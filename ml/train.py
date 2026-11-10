"""Step 2 - build and train the PulmoScan CNN.

    python ml/train.py

Reads the cached arrays from data/processed/ (run preprocess.py first), trains
with augmentation + early stopping, and writes:

    backend/models/pulmoscan_cnn.keras   trained model (best validation loss)
    backend/models/history.json          per-epoch metrics + training settings
    ml/outputs/accuracy.png, loss.png    training graphs
"""

from __future__ import annotations

import json
import time

import matplotlib

matplotlib.use("Agg")  # render graphs to files, no window needed
import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
from sklearn.utils.class_weight import compute_class_weight
from tensorflow import keras
from tensorflow.keras import layers

import config as C

AUGMENTATION_DESCRIPTION = [
    "Random rotation (about +/-10 degrees)",
    "Random shift (up to 8% horizontally and vertically)",
    "Random zoom (up to 10%)",
    "Random brightness (+/-10%)",
    "Random contrast (+/-15%)",
]


def load_split(name: str) -> tuple[np.ndarray, np.ndarray]:
    path = C.PROCESSED_DIR / f"{name}.npz"
    if not path.exists():
        raise SystemExit(f"{path} not found - run `python ml/preprocess.py` first.")
    data = np.load(path)
    x = data["x"].astype("float32")[..., None]  # (N, 160, 160, 1), values 0..255
    y = data["y"].astype("float32")
    return x, y


def build_augmenter() -> keras.Sequential:
    """Random, label-preserving distortions applied ONLY to training images.

    No horizontal flip on purpose: left/right matters in a chest X-ray (the
    heart sits on the left), so a mirrored image is anatomically wrong.
    """
    return keras.Sequential(
        [
            layers.RandomRotation(0.03, fill_mode="constant", seed=C.SEED),
            layers.RandomTranslation(0.08, 0.08, fill_mode="constant", seed=C.SEED),
            layers.RandomZoom(0.10, fill_mode="constant", seed=C.SEED),
            layers.RandomBrightness(0.10, value_range=(0, 255), seed=C.SEED),
            layers.RandomContrast(0.15, value_range=(0, 255), seed=C.SEED),
        ],
        name="augmentation",
    )


def make_dataset(x: np.ndarray, y: np.ndarray, training: bool) -> tf.data.Dataset:
    ds = tf.data.Dataset.from_tensor_slices((x, y))
    if training:
        ds = ds.shuffle(len(x), seed=C.SEED, reshuffle_each_iteration=True)
    ds = ds.batch(C.BATCH_SIZE)
    if training:
        augment = build_augmenter()
        ds = ds.map(lambda a, b: (augment(a, training=True), b), num_parallel_calls=tf.data.AUTOTUNE)
    return ds.prefetch(tf.data.AUTOTUNE)


def conv_block(x, filters: int, index: int):
    """(Conv -> BatchNorm -> ReLU) x CONVS_PER_BLOCK, then 2x2 max-pooling.

    * Conv2D learns local patterns (edges -> textures -> lung opacities).
    * BatchNormalization keeps activations well-scaled => faster, stabler training.
    * MaxPooling halves the resolution so deeper layers see a wider area.
    """
    for i in range(1, C.CONVS_PER_BLOCK + 1):
        x = layers.Conv2D(filters, 3, padding="same", use_bias=False, name=f"block{index}_conv{i}")(x)
        x = layers.BatchNormalization(momentum=C.BN_MOMENTUM, name=f"block{index}_bn{i}")(x)
        x = layers.ReLU(name=f"block{index}_relu{i}")(x)
    return layers.MaxPooling2D(2, name=f"block{index}_pool")(x)


def build_model() -> keras.Model:
    inputs = keras.Input(shape=(C.IMG_SIZE, C.IMG_SIZE, 1), name="xray")
    x = layers.Rescaling(1.0 / 255, name="normalize")(inputs)  # pixels 0..255 -> 0..1

    for index, filters in enumerate(C.FILTERS, start=1):
        x = conv_block(x, filters, index)

    # Classifier head. GlobalAveragePooling replaces a huge Flatten layer:
    # far fewer parameters, which means less overfitting.
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.Dropout(C.DROPOUT_HEAD, name="dropout_1")(x)
    x = layers.Dense(C.DENSE_UNITS, activation="relu", name="dense")(x)
    x = layers.Dropout(C.DROPOUT_DENSE, name="dropout_2")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="pneumonia_probability")(x)

    model = keras.Model(inputs, outputs, name="PulmoScanCNN")
    model.compile(
        optimizer=keras.optimizers.Adam(C.LEARNING_RATE),
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.BinaryAccuracy(name="accuracy"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
            keras.metrics.AUC(name="auc"),
        ],
    )
    return model


def plot_curves(history: dict[str, list[float]], best_epoch: int) -> None:
    C.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    epochs = range(1, len(history["loss"]) + 1)
    for metric, title in (("accuracy", "Accuracy"), ("loss", "Loss")):
        fig, ax = plt.subplots(figsize=(7, 4.5), dpi=140)
        ax.plot(epochs, history[metric], marker="o", ms=3, label=f"Training {title.lower()}")
        ax.plot(epochs, history[f"val_{metric}"], marker="o", ms=3, label=f"Validation {title.lower()}")
        ax.axvline(best_epoch, color="gray", ls="--", lw=1, label=f"Best epoch ({best_epoch})")
        ax.set(xlabel="Epoch", ylabel=title, title=f"Training vs validation {title.lower()}")
        ax.grid(alpha=0.3)
        ax.legend()
        fig.tight_layout()
        fig.savefig(C.OUTPUT_DIR / f"{metric}.png")
        plt.close(fig)


def main() -> None:
    keras.utils.set_random_seed(C.SEED)

    x_train, y_train = load_split("train")
    x_val, y_val = load_split("val")
    print(f"train: {x_train.shape}  val: {x_val.shape}")

    # The dataset has ~3x more pneumonia than normal images. Class weights make
    # every mistake on the rarer class count proportionally more in the loss.
    weights = compute_class_weight("balanced", classes=np.array([0, 1]), y=y_train.astype(int))
    class_weight = {0: float(weights[0]), 1: float(weights[1])}
    print("class weights:", class_weight)

    model = build_model()
    model.summary()

    C.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    callbacks = [
        # Stop when validation loss has not improved for N epochs and roll
        # back to the best weights -> prevents overfitting.
        keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=C.EARLY_STOP_PATIENCE, restore_best_weights=True, verbose=1
        ),
        # Halve the learning rate when progress stalls -> finer final steps.
        keras.callbacks.ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, min_lr=1e-5, verbose=1),
        keras.callbacks.ModelCheckpoint(C.MODEL_PATH, monitor="val_loss", save_best_only=True),
    ]

    start = time.time()
    result = model.fit(
        make_dataset(x_train, y_train, training=True),
        validation_data=make_dataset(x_val, y_val, training=False),
        epochs=C.MAX_EPOCHS,
        class_weight=class_weight,
        callbacks=callbacks,
        verbose=2,
    )
    duration = time.time() - start

    history = {k: [float(v) for v in vals] for k, vals in result.history.items()}
    best_epoch = int(np.argmin(history["val_loss"])) + 1
    model.save(C.MODEL_PATH)  # weights already restored to the best epoch

    summary = {
        "epochs_run": len(history["loss"]),
        "max_epochs": C.MAX_EPOCHS,
        "best_epoch": best_epoch,
        "batch_size": C.BATCH_SIZE,
        "optimizer": "Adam",
        "initial_learning_rate": C.LEARNING_RATE,
        "loss": "Binary cross-entropy",
        "early_stopping_patience": C.EARLY_STOP_PATIENCE,
        "class_weight": {C.CLASS_NAMES[k]: round(v, 4) for k, v in class_weight.items()},
        "augmentation": AUGMENTATION_DESCRIPTION,
        "duration_seconds": round(duration, 1),
        "hardware": "CPU" if not tf.config.list_physical_devices("GPU") else "GPU",
        "tensorflow_version": tf.__version__,
        # Metrics at the best epoch (the weights that were saved).
        "train_accuracy": history["accuracy"][best_epoch - 1],
        "val_accuracy": history["val_accuracy"][best_epoch - 1],
        "train_loss": history["loss"][best_epoch - 1],
        "val_loss": history["val_loss"][best_epoch - 1],
    }
    C.HISTORY_PATH.write_text(json.dumps({"training": summary, "history": history}, indent=2))
    plot_curves(history, best_epoch)

    print(f"\nFinished in {duration / 60:.1f} min. Best epoch: {best_epoch}")
    print(f"train acc {summary['train_accuracy']:.4f} | val acc {summary['val_accuracy']:.4f}")
    print(f"Model saved to {C.MODEL_PATH}")


if __name__ == "__main__":
    main()
