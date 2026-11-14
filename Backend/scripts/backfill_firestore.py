"""One-time SQL-to-Firestore backfill; uses the DATABASE_URL in the environment."""

from sqlalchemy import select

from app.core.firebase import firestore_client, write_user_profile
from app.db.firestore_sync import _MIRRORED_TYPES, _model_payload
from app.db.models import User
from app.db.session import SessionLocal


def main() -> None:
    client = firestore_client()
    written = 0
    with SessionLocal() as session:
        for model in _MIRRORED_TYPES:
            for row in session.scalars(select(model)).yield_per(200):
                doc_id = str(getattr(row, "id", getattr(row, "user_id", "")))
                if not doc_id:
                    continue
                client.collection(model.__tablename__).document(doc_id).set(_model_payload(row))
                if isinstance(row, User) and row.firebase_uid:
                    write_user_profile(row.firebase_uid, {
                        "uid": row.firebase_uid,
                        "user_id": row.id,
                        "email": row.email,
                        "full_name": row.full_name,
                        "role": row.role,
                        "is_active": row.is_active,
                    })
                written += 1
    print(f"Firestore backfill complete: {written} SQL records copied.")


if __name__ == "__main__":
    main()
