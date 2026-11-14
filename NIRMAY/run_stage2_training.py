"""
run_stage2_training.py — Entry point for Stage 2 cancer type classification training.

Run AFTER:
  1. Downloading a type-labeled dataset (ORCHID / Mendeley / Kaggle)
  2. Placing images in stage2_dataset/ folders
  3. Completing Stage 1 training (run_training.py)
"""

import sys, os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.stage2_data_loader import create_stage2_placeholder, split_stage2_dataset
from src.stage2_train import train_stage2
from src.config import STAGE2_DATASET_DIR, STAGE2_CLASS_NAMES
from pathlib import Path

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="NIRMAY Stage 2 Training (Cancer Type Classification)")
    parser.add_argument("--setup", action="store_true",
                        help="Create empty stage2_dataset folder structure")
    parser.add_argument("--resume", type=str, default=None,
                        help="Resume from checkpoint path")
    parser.add_argument("--rebuild", action="store_true", default=True,
                        help="Force rebuild of stage2 train/val/test split")
    args = parser.parse_args()

    if args.setup:
        create_stage2_placeholder()
    else:
        # Check class folders and show count per class
        base = Path(STAGE2_DATASET_DIR)
        print("\n" + "=" * 55)
        print("📊 STAGE 2 CANCER TYPES DATASET STATUS")
        print("=" * 55)
        active_classes = []
        for cls in STAGE2_CLASS_NAMES:
            folder = base / cls
            count = 0
            if folder.exists():
                count = len(list(folder.rglob("*.jpg")) +
                            list(folder.rglob("*.png")) +
                            list(folder.rglob("*.jpeg")))
            status = f"✅ ({count} images)" if count > 0 else "❌ (0 images)"
            print(f"  {cls:<28} : {status}")
            if count > 0:
                active_classes.append((cls, count))
        print("=" * 55)

        if len(active_classes) == 0:
            print("\n⚠️  No images found in stage2_dataset/")
            print("   We populated 488 SCC images using: python populate_scc.py")
            print("   Please add images for at least one more type (e.g. Melanoma, Verrucous, etc.)")
        elif len(active_classes) == 1:
            cls_name, count = active_classes[0]
            print(f"\n⚠️  Only 1 class is populated: '{cls_name}' with {count} images.")
            print("   A multi-class classifier requires at least 2 distinct cancer types to train!")
            print("   👉 Add images to at least one other folder (e.g. Melanoma, Verrucous_Carcinoma, etc.)")
            print(f"   Location: {base}\\<Cancer_Type>")
        else:
            total_images = sum(c for _, c in active_classes)
            print(f"\n✅ Ready! Found {total_images} images across {len(active_classes)} cancer types.")
            print(f"   Training classes: {[c for c, _ in active_classes]}")
            train_stage2(resume_from=args.resume, rebuild=args.rebuild)
