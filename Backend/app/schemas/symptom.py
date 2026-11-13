from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.disclaimer import DISCLAIMER, THRESHOLDS_STATUS
from app.schemas.intake import Recommendation

SymptomName = Literal[
    "non_healing_ulcer",
    "white_or_red_patch",
    "lump_or_swelling",
    "persistent_mouth_pain",
    "difficulty_chewing_or_swallowing",
    "unexplained_loose_tooth",
]


class SymptomIn(BaseModel):
    model_config = ConfigDict(extra="forbid")
    patient_id: int | None = None
    symptoms: list[SymptomName] = Field(default_factory=list, max_length=10)
    duration_days: int | None = Field(default=None, ge=0, le=3650)
    heavy_bleeding: bool = False
    cannot_swallow_fluids: bool = False
    severe_jaundice: bool = False


class SymptomOut(BaseModel):
    id: int
    urgency: Literal["routine", "soon", "urgent"]
    emergency: bool
    reasons: list[str]
    rules_fired: list[str]
    recommended_test: Recommendation
    action: str | None = None
    thresholds_status: str = THRESHOLDS_STATUS
    disclaimer: str = DISCLAIMER
