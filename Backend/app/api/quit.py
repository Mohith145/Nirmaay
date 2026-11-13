from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_consent
from app.core.audit import audit
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import QuitProgress, User, utcnow
from app.db.session import get_db

router = APIRouter(prefix="/quit", tags=["quit-tobacco"])
BADGE_DAYS = ((1, "1 day"), (7, "1 week"), (30, "1 month"), (100, "100 days"))


class QuitIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    quit_date: date
    daily_spend: float = Field(ge=0, le=100000)


def _view(row: QuitProgress | None) -> dict:
    if row is None:
        return {"set_up": False, "message": "No quit date set yet."}
    streak = max((date.today() - row.quit_date).days, 0)
    return {
        "set_up": True,
        "quit_date": row.quit_date.isoformat(),
        "streak_days": streak,
        "money_saved": round(streak * row.daily_spend, 2),
        "money_saved_note": "Computed from the daily spend you entered.",
        "badges": [name for days, name in BADGE_DAYS if streak >= days],
    }


@router.get("/progress")
def get_progress(db: Session = Depends(get_db), user: User = Depends(require_role(Role.patient))):
    row = db.scalar(select(QuitProgress).where(QuitProgress.user_id == user.id))
    return _view(row)


@router.post("/progress")
def set_progress(
    body: QuitIn, db: Session = Depends(get_db), user: User = Depends(require_role(Role.patient))
):
    require_consent(db, user)
    row = db.scalar(select(QuitProgress).where(QuitProgress.user_id == user.id))
    if row is None:
        row = QuitProgress(user_id=user.id, quit_date=body.quit_date, daily_spend=body.daily_spend)
        db.add(row)
    else:
        row.quit_date, row.daily_spend, row.updated_at = body.quit_date, body.daily_spend, utcnow()
    audit(db, user, "quit.update", "quit_progress", None)
    db.commit()
    return _view(row)
