"""Builds the doctor handoff summary from stored results. No AI: text comes from rule output."""

from app.core.disclaimer import DISCLAIMER


def build_handoff(case, subject, intake, symptom, photo, review) -> dict:
    risk = {
        "level": intake.risk_level,
        "score": intake.risk_score,
        "reasons": intake.reasons,
        "rules_fired": intake.rules_fired,
        "source": "rules engine (PENDING CLINICIAN REVIEW)",
    }
    symptoms = None
    if symptom is not None:
        symptoms = {
            "urgency": symptom.urgency,
            "emergency": symptom.emergency,
            "reasons": symptom.reasons,
            "rules_fired": symptom.rules_fired,
            "action": symptom.action,
            "answers": symptom.answers,
        }
    photo_out = None
    if photo is not None:
        photo_out = {
            "id": photo.id,
            "status": photo.status,
            "label": photo.label,
            "confidence": photo.confidence,
            "heatmap_b64": photo.heatmap_b64,
            "model_version": photo.model_version,
            "demo_placeholder": photo.demo_placeholder,
            "image_available": bool(photo.retained and photo.image_path),
            "note": "AI flag is display only and does not set risk or urgency.",
        }
    review_out = None
    if review is not None:
        review_out = {
            "decision": review.decision,
            "reason": review.reason,
            "final_risk_level": review.final_risk_level,
            "final_urgency": review.final_urgency,
            "created_at": review.created_at.isoformat(),
        }

    # Recommended test: the more urgent of the intake and symptom recommendations.
    rec = dict(intake.recommended_test)
    if symptom is not None and (symptom.emergency or symptom.urgency in ("soon", "urgent")):
        rec = dict(symptom.recommended_test)

    lines = [f"Case #{case.id} for {subject.full_name}."]
    if case.emergency:
        lines.append(f"EMERGENCY (rule-based): {symptom.action if symptom else ''}".strip())
    lines.append(f"Urgency: {case.urgency}. Risk: {case.risk_level} (score {intake.risk_score}).")
    lines.append("Risk reasons: " + "; ".join(intake.reasons) + ".")
    if symptom is not None:
        lines.append("Symptom findings: " + "; ".join(symptom.reasons) + ".")
    if photo is not None:
        tag = " (demo placeholder)" if photo.demo_placeholder else ""
        if photo.label:
            conf = f", confidence {photo.confidence:.2f}" if photo.confidence is not None else ""
            lines.append(f"Photo screener flag: {photo.label}{conf}{tag}.")
        else:
            lines.append(f"Photo screener: {photo.status}, no class given{tag}.")
    lines.append(f"Recommended test: {rec['test']} ({rec['timeframe']}).")
    if review is not None:
        lines.append(f"Clinician decision: {review.decision}.")
    lines.append(DISCLAIMER)

    return {
        "case_id": case.id,
        "summary_text": " ".join(lines),
        "patient": {"id": subject.id, "name": subject.full_name, "age": (intake.answers or {}).get("age")},
        "risk": risk,
        "symptoms": symptoms,
        "photo": photo_out,
        "ai_flag": case.ai_flag,
        "recommended_test": rec,
        "review": review_out,
        "emergency": case.emergency,
        "status": case.status,
        "disclaimer": DISCLAIMER,
    }
