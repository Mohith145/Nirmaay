from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import require_consent, resolve_subject
from app.core.audit import audit
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import Intake, User
from app.db.session import get_db
from app.schemas.intake import IntakeOut, OralIntakeIn
from app.services.rules.engine import assess_intake

router = APIRouter(prefix="/intakes", tags=["intake"])


@router.post("", response_model=IntakeOut, status_code=201)
def create_intake(
    body: OralIntakeIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.patient, Role.health_worker)),
):
    subject = resolve_subject(db, actor, body.patient_id)
    require_consent(db, subject)
    answers = body.model_dump(exclude={"patient_id", "cancer_type"})
    try:
        result = assess_intake(answers)  # rules decide
    except ValueError as e:
        raise http_error(422, "invalid_intake", str(e)) from e
    row = Intake(
        subject_id=subject.id,
        created_by_id=actor.id,
        cancer_type=body.cancer_type,
        answers=answers,
        risk_level=result.risk_level,
        risk_score=result.score,
        reasons=result.reasons,
        rules_fired=result.rules_fired,
        recommended_test=result.recommended_test.__dict__,
    )
    db.add(row)
    db.flush()
    audit(db, actor, "intake.create", "intake", row.id, {"subject_id": subject.id})
    db.commit()
    return IntakeOut(
        id=row.id,
        cancer_type=row.cancer_type,
        risk_level=row.risk_level,
        risk_score=row.risk_score,
        reasons=row.reasons,
        rules_fired=row.rules_fired,
        recommended_test=row.recommended_test,
    )
