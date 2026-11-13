from concurrent.futures import ThreadPoolExecutor

import numpy as np
import pytest

from app.services.vision import classifier as classifier_module
from app.services.vision.classifier import (
    ClassifierProvider,
    ClassifierUnavailable,
    ModelMetadata,
    OnnxClassifier,
)


def test_missing_model_is_reported_as_unavailable(tmp_path):
    with pytest.raises(ClassifierUnavailable, match="trained ONNX model is not installed"):
        OnnxClassifier(tmp_path / "model.onnx", tmp_path / "metadata.json")


def test_inference_requires_one_batched_image():
    classifier = object.__new__(OnnxClassifier)
    classifier.metadata = ModelMetadata(
        model_version="test",
        labels=("normal", "suspicious"),
        input_width=4,
        input_height=4,
        layout="NCHW",
        color_order="RGB",
        scale=255,
        mean=(0, 0, 0),
        std=(1, 1, 1),
        output_type="logits",
        temperature=1,
        confidence_threshold=0.7,
    )

    with pytest.raises(ValueError, match="Expected preprocessed tensor shape"):
        classifier.predict_preprocessed(np.zeros((2, 3, 224, 224), dtype=np.float32))


def test_prediction_uses_not_sure_below_configured_threshold():
    class FakeSession:
        def run(self, output_names, inputs):
            return [np.array([[0.1, 0.0]], dtype=np.float32)]

    classifier = object.__new__(OnnxClassifier)
    classifier.metadata = ModelMetadata(
        model_version="test",
        labels=("normal", "suspicious"),
        input_width=4,
        input_height=4,
        layout="NCHW",
        color_order="RGB",
        scale=255,
        mean=(0, 0, 0),
        std=(1, 1, 1),
        output_type="logits",
        temperature=1,
        confidence_threshold=0.9,
    )
    classifier._session = FakeSession()
    classifier._input_name = "image"
    classifier._output_name = "scores"

    prediction = classifier.predict_preprocessed(np.zeros((1, 3, 4, 4), dtype=np.float32))

    assert prediction["status"] == "not_sure"
    assert prediction["label"] == "not sure"
    assert prediction["heatmap"] is None


def test_classifier_provider_loads_only_once_under_parallel_startup(monkeypatch, tmp_path):
    class FakeClassifier:
        pass

    calls = 0

    def factory(model_path, metadata_path):
        nonlocal calls
        calls += 1
        return FakeClassifier()

    monkeypatch.setattr(classifier_module, "OnnxClassifier", factory)
    provider = ClassifierProvider(tmp_path / "model.onnx", tmp_path / "metadata.json")
    with ThreadPoolExecutor(max_workers=5) as pool:
        loaded = list(pool.map(lambda _: provider.initialize(), range(5)))

    assert calls == 1
    assert all(item is loaded[0] for item in loaded)
