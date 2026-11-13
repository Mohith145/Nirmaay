from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.cases import load_case_bundle
from app.core.audit import audit
from app.core.errors import http_error
from app.core.roles import Role
from app.core.security import require_role
from app.db.models import Case, Review, User, utcnow
from app.db.session import get_db
from app.schemas.case import QueueItemOut, QueueOut
from app.schemas.review import ReviewIn, ReviewOut
from app.services.handoff import build_handoff

router = APIRouter(prefix="/clinician", tags=["clinician"])
_doctor = require_role(Role.doctor)
_URGENCY_RANK = {"urgent": 0, "soon": 1, "routine": 2}


def _rank(case: Case) -> int:
    return -1 if case.emergency else _URGENCY_RANK[case.urgency]


@router.get("/queue", response_model=QueueOut)
def queue(
    include_reviewed: bool = False,
    db: Session = Depends(get_db),
    doctor: User = Depends(_doctor),
):
    stmt = select(Case).where(Case.deletion_queued.is_(False))
    if not include_reviewed:
        stmt = stmt.where(Case.status != "reviewed")
    # Emergency first, then urgency, then longest waiting.
    cases = sorted(db.scalars(stmt).all(), key=lambda c: (_rank(c), c.created_at))
    now = utcnow()
    items = []
    for c in cases:
        patient = db.get(User, c.subject_id)
        items.append(
            QueueItemOut(
                case_id=c.id, patient_name=patient.full_name, urgency=c.urgency,
                emergency=c.emergency, risk_level=c.risk_level, ai_flag=c.ai_flag,
                status=c.status, waiting_minutes=int((now - c.created_at).total_seconds() // 60),
                created_at=c.created_at,
            )
        )
    audit(db, doctor, "queue.view", "case", None, {"count": len(items)})
    db.commit()
    return QueueOut(items=items)


@router.post("/cases/{case_id}/review", response_model=ReviewOut, status_code=201)
def review_case(
    case_id: int,
    body: ReviewIn,
    db: Session = Depends(get_db),
    doctor: User = Depends(_doctor),
):
    case = db.get(Case, case_id)
    if case is None:
        raise http_error(404, "case_not_found", "Case not found.")
    if case.deletion_queued:
        raise http_error(403, "case_flagged_for_deletion", "Consent was withdrawn for this case.")
    row = Review(
        case_id=case.id,
        doctor_id=doctor.id,
        decision=body.decision,
        reason=body.reason.strip() if body.reason else None,
        final_risk_level=body.final_risk_level,
        final_urgency=body.final_urgency,
    )
    db.add(row)
    case.status = "reviewed"  # original rule/AI fields stay untouched for the audit trail
    db.flush()
    audit(
        db, doctor, f"review.{body.decision}", "case", case.id,
        {"review_id": row.id, "final_risk_level": row.final_risk_level,
         "final_urgency": row.final_urgency},
    )
    db.commit()
    return ReviewOut(
        id=row.id, case_id=case.id, decision=row.decision, reason=row.reason,
        final_risk_level=row.final_risk_level, final_urgency=row.final_urgency,
        created_at=row.created_at,
    )


@router.get("/cases/{case_id}")
def clinician_case_view(
    case_id: int, db: Session = Depends(get_db), doctor: User = Depends(_doctor)
):
    """Doctor's full view: handoff summary, AI flag, heatmap, and a link to the stored photo."""
    case = db.get(Case, case_id)
    if case is None:
        raise http_error(404, "case_not_found", "Case not found.")
    if case.deletion_queued:
        raise http_error(403, "case_flagged_for_deletion", "Consent was withdrawn for this case.")
    subject, intake, symptom, photo, review = load_case_bundle(db, case)
    data = build_handoff(case, subject, intake, symptom, photo, review)
    if photo is not None and photo.retained:
        data["photo"]["image_url"] = f"/photos/{photo.id}/image"
    audit(db, doctor, "case.view", "case", case.id, {"subject_id": case.subject_id})
    db.commit()
    return data
