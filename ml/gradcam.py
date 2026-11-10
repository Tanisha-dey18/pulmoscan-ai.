"""Step 4 - Grad-CAM visual explanations.

    python ml/gradcam.py                       # grid of random test images
    python ml/gradcam.py --image path/to.jpeg  # explain one image

The Grad-CAM maths lives in backend/utils/gradcam.py (the API uses the very
same code). This script is the offline / report version: it saves a figure to
ml/outputs/gradcam_samples.png.
"""

from __future__ import annotations

import argparse

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from tensorflow import keras

import config as C
from utils.gradcam import build_grad_model, compute_gradcam, overlay, upscale_heatmap
from utils.preprocessing import to_batch, to_model_array


def explain(grad_model, gray: np.ndarray) -> tuple[np.ndarray, float, int]:
    """Return (overlay image, P(pneumonia), predicted label) for one X-ray."""
    batch = to_batch(gray)
    # first pass just to learn the predicted class, second explains that class
    _, prob = compute_gradcam(grad_model, batch, target_class=1)
    label = int(prob >= C.THRESHOLD)
    cam, _ = compute_gradcam(grad_model, batch, target_class=label)
    heat = upscale_heatmap(cam, (C.IMG_SIZE, C.IMG_SIZE))
    return overlay(gray, heat), prob, label


def main() -> None:
    parser = argparse.ArgumentParser(description="Grad-CAM for the PulmoScan CNN")
    parser.add_argument("--image", help="path to a single chest X-ray image")
    parser.add_argument("--n", type=int, default=4, help="test images per class for the grid")
    args = parser.parse_args()

    model = keras.models.load_model(C.MODEL_PATH)
    grad_model = build_grad_model(model)
    C.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.image:
        with Image.open(args.image) as img:
            gray = to_model_array(img)
        blended, prob, label = explain(grad_model, gray)
        out = C.OUTPUT_DIR / "gradcam_single.png"
        Image.fromarray(np.hstack([np.repeat(gray[..., None], 3, -1), blended])).save(out)
        print(f"{C.CLASS_NAMES[label]}  P(pneumonia) = {prob:.4f}  ->  {out}")
        return

    data = np.load(C.PROCESSED_DIR / "test.npz")
    x, y = data["x"], data["y"]
    rng = np.random.default_rng(C.SEED)
    picks = np.concatenate([rng.choice(np.where(y == c)[0], args.n, replace=False) for c in (0, 1)])

    fig, axes = plt.subplots(2, len(picks), figsize=(2.6 * len(picks), 5.6), dpi=130)
    for col, i in enumerate(picks):
        blended, prob, label = explain(grad_model, x[i])
        correct = label == y[i]
        axes[0, col].imshow(x[i], cmap="gray")
        axes[0, col].set_title(f"True: {C.CLASS_NAMES[y[i]]}", fontsize=9)
        axes[1, col].imshow(blended)
        axes[1, col].set_title(
            f"Pred: {C.CLASS_NAMES[label]}\nP(pneumonia) = {prob:.2f}",
            fontsize=9, color="green" if correct else "red",
        )
        for row in (0, 1):
            axes[row, col].axis("off")
    fig.suptitle("Grad-CAM - regions that influenced the prediction", fontsize=12)
    fig.tight_layout()
    out = C.OUTPUT_DIR / "gradcam_samples.png"
    fig.savefig(out)
    print(f"Saved {out}")


if __name__ == "__main__":
    main()
