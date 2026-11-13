import cv2
import numpy as np

from app.services.vision.quality_gate import check_photo_quality


def make_png(image: np.ndarray) -> bytes:
    success, encoded = cv2.imencode(".png", image)
    assert success
    return encoded.tobytes()


def check(image: np.ndarray):
    return check_photo_quality(
        make_png(image),
        min_blur_variance=10,
        min_brightness=40,
        max_brightness=220,
        min_width=64,
        min_height=64,
        min_aspect_ratio=0.75,
        max_aspect_ratio=1.5,
    )


def test_rejects_unreadable_image():
    result = check_photo_quality(
        b"not an image",
        min_blur_variance=10,
        min_brightness=40,
        max_brightness=220,
        min_width=64,
        min_height=64,
        min_aspect_ratio=0.75,
        max_aspect_ratio=1.5,
    )

    assert not result.ok
    assert result.reason
    assert result.retake_tip


def test_rejects_image_that_is_too_small():
    result = check(np.zeros((20, 20, 3), dtype=np.uint8))

    assert not result.ok
    assert result.reason == "The photo is too small."


def test_rejects_dark_image():
    rng = np.random.default_rng(1)
    dark = rng.integers(0, 30, size=(100, 100, 3), dtype=np.uint8)

    result = check(dark)

    assert not result.ok
    assert result.reason == "The photo is too dark."


def test_accepts_clear_well_lit_image():
    checkerboard = np.indices((100, 100)).sum(axis=0) % 2
    image = np.repeat((checkerboard * 255).astype(np.uint8)[:, :, None], 3, axis=2)

    result = check(image)

    assert result.ok

def test_rejects_blurry_image():
    blurry = np.full((100, 100, 3), 127, dtype=np.uint8)
    result = check(blurry)

    assert not result.ok
    assert result.reason == "The photo is blurry."


def test_rejects_overexposed_image():
    rng = np.random.default_rng(2)
    bright = rng.integers(230, 256, size=(100, 100, 3), dtype=np.uint8)

    result = check(bright)

    assert not result.ok
    assert result.reason == "The photo is too bright."


def test_rejects_unusual_framing():
    image = np.full((100, 200, 3), 127, dtype=np.uint8)

    result = check(image)

    assert not result.ok
    assert result.reason == "Photo framing is not suitable."
