"""Public model-card route; reports honestly when no trained model is installed."""

from fastapi import APIRouter

router = APIRouter(tags=["model-card"])


@router.get("/model-card")
def get_model_card() -> dict[str, object]:
    return {
        "status": "demo placeholder",
        "model_available": False,
        "scope": "Oral photo screening only",
        "architecture": "TBD",
        "input_size": "TBD",
        "normalization": "TBD",
        "calibration_temperature": "TBD",
        "not_sure_threshold": "TBD",
        "sensitivity_by_class": "TBD",
        "disclaimer": "Screening aid, not diagnosis.",
    }
