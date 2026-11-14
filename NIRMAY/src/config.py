"""
config.py — Central configuration for NIRMAY (2-Stage AI Oral Cancer Diagnostic Pipeline)

Stage 1: Cancer Detection      → Cancer vs Non-Cancer (binary)
Stage 2: Cancer Type Classifier → SCC / Verrucous / Salivary Gland /
                                   Adenoid Cystic / Melanoma / Lymphoma /
                                   Sarcoma / Odontogenic
"""

import os

MODEL_NAME = "NIRMAY"

# ─────────────────────────────────────────────
# BASE PATHS
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ─────────────────────────────────────────────
# STAGE 1 — DETECTION (Cancer vs Non-Cancer)
# ─────────────────────────────────────────────
DATASET1_ROOT = os.environ.get(
    "NIRMAY_DATASET1_ROOT", os.path.join(BASE_DIR, "datasets", "dataset1")
)
DATASET1_HOSPITALS = {
    name: os.path.join(DATASET1_ROOT, name)
    for name in ("Mitford Hospital", "Reshmi Dental", "Shuvro Dental", "Uposhomo Dental")
}

DATASET2_ROOT = os.environ.get(
    "NIRMAY_DATASET2_ROOT", os.path.join(BASE_DIR, "datasets", "dataset2")
)
DATASET2_PATHS = {
    "original_benign": os.path.join(DATASET2_ROOT, "original_data", "benign_lesions"),
    "original_malignant": os.path.join(DATASET2_ROOT, "original_data", "malignant_lesions"),
    "augmented_benign": os.path.join(DATASET2_ROOT, "augmented_data", "augmented_benign"),
    "augmented_malignant": os.path.join(DATASET2_ROOT, "augmented_data", "augmented_malignant"),
}

MERGED_DATASET_DIR = os.path.join(BASE_DIR, "merged_dataset")

# Stage 1 class labels (ImageFolder assigns alphabetically: Cancer=0, Non_Cancer=1)
STAGE1_CLASS_NAMES = ["Cancer", "Non_Cancer"]
CLASS_NAMES = STAGE1_CLASS_NAMES
NUM_CLASSES = 2


# ─────────────────────────────────────────────
# STAGE 2 — CANCER TYPE CLASSIFICATION
# ─────────────────────────────────────────────
# Download one of these datasets and place it here:
#   ORCHID Dataset  → https://zenodo.org/record/ORCHID  (Normal/OSMF/OSCC)
#   Mendeley OSCC   → https://data.mendeley.com/datasets/ftmp4cvtmb/2
#   NDB-UFES        → OSCC / Leukoplakia-with-dysplasia / Leukoplakia-without-dysplasia
#
# Folder layout expected (one sub-folder per cancer type):
#   stage2_dataset/
#       SCC/
#       Verrucous_Carcinoma/
#       Salivary_Gland_Cancer/
#       Adenoid_Cystic_Carcinoma/
#       Melanoma/
#       Lymphoma/
#       Sarcoma/
#       Odontogenic_Tumour/

STAGE2_DATASET_DIR = os.path.join(BASE_DIR, "stage2_dataset")

# Full 8-type taxonomy (matches your original cancer list)
STAGE2_CLASS_NAMES = [
    "SCC",                    # Squamous Cell Carcinoma  >90%
    "Verrucous_Carcinoma",    # Low-grade SCC variant
    "Salivary_Gland_Cancer",  # Mucoepidermoid etc.
    "Adenoid_Cystic_Carcinoma",
    "Melanoma",
    "Lymphoma",
    "Sarcoma",
    "Odontogenic_Tumour",
]
STAGE2_NUM_CLASSES = len(STAGE2_CLASS_NAMES)

# ─────────────────────────────────────────────
# SHARED HYPERPARAMETERS
# ─────────────────────────────────────────────
IMG_SIZE       = (224, 224)
BATCH_SIZE     = 32
EPOCHS         = 30
LEARNING_RATE  = 1e-4
FINE_TUNE_LR   = 1e-5
DROPOUT_RATE   = 0.5
TRAIN_RATIO    = 0.70
VAL_RATIO      = 0.15
TEST_RATIO     = 0.15
SEED           = 42
IMG_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}

# ─────────────────────────────────────────────
# OUTPUT PATHS
# ─────────────────────────────────────────────
OUTPUT_DIR     = os.path.join(BASE_DIR, "outputs")

# Stage 1 outputs
STAGE1_MODEL_DIR  = os.path.join(OUTPUT_DIR, "stage1_models")
STAGE1_PLOT_DIR   = os.path.join(OUTPUT_DIR, "stage1_plots")
STAGE1_REPORT_DIR = os.path.join(OUTPUT_DIR, "stage1_reports")

# Stage 2 outputs
STAGE2_MODEL_DIR  = os.path.join(OUTPUT_DIR, "stage2_models")
STAGE2_PLOT_DIR   = os.path.join(OUTPUT_DIR, "stage2_plots")
STAGE2_REPORT_DIR = os.path.join(OUTPUT_DIR, "stage2_reports")

# Legacy aliases (kept for backward compat)
MODEL_SAVE_DIR = STAGE1_MODEL_DIR
PLOT_DIR       = STAGE1_PLOT_DIR
REPORT_DIR     = STAGE1_REPORT_DIR
