"""
data_loader.py — Dataset merging, preprocessing, and DataLoader creation.

Combines Dataset 1 (4-hospital Cancer/Non_Cancer) and Dataset 2 (Benign/Malignant)
into a unified binary classification dataset, then creates stratified train/val/test splits.
"""

import os
import shutil
import random
import numpy as np
from pathlib import Path
from collections import defaultdict
from typing import Tuple

import torch
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, transforms

from config import (
    DATASET1_HOSPITALS, DATASET2_PATHS, MERGED_DATASET_DIR,
    IMG_SIZE, BATCH_SIZE, TRAIN_RATIO, VAL_RATIO, TEST_RATIO,
    IMG_EXTENSIONS, SEED, CLASS_NAMES
)

# ─────────────────────────────────────────────────────────────────────────────
# 1. DATASET MERGING
# ─────────────────────────────────────────────────────────────────────────────

def merge_datasets(force_rebuild: bool = False) -> str:
    """
    Collect images from both datasets and copy them into a unified structure:

        merged_dataset/
            Cancer/       ← label 1
            Non_Cancer/   ← label 0

    Dataset 1 : Cancer / Non_Cancer  →  maps directly
    Dataset 2 : malignant → Cancer, benign → Non_Cancer
                (only original_data used to avoid leaking augmented images into val/test)

    Args:
        force_rebuild: If True, deletes and recreates the merged folder.

    Returns:
        Path to the merged dataset root directory.
    """
    merged = Path(MERGED_DATASET_DIR)
    if merged.exists() and not force_rebuild:
        print(f"[merge_datasets] Merged dataset already exists at {merged}. Skipping rebuild.")
        return str(merged)

    if merged.exists():
        shutil.rmtree(merged)

    cancer_dir     = merged / "Cancer"
    noncancer_dir  = merged / "Non_Cancer"
    cancer_dir.mkdir(parents=True, exist_ok=True)
    noncancer_dir.mkdir(parents=True, exist_ok=True)

    def _copy_images(src: str, dst: Path, tag: str):
        src_path = Path(src)
        if not src_path.exists():
            print(f"  [WARN] Path not found: {src_path}")
            return 0
        copied = 0
        for img_file in src_path.rglob("*"):
            if img_file.suffix.lower() in IMG_EXTENSIONS:
                unique_name = f"{tag}_{img_file.name}"
                # Ensure no filename collision
                dest_file = dst / unique_name
                counter = 1
                while dest_file.exists():
                    stem = img_file.stem
                    dest_file = dst / f"{tag}_{stem}_{counter}{img_file.suffix}"
                    counter += 1
                shutil.copy2(img_file, dest_file)
                copied += 1
        return copied

    total_cancer    = 0
    total_noncancer = 0

    # ── Dataset 1 ──
    print("\n[merge_datasets] Processing Dataset 1 (Bangladesh Multi-Institution)...")
    for hospital, path in DATASET1_HOSPITALS.items():
        tag = hospital.replace(" ", "_")
        c = _copy_images(os.path.join(path, "Cancer"),     cancer_dir,    f"D1_{tag}_C")
        n = _copy_images(os.path.join(path, "Non_Cancer"), noncancer_dir, f"D1_{tag}_N")
        print(f"  {hospital}: {c} cancer, {n} non-cancer")
        total_cancer    += c
        total_noncancer += n

    # ── Dataset 2 (original only — augmented kept for training augmentation only) ──
    print("\n[merge_datasets] Processing Dataset 2 (Oral Images — original data only)...")
    c = _copy_images(DATASET2_PATHS["original_malignant"], cancer_dir,    "D2_orig_mal")
    n = _copy_images(DATASET2_PATHS["original_benign"],    noncancer_dir, "D2_orig_ben")
    print(f"  Original malignant: {c}, Original benign: {n}")
    total_cancer    += c
    total_noncancer += n

    print(f"\n✅ Merged dataset ready:")
    print(f"   Cancer    : {total_cancer}")
    print(f"   Non_Cancer: {total_noncancer}")
    print(f"   Total     : {total_cancer + total_noncancer}")
    print(f"   Location  : {merged}\n")
    return str(merged)


# ─────────────────────────────────────────────────────────────────────────────
# 2. STRATIFIED SPLIT  (train / val / test)
# ─────────────────────────────────────────────────────────────────────────────

def split_dataset(merged_root: str, force_rebuild: bool = False) -> Tuple[str, str, str]:
    """
    Create stratified train / val / test split folders from merged_root.

        split/
            train/Cancer, train/Non_Cancer
            val/Cancer,   val/Non_Cancer
            test/Cancer,  test/Non_Cancer

    Returns:
        Tuple of (train_dir, val_dir, test_dir) paths.
    """
    split_root = Path(merged_root).parent / "split"
    if split_root.exists() and not force_rebuild:
        print(f"[split_dataset] Split already exists at {split_root}. Skipping.")
        return (
            str(split_root / "train"),
            str(split_root / "val"),
            str(split_root / "test"),
        )

    if split_root.exists():
        shutil.rmtree(split_root)

    random.seed(SEED)
    merged = Path(merged_root)

    for class_name in CLASS_NAMES:
        class_src = merged / class_name
        all_files = [f for f in class_src.iterdir() if f.suffix.lower() in IMG_EXTENSIONS]
        random.shuffle(all_files)

        n = len(all_files)
        n_train = int(n * TRAIN_RATIO)
        n_val   = int(n * VAL_RATIO)

        splits = {
            "train": all_files[:n_train],
            "val":   all_files[n_train:n_train + n_val],
            "test":  all_files[n_train + n_val:],
        }

        for split_name, files in splits.items():
            dest_dir = split_root / split_name / class_name
            dest_dir.mkdir(parents=True, exist_ok=True)
            for f in files:
                shutil.copy2(f, dest_dir / f.name)

        print(f"[split] {class_name}: train={len(splits['train'])}, val={len(splits['val'])}, test={len(splits['test'])}")

    return (
        str(split_root / "train"),
        str(split_root / "val"),
        str(split_root / "test"),
    )


# ─────────────────────────────────────────────────────────────────────────────
# 3. TRANSFORMS
# ─────────────────────────────────────────────────────────────────────────────

def get_transforms():
    """Returns train, val, and test image transforms."""
    train_transform = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(degrees=20),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(IMG_SIZE),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_test_transform


# ─────────────────────────────────────────────────────────────────────────────
# 4. DATA LOADERS
# ─────────────────────────────────────────────────────────────────────────────

def build_dataloaders(train_dir: str, val_dir: str, test_dir: str):
    """
    Creates PyTorch DataLoaders with class-balanced sampling for the training set.

    Returns:
        (train_loader, val_loader, test_loader, class_weights)
    """
    train_transform, val_test_transform = get_transforms()

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset   = datasets.ImageFolder(val_dir,   transform=val_test_transform)
    test_dataset  = datasets.ImageFolder(test_dir,  transform=val_test_transform)

    print(f"\n[DataLoaders] Class mapping: {train_dataset.class_to_idx}")
    print(f"  Train: {len(train_dataset)} | Val: {len(val_dataset)} | Test: {len(test_dataset)}")

    # ── Weighted sampler to handle class imbalance ──
    class_counts   = np.array([len(os.listdir(os.path.join(train_dir, c))) for c in CLASS_NAMES])
    class_weights  = 1.0 / class_counts
    sample_weights = [class_weights[label] for _, label in train_dataset.samples]
    sampler = WeightedRandomSampler(
        weights=sample_weights,
        num_samples=len(sample_weights),
        replacement=True
    )

    use_cuda = torch.cuda.is_available()
    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE,
        sampler=sampler, num_workers=0, pin_memory=use_cuda
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE,
        shuffle=False, num_workers=0, pin_memory=use_cuda
    )
    test_loader = DataLoader(
        test_dataset, batch_size=BATCH_SIZE,
        shuffle=False, num_workers=0, pin_memory=use_cuda
    )

    return train_loader, val_loader, test_loader, class_weights


# ─────────────────────────────────────────────────────────────────────────────
# 5. QUICK STATS
# ─────────────────────────────────────────────────────────────────────────────

def print_dataset_stats():
    """Prints image counts from both raw datasets before merging."""
    print("\n📊 RAW DATASET STATISTICS")
    print("=" * 50)

    print("\n🏥 Dataset 1 — Bangladesh Multi-Institution:")
    d1_cancer = d1_non = 0
    for hospital, path in DATASET1_HOSPITALS.items():
        c = len([f for f in Path(path, "Cancer").rglob("*") if f.suffix.lower() in IMG_EXTENSIONS]) \
            if Path(path, "Cancer").exists() else 0
        n = len([f for f in Path(path, "Non_Cancer").rglob("*") if f.suffix.lower() in IMG_EXTENSIONS]) \
            if Path(path, "Non_Cancer").exists() else 0
        d1_cancer += c
        d1_non += n
        print(f"   {hospital:<20}: Cancer={c:>4}, Non_Cancer={n:>4}")
    print(f"   {'TOTAL':<20}: Cancer={d1_cancer:>4}, Non_Cancer={d1_non:>4}")

    print("\n🦷 Dataset 2 — Oral Images:")
    for key, path in DATASET2_PATHS.items():
        count = len([f for f in Path(path).rglob("*") if f.suffix.lower() in IMG_EXTENSIONS]) \
            if Path(path).exists() else 0
        print(f"   {key:<30}: {count:>5} images")

    print("\n" + "=" * 50)


if __name__ == "__main__":
    print_dataset_stats()
    merged = merge_datasets(force_rebuild=True)
    train_dir, val_dir, test_dir = split_dataset(merged, force_rebuild=True)
    train_loader, val_loader, test_loader, cw = build_dataloaders(train_dir, val_dir, test_dir)
    print(f"\n✅ Dataloaders ready. Class weights: {cw}")
