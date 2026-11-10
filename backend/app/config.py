"""Runtime settings for the API. Everything deploy-specific comes from
environment variables, so the same code runs locally and in production."""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = Path(os.getenv("MODEL_PATH", MODEL_DIR / "pulmoscan_cnn.keras"))
METRICS_PATH = Path(os.getenv("METRICS_PATH", MODEL_DIR / "metrics.json"))

CLASS_NAMES = ["NORMAL", "PNEUMONIA"]
DEFAULT_THRESHOLD = 0.5

# ---- upload validation ----------------------------------------------------
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_MB", "10"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
ALLOWED_FORMATS = {"JPEG", "PNG"}   # checked on the real file content, not the name
MIN_DIMENSION = 100                 # pixels; smaller images carry too little detail

# ---- CORS -----------------------------------------------------------------
# Comma-separated list of frontend origins allowed to call this API, e.g.
#   ALLOWED_ORIGINS=https://pulmoscan-ai.netlify.app
_DEV_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"
ALLOWED_ORIGINS = [
    o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", _DEV_ORIGINS).split(",") if o.strip()
]
# Optional regex, handy for Netlify deploy previews, e.g.
#   ALLOWED_ORIGIN_REGEX=https://.*--pulmoscan-ai\.netlify\.app
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX") or None

DISCLAIMER = (
    "Educational prototype only. PulmoScan AI is not a medical device and has not "
    "been clinically validated. Results must not be used for diagnosis or replace "
    "evaluation by a qualified healthcare professional."
)
