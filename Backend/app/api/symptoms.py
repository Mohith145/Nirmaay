from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_consent, resolve_subject
from app.core.audit import audit
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import SymptomCheck, User
from app.db.session import get_db
from app.schemas.symptom import SymptomIn, SymptomOut
from app.services.rules.engine import assess_symptoms

router = APIRouter(prefix="/symptoms", tags=["symptoms"])


@router.post("/check", response_model=SymptomOut, status_code=201)
def check_symptoms(
    body: SymptomIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.patient, Role.health_worker)),
):
    subject = resolve_subject(db, actor, body.patient_id)
    require_consent(db, subject)
    answers = body.model_dump(exclude={"patient_id"})
    try:
        result = assess_symptoms(answers)  # rules decide; emergency rule runs first
    except ValueError as e:
        raise http_error(422, "invalid_symptoms", str(e)) from e
    row = SymptomCheck(
        subject_id=subject.id,
        created_by_id=actor.id,
        answers=answers,
        urgency=result.urgency,
        emergency=result.emergency,
        reasons=result.reasons,
        rules_fired=result.rules_fired,
        action=result.action,
        recommended_test=result.recommended_test.__dict__,
    )
    db.add(row)
    db.flush()
    audit(
        db, actor, "symptoms.check", "symptom_check", row.id,
        {"subject_id": subject.id, "emergency": row.emergency},
    )
    db.commit()
    return SymptomOut(
        id=row.id,
        urgency=row.urgency,
        emergency=row.emergency,
        reasons=row.reasons,
        rules_fired=row.rules_fired,
        recommended_test=row.recommended_test,
        action=row.action,
    )
