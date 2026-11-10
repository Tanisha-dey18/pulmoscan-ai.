"""Response shapes (Pydantic models). FastAPI uses them to validate what the
API returns and to generate the interactive docs at /docs."""

from __future__ import annotations

from pydantic import BaseModel


class Probabilities(BaseModel):
    NORMAL: float
    PNEUMONIA: float


class GradCam(BaseModel):
    overlay: str   # heatmap blended over the X-ray  (PNG data URL)
    heatmap: str   # heatmap alone                   (PNG data URL)
    layer: str     # conv layer the map was computed from
    target_class: str


class ImageInfo(BaseModel):
    filename: str
    width: int
    height: int
    format: str


class PredictionResponse(BaseModel):
    prediction: str            # "NORMAL" or "PNEUMONIA"
    confidence: float          # probability of the predicted class (0..1)
    probabilities: Probabilities
    threshold: float
    gradcam: GradCam
    image: ImageInfo
    warnings: list[str]
    inference_ms: float
    disclaimer: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    metrics_available: bool
