from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import resolve_subject
from app.core.audit import audit
from app.core.errors import http_error
from app.core.privacy import withdraw_subject
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import Consent, User
from app.db.session import get_db
from app.schemas.consent import ConsentIn, ConsentOut

router = APIRouter(prefix="/consents", tags=["consent"])
_who = require_role(Role.patient, Role.health_worker)


@router.post("", response_model=ConsentOut, status_code=201)
def grant(body: ConsentIn, db: Session = Depends(get_db), actor: User = Depends(_who)):
    subject = resolve_subject(db, actor, body.patient_id)
    existing = db.scalar(
        select(Consent).where(Consent.subject_id == subject.id, Consent.status == "granted")
    )
    if existing is not None:
        return existing
    consent = Consent(subject_id=subject.id, granted_by_id=actor.id, purpose=body.purpose)
    db.add(consent)
    db.flush()
    audit(db, actor, "consent.grant", "consent", consent.id, {"subject_id": subject.id})
    db.commit()
    return consent


@router.delete("/{consent_id}", response_model=ConsentOut)
def withdraw(consent_id: int, db: Session = Depends(get_db), actor: User = Depends(_who)):
    consent = db.get(Consent, consent_id)
    if consent is None:
        raise http_error(404, "consent_not_found", "Consent not found.")
    allowed = consent.subject_id == actor.id or (
        actor.role == Role.health_worker and consent.granted_by_id == actor.id
    )
    if not allowed:
        raise http_error(403, "not_your_record", "You cannot withdraw this consent.")
    subject = db.get(User, consent.subject_id)
    withdraw_subject(db, subject)
    audit(db, actor, "consent.withdraw", "consent", consent.id, {"subject_id": subject.id})
    db.commit()
    db.refresh(consent)
    consent.message = "Consent withdrawn. Processing stopped and data deletion is queued."
    return consent
