"""
run_training.py — Entry point to launch full training pipeline.
Run from the NIRMAY project directory.
"""

import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from src.train import train

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="NIRMAY Stage 1 Training (Cancer Detection)")
    parser.add_argument("--resume", type=str, default=None,
                        help="Path to checkpoint to resume training from")
    args = parser.parse_args()
    train(resume_from=args.resume)
