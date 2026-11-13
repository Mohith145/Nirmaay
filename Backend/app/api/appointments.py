import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_consent
from app.core.audit import audit
from app.core.config import get_settings
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import Appointment, Case, User
from app.db.session import get_db
from app.schemas.appointment import AppointmentIn, AppointmentOut

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _out(a: Appointment) -> AppointmentOut:
    return AppointmentOut(
        id=a.id, case_id=a.case_id, doctor_id=a.doctor_id, patient_id=a.patient_id,
        room_id=a.room_id, join_url=f"{get_settings().jitsi_base_url}/{a.room_id}",
    )


@router.post("", response_model=AppointmentOut, status_code=201)
def accept_case(
    body: AppointmentIn,
    db: Session = Depends(get_db),
    doctor: User = Depends(require_role(Role.doctor)),
):
    case = db.get(Case, body.case_id)
    if case is None:
        raise http_error(404, "case_not_found", "Case not found.")
    if case.deletion_queued:
        raise http_error(403, "case_flagged_for_deletion", "Consent was withdrawn for this case.")
    patient = db.get(User, case.subject_id)
    require_consent(db, patient)  # consent before the call

    existing = db.scalar(select(Appointment).where(Appointment.case_id == case.id))
    if existing is not None:
        return _out(existing)  # both parties keep the same room
    appt = Appointment(
        case_id=case.id, doctor_id=doctor.id, patient_id=patient.id,
        room_id="nirmay-" + uuid.uuid4().hex,  # unguessable
    )
    db.add(appt)
    if case.status == "pending":
        case.status = "accepted"
    db.flush()
    audit(db, doctor, "appointment.create", "appointment", appt.id, {"case_id": case.id})
    db.commit()
    return _out(appt)


@router.get("/{appointment_id}", response_model=AppointmentOut)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    actor: User = Depends(require_role(Role.doctor, Role.patient)),
):
    appt = db.get(Appointment, appointment_id)
    if appt is None:
        raise http_error(404, "appointment_not_found", "Appointment not found.")
    if actor.role == Role.patient and appt.patient_id != actor.id:
        raise http_error(403, "not_your_record", "This is not your appointment.")
    case = db.get(Case, appt.case_id)
    if case.deletion_queued:
        raise http_error(403, "case_flagged_for_deletion", "Consent was withdrawn for this case.")
    audit(db, actor, "appointment.view", "appointment", appt.id)
    db.commit()
    return _out(appt)
