"""
populate_scc.py — Copy confirmed cancer images into stage2_dataset/SCC

Since >90% of oral cancers in clinical oral histology (and the Bangladesh/Oral datasets)
are Squamous Cell Carcinoma (SCC), this utility populates the SCC class folder
directly from your existing Dataset 1 and Dataset 2 cancer images.
"""

import os
import shutil
from pathlib import Path
from src.config import DATASET1_HOSPITALS, DATASET2_PATHS, STAGE2_DATASET_DIR, IMG_EXTENSIONS

def populate_scc():
    scc_dir = Path(STAGE2_DATASET_DIR) / "SCC"
    scc_dir.mkdir(parents=True, exist_ok=True)
    
    total = 0
    # Copy from Dataset 1 hospitals (Cancer folders)
    for hospital, base_path in DATASET1_HOSPITALS.items():
        tag = hospital.replace(" ", "_")
        c_path = Path(base_path) / "Cancer"
        if c_path.exists():
            for img in c_path.glob("*"):
                if img.suffix.lower() in IMG_EXTENSIONS:
                    dest = scc_dir / f"D1_{tag}_{img.name}"
                    shutil.copy2(img, dest)
                    total += 1
                    
    # Copy from Dataset 2 (Malignant lesions)
    m_path = Path(DATASET2_PATHS["original_malignant"])
    if m_path.exists():
        for img in m_path.glob("*"):
            if img.suffix.lower() in IMG_EXTENSIONS:
                dest = scc_dir / f"D2_orig_{img.name}"
                shutil.copy2(img, dest)
                total += 1
                
    print(f"[populate_scc] Copied {total} confirmed cancer images into {scc_dir}")

if __name__ == "__main__":
    populate_scc()
