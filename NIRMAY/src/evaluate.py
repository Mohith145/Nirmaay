"""
evaluate.py — Model evaluation: metrics, confusion matrix, classification report, and plots.
"""

import os
import json
import numpy as np
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_curve, auc,
    precision_recall_curve,
    average_precision_score
)

from config import CLASS_NAMES, PLOT_DIR, REPORT_DIR, MODEL_SAVE_DIR


# ─────────────────────────────────────────────────────────────────────────────
# EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

def evaluate(model, test_loader, device, checkpoint_path: str = None):
    """
    Evaluate model on test_loader. Loads weights from checkpoint_path if provided.
    Saves classification report, confusion matrix, and ROC curve.
    """
    if checkpoint_path and os.path.exists(checkpoint_path):
        ckpt = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(ckpt["model_state"])
        print(f"[evaluate] Loaded weights from {checkpoint_path}")

    model.eval()
    all_labels  = []
    all_preds   = []
    all_probs   = []

    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            outputs = model(images)
            probs   = torch.softmax(outputs, dim=1)
            preds   = outputs.argmax(dim=1)

            all_labels.extend(labels.cpu().numpy())
            all_preds.extend(preds.cpu().numpy())
            # Probability of Cancer (class index 0)
            cancer_idx = CLASS_NAMES.index("Cancer")
            all_probs.extend(probs[:, cancer_idx].cpu().numpy())

    all_labels = np.array(all_labels)
    all_preds  = np.array(all_preds)
    all_probs  = np.array(all_probs)
    cancer_idx = CLASS_NAMES.index("Cancer")
    binary_cancer_labels = (all_labels == cancer_idx).astype(int)

    # ── Classification Report ──
    report = classification_report(all_labels, all_preds, target_names=CLASS_NAMES, digits=4)
    print("\n📋 Classification Report:\n")
    print(report)

    Path(REPORT_DIR).mkdir(parents=True, exist_ok=True)
    report_path = os.path.join(REPORT_DIR, "classification_report.txt")
    with open(report_path, "w") as f:
        f.write(report)
    print(f"📄 Report saved → {report_path}")

    # ── Confusion Matrix ──
    plot_confusion_matrix(all_labels, all_preds)

    # ── ROC Curve ──
    plot_roc_curve(binary_cancer_labels, all_probs)

    # ── Precision-Recall Curve ──
    plot_pr_curve(binary_cancer_labels, all_probs)

    return report


# ─────────────────────────────────────────────────────────────────────────────
# PLOTS
# ─────────────────────────────────────────────────────────────────────────────

def plot_confusion_matrix(labels, preds):
    """Plot and save normalized confusion matrix."""
    Path(PLOT_DIR).mkdir(parents=True, exist_ok=True)
    cm = confusion_matrix(labels, preds)
    cm_norm = cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    for ax, data, title in zip(axes, [cm, cm_norm], ["Counts", "Normalized"]):
        fmt = "d" if title == "Counts" else ".2%"
        sns.heatmap(
            data, annot=True, fmt=fmt, cmap="Blues",
            xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES, ax=ax
        )
        ax.set_title(f"Confusion Matrix ({title})", fontsize=13)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("Actual")

    plt.tight_layout()
    out = os.path.join(PLOT_DIR, "confusion_matrix.png")
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"🖼️  Confusion matrix saved → {out}")


def plot_roc_curve(labels, probs):
    """Plot and save ROC curve with AUC score."""
    fpr, tpr, _ = roc_curve(labels, probs)
    roc_auc = auc(fpr, tpr)

    plt.figure(figsize=(7, 5))
    plt.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC AUC = {roc_auc:.4f}")
    plt.plot([0, 1], [0, 1], color="navy", lw=1.5, linestyle="--", label="Random Classifier")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate (Recall)")
    plt.title("ROC Curve — Oral Cancer Detection")
    plt.legend(loc="lower right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    out = os.path.join(PLOT_DIR, "roc_curve.png")
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"🖼️  ROC curve saved → {out}  (AUC = {roc_auc:.4f})")


def plot_pr_curve(labels, probs):
    """Plot and save Precision-Recall curve."""
    precision, recall, _ = precision_recall_curve(labels, probs)
    ap = average_precision_score(labels, probs)

    plt.figure(figsize=(7, 5))
    plt.plot(recall, precision, color="steelblue", lw=2, label=f"AP = {ap:.4f}")
    plt.xlabel("Recall")
    plt.ylabel("Precision")
    plt.title("Precision-Recall Curve — Oral Cancer Detection")
    plt.legend(loc="upper right")
    plt.grid(alpha=0.3)
    plt.tight_layout()
    out = os.path.join(PLOT_DIR, "pr_curve.png")
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"🖼️  PR curve saved → {out}  (AP = {ap:.4f})")


def plot_training_curves(history: dict):
    """Plot and save loss and accuracy curves from training history."""
    Path(PLOT_DIR).mkdir(parents=True, exist_ok=True)
    epochs = range(1, len(history["train_loss"]) + 1)

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Loss
    ax1.plot(epochs, history["train_loss"], "b-o", label="Train Loss", markersize=4)
    ax1.plot(epochs, history["val_loss"],   "r-o", label="Val Loss",   markersize=4)
    ax1.set_title("Loss over Epochs")
    ax1.set_xlabel("Epoch")
    ax1.set_ylabel("Loss")
    ax1.legend()
    ax1.grid(alpha=0.3)
    ax1.axvline(x=10, color="gray", linestyle="--", label="Phase 2 start")

    # Accuracy
    train_acc_pct = [a * 100 for a in history["train_acc"]]
    val_acc_pct   = [a * 100 for a in history["val_acc"]]
    ax2.plot(epochs, train_acc_pct, "b-o", label="Train Acc", markersize=4)
    ax2.plot(epochs, val_acc_pct,   "r-o", label="Val Acc",   markersize=4)
    ax2.set_title("Accuracy over Epochs")
    ax2.set_xlabel("Epoch")
    ax2.set_ylabel("Accuracy (%)")
    ax2.legend()
    ax2.grid(alpha=0.3)
    ax2.axvline(x=10, color="gray", linestyle="--", label="Phase 2 start")

    plt.suptitle("NIRMAY — AI Oral Cancer Diagnostic Curves", fontsize=14)
    plt.tight_layout()
    out = os.path.join(PLOT_DIR, "training_curves.png")
    plt.savefig(out, dpi=150)
    plt.close()
    print(f"🖼️  Training curves saved → {out}")
