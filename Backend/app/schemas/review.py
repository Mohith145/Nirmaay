from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, model_validator

from app.core.disclaimer import DISCLAIMER


class ReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["confirm", "override"]
    reason: str | None = None
    final_risk_level: Literal["Low", "Medium", "High"] | None = None
    final_urgency: Literal["routine", "soon", "urgent"] | None = None

    @model_validator(mode="after")
    def override_needs_reason(self):
        if self.decision == "override":
            if not self.reason or len(self.reason.strip()) < 3:
                raise ValueError("override requires a reason")
            if self.final_risk_level is None and self.final_urgency is None:
                raise ValueError("override must set final_risk_level or final_urgency")
        return self


class ReviewOut(BaseModel):
    id: int
    case_id: int
    decision: str
    reason: str | None
    final_risk_level: str | None
    final_urgency: str | None
    created_at: datetime
    disclaimer: str = DISCLAIMER
