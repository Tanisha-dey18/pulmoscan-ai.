from __future__ import annotations

import time

import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile

from app import config
from app.schemas import GradCam, ImageInfo, PredictionResponse, Probabilities
from app.state import state
from utils.gradcam import colourise, compute_gradcam, overlay, to_data_url, upscale_heatmap
from utils.preprocessing import colour_fraction, to_batch, to_model_array
from utils.validation import read_validated_image

router = APIRouter(tags=["prediction"])

DISPLAY_MAX = 512  # longest side (px) of the Grad-CAM images sent to the browser


# A plain `def` (not `async def`): FastAPI runs it in a worker thread, so the
# CPU-heavy model call does not block other requests.
@router.post("/api/predict", response_model=PredictionResponse)
def predict(file: UploadFile = File(..., description="Chest X-ray image (JPEG or PNG)")) -> PredictionResponse:
    if not state.ready:
        raise HTTPException(503, "The model is not loaded on the server.")

    img, fmt = read_validated_image(file)
    started = time.perf_counter()

    warnings: list[str] = []
    if colour_fraction(img) > 0.15:
        warnings.append(
            "This image contains a lot of colour, which is unusual for a chest X-ray. "
            "The model was only trained on X-rays, so this result is likely meaningless."
        )

    # 1) preprocess exactly like the training data
    gray = to_model_array(img)
    batch = to_batch(gray)

    # 2) predict, then 3) explain the predicted class with Grad-CAM
    _, p_pneumonia = compute_gradcam(state.grad_model, batch, target_class=1)
    label = int(p_pneumonia >= state.threshold)
    cam, _ = compute_gradcam(state.grad_model, batch, target_class=label)

    # 4) render the heatmap over a sharper copy of the X-ray, keeping the
    #    original aspect ratio so it lines up with the preview in the browser
    scale = DISPLAY_MAX / max(img.size)
    size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
    display = np.asarray(img.convert("L").resize(size), dtype=np.uint8)
    heat = upscale_heatmap(cam, size)

    probs = {"NORMAL": 1.0 - p_pneumonia, "PNEUMONIA": p_pneumonia}
    prediction = config.CLASS_NAMES[label]
    return PredictionResponse(
        prediction=prediction,
        confidence=probs[prediction],
        probabilities=Probabilities(**probs),
        threshold=state.threshold,
        gradcam=GradCam(
            overlay=to_data_url(overlay(display, heat)),
            heatmap=to_data_url(colourise(heat)),
            layer=state.gradcam_layer,
            target_class=prediction,
        ),
        image=ImageInfo(filename=file.filename or "upload", width=img.width, height=img.height, format=fmt),
        warnings=warnings,
        inference_ms=round((time.perf_counter() - started) * 1000, 1),
        disclaimer=config.DISCLAIMER,
    )
