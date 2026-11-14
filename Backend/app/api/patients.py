from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import hash_password, require_role
from app.db.models import Case, Consent, PatientProfile, User
from app.db.session import get_db

router = APIRouter(prefix="/patients", tags=["patients"])
_staff = require_role(Role.health_worker, Role.doctor, Role.admin)
_workers = require_role(Role.health_worker, Role.admin)


class PatientCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str = Field(min_length=1, max_length=120)
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=255)
    password: str = Field(min_length=8, max_length=72)
    age: int | None = Field(default=None, ge=0, le=120)
    gender: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=40)
    camp_token: str | None = Field(default=None, max_length=80)
    consent_given: bool = True


def _patient_out(db: Session, patient: User) -> dict:
    profile = db.get(PatientProfile, patient.id)
    screening_count = db.scalar(select(func.count(Case.id)).where(Case.subject_id == patient.id)) or 0
    latest_risk = db.scalar(
        select(Case.risk_level).where(Case.subject_id == patient.id).order_by(Case.created_at.desc()).limit(1)
    )
    return {
        "id": patient.id,
        "email": patient.email,
        "full_name": patient.full_name,
        "role": patient.role,
        "age": profile.age if profile else None,
        "gender": profile.gender if profile else None,
        "phone": profile.phone if profile else None,
        "camp_token": profile.camp_token if profile else None,
        "screenings_count": screening_count,
        "latest_risk_level": latest_risk,
    }


@router.post("", status_code=201)
def create_patient(body: PatientCreateIn, db: Session = Depends(get_db), actor: User = Depends(_workers)):
    if not body.consent_given:
        raise http_error(422, "consent_required", "Obtain the participant's consent before registration.")
    email = body.email.strip().lower()
    camp_token = body.camp_token.strip() if body.camp_token else None
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise http_error(409, "email_taken", "An account with this email already exists.")
    if camp_token and db.scalar(
        select(PatientProfile.patient_id).where(PatientProfile.camp_token == camp_token)
    ) is not None:
        raise http_error(409, "camp_token_taken", "This camp token is already assigned to a patient.")

    patient = User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
        role=Role.patient.value,
    )
    db.add(patient)
    db.flush()
    db.add(PatientProfile(
        patient_id=patient.id,
        age=body.age,
        gender=body.gender,
        phone=body.phone.strip() if body.phone else None,
        camp_token=camp_token,
    ))
    consent = Consent(subject_id=patient.id, granted_by_id=actor.id)
    db.add(consent)
    db.flush()
    audit(db, actor, "patient.create", "user", patient.id, {"consent_id": consent.id})
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise http_error(409, "patient_conflict", "Patient email or camp token is already in use.") from exc
    db.refresh(patient)
    return _patient_out(db, patient)


@router.get("")
def list_patients(
    q: str = Query(default="", max_length=120),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    _actor: User = Depends(_staff),
):
    stmt = select(User).where(User.role == Role.patient.value, User.is_active.is_(True))
    query = q.strip()
    if query:
        pattern = f"%{query}%"
        stmt = stmt.outerjoin(PatientProfile, PatientProfile.patient_id == User.id).where(
            or_(User.full_name.ilike(pattern), User.email.ilike(pattern),
                PatientProfile.camp_token.ilike(pattern),
                cast(User.id, String).ilike(pattern))
        )
    patients = db.scalars(stmt.order_by(User.full_name).limit(limit)).all()
    return [_patient_out(db, patient) for patient in patients]


@router.get("/{patient_id}")
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _actor: User = Depends(_staff),
):
    patient = db.get(User, patient_id)
    if patient is None or patient.role != Role.patient.value or not patient.is_active:
        raise http_error(404, "patient_not_found", "Patient not found.")
    return _patient_out(db, patient)
