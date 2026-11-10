"""Grad-CAM (Gradient-weighted Class Activation Mapping).

Idea in one paragraph
---------------------
The last convolutional layer still has a spatial layout (20 x 20 here) and
each of its channels detects some learned pattern. Grad-CAM asks: "if I nudge
each channel's activation, how much does the class score change?" The gradient
of the score w.r.t. each channel, averaged over space, gives one importance
weight per channel. A weighted sum of the channels, passed through ReLU, is a
coarse map of WHERE the evidence for that class was found.

Reference: Selvaraju et al., "Grad-CAM: Visual Explanations from Deep Networks
via Gradient-based Localization", ICCV 2017.
"""

from __future__ import annotations

import base64
import io

import numpy as np
import tensorflow as tf
from PIL import Image

def find_gradcam_layer(model: tf.keras.Model) -> str:
    """Name of the last layer that still outputs feature MAPS (4-D, before the
    final pooling): the ReLU at the end of the last conv block."""
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.layers.ReLU) and len(layer.output.shape) == 4:
            return layer.name
    raise ValueError("No convolutional activation layer found in the model.")


def build_grad_model(model: tf.keras.Model, layer_name: str | None = None) -> tf.keras.Model:
    """A model that returns (last conv feature maps, prediction) in one pass."""
    layer_name = layer_name or find_gradcam_layer(model)
    return tf.keras.Model(
        inputs=model.inputs,
        outputs=[model.get_layer(layer_name).output, model.output],
    )


def compute_gradcam(grad_model: tf.keras.Model, batch: np.ndarray, target_class: int):
    """Return (heatmap in 0..1 with the conv layer's spatial size, P(pneumonia)).

    The network has ONE sigmoid output p = P(pneumonia). So the "score" for
    class PNEUMONIA (1) is p, and for class NORMAL (0) it is 1 - p.
    """
    x = tf.convert_to_tensor(batch, dtype=tf.float32)
    with tf.GradientTape() as tape:
        conv_maps, preds = grad_model(x, training=False)
        p = preds[:, 0]
        score = p if target_class == 1 else 1.0 - p

    grads = tape.gradient(score, conv_maps)            # (1, h, w, channels)
    weights = tf.reduce_mean(grads, axis=(1, 2))       # (1, channels)  "alpha_k"
    cam = tf.einsum("bhwc,bc->bhw", conv_maps, weights)  # weighted sum of channels
    cam = tf.nn.relu(cam)[0].numpy()                   # keep positive evidence only

    peak = float(cam.max())
    if peak > 1e-8:
        cam = cam / peak                               # normalise to 0..1
    return cam, float(p.numpy()[0])


# --------------------------------------------------------------------------
# Rendering helpers (NumPy + Pillow only, so the backend stays lightweight)
# --------------------------------------------------------------------------

# Anchor colours of a perceptual "turbo"-style ramp: deep blue -> cyan -> green
# -> yellow -> red. Interpolated to 256 entries below.
_ANCHORS = np.array(
    [
        [48, 18, 59],
        [70, 107, 227],
        [40, 187, 236],
        [50, 241, 151],
        [164, 252, 60],
        [238, 207, 58],
        [251, 128, 34],
        [209, 52, 5],
        [122, 4, 3],
    ],
    dtype=np.float32,
)
_POS = np.linspace(0, 255, len(_ANCHORS))
COLORMAP = np.stack(
    [np.interp(np.arange(256), _POS, _ANCHORS[:, c]) for c in range(3)], axis=1
).astype(np.uint8)


def upscale_heatmap(cam: np.ndarray, size: tuple[int, int]) -> np.ndarray:
    """Smoothly resize the coarse heatmap to (width, height); returns 0..1 floats."""
    img = Image.fromarray(np.uint8(cam * 255)).resize(size, Image.Resampling.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0


def colourise(heat: np.ndarray) -> np.ndarray:
    """0..1 heatmap -> RGB uint8 image using the colour ramp."""
    return COLORMAP[np.uint8(np.clip(heat, 0, 1) * 255)]


def overlay(gray: np.ndarray, heat: np.ndarray, max_alpha: float = 0.6) -> np.ndarray:
    """Blend the heatmap over the grayscale X-ray.

    The blend strength follows the heat value, so unimportant regions stay as
    the untouched X-ray and only influential regions get coloured.
    """
    base = np.repeat(gray[..., None], 3, axis=-1).astype(np.float32)
    colour = colourise(heat).astype(np.float32)
    alpha = (np.clip(heat, 0, 1) ** 0.8 * max_alpha)[..., None]
    return np.uint8(base * (1 - alpha) + colour * alpha)


def to_data_url(rgb: np.ndarray) -> str:
    """Encode an image array as a base64 PNG data URL the browser can display."""
    buf = io.BytesIO()
    Image.fromarray(rgb).save(buf, format="PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")
