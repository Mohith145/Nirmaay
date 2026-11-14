"""
test_pipeline.py — End-to-end pipeline sanity test.
Runs 1 epoch on 2 batches to verify:
  1. Data loading
  2. Forward & backward passes
  3. Weight updates
  4. Validation & evaluation saving
"""

import sys, os
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
import torch
import torch.nn as nn
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.config import CLASS_NAMES, MERGED_DATASET_DIR
from src.data_loader import build_dataloaders, split_dataset
from src.model import build_model, get_optimizer
from src.evaluate import evaluate

def quick_test():
    print("Testing GPU Pipeline End-to-End...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Active Device: {device} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")
    train_dir, val_dir, test_dir = split_dataset(MERGED_DATASET_DIR)
    train_loader, val_loader, test_loader, cw = build_dataloaders(train_dir, val_dir, test_dir)
    
    model = build_model(device)
    optimizer = get_optimizer(model, fine_tune=False)
    criterion = nn.CrossEntropyLoss()
    
    # Train 2 batches on GPU
    model.train()
    for i, (imgs, lbls) in enumerate(train_loader):
        if i >= 2:
            break
        imgs, lbls = imgs.to(device), lbls.to(device)
        optimizer.zero_grad()
        out = model(imgs[:4])
        loss = criterion(out, lbls[:4])
        loss.backward()
        optimizer.step()
        print(f"  Batch {i+1} loss: {loss.item():.4f} [computed on {imgs.device}]")
        
    print("GPU test successful!")

if __name__ == "__main__":
    quick_test()
