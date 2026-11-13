"""Quality-gated photo screening orchestration for the Member 1 API router."""

from __future__ import annotations

from collections.abc import Callable, Mapping
from typing import Any

from app.services.vision.classifier import ClassifierUnavailable, OnnxClassifier
from app.services.vision.quality_gate import check_photo_quality

DISCLAIMER = "Screening aid, not diagnosis."


def screen_photo(
    image_bytes: bytes,
    *,
    quality_parameters: Mapping[str, float | int],
    classifier: OnnxClassifier | None,
    heatmap_generator: Callable[[bytes, int], Any] | None = None,
) -> dict[str, Any]:
    """Reject poor images before inference, then return a screening result or fallback."""
    quality = check_photo_quality(image_bytes, **quality_parameters)
    if not quality.ok:
        return {
            "status": "rejected",
            "reason": quality.reason,
            "retake_tip": quality.retake_tip,
            "disclaimer": DISCLAIMER,
        }
    if classifier is None:
        return {
            "status": "unavailable",
            "message": "Photo screener unavailable; please see a doctor.",
            "demo_placeholder": True,
            "disclaimer": DISCLAIMER,
        }

    try:
        tensor = classifier.preprocess(image_bytes)
        prediction = classifier.predict_preprocessed(tensor)
    except (ClassifierUnavailable, ValueError):
        return {
            "status": "unavailable",
            "message": "Photo screener unavailable; please see a doctor.",
            "demo_placeholder": True,
            "disclaimer": DISCLAIMER,
        }

    if heatmap_generator is not None and prediction["status"] == "ok":
        try:
            class_index = classifier.metadata.labels.index(prediction["label"])
            prediction["heatmap"] = heatmap_generator(image_bytes, class_index)
            prediction["heatmap_status"] = "available"
        except (ValueError, RuntimeError):
            prediction["heatmap"] = None
            prediction["heatmap_status"] = "unavailable"
    prediction["disclaimer"] = DISCLAIMER
    return prediction
