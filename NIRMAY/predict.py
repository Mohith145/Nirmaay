"""
predict.py — Full 2-Stage Oral Cancer Prediction Pipeline

Stage 1: Is it Cancer or Non-Cancer?
Stage 2: If Cancer → Which type? (SCC / Melanoma / Lymphoma / etc.)

Usage:
    python predict.py --image path/to/image.jpg
    python predict.py --folder path/to/folder/ --output results.csv
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import argparse
import csv
import torch
import numpy as np
from pathlib import Path
from PIL import Image
from torchvision import transforms

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.config import (
    IMG_SIZE, STAGE1_MODEL_DIR, STAGE2_MODEL_DIR,
    STAGE1_CLASS_NAMES, STAGE2_CLASS_NAMES, IMG_EXTENSIONS
)
from src.model import OralCancerModel
from src.stage2_model import CancerTypeModel

# ─────────────────────────────────────────────────────────────────────────────
INFER_TF = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

# Cancer type display info
CANCER_TYPE_INFO = {
    "SCC":                     "Squamous Cell Carcinoma — most common (>90% of oral cancers)",
    "Verrucous_Carcinoma":     "Verrucous Carcinoma — low-grade SCC variant, rarely spreads",
    "Salivary_Gland_Cancer":   "Salivary Gland Cancer (e.g., Mucoepidermoid Carcinoma)",
    "Adenoid_Cystic_Carcinoma":"Adenoid Cystic Carcinoma — slow-growing but invasive",
    "Melanoma":                "Melanoma — originates in pigment-producing cells (~1-2%)",
    "Lymphoma":                "Lymphoma — affects lymphatic cells (tongue/tonsil area)",
    "Sarcoma":                 "Sarcoma — connective tissue cancer (bone/muscle), uncommon",
    "Odontogenic_Tumour":      "Odontogenic Tumour — originates in tooth/jaw tissue",
}


# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADERS
# ─────────────────────────────────────────────────────────────────────────────

def load_stage1_model(device):
    model = OralCancerModel()
    ckpt_path = os.path.join(STAGE1_MODEL_DIR, "best_model.pth")
    if not os.path.exists(ckpt_path):
        raise FileNotFoundError(f"Stage 1 model not found: {ckpt_path}\nRun: python run_training.py first.")
    ckpt = torch.load(ckpt_path, map_location=device)
    model.load_state_dict(ckpt["model_state"])
    model.to(device).eval()
    print(f"✅ Stage 1 model loaded (Cancer Detection)")
    return model


def load_stage2_model(device):
    ckpt_path = os.path.join(STAGE2_MODEL_DIR, "best_stage2_model.pth")
    if not os.path.exists(ckpt_path):
        print(f"⚠️  Stage 2 model not found: {ckpt_path}")
        print("   Cancer type classification will be SKIPPED.")
        print("   Run: python run_stage2_training.py after adding type-labeled data.")
        return None, []
    ckpt = torch.load(ckpt_path, map_location=device)
    class_names = ckpt.get("class_names", STAGE2_CLASS_NAMES)
    model = CancerTypeModel(num_classes=len(class_names))
    model.load_state_dict(ckpt["model_state"])
    model.to(device).eval()
    print(f"✅ Stage 2 model loaded ({len(class_names)} cancer types: {class_names})")
    return model, class_names


# ─────────────────────────────────────────────────────────────────────────────
# INFERENCE
# ─────────────────────────────────────────────────────────────────────────────

def predict_image(stage1_model, stage2_model, image_path: str, device, stage2_classes: list = None) -> dict:
    """
    Full 2-stage inference on a single image.
    Returns a dict with detection + type classification results.
    """
    if stage2_classes is None:
        stage2_classes = STAGE2_CLASS_NAMES

    img    = Image.open(image_path).convert("RGB")
    tensor = INFER_TF(img).unsqueeze(0).to(device)

    # ── Stage 1: Cancer Detection ──
    with torch.no_grad():
        out1   = stage1_model(tensor)
        probs1 = torch.softmax(out1, dim=1)[0].cpu().numpy()

    # Class mapping from ImageFolder is alphabetical: Cancer=0, Non_Cancer=1
    cancer_prob     = float(probs1[0])   # index 0 = Cancer
    noncancer_prob  = float(probs1[1])   # index 1 = Non_Cancer
    is_cancer       = cancer_prob > noncancer_prob
    stage1_label    = "Cancer" if is_cancer else "Non_Cancer"
    stage1_conf     = cancer_prob if is_cancer else noncancer_prob

    result = {
        "image":            os.path.basename(image_path),
        "detection":        stage1_label,
        "detection_conf":   f"{stage1_conf*100:.2f}%",
        "cancer_prob":      f"{cancer_prob*100:.2f}%",
        "non_cancer_prob":  f"{noncancer_prob*100:.2f}%",
        "cancer_type":      "N/A",
        "type_confidence":  "N/A",
        "type_description": "N/A",
    }

    # ── Stage 2: Cancer Type (only if cancer detected AND stage2 model exists) ──
    if is_cancer and stage2_model is not None:
        with torch.no_grad():
            out2   = stage2_model(tensor)
            probs2 = torch.softmax(out2, dim=1)[0].cpu().numpy()

        type_idx    = int(np.argmax(probs2))
        type_label  = stage2_classes[type_idx] if type_idx < len(stage2_classes) else "Unknown"
        type_conf   = float(probs2[type_idx])
        type_desc   = CANCER_TYPE_INFO.get(type_label, "")

        result["cancer_type"]      = type_label.replace("_", " ")
        result["type_confidence"]  = f"{type_conf*100:.2f}%"
        result["type_description"] = type_desc

        # Top probabilities
        top_k = min(3, len(stage2_classes))
        top_idx = np.argsort(probs2)[::-1][:top_k]
        result["top3_types"] = " | ".join(
            f"{stage2_classes[i].replace('_',' ')} ({probs2[i]*100:.1f}%)"
            for i in top_idx
        )
    else:
        result["top3_types"] = "N/A"

    return result


def print_result(result: dict):
    """Pretty-print a single prediction result."""
    icon = "🔴" if result["detection"] == "Cancer" else "🟢"
    print(f"\n{'='*60}")
    print(f"🔬 NIRMAY — AI Oral Cancer Diagnostic Report")
    print(f"{'='*60}")
    print(f"  Image            : {result['image']}")
    print(f"  Detection        : {icon} {result['detection']} ({result['detection_conf']})")
    print(f"  Cancer Prob      : {result['cancer_prob']}")
    print(f"  Non-Cancer Prob  : {result['non_cancer_prob']}")
    if result["cancer_type"] != "N/A":
        print(f"\n  🧬 Cancer Type   : {result['cancer_type']} ({result['type_confidence']})")
        print(f"  Description      : {result['type_description']}")
        print(f"  Top 3 Types      : {result['top3_types']}")
    print(f"{'='*60}\n")


def predict_folder(stage1_model, stage2_model, folder: str, device, output_csv=None):
    """Batch inference on all images in a folder."""
    folder_path = Path(folder)
    images = [f for f in folder_path.rglob("*") if f.suffix.lower() in IMG_EXTENSIONS]

    if not images:
        print(f"⚠️  No images found in {folder}")
        return []

    print(f"\n🔍 Running 2-stage inference on {len(images)} images...\n")
    results = []

    for img_path in images:
        try:
            r = predict_image(stage1_model, stage2_model, str(img_path), device)
            results.append(r)
            icon = "🔴" if r["detection"] == "Cancer" else "🟢"
            type_str = f" → {r['cancer_type']}" if r["cancer_type"] != "N/A" else ""
            print(f"  {icon} {img_path.name:<40} {r['detection']}{type_str} ({r['detection_conf']})")
        except Exception as e:
            print(f"  ⚠️  {img_path.name}: {e}")

    # Summary
    cancer_results     = [r for r in results if r["detection"] == "Cancer"]
    non_cancer_results = [r for r in results if r["detection"] == "Non_Cancer"]
    print(f"\n{'='*60}")
    print(f"📊 Summary: {len(results)} images")
    print(f"   🔴 Cancer     : {len(cancer_results)}")
    print(f"   🟢 Non-Cancer : {len(non_cancer_results)}")
    if cancer_results and cancer_results[0]["cancer_type"] != "N/A":
        from collections import Counter
        type_counts = Counter(r["cancer_type"] for r in cancer_results)
        print(f"\n   Cancer Types Detected:")
        for t, c in type_counts.most_common():
            print(f"     {t}: {c}")
    print(f"{'='*60}")

    if output_csv and results:
        fieldnames = [k for k in results[0].keys()]
        with open(output_csv, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        print(f"📄 Results saved → {output_csv}")

    return results


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="NIRMAY — 2-Stage AI Oral Cancer Diagnostic Pipeline")
    group  = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--image",  type=str, help="Path to a single image")
    group.add_argument("--folder", type=str, help="Path to a folder of images")
    parser.add_argument("--output", type=str, default=None, help="CSV output path (folder mode)")
    args   = parser.parse_args()

    device       = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    stage1_model = load_stage1_model(device)
    stage2_model, stage2_classes = load_stage2_model(device)

    if args.image:
        result = predict_image(stage1_model, stage2_model, args.image, device, stage2_classes=stage2_classes)
        print_result(result)
    else:
        predict_folder(stage1_model, stage2_model, args.folder, device, output_csv=args.output)


if __name__ == "__main__":
    main()
