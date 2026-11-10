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
# Origins that are always allowed: local development and this project's own
# deployed frontends. To allow another site, add it here or (without touching
# the code) set the ALLOWED_ORIGINS environment variable on the host to a
# comma-separated list, e.g. ALLOWED_ORIGINS=https://my-site.example.com
_DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:4173",
    "https://pulmoscan-ai-topaz.vercel.app",
    "https://pulmoscan-ai-474.netlify.app",
]
_EXTRA_ORIGINS = [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
ALLOWED_ORIGINS = list(dict.fromkeys(_DEFAULT_ORIGINS + _EXTRA_ORIGINS))  # merged, no duplicates
# Optional regex, handy for Netlify deploy previews, e.g.
#   ALLOWED_ORIGIN_REGEX=https://.*--pulmoscan-ai\.netlify\.app
ALLOWED_ORIGIN_REGEX = os.getenv("ALLOWED_ORIGIN_REGEX") or None

DISCLAIMER = (
    "Educational prototype only. PulmoScan AI is not a medical device and has not "
    "been clinically validated. Results must not be used for diagnosis or replace "
    "evaluation by a qualified healthcare professional."
)
