"""Upload validation - never trust a file just because of its name."""

from __future__ import annotations

import io

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError

from app import config


def read_validated_image(file: UploadFile) -> tuple[Image.Image, str]:
    """Read the upload and return (PIL image, real format).

    Raises HTTP 4xx errors with a human-readable message when the upload is
    too large, empty, not a real JPEG/PNG, or too small to analyse.
    """
    data = file.file.read(config.MAX_UPLOAD_BYTES + 1)
    if not data:
        raise HTTPException(400, "The uploaded file is empty.")
    if len(data) > config.MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File is too large. Maximum size is {config.MAX_UPLOAD_MB} MB.")

    try:
        Image.open(io.BytesIO(data)).verify()   # integrity check (detects corrupt files)
        img = Image.open(io.BytesIO(data))      # verify() invalidates the object, so reopen
        img.load()
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, SyntaxError, ValueError):
        raise HTTPException(415, "This file is not a valid image. Please upload a JPEG or PNG chest X-ray.")

    fmt = (img.format or "").upper()
    if fmt not in config.ALLOWED_FORMATS:
        raise HTTPException(415, f"Unsupported image format ({fmt or 'unknown'}). Please upload a JPEG or PNG.")
    if min(img.size) < config.MIN_DIMENSION:
        raise HTTPException(
            422,
            f"Image is too small ({img.width}x{img.height}). Minimum is {config.MIN_DIMENSION}px on each side.",
        )
    # Apply the EXIF orientation now so width/height below match what the user sees.
    return ImageOps.exif_transpose(img), fmt
