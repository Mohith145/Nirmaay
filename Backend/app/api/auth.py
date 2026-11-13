from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.config import get_settings
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import (
    create_access_token,
    get_optional_user,
    hash_password,
    verify_password,
)
from app.db.models import User
from app.db.session import get_db
from app.schemas.auth import LoginIn, RegisterIn, TokenOut, UserOut

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
    audit(db, caller or user, "auth.register", "user", user.id, {"role": str(body.role)})
    db.commit()
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
