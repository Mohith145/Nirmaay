"""Rules engine: pure functions, no I/O except loading oral.yaml once.

Rules decide, AI explains. Risk, urgency and emergency escalation are computed here only.
All thresholds come from oral.yaml (PENDING CLINICIAN REVIEW); no cut-off is hardcoded.
"""

from dataclasses import asdict, dataclass
from functools import lru_cache
from pathlib import Path

import yaml

RULES_PATH = Path(__file__).with_name("oral.yaml")
URGENCY_ORDER = ("routine", "soon", "urgent")
DISCLAIMER = "Screening aid, not diagnosis."
THRESHOLDS_STATUS = "PENDING CLINICIAN REVIEW"


@dataclass(frozen=True)
class Recommendation:
    test: str
    timeframe: str


@dataclass(frozen=True)
class RiskResult:
    risk_level: str  # Low | Medium | High
    score: int
    reasons: list[str]
    rules_fired: list[str]
    recommended_test: Recommendation
    thresholds_status: str = THRESHOLDS_STATUS
    disclaimer: str = DISCLAIMER

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass(frozen=True)
class UrgencyResult:
    urgency: str  # routine | soon | urgent
    emergency: bool
    reasons: list[str]
    rules_fired: list[str]
    recommended_test: Recommendation
    action: str | None = None
    thresholds_status: str = THRESHOLDS_STATUS
    disclaimer: str = DISCLAIMER

    def to_dict(self) -> dict:
        return asdict(self)


@lru_cache
def load_rules() -> dict:
    with open(RULES_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def _rec(d: dict) -> Recommendation:
    return Recommendation(test=d["test"], timeframe=d["timeframe"])


def _higher(a: str, b: str) -> str:
    return a if URGENCY_ORDER.index(a) >= URGENCY_ORDER.index(b) else b


def assess_symptoms(report: dict, rules: dict | None = None) -> UrgencyResult:
    """Symptom report -> urgency (routine/soon/urgent) and emergency flag."""
    rules = rules or load_rules()

    # 1. EMERGENCY RULE FIRST. Nothing below can lower or skip it.
    em = rules["emergency"]
    em_fired = [key for key in em["flags"] if bool(report.get(key))]
    if em_fired:
        return UrgencyResult(
            urgency="urgent",
            emergency=True,
            reasons=[em["flags"][k] for k in em_fired],
            rules_fired=[f"emergency:{k}" for k in em_fired],
            recommended_test=_rec(em["recommended"]),
            action=em["action"],
        )

    cfg = rules["symptoms"]
    symptoms = list(report.get("symptoms") or [])
    for s in symptoms:
        if s not in cfg["labels"]:
            raise ValueError(f"unknown symptom: {s!r}")

    by_urgency = rules["recommended_tests"]["by_urgency"]
    if not symptoms:
        return UrgencyResult(
            urgency="routine",
            emergency=False,
            reasons=["No symptoms reported"],
            rules_fired=["no_symptoms"],
            recommended_test=_rec(by_urgency["routine"]),
        )

    reasons = [cfg["labels"][s] for s in symptoms]
    fired = [f"symptom:{s}" for s in symptoms]
    urgency = "routine"

    days = report.get("duration_days")
    soon_min = cfg["duration_days"]["soon_min"]
    urgent_min = cfg["duration_days"]["urgent_min"]
    if days is None:
        reasons.append("Duration not given")
        fired.append("duration:missing")
    elif days >= urgent_min:
        urgency = "urgent"
        reasons.append(f"Present for {days} days (urgent from {urgent_min} days)")
        fired.append("duration:urgent")
    elif days >= soon_min:
        urgency = "soon"
        reasons.append(f"Present for {days} days (soon from {soon_min} days)")
        fired.append("duration:soon")
    else:
        reasons.append(f"Present for {days} days")
        fired.append("duration:routine")

    red_flags = [s for s in symptoms if s in cfg["red_flag_symptoms"]]
    if red_flags:
        raised = _higher(urgency, cfg["red_flag_minimum_urgency"])
        if raised != urgency:
            urgency = raised
            reasons.append("Red-flag symptom raises urgency")
        fired.extend(f"red_flag:{s}" for s in red_flags)

    return UrgencyResult(
        urgency=urgency,
        emergency=False,
        reasons=reasons,
        rules_fired=fired,
        recommended_test=_rec(by_urgency[urgency]),
    )


def assess_intake(answers: dict, rules: dict | None = None) -> RiskResult:
    """Oral intake answers -> risk level (Low/Medium/High) with reasons and rules fired."""
    rules = rules or load_rules()
    cfg = rules["risk"]
    f = cfg["factors"]
    score = 0
    reasons: list[str] = []
    fired: list[str] = []

    def add(points: int, rule_id: str, reason: str) -> None:
        nonlocal score
        if points:
            score += points
            reasons.append(reason)
            fired.append(f"{rule_id}(+{points})")

    tobacco = answers.get("tobacco", "none")
    if tobacco not in f["tobacco"]:
        raise ValueError(f"unknown tobacco value: {tobacco!r}")
    add(f["tobacco"][tobacco], f"tobacco:{tobacco}", f"Tobacco use: {tobacco}")

    years = answers.get("tobacco_years")
    if tobacco != "none" and years is not None and years >= f["tobacco_years"]["min_years"]:
        add(
            f["tobacco_years"]["points"],
            "tobacco_years",
            f"Tobacco use for {years} years",
        )

    if answers.get("betel_quid"):
        add(f["betel_quid"], "betel_quid", "Chews betel quid or areca nut")

    alcohol = answers.get("alcohol", "none")
    if alcohol not in f["alcohol"]:
        raise ValueError(f"unknown alcohol value: {alcohol!r}")
    add(f["alcohol"][alcohol], f"alcohol:{alcohol}", f"Alcohol use: {alcohol}")

    if answers.get("family_history"):
        add(f["family_history"], "family_history", "Family history of cancer")
    if answers.get("prior_oral_lesion"):
        add(f["prior_oral_lesion"], "prior_oral_lesion", "Earlier mouth lesion")

    age = answers.get("age")
    if age is not None and age >= f["age"]["min_age"]:
        add(f["age"]["points"], "age", f"Age {age}")

    levels = cfg["levels"]
    if score >= levels["high_min_score"]:
        level = "High"
    elif score >= levels["medium_min_score"]:
        level = "Medium"
    else:
        level = "Low"

    if not fired:
        reasons.append("No risk factors reported")
        fired.append("no_risk_factors")

    return RiskResult(
        risk_level=level,
        score=score,
        reasons=reasons,
        rules_fired=fired,
        recommended_test=_rec(rules["recommended_tests"]["by_risk"][level]),
    )
