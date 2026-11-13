from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.core.disclaimer import DISCLAIMER


class CaseCreateIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: int | None = None
    intake_id: int
    symptom_id: int | None = None
    photo_id: int | None = None


class CaseOut(BaseModel):
    id: int
    status: str
    risk_level: str
    urgency: str
    emergency: bool
    ai_flag: str | None = None
    created_at: datetime
    disclaimer: str = DISCLAIMER


class QueueItemOut(BaseModel):
    case_id: int
    patient_name: str
    urgency: Literal["routine", "soon", "urgent"]
    emergency: bool
    risk_level: str
    ai_flag: str | None = None
    status: str
    waiting_minutes: int
    created_at: datetime


class QueueOut(BaseModel):
    items: list[QueueItemOut]
    disclaimer: str = DISCLAIMER


class HandoffOut(BaseModel):
    case_id: int
    summary_text: str
    patient: dict
    risk: dict
    symptoms: dict | None = None
    photo: dict | None = None
    ai_flag: str | None = None
    recommended_test: dict
    review: dict | None = None
    emergency: bool
    status: str
    disclaimer: str = DISCLAIMER
