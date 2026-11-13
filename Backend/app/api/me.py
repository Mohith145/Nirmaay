from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.audit import audit
from app.core.privacy import withdraw_subject
from app.core.security import get_current_user
from app.db.models import User
from app.db.session import get_db

router = APIRouter(tags=["me"])


@router.delete("/me")
def delete_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Consent-withdrawal path: stop processing, queue deletion, deactivate the login."""
    audit(db, user, "me.delete_requested", "user", user.id)
    withdraw_subject(db, user, deactivate=True)
    db.commit()
    return {"status": "deletion_queued", "message": "Processing stopped. Your data is queued for deletion."}
