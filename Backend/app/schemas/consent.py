from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class ConsentIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: int | None = None  # required for health workers, omitted by patients
    purpose: Literal["screening"] = "screening"


class ConsentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    subject_id: int
    purpose: str
    status: str
    granted_at: datetime
    withdrawn_at: datetime | None = None
    message: str | None = None
