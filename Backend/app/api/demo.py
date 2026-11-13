"""Seeded mock endpoints for the dashboard. Everything here is labelled `demo data`."""

from fastapi import APIRouter, Depends

from app.core.disclaimer import DEMO_DATA
from app.core.roles import Role
from app.core.security import require_role

router = APIRouter(prefix="/demo", tags=["demo"])
_who = require_role(Role.admin, Role.doctor)


def _wrap(payload: dict) -> dict:
    return {"data_label": DEMO_DATA, "note": "Seeded fake data. Not real.", **payload}


@router.get("/hotspots")
def hotspots(_=Depends(_who)):
    return _wrap({"areas": [
        {"name": "Demo District A", "screened": 120, "flagged": 14},
        {"name": "Demo District B", "screened": 85, "flagged": 6},
        {"name": "Demo District C", "screened": 60, "flagged": 9},
    ]})


@router.get("/funnel")
def funnel(_=Depends(_who)):
    return _wrap({"stages": [
        {"stage": "Consented", "count": 265},
        {"stage": "Intake done", "count": 240},
        {"stage": "Flagged for doctor", "count": 29},
        {"stage": "Reviewed by doctor", "count": 21},
    ]})


@router.get("/camp")
def camp(_=Depends(_who)):
    return _wrap({"camp": "Demo Screening Camp", "registered": 48, "screened": 41, "referred": 5})


@router.get("/qr/{patient_id}")
def qr_card(patient_id: int, _=Depends(_who)):
    return _wrap({"patient_id": patient_id, "qr_payload": f"nirmay://demo/card/{patient_id}",
                  "card_title": "Nirmay screening card (demo placeholder)"})
