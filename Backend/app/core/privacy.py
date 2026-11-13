"""Consent withdrawal and deletion: stops processing and queues deletion."""

import os
from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.db.models import Case, Consent, PhotoScreening, User, utcnow


def withdraw_subject(db: Session, subject: User, *, deactivate: bool = False) -> int:
    """Withdraw every active consent for the subject, flag their cases for deletion and
    delete retained photo files. Returns the number of consents withdrawn. Caller commits."""
    now: datetime = utcnow()
    active = db.scalars(
        select(Consent).where(Consent.subject_id == subject.id, Consent.status == "granted")
    ).all()
    for c in active:
        c.status = "withdrawn"
        c.withdrawn_at = now

    db.execute(update(Case).where(Case.subject_id == subject.id).values(deletion_queued=True))

    photos = db.scalars(
        select(PhotoScreening).where(
            PhotoScreening.subject_id == subject.id, PhotoScreening.image_path.is_not(None)
        )
    ).all()
    for p in photos:
        _remove_file(p.image_path)
        p.image_path = None
        p.retained = False
        p.heatmap_b64 = None

    if deactivate:
        subject.deletion_requested_at = now
        subject.is_active = False
    return len(active)


def _remove_file(path: str | None) -> None:
    if path:
        try:
            os.remove(path)
        except FileNotFoundError:
            pass
