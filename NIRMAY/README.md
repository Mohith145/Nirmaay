# NIRMAY Model

This folder contains the two-stage model code and the best saved checkpoint for each stage:

- Stage 1 detects cancer vs. non-cancer.
- Stage 2 classifies cancer type.

The image datasets and intermediate training checkpoints are not included. Install the packages in `requirements.txt` and place the datasets locally, or set `NIRMAY_DATASET1_ROOT` and `NIRMAY_DATASET2_ROOT` to their locations before training.

Run `python run_training.py` for Stage 1 and `python run_stage2_training.py` for Stage 2. `export_stage2_onnx.py` exports the Stage 2 checkpoint; pass `--output-dir` to choose where the ONNX model and metadata are written.

The local predictor abstains when its highest raw class score is below `0.70` (`--min-confidence` overrides this). The score is not calibrated, and this cutoff is not a mouth-image detector; non-mouth images can still receive high scores. Use the model only with inside-mouth images and treat the output as experimental.
