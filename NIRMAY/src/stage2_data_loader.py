"""
stage2_data_loader.py — Dataset loader for Stage 2 (Cancer Type Classification)

Expects STAGE2_DATASET_DIR to have one sub-folder per cancer type:

    stage2_dataset/
        SCC/
        Verrucous_Carcinoma/
        Salivary_Gland_Cancer/
        Adenoid_Cystic_Carcinoma/
        Melanoma/
        Lymphoma/
        Sarcoma/
        Odontogenic_Tumour/

Also includes a helper to create a placeholder dataset structure for testing.
"""

import os
import shutil
import random
import numpy as np
from pathlib import Path
from typing import Tuple

import torch
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms

from config import (
    STAGE2_DATASET_DIR, STAGE2_CLASS_NAMES, STAGE2_NUM_CLASSES,
    IMG_SIZE, BATCH_SIZE, TRAIN_RATIO, VAL_RATIO, IMG_EXTENSIONS, SEED
)


# ─────────────────────────────────────────────────────────────────────────────
# TRANSFORMS
# ─────────────────────────────────────────────────────────────────────────────

def get_transforms():
    train_tf = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.RandomHorizontalFlip(0.5),
        transforms.RandomVerticalFlip(0.3),
        transforms.RandomRotation(20),
        transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train_tf, eval_tf


# ─────────────────────────────────────────────────────────────────────────────
# SPLIT STAGE 2 DATASET
# ─────────────────────────────────────────────────────────────────────────────

def split_stage2_dataset(force_rebuild: bool = False) -> Tuple[str, str, str]:
    """
    Create stratified train/val/test split from STAGE2_DATASET_DIR.

    Returns:
        (train_dir, val_dir, test_dir)
    """
    src = Path(STAGE2_DATASET_DIR)
    split_root = src.parent / "stage2_split"

    if split_root.exists() and not force_rebuild:
        print(f"[Stage2 Split] Already exists at {split_root}. Skipping.")
        return str(split_root/"train"), str(split_root/"val"), str(split_root/"test")

    if split_root.exists():
        shutil.rmtree(split_root)

    random.seed(SEED)
    class_counts = {}

    for class_name in STAGE2_CLASS_NAMES:
        class_src = src / class_name
        if not class_src.exists():
            continue

        all_files = [f for f in class_src.rglob("*") if f.suffix.lower() in IMG_EXTENSIONS]
        if len(all_files) == 0:
            continue

        random.shuffle(all_files)

        n       = len(all_files)
        n_train = max(1, int(n * TRAIN_RATIO))
        n_val   = max(1, int(n * VAL_RATIO)) if n > 3 else 0

        splits = {
            "train": all_files[:n_train],
            "val":   all_files[n_train:n_train + n_val],
            "test":  all_files[n_train + n_val:],
        }

        for split_name, files in splits.items():
            if not files:
                continue
            dest = split_root / split_name / class_name
            dest.mkdir(parents=True, exist_ok=True)
            for f in files:
                shutil.copy2(f, dest / f.name)

        class_counts[class_name] = n
        print(f"  {class_name:<30}: total={n:>4} | "
              f"train={len(splits['train'])}, val={len(splits['val'])}, test={len(splits['test'])}")

    return str(split_root/"train"), str(split_root/"val"), str(split_root/"test")


# ─────────────────────────────────────────────────────────────────────────────
# BUILD DATALOADERS
# ─────────────────────────────────────────────────────────────────────────────

def build_stage2_dataloaders(train_dir: str, val_dir: str, test_dir: str):
    """
    Creates DataLoaders with class-weighted sampling for imbalanced type distribution.
    (SCC is ~90% of real oral cancers, so other types will be rare.)
    """
    train_tf, eval_tf = get_transforms()

    train_ds = datasets.ImageFolder(train_dir, transform=train_tf)
    val_ds   = datasets.ImageFolder(val_dir,   transform=eval_tf)
    test_ds  = datasets.ImageFolder(test_dir,  transform=eval_tf)

    print(f"\n[Stage2 DataLoaders] Class mapping: {train_ds.class_to_idx}")
    print(f"  Train: {len(train_ds)} | Val: {len(val_ds)} | Test: {len(test_ds)}")

    # Weighted sampler per class
    class_counts  = np.array([
        len(list((Path(train_dir) / c).glob("*"))) for c in train_ds.classes
    ])
    class_weights  = 1.0 / np.maximum(class_counts, 1)
    sample_weights = [class_weights[label] for _, label in train_ds.samples]
    sampler = WeightedRandomSampler(sample_weights, len(sample_weights), replacement=True)

    use_cuda = torch.cuda.is_available()
    STAGE2_BATCH_SIZE = 16  # smaller batch size for smoother gradients on smaller dataset
    train_loader = DataLoader(train_ds, batch_size=STAGE2_BATCH_SIZE, sampler=sampler,
                              num_workers=0, pin_memory=use_cuda)
    val_loader   = DataLoader(val_ds,   batch_size=STAGE2_BATCH_SIZE, shuffle=False,
                              num_workers=0, pin_memory=use_cuda)
    test_loader  = DataLoader(test_ds,  batch_size=STAGE2_BATCH_SIZE, shuffle=False,
                              num_workers=0, pin_memory=use_cuda)

    return train_loader, val_loader, test_loader, class_weights


# ─────────────────────────────────────────────────────────────────────────────
# UTILITY: Create placeholder folder structure
# ─────────────────────────────────────────────────────────────────────────────

def create_stage2_placeholder():
    """
    Creates empty Stage 2 folder structure so you know exactly
    where to place your downloaded images.
    """
    base = Path(STAGE2_DATASET_DIR)
    print(f"\n📁 Creating Stage 2 folder structure at: {base}")
    for cls in STAGE2_CLASS_NAMES:
        (base / cls).mkdir(parents=True, exist_ok=True)
        # Drop a README so folder isn't empty
        readme = base / cls / "README.txt"
        readme.write_text(
            f"Place {cls} images here.\n"
            f"Supported formats: {', '.join(IMG_EXTENSIONS)}\n"
        )
        print(f"  ✅ {base / cls}")
    print(f"\n👉 Download a labeled dataset and place images into the folders above.")
    print("   Recommended sources:")
    print("   • ORCHID  : https://zenodo.org  (search 'ORCHID oral cancer')")
    print("   • Mendeley: https://data.mendeley.com/datasets/ftmp4cvtmb/2")
    print("   • Kaggle  : https://www.kaggle.com/datasets (search 'oral cancer OSCC')\n")


if __name__ == "__main__":
    create_stage2_placeholder()
    stage2_dir = Path(STAGE2_DATASET_DIR)
    # Check if any class has images yet
    has_data = any(
        len(list((stage2_dir / cls).glob("*.jpg")) +
            list((stage2_dir / cls).glob("*.png"))) > 0
        for cls in STAGE2_CLASS_NAMES
        if (stage2_dir / cls).exists()
    )
    if has_data:
        print("Images detected — running split...")
        t, v, te = split_stage2_dataset(force_rebuild=True)
        build_stage2_dataloaders(t, v, te)
    else:
        print("No images yet. Add images to the folders above, then re-run.")
