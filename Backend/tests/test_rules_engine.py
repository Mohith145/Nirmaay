"""Rules engine tests. Plain asserts (no pytest import) so they also run without pytest."""

import copy

from app.services.rules.engine import assess_intake, assess_symptoms, load_rules

RULES = load_rules()
SOON = RULES["symptoms"]["duration_days"]["soon_min"]
URGENT = RULES["symptoms"]["duration_days"]["urgent_min"]


def _raises(fn, exc):
    try:
        fn()
    except exc:
        return True
    return False


# ---------- emergency rule ----------
def test_emergency_heavy_bleeding():
    r = assess_symptoms({"heavy_bleeding": True})
    assert r.emergency and r.urgency == "urgent" and r.action
    assert r.rules_fired == ["emergency:heavy_bleeding"]


def test_emergency_cannot_swallow_fluids():
    r = assess_symptoms({"cannot_swallow_fluids": True})
    assert r.emergency and "emergency:cannot_swallow_fluids" in r.rules_fired


def test_emergency_severe_jaundice():
    r = assess_symptoms({"severe_jaundice": True})
    assert r.emergency and "emergency:severe_jaundice" in r.rules_fired


def test_emergency_wins_over_everything_else():
    r = assess_symptoms(
        {"symptoms": ["persistent_mouth_pain"], "duration_days": 1, "heavy_bleeding": True}
    )
    assert r.emergency and r.urgency == "urgent"
    assert all(x.startswith("emergency:") for x in r.rules_fired)


def test_multiple_emergency_flags_all_listed():
    r = assess_symptoms({"heavy_bleeding": True, "severe_jaundice": True})
    assert len(r.rules_fired) == 2 and len(r.reasons) == 2


def test_no_emergency_flags_means_no_emergency():
    assert assess_symptoms({"symptoms": ["persistent_mouth_pain"], "duration_days": 2}).emergency is False


# ---------- urgency from duration ----------
def test_short_duration_is_routine():
    r = assess_symptoms({"symptoms": ["persistent_mouth_pain"], "duration_days": SOON - 1})
    assert r.urgency == "routine"


def test_duration_at_soon_boundary_is_soon():
    r = assess_symptoms({"symptoms": ["persistent_mouth_pain"], "duration_days": SOON})
    assert r.urgency == "soon" and "duration:soon" in r.rules_fired


def test_duration_at_urgent_boundary_is_urgent():
    r = assess_symptoms({"symptoms": ["persistent_mouth_pain"], "duration_days": URGENT})
    assert r.urgency == "urgent" and r.emergency is False


def test_red_flag_symptom_raises_short_duration_to_minimum():
    r = assess_symptoms({"symptoms": ["non_healing_ulcer"], "duration_days": 1})
    assert r.urgency == RULES["symptoms"]["red_flag_minimum_urgency"]
    assert "red_flag:non_healing_ulcer" in r.rules_fired


def test_red_flag_never_lowers_urgency():
    r = assess_symptoms({"symptoms": ["lump_or_swelling"], "duration_days": URGENT + 5})
    assert r.urgency == "urgent"


def test_missing_duration_is_routine_with_reason():
    r = assess_symptoms({"symptoms": ["persistent_mouth_pain"]})
    assert r.urgency == "routine" and "Duration not given" in r.reasons


def test_no_symptoms_is_routine():
    r = assess_symptoms({})
    assert r.urgency == "routine" and r.rules_fired == ["no_symptoms"]


def test_unknown_symptom_rejected():
    assert _raises(lambda: assess_symptoms({"symptoms": ["made_up"]}), ValueError)


# ---------- risk from intake ----------
def test_no_risk_factors_is_low_and_lists_a_rule():
    r = assess_intake({"tobacco": "none", "alcohol": "none"})
    assert r.risk_level == "Low" and r.rules_fired == ["no_risk_factors"]


def test_risk_levels_follow_yaml_thresholds():
    med = RULES["risk"]["levels"]["medium_min_score"]
    high = RULES["risk"]["levels"]["high_min_score"]
    f = RULES["risk"]["factors"]
    heavy = {
        "tobacco": "both",
        "tobacco_years": f["tobacco_years"]["min_years"],
        "betel_quid": True,
        "alcohol": "regular",
        "family_history": True,
        "prior_oral_lesion": True,
        "age": f["age"]["min_age"],
    }
    r = assess_intake(heavy)
    assert r.score >= high and r.risk_level == "High"
    r2 = assess_intake({"tobacco": "smokeless"})
    assert r2.risk_level == ("Medium" if r2.score >= med else "Low")


def test_tobacco_years_only_count_for_tobacco_users():
    yrs = RULES["risk"]["factors"]["tobacco_years"]["min_years"]
    r = assess_intake({"tobacco": "none", "tobacco_years": yrs + 20})
    assert r.score == 0


def test_age_threshold_adds_points():
    min_age = RULES["risk"]["factors"]["age"]["min_age"]
    assert assess_intake({"age": min_age}).score > assess_intake({"age": min_age - 1}).score


def test_every_fired_factor_has_a_reason():
    r = assess_intake({"tobacco": "smoking", "betel_quid": True, "family_history": True})
    assert len(r.reasons) == len(r.rules_fired) >= 3


def test_unknown_intake_values_rejected():
    assert _raises(lambda: assess_intake({"tobacco": "vape"}), ValueError)
    assert _raises(lambda: assess_intake({"alcohol": "lots"}), ValueError)


# ---------- guardrails ----------
def test_thresholds_come_from_yaml_not_code():
    custom = copy.deepcopy(RULES)
    custom["risk"]["levels"]["high_min_score"] = 1
    answers = {"tobacco": "smokeless"}
    assert assess_intake(answers, RULES).risk_level != "High"
    assert assess_intake(answers, custom).risk_level == "High"


def test_functions_are_pure_and_do_not_mutate_input():
    answers = {"tobacco": "smoking", "age": 60}
    before = copy.deepcopy(answers)
    assert assess_intake(answers).to_dict() == assess_intake(answers).to_dict()
    assert answers == before


def test_every_result_has_disclaimer_and_pending_status():
    for r in (assess_intake({}), assess_symptoms({}), assess_symptoms({"heavy_bleeding": True})):
        assert r.disclaimer == "Screening aid, not diagnosis."
        assert r.thresholds_status == "PENDING CLINICIAN REVIEW"


def test_yaml_sections_marked_pending_clinician_review():
    assert RULES["status"] == "PENDING CLINICIAN REVIEW"
    for section in ("emergency", "risk", "symptoms", "recommended_tests"):
        assert RULES[section]["status"] == "PENDING CLINICIAN REVIEW", section


def test_recommended_test_exists_for_every_level_and_urgency():
    for level in ("Low", "Medium", "High"):
        assert RULES["recommended_tests"]["by_risk"][level]["timeframe"]
    for u in ("routine", "soon", "urgent"):
        assert RULES["recommended_tests"]["by_urgency"][u]["timeframe"]
