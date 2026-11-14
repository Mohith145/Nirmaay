from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import http_error
from app.core.roles import Role
from app.db.models import User
from app.db.session import get_db

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    rounds = get_settings().bcrypt_rounds
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=rounds)).decode()


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_access_token(user_id: int, role: str) -> str:
    s = get_settings()
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "role": str(role),
        "iat": now,
        "exp": now + timedelta(minutes=s.jwt_expire_minutes),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=s.jwt_algorithm)


def _user_from_credentials(
    creds: HTTPAuthorizationCredentials | None, db: Session
) -> User | None:
    if creds is None:
        return None
    s = get_settings()
    token = creds.credentials
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        raise http_error(401, "invalid_token", "Invalid or expired token.") from None

    if header.get("alg") == "RS256":
        # Firebase ID tokens are accepted only after verification by Firebase Admin.
        from app.core.firebase import FirebaseUnavailable, verify_id_token

        try:
            firebase_payload = verify_id_token(token)
        except FirebaseUnavailable:
            raise http_error(503, "firebase_unavailable", "Firebase Authentication is unavailable.") from None
        except ValueError:
            raise http_error(401, "invalid_token", "Invalid or expired token.") from None
        uid = firebase_payload.get("uid")
        user = db.scalar(select(User).where(User.firebase_uid == uid)) if uid else None
        # Link a pre-existing account only when Firebase confirms ownership of its email.
        if user is None and uid and firebase_payload.get("email_verified"):
            email = str(firebase_payload.get("email") or "").strip().lower()
            user = db.scalar(select(User).where(User.email == email)) if email else None
            if user and not user.firebase_uid and user.is_active:
                user.firebase_uid = uid
                db.commit()
        if user is None or not user.is_active:
            raise http_error(401, "invalid_token", "Firebase account is not linked to a NIRMAY profile.")
        return user

    try:
        payload = jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise http_error(401, "invalid_token", "Invalid or expired token.") from None
    user = db.get(User, user_id)
    # The database role is the truth; a token whose role claim disagrees is rejected.
    if user is None or not user.is_active or str(user.role) != payload.get("role"):
        raise http_error(401, "invalid_token", "Invalid or expired token.")
    return user


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User | None:
    return _user_from_credentials(creds, db)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User:
    user = _user_from_credentials(creds, db)
    if user is None:
        raise http_error(401, "not_authenticated", "Log in first.")
    return user


def require_role(*roles: Role):
    allowed = {str(r) for r in roles}

    def dependency(user: User = Depends(get_current_user)) -> User:
        if str(user.role) not in allowed:
            raise http_error(403, "role_not_permitted", "Your role cannot use this endpoint.")
        return user

    return dependency
