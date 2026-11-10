"""Central configuration for the ML pipeline (paths + hyper-parameters)."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

# Let the ml/ scripts import the backend's preprocessing and Grad-CAM code so
# training and inference share a single implementation.
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from utils.preprocessing import IMG_SIZE as SHARED_IMG_SIZE  # noqa: E402

# ---- paths ---------------------------------------------------------------
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
OUTPUT_DIR = ROOT / "ml" / "outputs"          # PNG graphs for the report
MODEL_DIR = BACKEND_DIR / "models"            # artefacts the API serves
MODEL_PATH = MODEL_DIR / "pulmoscan_cnn.keras"
HISTORY_PATH = MODEL_DIR / "history.json"
METRICS_PATH = MODEL_DIR / "metrics.json"

# ---- dataset -------------------------------------------------------------
DATASET_NAME = "Chest X-Ray Images (Pneumonia) - Kermany et al., 2018"
DATASET_URL = "https://data.mendeley.com/datasets/rscbjbr9sj/2"
DATASET_ZIP_URL = (
    "https://data.mendeley.com/public-files/datasets/rscbjbr9sj/files/"
    "f12eaf6d-6023-432f-acc9-80c9d7393433/file_downloaded"
)
DATASET_ZIP = DATA_DIR / "ChestXRay2017.zip"
CLASS_NAMES = ["NORMAL", "PNEUMONIA"]  # label 0, label 1

# ---- hyper-parameters ----------------------------------------------------
SEED = 42
IMG_SIZE = SHARED_IMG_SIZE  # 160, defined once in backend/utils/preprocessing.py
VAL_FRACTION = 0.15          # share of the training pool held out for validation
BATCH_SIZE = 32
MAX_EPOCHS = 25
LEARNING_RATE = 1e-3
FILTERS = [16, 32, 64, 128]  # conv filters per block
CONVS_PER_BLOCK = 1            # Conv-BN-ReLU repeats per block (1 keeps CPU training fast)
BN_MOMENTUM = 0.9             # how fast BatchNorm's moving averages follow the data (Keras default 0.99)
DENSE_UNITS = 64
DROPOUT_HEAD = 0.4
DROPOUT_DENSE = 0.3
EARLY_STOP_PATIENCE = 5
THRESHOLD = 0.5              # P(pneumonia) >= threshold -> "PNEUMONIA"
