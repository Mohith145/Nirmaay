"""Durably mirror committed SQL rows to Firestore with a SQL outbox."""

import logging
from datetime import UTC, date, datetime

from sqlalchemy import event, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.models import (
    Appointment,
    AuditLog,
    Case,
    Consent,
    FirestoreOutbox,
    Intake,
    PhotoScreening,
    QuitProgress,
    Review,
    SymptomCheck,
    User,
)
from app.db.session import SessionLocal

log = logging.getLogger("nirmay.firestore")
_MIRRORED_TYPES = (
    User, Consent, Intake, SymptomCheck, PhotoScreening, Case,
    Review, Appointment, AuditLog, QuitProgress,
)
_installed = False


def _json_safe(value):
    if isinstance(value, datetime):
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, dict):
        return {key: _json_safe(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    return value


def _model_payload(instance) -> dict:
    payload = {}
    for column in instance.__table__.columns:
        if isinstance(instance, User) and column.name == "password_hash":
            continue
        if isinstance(instance, PhotoScreening) and column.name in {"heatmap_b64", "image_path"}:
            continue
        payload[column.name] = _json_safe(getattr(instance, column.name))
    if isinstance(instance, PhotoScreening):
        payload["media_storage"] = {
            "heatmap": "stored outside Firestore document",
            "image": "retained separately" if instance.retained else "not retained",
        }
    return payload


def install_firestore_sync() -> None:
    """Install commit hooks once. Password hashes and image bytes never enter Firestore."""
    global _installed
    if _installed:
        return
    _installed = True

    @event.listens_for(Session, "before_flush")
    def collect_changes(session, _flush_context, _instances):
        if session.info.get("firestore_sync_dispatch") or not get_settings().firebase_project_id:
            return
        changed = set(session.new).union(session.dirty).union(session.deleted)
        pending = session.info.setdefault("firestore_rows", {})
        for row in changed:
            if isinstance(row, _MIRRORED_TYPES):
                pending[id(row)] = (row, row in session.deleted)

    @event.listens_for(Session, "after_flush_postexec")
    def enqueue_changes(session, _flush_context):
        if session.info.get("firestore_sync_dispatch") or not get_settings().firebase_project_id:
            return
        pending = session.info.pop("firestore_rows", {})
        for row, is_delete in pending.values():
            document_id = str(getattr(row, "id", getattr(row, "user_id", "")))
            if document_id:
                session.add(FirestoreOutbox(
                    collection=row.__tablename__,
                    document_id=document_id,
                    payload=None if is_delete else _model_payload(row),
                    is_delete=is_delete,
                ))

    @event.listens_for(Session, "after_commit")
    def publish_changes(session):
        if session.info.get("firestore_sync_dispatch") or not get_settings().firebase_project_id:
            return
        try:
            drain_firestore_outbox()
        except Exception as exc:  # committed SQL data remains available; outbox retries later
            log.error("Firestore delivery deferred (%s).", type(exc).__name__)


def drain_firestore_outbox(limit: int = 100) -> None:
    from app.core.firebase import firestore_client

    client = firestore_client()
    while True:
        with SessionLocal() as session:
            session.info["firestore_sync_dispatch"] = True
            pending = session.scalars(
                select(FirestoreOutbox)
                .where(FirestoreOutbox.delivered_at.is_(None))
                .order_by(FirestoreOutbox.id)
                .limit(limit)
            ).all()
            if not pending:
                return
            for item in pending:
                ref = client.collection(item.collection).document(item.document_id)
                if item.is_delete:
                    ref.delete()
                else:
                    ref.set(item.payload or {})
                item.delivered_at = datetime.now(UTC).replace(tzinfo=None)
            session.commit()
