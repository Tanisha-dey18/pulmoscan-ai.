"""Step 3 - evaluate the trained model on the untouched test set.

    python ml/evaluate.py

Computes accuracy, precision, recall, F1-score, ROC-AUC and the confusion
matrix, saves graphs to ml/outputs/, and writes backend/models/metrics.json.
The web app's "Model Insights" page reads that file, so every number shown in
the UI is a real measurement produced by this script.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
)
from tensorflow import keras

import config as C
from utils.gradcam import find_gradcam_layer


def load_split(name: str) -> tuple[np.ndarray, np.ndarray]:
    data = np.load(C.PROCESSED_DIR / f"{name}.npz")
    return data["x"].astype("float32")[..., None], data["y"].astype(int)


def describe_model(model: keras.Model) -> dict:
    layers_info = []
    for layer in model.layers:
        shape = layer.output.shape if hasattr(layer, "output") else None
        layers_info.append(
            {
                "name": layer.name,
                "type": layer.__class__.__name__,
                "output_shape": [d for d in shape[1:]] if shape is not None else None,
                "params": int(layer.count_params()),
            }
        )
    trainable = int(sum(np.prod(w.shape) for w in model.trainable_weights))
    return {
        "name": model.name,
        "framework": "TensorFlow / Keras",
        "input_shape": [C.IMG_SIZE, C.IMG_SIZE, 1],
        "output": "Sigmoid - probability of pneumonia",
        "total_params": int(model.count_params()),
        "trainable_params": trainable,
        "file_size_mb": round(C.MODEL_PATH.stat().st_size / 1e6, 2),
        "gradcam_layer": find_gradcam_layer(model),
        "convs_per_block": C.CONVS_PER_BLOCK,
        "conv_filters": C.FILTERS,
        "layers": layers_info,
    }


def evaluate_split(y_true: np.ndarray, prob: np.ndarray) -> dict:
    y_pred = (prob >= C.THRESHOLD).astype(int)
    report = classification_report(
        y_true, y_pred, target_names=C.CLASS_NAMES, output_dict=True, zero_division=0
    )
    tidy = lambda d: {  # noqa: E731
        "precision": float(d["precision"]),
        "recall": float(d["recall"]),
        "f1": float(d["f1-score"]),
        "support": int(d["support"]),
    }
    return {
        "samples": int(len(y_true)),
        "threshold": C.THRESHOLD,
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "roc_auc": float(roc_auc_score(y_true, prob)),
        # rows = actual class, columns = predicted class, order [NORMAL, PNEUMONIA]
        "confusion_matrix": confusion_matrix(y_true, y_pred).tolist(),
        "per_class": {cls: tidy(report[cls]) for cls in C.CLASS_NAMES},
        "macro_avg": tidy(report["macro avg"]),
        "weighted_avg": tidy(report["weighted avg"]),
    }


def plot_confusion(cm: list[list[int]]) -> None:
    fig, ax = plt.subplots(figsize=(5.2, 4.4), dpi=140)
    sns.heatmap(
        np.array(cm), annot=True, fmt="d", cmap="Blues", cbar=False,
        xticklabels=C.CLASS_NAMES, yticklabels=C.CLASS_NAMES, annot_kws={"size": 14}, ax=ax,
    )
    ax.set(xlabel="Predicted label", ylabel="True label", title="Confusion matrix - test set")
    fig.tight_layout()
    fig.savefig(C.OUTPUT_DIR / "confusion_matrix.png")
    plt.close(fig)


def plot_roc(fpr: np.ndarray, tpr: np.ndarray, auc: float) -> None:
    fig, ax = plt.subplots(figsize=(5.2, 4.4), dpi=140)
    ax.plot(fpr, tpr, lw=2, label=f"PulmoScan CNN (AUC = {auc:.3f})")
    ax.plot([0, 1], [0, 1], ls="--", color="gray", label="Random guess")
    ax.set(xlabel="False positive rate", ylabel="True positive rate (recall)", title="ROC curve - test set")
    ax.grid(alpha=0.3)
    ax.legend(loc="lower right")
    fig.tight_layout()
    fig.savefig(C.OUTPUT_DIR / "roc_curve.png")
    plt.close(fig)


def main() -> None:
    if not C.MODEL_PATH.exists():
        raise SystemExit("No trained model found - run `python ml/train.py` first.")
    C.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    model = keras.models.load_model(C.MODEL_PATH)
    saved = json.loads(C.HISTORY_PATH.read_text())
    dataset = json.loads((C.PROCESSED_DIR / "dataset_info.json").read_text())

    results = {}
    for split in ("val", "test"):
        x, y = load_split(split)
        prob = model.predict(x, batch_size=64, verbose=0)[:, 0]
        results[split] = evaluate_split(y, prob)
        if split == "test":
            fpr, tpr, _ = roc_curve(y, prob)
            plot_roc(fpr, tpr, results[split]["roc_auc"])
            # ~60 evenly spaced points are plenty for the web chart
            idx = np.unique(np.linspace(0, len(fpr) - 1, 60).astype(int))
            results[split]["roc_curve"] = {"fpr": fpr[idx].tolist(), "tpr": tpr[idx].tolist()}
            print(classification_report(y, (prob >= C.THRESHOLD).astype(int), target_names=C.CLASS_NAMES, digits=4))

    plot_confusion(results["test"]["confusion_matrix"])

    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": describe_model(model),
        "dataset": dataset,
        "training": saved["training"],
        "history": saved["history"],
        "validation": results["val"],
        "test": results["test"],
    }
    C.METRICS_PATH.write_text(json.dumps(metrics, indent=2))

    t = results["test"]
    print(f"Test accuracy : {t['accuracy']:.4f}")
    print(f"Test ROC-AUC  : {t['roc_auc']:.4f}")
    print(f"Confusion matrix [[TN, FP], [FN, TP]]: {t['confusion_matrix']}")
    print(f"Saved {C.METRICS_PATH} and graphs in {C.OUTPUT_DIR}")


if __name__ == "__main__":
    main()
