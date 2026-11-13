from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_consent, resolve_subject
from app.core.audit import audit
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import Case, Intake, PhotoScreening, Review, SymptomCheck, User
from app.db.session import get_db
from app.schemas.case import CaseCreateIn, CaseOut, HandoffOut
from app.services.handoff import build_handoff

router = APIRouter(prefix="/cases", tags=["cases"])


def load_case_bundle(db: Session, case: Case):
    subject = db.get(User, case.subject_id)
    intake = db.get(Intake, case.intake_id)
    symptom = db.get(SymptomCheck, case.symptom_id) if case.symptom_id else None
    photo = db.get(PhotoScreening, case.photo_id) if case.photo_id else None
    review = db.scalar(
        select(Review).where(Review.case_id == case.id).order_by(Review.id.desc())
    )
    return subject, intake, symptom, photo, review


@router.post("", response_model=CaseOut, status_code=201)
def create_case(
    body: CaseCreateIn,
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.patient, Role.health_worker)),
):
    subject = resolve_subject(db, actor, body.patient_id)
    require_consent(db, subject)

    intake = db.get(Intake, body.intake_id)
    if intake is None or intake.subject_id != subject.id:
        raise http_error(404, "intake_not_found", "Intake not found for this patient.")
    symptom = None
    if body.symptom_id is not None:
        symptom = db.get(SymptomCheck, body.symptom_id)
        if symptom is None or symptom.subject_id != subject.id:
            raise http_error(404, "symptom_not_found", "Symptom check not found for this patient.")
    photo = None
    if body.photo_id is not None:
        photo = db.get(PhotoScreening, body.photo_id)
        if photo is None or photo.subject_id != subject.id:
            raise http_error(404, "photo_not_found", "Photo screening not found for this patient.")
        if photo.status not in ("ok", "not_sure") or not photo.retained:
            raise http_error(
                409, "photo_not_sent",
                "That photo was not kept for a doctor. Re-upload with send_to_doctor=true.",
            )

    # Risk, urgency and emergency come from stored rule results only. AI flag is display only.
    case = Case(
        subject_id=subject.id,
        created_by_id=actor.id,
        intake_id=intake.id,
        symptom_id=symptom.id if symptom else None,
        photo_id=photo.id if photo else None,
        risk_level=intake.risk_level,
        urgency=symptom.urgency if symptom else "routine",
        emergency=bool(symptom.emergency) if symptom else False,
        ai_flag=(photo.label or "not_sure") if photo else None,
    )
    db.add(case)
    db.flush()
    audit(db, actor, "case.create", "case", case.id, {"subject_id": subject.id})
    db.commit()
    return CaseOut(
        id=case.id, status=case.status, risk_level=case.risk_level, urgency=case.urgency,
        emergency=case.emergency, ai_flag=case.ai_flag, created_at=case.created_at,
    )


@router.get("/{case_id}/handoff", response_model=HandoffOut)
def get_handoff(
    case_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.patient, Role.health_worker, Role.doctor)),
):
    case = db.get(Case, case_id)
    if case is None:
        raise http_error(404, "case_not_found", "Case not found.")
    if actor.role == Role.patient and case.subject_id != actor.id:
        raise http_error(403, "not_your_record", "You can only view your own cases.")
    if actor.role == Role.health_worker and case.created_by_id != actor.id:
        raise http_error(403, "not_your_record", "You can only view cases you created.")
    if case.deletion_queued:
        raise http_error(403, "case_flagged_for_deletion", "Consent was withdrawn for this case.")
    subject, intake, symptom, photo, review = load_case_bundle(db, case)
    audit(db, actor, "handoff.view", "case", case.id, {"subject_id": case.subject_id})
    db.commit()
    return build_handoff(case, subject, intake, symptom, photo, review)
