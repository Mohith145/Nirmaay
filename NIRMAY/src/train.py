"""
train.py — Full 2-phase training loop for OralCancerModel.

Phase 1 (Epochs 1–10):   Frozen backbone, train classifier head only.
Phase 2 (Epochs 11–30):  Unfreeze last 20 backbone layers, fine-tune with lower LR.
"""

import os
import time
import json
import torch
import torch.nn as nn
import numpy as np
from pathlib import Path

from config import (
    EPOCHS, MODEL_SAVE_DIR, REPORT_DIR, PLOT_DIR, SEED, CLASS_NAMES
)
from data_loader import merge_datasets, split_dataset, build_dataloaders, print_dataset_stats
from model import build_model, get_optimizer, get_scheduler
from evaluate import evaluate, plot_training_curves

# ─────────────────────────────────────────────────────────────────────────────
# Reproducibility
# ─────────────────────────────────────────────────────────────────────────────
torch.manual_seed(SEED)
np.random.seed(SEED)


def train_one_epoch(model, loader, criterion, optimizer, device) -> tuple:
    """Run one training epoch. Returns (avg_loss, accuracy)."""
    model.train()
    running_loss = 0.0
    correct = total = 0

    for batch_idx, (images, labels) in enumerate(loader):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()

        # Gradient clipping
        nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == labels).sum().item()
        total   += labels.size(0)

        if (batch_idx + 1) % 10 == 0:
            print(f"    Step [{batch_idx+1}/{len(loader)}]  "
                  f"Loss: {loss.item():.4f}  "
                  f"Acc: {correct/total*100:.2f}%", end="\r")

    avg_loss = running_loss / total
    accuracy = correct / total
    return avg_loss, accuracy


def validate(model, loader, criterion, device) -> tuple:
    """Run validation. Returns (avg_loss, accuracy)."""
    model.eval()
    running_loss = 0.0
    correct = total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss    = criterion(outputs, labels)
            running_loss += loss.item() * images.size(0)
            preds    = outputs.argmax(dim=1)
            correct += (preds == labels).sum().item()
            total   += labels.size(0)

    return running_loss / total, correct / total


def train(resume_from: str = None):
    """
    Main training function.

    Args:
        resume_from: Path to a checkpoint (.pth) to resume from.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n🖥️  Device: {device}")
    if device.type == "cuda":
        print(f"   GPU: {torch.cuda.get_device_name(0)}")

    # ── Data ──
    print_dataset_stats()
    merged    = merge_datasets(force_rebuild=False)
    train_dir, val_dir, test_dir = split_dataset(merged, force_rebuild=False)
    train_loader, val_loader, test_loader, class_weights = build_dataloaders(
        train_dir, val_dir, test_dir
    )

    # ── Model ──
    model = build_model(device)

    # ── Loss (weighted for class imbalance) ──
    cw_tensor = torch.tensor(class_weights, dtype=torch.float32).to(device)
    criterion = nn.CrossEntropyLoss(weight=cw_tensor)

    # ── Resume checkpoint ──
    start_epoch = 0
    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

    if resume_from and os.path.exists(resume_from):
        ckpt = torch.load(resume_from, map_location=device)
        model.load_state_dict(ckpt["model_state"])
        start_epoch  = ckpt.get("epoch", 0)
        best_val_acc = ckpt.get("best_val_acc", 0.0)
        history      = ckpt.get("history", history)
        print(f"\n[Resume] Loaded checkpoint from epoch {start_epoch}. Best val acc: {best_val_acc:.4f}")

    # ─────────────────────────────────────────────
    # PHASE 1: Train head only (epochs 1–10)
    # PHASE 2: Fine-tune backbone (epochs 11–EPOCHS)
    # ─────────────────────────────────────────────
    PHASE2_START = 10
    patience = 7
    no_improve = 0

    # Ensure all output directories exist before training
    Path(MODEL_SAVE_DIR).mkdir(parents=True, exist_ok=True)
    Path(REPORT_DIR).mkdir(parents=True, exist_ok=True)
    Path(PLOT_DIR).mkdir(parents=True, exist_ok=True)

    print(f"\n🚀 Starting training for {EPOCHS} epochs...\n{'='*60}")

    for epoch in range(start_epoch, EPOCHS):
        t0 = time.time()

        # Switch to Phase 2
        if epoch == PHASE2_START:
            print(f"\n{'='*60}")
            print(f"🔥 PHASE 2: Unfreezing backbone for fine-tuning (epoch {epoch+1})")
            print(f"{'='*60}\n")
            model.unfreeze_backbone(num_layers=20)
            optimizer  = get_optimizer(model, fine_tune=True)
            scheduler  = get_scheduler(optimizer, EPOCHS - PHASE2_START)
        elif epoch == start_epoch:
            optimizer  = get_optimizer(model, fine_tune=(epoch >= PHASE2_START))
            scheduler  = get_scheduler(optimizer, PHASE2_START if epoch < PHASE2_START else EPOCHS - PHASE2_START)

        phase_label = "Phase 1 (Head)" if epoch < PHASE2_START else "Phase 2 (Fine-tune)"
        print(f"Epoch [{epoch+1:02d}/{EPOCHS}] — {phase_label}")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss,   val_acc   = validate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - t0
        print(f"  Train Loss: {train_loss:.4f}  Train Acc: {train_acc*100:.2f}%  |  "
              f"Val Loss: {val_loss:.4f}  Val Acc: {val_acc*100:.2f}%  |  "
              f"Time: {elapsed:.1f}s")

        # Track history
        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)

        # ── Save best model ──
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            no_improve = 0
            best_path = os.path.join(MODEL_SAVE_DIR, "best_model.pth")
            torch.save({
                "epoch":         epoch + 1,
                "model_state":   model.state_dict(),
                "best_val_acc":  best_val_acc,
                "history":       history,
                "class_names":   CLASS_NAMES,
            }, best_path)
            print(f"  ✅ Best model saved → {best_path}  (val_acc={best_val_acc*100:.2f}%)")
        else:
            no_improve += 1

        # ── Save latest checkpoint every 5 epochs ──
        if (epoch + 1) % 5 == 0:
            ckpt_path = os.path.join(MODEL_SAVE_DIR, f"checkpoint_epoch{epoch+1}.pth")
            torch.save({
                "epoch":        epoch + 1,
                "model_state":  model.state_dict(),
                "best_val_acc": best_val_acc,
                "history":      history,
                "class_names":  CLASS_NAMES,
            }, ckpt_path)

        # ── Early stopping ──
        if no_improve >= patience:
            print(f"\n⏹️  Early stopping triggered after {patience} epochs with no improvement.")
            break

    print(f"\n{'='*60}")
    print(f"✅ Training complete. Best Val Acc: {best_val_acc*100:.2f}%")

    # ── Save training history ──
    history_path = os.path.join(REPORT_DIR, "training_history.json")
    Path(REPORT_DIR).mkdir(parents=True, exist_ok=True)
    with open(history_path, "w") as f:
        json.dump(history, f, indent=2)
    print(f"📄 History saved → {history_path}")

    # ── Plot curves ──
    plot_training_curves(history)

    # ── Final Test Evaluation ──
    print("\n📊 Running final evaluation on test set...")
    best_model_path = os.path.join(MODEL_SAVE_DIR, "best_model.pth")
    evaluate(model, test_loader, device, best_model_path)


if __name__ == "__main__":
    train()
