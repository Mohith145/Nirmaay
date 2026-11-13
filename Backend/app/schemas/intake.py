from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.core.disclaimer import DISCLAIMER, THRESHOLDS_STATUS


class Recommendation(BaseModel):
    test: str
    timeframe: str


class OralIntakeIn(BaseModel):
    """Only fields the rules use (data minimisation)."""

    model_config = ConfigDict(extra="forbid")
    patient_id: int | None = None
    cancer_type: Literal["oral"] = "oral"
    age: int = Field(ge=0, le=120)
    tobacco: Literal["none", "smokeless", "smoking", "both"]
    tobacco_years: int | None = Field(default=None, ge=0, le=90)
    betel_quid: bool = False
    alcohol: Literal["none", "occasional", "regular"] = "none"
    family_history: bool = False
    prior_oral_lesion: bool = False


class IntakeOut(BaseModel):
    id: int
    cancer_type: str
    risk_level: Literal["Low", "Medium", "High"]
    risk_score: int
    reasons: list[str]
    rules_fired: list[str]
    recommended_test: Recommendation
    thresholds_status: str = THRESHOLDS_STATUS
    disclaimer: str = DISCLAIMER
