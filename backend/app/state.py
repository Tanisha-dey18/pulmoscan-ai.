"""Holds the objects that are loaded ONCE at startup and reused per request.

Loading a Keras model takes seconds; doing it on every request would make the
API unusable, so it is loaded when the server boots and kept in memory.
"""

from __future__ import annotations

import json
import logging

from app import config

log = logging.getLogger("pulmoscan")


class ModelState:
    model = None        # the trained CNN
    grad_model = None   # same network, also returning the last conv feature maps
    gradcam_layer: str = ""
    metrics: dict | None = None
    threshold: float = config.DEFAULT_THRESHOLD

    def load(self) -> None:
        if config.METRICS_PATH.exists():
            self.metrics = json.loads(config.METRICS_PATH.read_text())
            self.threshold = float(self.metrics.get("test", {}).get("threshold", config.DEFAULT_THRESHOLD))
        else:
            log.warning("metrics.json not found - run ml/evaluate.py")

        if not config.MODEL_PATH.exists():
            log.error("Model file %s not found - run ml/train.py", config.MODEL_PATH)
            return

        # Imported here so the app can still start (and report a clear error)
        # even if the model file is missing.
        import numpy as np
        from tensorflow import keras

        from utils.gradcam import build_grad_model, compute_gradcam, find_gradcam_layer
        from utils.preprocessing import IMG_SIZE

        self.model = keras.models.load_model(config.MODEL_PATH, compile=False)
        self.gradcam_layer = find_gradcam_layer(self.model)
        self.grad_model = build_grad_model(self.model, self.gradcam_layer)
        # Warm-up: the first call is slow while TensorFlow sets itself up; do
        # it now so the first real user does not wait for it.
        compute_gradcam(self.grad_model, np.zeros((1, IMG_SIZE, IMG_SIZE, 1), "float32"), 1)
        log.info("Model loaded from %s", config.MODEL_PATH.name)

    @property
    def ready(self) -> bool:
        return self.grad_model is not None


state = ModelState()
