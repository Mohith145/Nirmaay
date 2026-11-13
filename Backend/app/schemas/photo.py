from pydantic import BaseModel

from app.core.disclaimer import DISCLAIMER


class PhotoOut(BaseModel):
    id: int
    status: str  # ok | not_sure | unavailable  (refused photos return 422)
    label: str | None = None
    confidence: float | None = None
    heatmap_b64: str | None = None
    message: str
    model_version: str | None = None
    demo_placeholder: bool = False
    retained_for_doctor: bool = False
    disclaimer: str = DISCLAIMER
