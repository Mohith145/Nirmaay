from concurrent.futures import ThreadPoolExecutor

import cv2
import numpy as np

from app.services.vision.screener import DISCLAIMER, screen_photo

QUALITY_PARAMETERS = {
    "min_blur_variance": 10,
    "min_brightness": 40,
    "max_brightness": 220,
    "min_width": 64,
    "min_height": 64,
    "min_aspect_ratio": 0.75,
    "max_aspect_ratio": 1.5,
}


def encode(image):
    success, content = cv2.imencode(".png", image)
    assert success
    return content.tobytes()


def test_bad_photo_is_rejected_before_classifier_runs():
    class NeverCallClassifier:
        def preprocess(self, image_bytes):
            raise AssertionError("classifier must not run after quality rejection")

    image = np.zeros((100, 100, 3), dtype=np.uint8)
    result = screen_photo(
        encode(image),
        quality_parameters=QUALITY_PARAMETERS,
        classifier=NeverCallClassifier(),
    )

    assert result["status"] == "rejected"
    assert result["reason"] == "The photo is blurry."
    assert result["disclaimer"] == DISCLAIMER


def test_good_photo_without_model_returns_unavailable():
    checkerboard = np.indices((100, 100)).sum(axis=0) % 2
    image = np.repeat((checkerboard * 255).astype(np.uint8)[:, :, None], 3, axis=2)

    result = screen_photo(
        encode(image),
        quality_parameters=QUALITY_PARAMETERS,
        classifier=None,
    )

    assert result["status"] == "unavailable"
    assert result["demo_placeholder"] is True
    assert result["disclaimer"] == DISCLAIMER


def test_five_parallel_good_photos_do_not_crash():
    class FakeClassifier:
        def preprocess(self, image_bytes):
            return np.zeros((1, 3, 100, 100), dtype=np.float32)

        def predict_preprocessed(self, tensor):
            return {
                "status": "not_sure",
                "label": "not sure",
                "confidence": 0.4,
                "heatmap": None,
                "model_version": "test",
            }

    checkerboard = np.indices((100, 100)).sum(axis=0) % 2
    image_bytes = encode(
        np.repeat((checkerboard * 255).astype(np.uint8)[:, :, None], 3, axis=2)
    )
    classifier = FakeClassifier()

    def screen_one(_):
        return screen_photo(
            image_bytes,
            quality_parameters=QUALITY_PARAMETERS,
            classifier=classifier,
        )

    with ThreadPoolExecutor(max_workers=5) as pool:
        results = list(pool.map(screen_one, range(5)))

    assert len(results) == 5
    assert all(result["status"] == "not_sure" for result in results)
