from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.config import get_settings
from app.core.errors import http_error
from app.core.firebase import (
    FirebaseUnavailable,
    create_auth_user,
    delete_auth_user,
    firebase_is_configured,
    verify_id_token,
    write_user_profile,
)
from app.core.roles import Role
from app.core.security import (
    create_access_token,
    bearer,
    get_optional_user,
    hash_password,
    verify_password,
)
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import FirebaseProfileIn, LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(
    body: RegisterIn,
    db: Session = Depends(get_db),
    caller: User | None = Depends(get_optional_user),
):
    # Anyone can register as a patient. Staff accounts need an admin token
    # (or ALLOW_OPEN_STAFF_REGISTRATION=true for local demos only).
    if body.role != Role.patient:
        is_admin = caller is not None and caller.role == Role.admin
        if not (is_admin or get_settings().allow_open_staff_registration):
            raise http_error(403, "staff_registration_closed", "Staff accounts are created by an admin.")
    email = body.email.strip().lower()
    if db.scalar(select(User.id).where(User.email == email)) is not None:
        raise http_error(409, "email_taken", "An account with this email already exists.")
    user = User(
        email=email,
        password_hash=hash_password(body.password),
        full_name=body.full_name.strip(),
        role=str(body.role),
    )
    db.add(user)
    db.flush()
    firebase_uid = None
    if firebase_is_configured():
        firebase_uid = f"nirmay-{user.id}"
        try:
            create_auth_user(
                uid=firebase_uid,
                email=email,
                password=body.password,
                display_name=user.full_name,
            )
            user.firebase_uid = firebase_uid
        except FirebaseUnavailable:
            db.rollback()
            raise http_error(503, "firebase_unavailable", "Firebase account setup is unavailable.") from None
    audit(db, caller or user, "auth.register", "user", user.id, {"role": str(body.role)})
    try:
        db.commit()
    except Exception:
        db.rollback()
        if firebase_uid:
            try:
                delete_auth_user(firebase_uid)
            except FirebaseUnavailable:
                pass
        raise
    if firebase_uid:
        try:
            write_user_profile(firebase_uid, {
                "uid": firebase_uid,
                "user_id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "is_active": user.is_active,
            })
        except FirebaseUnavailable:
            raise http_error(503, "firestore_unavailable", "Account created, but its profile could not be synced.") from None
    return user


@router.post("/firebase/profile", response_model=UserOut, status_code=201)
def create_firebase_patient_profile(
    body: FirebaseProfileIn,
    db: Session = Depends(get_db),
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    """Link a Firebase-authenticated public signup to a patient-only SQL profile."""
    if creds is None:
        raise http_error(401, "not_authenticated", "Log in first.")
    try:
        firebase_user = verify_id_token(creds.credentials)
    except FirebaseUnavailable:
        raise http_error(503, "firebase_unavailable", "Firebase Authentication is unavailable.") from None
    except ValueError:
        raise http_error(401, "invalid_token", "Invalid or expired token.") from None

    uid = firebase_user.get("uid")
    email = str(firebase_user.get("email") or "").strip().lower()
    if not uid or not email:
        raise http_error(401, "invalid_token", "Firebase account must include an email address.")

    user = db.scalar(select(User).where(User.firebase_uid == uid))
    if user is None:
        user = db.scalar(select(User).where(User.email == email))
        if user is not None:
            if not firebase_user.get("email_verified"):
                raise http_error(409, "account_link_requires_verified_email", "Verify this email before linking it.")
            if user.firebase_uid and user.firebase_uid != uid:
                raise http_error(409, "account_already_linked", "This account is already linked to another Firebase user.")
            user.firebase_uid = uid
        else:
            user = User(
                email=email,
                password_hash="firebase-managed",
                full_name=body.full_name.strip(),
                role=str(Role.patient),
                firebase_uid=uid,
            )
            db.add(user)
            db.flush()

    if str(user.role) != Role.patient.value:
        raise http_error(403, "role_not_permitted", "Public Firebase registration is patient-only.")
    audit(db, user, "auth.firebase_profile", "user", user.id, {"role": str(user.role)})
    db.commit()
    try:
        write_user_profile(uid, {
            "uid": uid,
            "user_id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": str(user.role),
            "is_active": user.is_active,
        })
    except FirebaseUnavailable:
        raise http_error(503, "firestore_unavailable", "Patient profile could not be synced to Firestore. Please retry.") from None
    return user


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if user is None or not user.is_active or not verify_password(body.password, user.password_hash):
        audit(db, None, "auth.login_failed", "user", None, {"email": body.email[:80]})
        db.commit()
        raise http_error(401, "bad_credentials", "Wrong email or password.")
    audit(db, user, "auth.login", "user", user.id)
    db.commit()
    return TokenOut(access_token=create_access_token(user.id, user.role), user_id=user.id, role=user.role)
