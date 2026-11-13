"""Metadata-driven ONNX image classifier loaded once for CPU inference."""

from __future__ import annotations

import json
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import cv2
import numpy as np


class ClassifierUnavailable(RuntimeError):
    """Raised when no usable trained model or metadata is available."""


@dataclass(frozen=True)
class ModelMetadata:
    model_version: str
    labels: tuple[str, ...]
    input_width: int
    input_height: int
    layout: str
    color_order: str
    scale: float
    mean: tuple[float, float, float]
    std: tuple[float, float, float]
    output_type: str
    temperature: float
    confidence_threshold: float
    input_name: str | None = None
    output_name: str | None = None
    not_mouth_label: str | None = None

    @classmethod
    def from_json(cls, path: str | Path) -> ModelMetadata:
        try:
            raw = json.loads(Path(path).read_text(encoding="utf-8"))
            meta = cls(
                model_version=str(raw["model_version"]),
                labels=tuple(raw["labels"]),
                input_width=int(raw["input_size"][1]),
                input_height=int(raw["input_size"][0]),
                layout=str(raw["layout"]).upper(),
                color_order=str(raw["color_order"]).upper(),
                scale=float(raw["scale"]),
                mean=tuple(float(v) for v in raw["mean"]),
                std=tuple(float(v) for v in raw["std"]),
                output_type=str(raw["output_type"]).lower(),
                temperature=float(raw["temperature"]),
                confidence_threshold=float(raw["confidence_threshold"]),
                input_name=raw.get("input_name"),
                output_name=raw.get("output_name"),
                not_mouth_label=raw.get("not_mouth_label"),
            )
        except (OSError, KeyError, TypeError, ValueError, IndexError) as exc:
            raise ClassifierUnavailable(f"Invalid model metadata: {exc}") from exc

        if not meta.model_version or not meta.labels or len(meta.labels) > 4:
            raise ClassifierUnavailable("Metadata needs a model version and 1-4 output labels.")
        if meta.input_width < 1 or meta.input_height < 1 or meta.scale <= 0:
            raise ClassifierUnavailable("Metadata input size and scale must be positive.")
        if meta.layout not in {"NCHW", "NHWC"} or meta.color_order not in {"RGB", "BGR"}:
            raise ClassifierUnavailable("Metadata layout must be NCHW/NHWC and color order RGB/BGR.")
        if meta.output_type not in {"logits", "probabilities"}:
            raise ClassifierUnavailable("Metadata output_type must be logits or probabilities.")
        if len(meta.mean) != 3 or len(meta.std) != 3 or any(v == 0 for v in meta.std):
            raise ClassifierUnavailable("Metadata mean and std must each contain three values; std cannot be zero.")
        if meta.temperature <= 0 or not 0 <= meta.confidence_threshold <= 1:
            raise ClassifierUnavailable("Temperature must be positive and confidence threshold must be in [0, 1].")
        if meta.not_mouth_label and meta.not_mouth_label not in meta.labels:
            raise ClassifierUnavailable("not_mouth_label must appear in labels.")
        return meta


class OnnxClassifier:
    """Load once, preprocess according to training metadata, and return calibrated scores."""

    def __init__(self, model_path: str | Path, metadata_path: str | Path):
        path = Path(model_path)
        if not path.is_file():
            raise ClassifierUnavailable(
                "Photo screener unavailable: trained ONNX model is not installed."
            )
        self.metadata = ModelMetadata.from_json(metadata_path)
        try:
            import onnxruntime as ort

            self._session = ort.InferenceSession(
                str(path), providers=["CPUExecutionProvider"]
            )
        except Exception as exc:
            raise ClassifierUnavailable(
                "Photo screener unavailable: ONNX model could not be loaded."
            ) from exc

        inputs = self._session.get_inputs()
        outputs = self._session.get_outputs()
        input_names = [item.name for item in inputs]
        output_names = [item.name for item in outputs]
        self._input_name = self.metadata.input_name or (input_names[0] if len(inputs) == 1 else None)
        self._output_name = self.metadata.output_name or (output_names[0] if len(outputs) == 1 else None)
        if self._input_name not in input_names or self._output_name not in output_names:
            raise ClassifierUnavailable("Metadata must identify a single model input and output.")

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        encoded = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Image could not be decoded.")
        if self.metadata.color_order == "RGB":
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = cv2.resize(image, (self.metadata.input_width, self.metadata.input_height))
        tensor = image.astype(np.float32) / self.metadata.scale
        mean = np.asarray(self.metadata.mean, dtype=np.float32).reshape(1, 1, 3)
        std = np.asarray(self.metadata.std, dtype=np.float32).reshape(1, 1, 3)
        tensor = (tensor - mean) / std
        if self.metadata.layout == "NCHW":
            tensor = np.transpose(tensor, (2, 0, 1))
        return np.expand_dims(tensor, axis=0).astype(np.float32)

    def predict_preprocessed(self, tensor: np.ndarray) -> dict[str, Any]:
        """Run inference and apply training-set calibration metadata."""
        expected_shape = (
            (1, 3, self.metadata.input_height, self.metadata.input_width)
            if self.metadata.layout == "NCHW"
            else (1, self.metadata.input_height, self.metadata.input_width, 3)
        )
        if tensor.shape != expected_shape:
            raise ValueError(f"Expected preprocessed tensor shape {expected_shape}; got {tensor.shape}.")
        try:
            raw = self._session.run(
                [self._output_name], {self._input_name: tensor.astype(np.float32)}
            )[0]
        except Exception as exc:
            raise ClassifierUnavailable("Photo screener unavailable: model inference failed.") from exc
        scores = np.asarray(raw, dtype=np.float64).reshape(-1)
        if len(scores) != len(self.metadata.labels) or not np.all(np.isfinite(scores)):
            raise ClassifierUnavailable("Model output does not match the metadata labels.")
        if self.metadata.output_type == "probabilities":
            if np.any(scores < 0) or not np.isclose(scores.sum(), 1.0, atol=0.05):
                raise ClassifierUnavailable("Model output was declared probabilities but is invalid.")
            scores = np.log(np.clip(scores, 1e-12, 1.0))
        scaled = scores / self.metadata.temperature
        probabilities = np.exp(scaled - np.max(scaled))
        probabilities /= probabilities.sum()
        index = int(np.argmax(probabilities))
        label = self.metadata.labels[index]
        confidence = float(probabilities[index])

        if self.metadata.not_mouth_label == label:
            status, display_label = "not_mouth", "not a mouth"
        elif confidence < self.metadata.confidence_threshold:
            status, display_label = "not_sure", "not sure"
        else:
            status, display_label = "ok", label
        return {
            "status": status,
            "label": display_label,
            "confidence": confidence,
            "class_probabilities": {
                name: float(probabilities[i]) for i, name in enumerate(self.metadata.labels)
            },
            "heatmap": None,
            "heatmap_status": "model-specific Grad-CAM adapter required",
            "model_version": self.metadata.model_version,
        }


class ClassifierProvider:
    """Thread-safe startup loader that attempts model initialization once."""

    def __init__(self, model_path: str | Path, metadata_path: str | Path):
        self.model_path = Path(model_path)
        self.metadata_path = Path(metadata_path)
        self._lock = threading.Lock()
        self._initialized = False
        self._classifier: OnnxClassifier | None = None
        self.failure_reason: str | None = None

    @classmethod
    def from_env(cls) -> ClassifierProvider:
        """Build the startup provider from server-side model file paths."""
        return cls(
            os.getenv("NIRMAY_MODEL_PATH", "app/services/vision/model.onnx"),
            os.getenv("NIRMAY_MODEL_METADATA_PATH", "app/services/vision/model_metadata.json"),
        )

    def initialize(self) -> OnnxClassifier | None:
        """Warm the session at app startup; safe for concurrent startup calls."""
        if self._initialized:
            return self._classifier
        with self._lock:
            if self._initialized:
                return self._classifier
            try:
                self._classifier = OnnxClassifier(self.model_path, self.metadata_path)
            except ClassifierUnavailable as exc:
                self.failure_reason = str(exc)
            finally:
                self._initialized = True
        return self._classifier

    @property
    def classifier(self) -> OnnxClassifier | None:
        return self._classifier if self._initialized else None


_default_provider = ClassifierProvider.from_env()


def load_model() -> None:
    """Warm the session at app startup (never inside a request)."""
    _default_provider.initialize()


def predict(image_bytes: bytes) -> dict[str, Any]:
    """Inference entry point expected by the /photos/screen route."""
    classifier = _default_provider.classifier
    if not _default_provider._initialized:
        classifier = _default_provider.initialize()
    if classifier is None:
        raise ClassifierUnavailable(
            _default_provider.failure_reason
            or "Photo screener unavailable: trained ONNX model is not installed."
        )
    tensor = classifier.preprocess(image_bytes)
    result = classifier.predict_preprocessed(tensor)
    return {
        "label": result.get("label"),
        "confidence": result.get("confidence"),
        "not_sure": result.get("status") == "not_sure",
        "heatmap_b64": result.get("heatmap"),
        "model_version": result.get("model_version"),
        "demo_placeholder": True,
        "is_mouth": result.get("status") != "not_mouth",
    }
