"""
stage2_train.py — Training loop for Stage 2 (Cancer Type Classification)

Trains CancerTypeModel on cancer-type labeled images.
Run AFTER stage2_data_loader.py has set up the dataset.
"""

import os
import time
import json
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path

from sklearn.metrics import classification_report
from config import (
    EPOCHS, STAGE1_MODEL_DIR, STAGE2_MODEL_DIR, STAGE2_REPORT_DIR,
    STAGE2_PLOT_DIR, STAGE2_CLASS_NAMES, SEED
)
from stage2_data_loader import split_stage2_dataset, build_stage2_dataloaders
from stage2_model import build_stage2_model, get_stage2_optimizer
from model import get_scheduler

torch.manual_seed(SEED)
np.random.seed(SEED)


def train_stage2(resume_from: str = None, rebuild: bool = True):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n🖥️  Stage 2 Training — Device: {device}")

    # ── Data ──
    print("\n📂 Preparing Stage 2 dataset split...")
    train_dir, val_dir, test_dir = split_stage2_dataset(force_rebuild=rebuild)
    train_loader, val_loader, test_loader, class_weights = build_stage2_dataloaders(
        train_dir, val_dir, test_dir
    )

    # ── Model ──
    active_classes = train_loader.dataset.classes
    model = build_stage2_model(device, num_classes=len(active_classes), class_names=active_classes)

    # ── Transfer Learning from Stage 1 ──
    stage1_ckpt_path = os.path.join(STAGE1_MODEL_DIR, "best_model.pth")
    if os.path.exists(stage1_ckpt_path):
        s1_ckpt = torch.load(stage1_ckpt_path, map_location=device)
        backbone_weights = {k: v for k, v in s1_ckpt["model_state"].items() if "backbone.features" in k}
        model.load_state_dict(backbone_weights, strict=False)
        print("  ✅ [Transfer Learning] Pre-loaded trained Stage 1 oral pathology backbone!")

    # ── Loss ──
    # Note: WeightedRandomSampler already feeds perfectly balanced batches across classes.
    # Label smoothing (0.1) prevents overfitting on minority classes with ~25 samples.
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

    # ── Optimizer & Scheduler ──
    # For small datasets, keep the backbone frozen as a feature extractor.
    # Train only the classifier head using AdamW with weight decay to prevent mode collapse.
    optimizer = torch.optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=3e-4,
        weight_decay=1e-3
    )
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS, eta_min=1e-6)

    # ── Resume checkpoint ──
    start_epoch  = 0
    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    if resume_from and os.path.exists(resume_from):
        ckpt = torch.load(resume_from, map_location=device)
        model.load_state_dict(ckpt["model_state"])
        start_epoch  = ckpt.get("epoch", 0)
        best_val_acc = ckpt.get("best_val_acc", 0.0)
        history      = ckpt.get("history", history)
        print(f"[Resume] From epoch {start_epoch}, best_val_acc={best_val_acc:.4f}")

    patience   = 12
    no_improve = 0

    Path(STAGE2_MODEL_DIR).mkdir(parents=True, exist_ok=True)
    Path(STAGE2_REPORT_DIR).mkdir(parents=True, exist_ok=True)
    Path(STAGE2_PLOT_DIR).mkdir(parents=True, exist_ok=True)

    print(f"\n🚀 NIRMAY Stage 2 Training ({EPOCHS} epochs, {len(STAGE2_CLASS_NAMES)} classes)\n{'='*60}")
    print("   Mode: Frozen-Backbone Linear Probing (prevents mode collapse on small datasets)")

    for epoch in range(start_epoch, EPOCHS):
        t0 = time.time()
        print(f"Epoch [{epoch+1:02d}/{EPOCHS}] — Classifier Head")

        # Train
        model.train()
        run_loss = correct = total = 0
        for imgs, labels in train_loader:
            imgs, labels = imgs.to(device), labels.to(device)
            optimizer.zero_grad()
            out  = model(imgs)
            loss = criterion(out, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            run_loss += loss.item() * imgs.size(0)
            correct  += (out.argmax(1) == labels).sum().item()
            total    += labels.size(0)

        train_loss = run_loss / total
        train_acc  = correct / total

        # Validate
        model.eval()
        v_loss = v_correct = v_total = 0
        with torch.no_grad():
            for imgs, labels in val_loader:
                imgs, labels = imgs.to(device), labels.to(device)
                out   = model(imgs)
                loss  = criterion(out, labels)
                v_loss    += loss.item() * imgs.size(0)
                v_correct += (out.argmax(1) == labels).sum().item()
                v_total   += labels.size(0)

        val_loss = v_loss / v_total
        val_acc  = v_correct / v_total
        scheduler.step()

        elapsed = time.time() - t0
        print(f"  Train: loss={train_loss:.4f} acc={train_acc*100:.2f}%  |  "
              f"Val: loss={val_loss:.4f} acc={val_acc*100:.2f}%  |  {elapsed:.1f}s")

        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        # Save best
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            no_improve   = 0
            best_path    = os.path.join(STAGE2_MODEL_DIR, "best_stage2_model.pth")
            torch.save({
                "epoch":        epoch + 1,
                "model_state":  model.state_dict(),
                "best_val_acc": best_val_acc,
                "history":      history,
                "class_names":  active_classes,
            }, best_path)
            print(f"  ✅ Best Stage 2 model saved → val_acc={best_val_acc*100:.2f}%")
        else:
            no_improve += 1

        if no_improve >= patience:
            print(f"\n⏹️  Early stopping triggered.")
            break

    # Save history
    hist_path = os.path.join(STAGE2_REPORT_DIR, "stage2_training_history.json")
    with open(hist_path, "w") as f:
        json.dump(history, f, indent=2)

    print(f"\n✅ Stage 2 Training complete. Best Val Acc: {best_val_acc*100:.2f}%")
    print(f"📄 History → {hist_path}")

    # ── Final Test Evaluation ──
    print("\n" + "=" * 60)
    print("📊 Evaluating Best Stage 2 Model on Test Set...")
    print("=" * 60)
    best_path = os.path.join(STAGE2_MODEL_DIR, "best_stage2_model.pth")
    if os.path.exists(best_path):
        ckpt = torch.load(best_path, map_location=device)
        model.load_state_dict(ckpt["model_state"])

    model.eval()
    all_preds, all_labels = [], []
    with torch.no_grad():
        for imgs, lbls in test_loader:
            imgs = imgs.to(device)
            out = model(imgs)
            preds = out.argmax(dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_labels.extend(lbls.numpy())

    rep = classification_report(all_labels, all_preds, target_names=active_classes, digits=4, zero_division=0)
    print("\n📋 Stage 2 Classification Report:")
    print(rep)
    rep_path = os.path.join(STAGE2_REPORT_DIR, "stage2_classification_report.txt")
    with open(rep_path, "w") as f:
        f.write(rep)
    print(f"📄 Report saved → {rep_path}")


if __name__ == "__main__":
    train_stage2()
