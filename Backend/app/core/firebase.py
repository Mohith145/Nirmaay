"""Firebase Admin helpers. Credentials are provided only through deployment secrets."""

import json
from threading import Lock
from typing import Any

from app.core.config import get_settings

_lock = Lock()


class FirebaseUnavailable(RuntimeError):
    """Firebase Admin is missing or could not complete an operation."""


def _firebase_sdk():
    try:
        import firebase_admin
        from firebase_admin import auth, credentials, firestore

        return firebase_admin, auth, credentials, firestore
    except ImportError as exc:
        raise FirebaseUnavailable("Firebase Admin SDK is not installed.") from exc


def firebase_is_configured() -> bool:
    return bool(get_settings().firebase_project_id)


def get_firebase_app():
    firebase_admin, _, credentials, _ = _firebase_sdk()
    settings = get_settings()
    if not settings.firebase_project_id:
        raise FirebaseUnavailable("FIREBASE_PROJECT_ID is not configured.")
    try:
        return firebase_admin.get_app()
    except ValueError:
        with _lock:
            try:
                return firebase_admin.get_app()
            except ValueError:
                try:
                    if settings.firebase_credentials_json:
                        service_account = json.loads(settings.firebase_credentials_json)
                        credential = credentials.Certificate(service_account)
                    elif settings.firebase_credentials_path:
                        credential = credentials.Certificate(settings.firebase_credentials_path)
                    else:
                        credential = credentials.ApplicationDefault()
                    return firebase_admin.initialize_app(
                        credential, {"projectId": settings.firebase_project_id}
                    )
                except Exception as exc:
                    raise FirebaseUnavailable("Firebase Admin credentials are unavailable.") from exc


def verify_id_token(token: str) -> dict[str, Any]:
    try:
        _, auth, _, _ = _firebase_sdk()
        return auth.verify_id_token(token, app=get_firebase_app(), check_revoked=True)
    except FirebaseUnavailable:
        raise
    except (
        auth.InvalidIdTokenError,
        auth.ExpiredIdTokenError,
        auth.RevokedIdTokenError,
        auth.UserDisabledError,
    ) as exc:
        raise ValueError("Firebase ID token is invalid or expired.") from exc
    except Exception as exc:
        raise FirebaseUnavailable("Firebase token verification is unavailable.") from exc


def create_auth_user(*, uid: str, email: str, password: str, display_name: str):
    try:
        _, auth, _, _ = _firebase_sdk()
        return auth.create_user(
            uid=uid,
            email=email,
            password=password,
            display_name=display_name,
            app=get_firebase_app(),
        )
    except Exception as exc:
        raise FirebaseUnavailable("Could not create the Firebase Authentication account.") from exc


def delete_auth_user(uid: str) -> None:
    try:
        _, auth, _, _ = _firebase_sdk()
        auth.delete_user(uid, app=get_firebase_app())
    except Exception as exc:
        raise FirebaseUnavailable("Could not delete the Firebase Authentication account.") from exc


def firestore_client():
    _, _, _, firestore = _firebase_sdk()
    return firestore.client(app=get_firebase_app())


def firebase_storage_bucket():
    """Return the configured private Firebase Storage bucket."""
    try:
        from firebase_admin import storage

        bucket_name = get_settings().firebase_storage_bucket
        if not bucket_name:
            raise FirebaseUnavailable("FIREBASE_STORAGE_BUCKET is not configured.")
        return storage.bucket(name=bucket_name, app=get_firebase_app())
    except FirebaseUnavailable:
        raise
    except Exception as exc:
        raise FirebaseUnavailable("Firebase Storage is unavailable.") from exc


def write_user_profile(uid: str, profile: dict[str, Any]) -> None:
    try:
        firestore_client().collection("user_profiles").document(uid).set(profile, merge=True)
    except Exception as exc:
        raise FirebaseUnavailable("Could not sync the Firebase user profile.") from exc
