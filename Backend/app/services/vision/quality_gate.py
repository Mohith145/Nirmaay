from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class QualityResult:
    ok: bool
    reason: str
    retake_tip: str


def check_photo_quality(
    image_bytes: bytes,
    *,
    min_blur_variance: float,
    min_brightness: float,
    max_brightness: float,
    min_width: int,
    min_height: int,
    min_aspect_ratio: float,
    max_aspect_ratio: float,
) -> QualityResult:
    """Reject unreadable, low-quality, or unusually framed uploaded photos.

    Thresholds are required inputs so callers must choose values from the
    project's sample-photo evaluation instead of relying on guessed defaults.
    """

    encoded = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

    if image is None:
        return QualityResult(
            ok=False,
            reason="The image could not be read.",
            retake_tip="Choose a JPG or PNG photo and try again.",
        )

    height, width = image.shape[:2]

    if width < min_width or height < min_height:
        return QualityResult(
            ok=False,
            reason="The photo is too small.",
            retake_tip="Move closer and take the photo again.",
        )
    aspect_ratio = width / height

    if not min_aspect_ratio <= aspect_ratio <= max_aspect_ratio:
        return QualityResult(
            ok=False,
            reason="Photo framing is not suitable.",
            retake_tip="Keep the mouth centered and include the full mouth in the photo.",
        )

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())

    if blur_variance < min_blur_variance:
        return QualityResult(
            ok=False,
            reason="The photo is blurry.",
            retake_tip="Hold the camera steady and take the photo again.",
        )

    if brightness < min_brightness:
        return QualityResult(
            ok=False,
            reason="The photo is too dark.",
            retake_tip="Use brighter lighting and take the photo again.",
        )

    if brightness > max_brightness:
        return QualityResult(
            ok=False,
            reason="The photo is too bright.",
            retake_tip="Avoid direct flash or strong light and try again.",
        )

    return QualityResult(ok=True, reason="", retake_tip="")


DEFAULT_QUALITY_PARAMS = {
    "min_blur_variance": 10.0,
    "min_brightness": 40.0,
    "max_brightness": 220.0,
    "min_width": 64,
    "min_height": 64,
    "min_aspect_ratio": 0.75,
    "max_aspect_ratio": 1.5,
}


def check_quality(image_bytes: bytes) -> QualityResult:
    """Standard quality gate check used by the /photos/screen router."""
    return check_photo_quality(image_bytes, **DEFAULT_QUALITY_PARAMS)
