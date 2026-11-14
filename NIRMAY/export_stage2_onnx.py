"""Export trained Stage 2 PyTorch model to ONNX and generate model_metadata.json for NIRMAY."""

import json
import os
import sys
import argparse
from pathlib import Path
import torch
import torch.nn as nn
from torchvision import models

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
from config import STAGE2_CLASS_NAMES, STAGE2_MODEL_DIR, STAGE2_NUM_CLASSES
from stage2_model import build_stage2_model

def export(output_dir: Path):
    device = torch.device("cpu")
    ckpt_path = os.path.join(STAGE2_MODEL_DIR, "best_stage2_model.pth")
    if not os.path.exists(ckpt_path):
        print(f"Error: {ckpt_path} not found.")
        return

    print(f"Loading checkpoint: {ckpt_path}")
    ckpt = torch.load(ckpt_path, map_location=device)
    class_names = ckpt.get("class_names", STAGE2_CLASS_NAMES)
    num_classes = len(class_names)
    print(f"Classes ({num_classes}): {class_names}")

    model = build_stage2_model(device, num_classes=num_classes, class_names=class_names)
    model.load_state_dict(ckpt["model_state"])
    model.eval()

    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    # Keep output location configurable and relative to the repository by default.
    backend_vision_dir = output_dir
    backend_vision_dir.mkdir(parents=True, exist_ok=True)
    onnx_path = backend_vision_dir / "model.onnx"
    metadata_path = backend_vision_dir / "model_metadata.json"

    print(f"Exporting ONNX to: {onnx_path}")
    torch.onnx.export(
        model,
        dummy_input,
        str(onnx_path),
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
    )
    print("✅ ONNX export succeeded.")

    meta = {
        "model_version": "NIRMAY-Stage2-EfficientNetB3-v1.0",
        "labels": class_names,
        "input_size": [224, 224],
        "layout": "NCHW",
        "color_order": "RGB",
        "scale": 255.0,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "output_type": "logits",
        "temperature": 1.0,
        "confidence_threshold": 0.25,
        "not_mouth_label": None,
        "input_name": "input",
        "output_name": "output"
    }

    print(f"Writing metadata to: {metadata_path}")
    metadata_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print("✅ Metadata written.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Export the NIRMAY Stage 2 model to ONNX.")
    default_output_dir = (
        Path(__file__).resolve().parent.parent
        / "Backend" / "Nirmaay-main" / "Backend" / "app" / "services" / "vision"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(os.environ.get("NIRMAY_ONNX_OUTPUT_DIR", default_output_dir)),
        help="Directory for model.onnx and model_metadata.json",
    )
    export(parser.parse_args().output_dir)
