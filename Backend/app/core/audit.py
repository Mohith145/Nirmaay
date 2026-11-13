from sqlalchemy.orm import Session

from app.db.models import AuditLog, User


def audit(
    db: Session,
    actor: User | None,
    action: str,
    resource: str | None = None,
    resource_id: int | None = None,
    detail: dict | None = None,
) -> None:
    """Add an audit row. Flushes; the caller commits with its own change."""
    db.add(
        AuditLog(
            actor_id=actor.id if actor else None,
            actor_role=str(actor.role) if actor else None,
            action=action,
            resource=resource,
            resource_id=resource_id,
            detail=detail,
        )
    )
    db.flush()
