"""Step 1 - download, split and preprocess the chest X-ray dataset.

    python ml/preprocess.py --download     # fetch the zip (1.2 GB) then process
    python ml/preprocess.py                # zip / folders already in data/

What it does
------------
1. (optional) downloads the public Kermany et al. dataset from Mendeley Data.
2. Extracts it into data/raw/.
3. Builds a PATIENT-GROUPED, stratified train/validation split. The official
   test folder is left untouched and is only used for the final evaluation.
4. Converts every image to 160 x 160 grayscale (same function the API uses)
   and caches the arrays in data/processed/*.npz so training is fast.

Works with both the Mendeley zip (train/test) and the Kaggle version
(train/val/test) - the tiny 16-image Kaggle "val" folder is merged into the
training pool before we make our own, larger validation split.
"""

from __future__ import annotations

import argparse
import json
import re
import urllib.request
import zipfile
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
from PIL import Image
from sklearn.model_selection import StratifiedGroupKFold

import config as C
from utils.preprocessing import to_model_array  # backend/utils (shared code)

IMAGE_EXT = {".jpeg", ".jpg", ".png"}


def download_dataset() -> None:
    if C.DATASET_ZIP.exists():
        print(f"[skip] {C.DATASET_ZIP.name} already downloaded")
        return
    C.DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading dataset (about 1.2 GB) from {C.DATASET_URL} ...")

    def progress(blocks: int, block_size: int, total: int) -> None:
        done = blocks * block_size / 1e6
        print(f"\r  {done:7.0f} / {total / 1e6:.0f} MB", end="", flush=True)

    urllib.request.urlretrieve(C.DATASET_ZIP_URL, C.DATASET_ZIP, progress)
    print("\nDownload complete.")


def extract_dataset() -> None:
    if C.RAW_DIR.exists() and any(C.RAW_DIR.iterdir()):
        print("[skip] data/raw already extracted")
        return
    zips = sorted(C.DATA_DIR.glob("*.zip"))
    if not zips:
        raise SystemExit(
            "No dataset found. Run with --download, or put the dataset zip "
            "(Mendeley or Kaggle) inside the data/ folder."
        )
    print(f"Extracting {zips[0].name} ...")
    C.RAW_DIR.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(zips[0]) as zf:
        zf.extractall(C.RAW_DIR)


def find_split_dir(name: str) -> Path | None:
    """Locate e.g. .../train/ that contains NORMAL/ and PNEUMONIA/ folders."""
    for d in sorted(C.RAW_DIR.rglob(name)):
        if "__MACOSX" in d.parts or not d.is_dir():
            continue
        if (d / "NORMAL").is_dir() and (d / "PNEUMONIA").is_dir():
            return d
    return None


def list_images(split_dir: Path) -> tuple[list[Path], list[int]]:
    paths, labels = [], []
    for label, cls in enumerate(C.CLASS_NAMES):
        for p in sorted((split_dir / cls).iterdir()):
            if p.suffix.lower() in IMAGE_EXT and not p.name.startswith("."):
                paths.append(p)
                labels.append(label)
    return paths, labels


def patient_id(path: Path) -> str:
    """Extract a patient identifier from the filename.

    One patient can have several X-rays. If one of them lands in training and
    another in validation, the validation score is inflated ("data leakage").
    Grouping by patient keeps all images of a person on the same side.

    Filename styles handled:
      person123_bacteria_45.jpeg      -> person 123
      IM-0115-0001.jpeg               -> normal patient 0115
      NORMAL2-IM-0383-0001.jpeg       -> normal patient 0383 (second batch)
      BACTERIA-1008087-0001.jpeg      -> Mendeley v3 naming
    """
    name = path.name
    m = re.match(r"person(\d+)_", name)
    if m:
        return f"P-{m.group(1)}"
    m = re.match(r"(NORMAL2-)?IM-(\d+)-", name)
    if m:
        return f"N{'2' if m.group(1) else '1'}-{m.group(2)}"
    m = re.match(r"(NORMAL|BACTERIA|VIRUS)-(\d+)-", name)
    if m:
        return f"{m.group(1)}-{m.group(2)}"
    return path.stem  # unknown style: treat each image as its own patient


def load_images(paths: list[Path]) -> np.ndarray:
    def load(p: Path) -> np.ndarray:
        with Image.open(p) as img:
            return to_model_array(img)

    with ThreadPoolExecutor(max_workers=8) as pool:
        arrays = list(pool.map(load, paths))
    return np.stack(arrays)


def class_counts(labels: np.ndarray) -> dict[str, int]:
    counts = Counter(labels.tolist())
    return {cls: int(counts.get(i, 0)) for i, cls in enumerate(C.CLASS_NAMES)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--download", action="store_true", help="download the dataset first")
    args = parser.parse_args()

    if args.download:
        download_dataset()
    extract_dataset()

    train_dir, test_dir, kaggle_val = (find_split_dir(n) for n in ("train", "test", "val"))
    if train_dir is None or test_dir is None:
        raise SystemExit("Could not find train/ and test/ folders with NORMAL and PNEUMONIA inside data/raw.")

    pool_paths, pool_labels = list_images(train_dir)
    if kaggle_val is not None:
        extra_paths, extra_labels = list_images(kaggle_val)
        pool_paths += extra_paths
        pool_labels += extra_labels
    test_paths, test_labels = list_images(test_dir)

    pool_labels_arr = np.array(pool_labels, dtype=np.uint8)
    groups = np.array([patient_id(p) for p in pool_paths])

    # StratifiedGroupKFold: keeps the class ratio similar in both parts AND
    # never splits one patient across train and validation.
    n_splits = round(1 / C.VAL_FRACTION)
    splitter = StratifiedGroupKFold(n_splits=n_splits, shuffle=True, random_state=C.SEED)
    train_idx, val_idx = next(splitter.split(pool_paths, pool_labels_arr, groups))
    assert not set(groups[train_idx]) & set(groups[val_idx]), "patient leakage!"

    C.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    splits = {
        "train": ([pool_paths[i] for i in train_idx], pool_labels_arr[train_idx]),
        "val": ([pool_paths[i] for i in val_idx], pool_labels_arr[val_idx]),
        "test": (test_paths, np.array(test_labels, dtype=np.uint8)),
    }

    info = {
        "name": C.DATASET_NAME,
        "url": C.DATASET_URL,
        "citation": (
            "Kermany, D., Zhang, K., Goldbaum, M. (2018). Labeled Optical Coherence "
            "Tomography (OCT) and Chest X-Ray Images for Classification. Mendeley Data, v2."
        ),
        "description": (
            "Paediatric chest X-rays (patients aged 1-5) from Guangzhou Women and "
            "Children's Medical Center, labelled by expert physicians."
        ),
        "classes": C.CLASS_NAMES,
        "image_size": [C.IMG_SIZE, C.IMG_SIZE, 1],
        "split_strategy": (
            f"Official test folder kept untouched. {int(C.VAL_FRACTION * 100)}% of the "
            "training pool held out for validation with a patient-grouped, stratified split."
        ),
        "patients_in_training_pool": int(len(set(groups))),
        "splits": {},
    }

    for name, (paths, labels) in splits.items():
        print(f"Processing {name:5s}: {len(paths)} images ...")
        images = load_images(paths)
        np.savez_compressed(C.PROCESSED_DIR / f"{name}.npz", x=images, y=labels)
        info["splits"][name] = class_counts(labels)
        print(f"   {info['splits'][name]}")

    (C.PROCESSED_DIR / "dataset_info.json").write_text(json.dumps(info, indent=2))
    print(f"Done. Arrays saved in {C.PROCESSED_DIR}")


if __name__ == "__main__":
    main()
