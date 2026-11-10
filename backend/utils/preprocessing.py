"""Image preprocessing shared by training (ml/) and inference (backend/).

Keeping ONE implementation here guarantees "train/serve parity": an X-ray is
turned into model input in exactly the same way whether it comes from the
dataset during training or from a user upload at prediction time.
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageOps

IMG_SIZE = 160  # the CNN expects 160 x 160 pixels
CHANNELS = 1    # chest X-rays are grayscale, so one channel is enough


def to_model_array(img: Image.Image) -> np.ndarray:
    """PIL image -> uint8 array of shape (160, 160) in grayscale.

    Steps:
      1. honour EXIF rotation (phone photos of X-rays are often rotated)
      2. convert to single-channel grayscale ("L" mode)
      3. resize to 160 x 160 with bilinear interpolation

    Pixel values stay in 0..255 here. Scaling to 0..1 is done by a
    `Rescaling(1/255)` layer INSIDE the model, so it can never be forgotten.
    """
    img = ImageOps.exif_transpose(img)
    img = img.convert("L")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.Resampling.BILINEAR)
    return np.asarray(img, dtype=np.uint8)


def to_batch(arr: np.ndarray) -> np.ndarray:
    """(160, 160) uint8 -> (1, 160, 160, 1) float32 batch for model.predict."""
    return arr.astype("float32")[None, ..., None]


def colour_fraction(img: Image.Image) -> float:
    """Rough measure of how colourful an image is (0 = pure grayscale).

    Real radiographs are grayscale. A high value suggests the upload is a
    normal photo, so the API can warn the user instead of silently predicting.
    """
    small = np.asarray(img.convert("RGB").resize((64, 64)), dtype=np.int16)
    spread = small.max(axis=-1) - small.min(axis=-1)  # per-pixel channel gap
    return float((spread > 30).mean())
