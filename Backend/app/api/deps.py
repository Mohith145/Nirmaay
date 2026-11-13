from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import http_error
from app.core.roles import Role
from app.db.models import Consent, User


def resolve_subject(db: Session, actor: User, patient_id: int | None) -> User:
    """Who the data is about. Patients act only for themselves; health workers name a patient."""
    if actor.role == Role.patient:
        if patient_id is not None and patient_id != actor.id:
            raise http_error(403, "not_your_record", "You can only act for yourself.")
        return actor
    if actor.role == Role.health_worker:
        if patient_id is None:
            raise http_error(422, "patient_required", "patient_id is required for health workers.")
        subject = db.get(User, patient_id)
        if subject is None or subject.role != Role.patient or not subject.is_active:
            raise http_error(404, "patient_not_found", "Patient not found.")
        return subject
    raise http_error(403, "role_not_permitted", "Your role cannot use this endpoint.")


def require_consent(db: Session, subject: User) -> None:
    """Processing endpoints call this first. No active consent -> 403."""
    if subject.deletion_requested_at is not None:
        raise http_error(403, "consent_withdrawn", "Data deletion has been requested.")
    granted = db.scalar(
        select(Consent.id).where(Consent.subject_id == subject.id, Consent.status == "granted")
    )
    if granted is None:
        raise http_error(
            403, "consent_required", "Consent is required (or was withdrawn). Processing blocked."
        )
