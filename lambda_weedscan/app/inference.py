"""
WeedScan ONNX inference (weedscan19_epoch_300.ort) with preprocessing from weedscan.json.
"""

from __future__ import annotations

import io
import json
import os
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
from PIL import Image

# Default paths inside the Lambda container image
_MODEL_PATH = os.environ.get(
    "WEEDSCAN_MODEL_PATH",
    "/opt/model/weedscan19_epoch_300.ort",
)
_CONFIG_PATH = os.environ.get(
    "WEEDSCAN_CONFIG_PATH",
    "/opt/model/weedscan.json",
)
_LABELS_PATH = os.environ.get(
    "WEEDSCAN_LABELS_PATH",
    "/opt/model/labels.json",
)

_session: ort.InferenceSession | None = None
_labels: list[str] | None = None
_preprocess: dict[str, Any] | None = None


def _load_json(path: str) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _ensure_loaded() -> None:
    global _session, _labels, _preprocess
    if _session is None:
        if not Path(_MODEL_PATH).is_file():
            raise FileNotFoundError(f"Model not found: {_MODEL_PATH}")
        _session = ort.InferenceSession(
            _MODEL_PATH,
            providers=["CPUExecutionProvider"],
        )
    if _preprocess is None:
        if not Path(_CONFIG_PATH).is_file():
            raise FileNotFoundError(f"Config not found: {_CONFIG_PATH}")
        raw = _load_json(_CONFIG_PATH)
        _preprocess = {
            "crop_w": int(raw["CustomVision.Preprocess.CropWidth"]),
            "crop_h": int(raw["CustomVision.Preprocess.CropHeight"]),
            "mean": json.loads(raw["CustomVision.Preprocess.NormalizeMean"]),
            "std": json.loads(raw["CustomVision.Preprocess.NormalizeStd"]),
        }
    if _labels is None:
        if Path(_LABELS_PATH).is_file():
            with open(_LABELS_PATH, encoding="utf-8") as f:
                _labels = json.load(f)
            if not isinstance(_labels, list):
                raise ValueError("labels.json must be a JSON array of strings")
        else:
            _labels = []


def preprocess_pil(image: Image.Image) -> np.ndarray:
    """Return NCHW float32 tensor, batch 1, RGB, Custom Vision–style normalization."""
    _ensure_loaded()
    assert _preprocess is not None
    cw = _preprocess["crop_w"]
    ch = _preprocess["crop_h"]
    mean = np.array(_preprocess["mean"], dtype=np.float32).reshape(1, 1, 3)
    std = np.array(_preprocess["std"], dtype=np.float32).reshape(1, 1, 3)

    image = image.convert("RGB")
    w, h = image.size
    if w < h:
        new_w = cw
        new_h = max(1, int(round(h * (cw / w))))
    else:
        new_h = ch
        new_w = max(1, int(round(w * (ch / h))))
    image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    left = (new_w - cw) // 2
    top = (new_h - ch) // 2
    image = image.crop((left, top, left + cw, top + ch))

    arr = np.asarray(image, dtype=np.float32)
    arr = (arr - mean) / std
    arr = np.transpose(arr, (2, 0, 1))
    return np.expand_dims(arr, axis=0)


def _softmax(x: np.ndarray) -> np.ndarray:
    x = x.reshape(-1)
    m = np.max(x)
    e = np.exp(x - m)
    return e / np.sum(e)


def predict_image_bytes(data: bytes) -> dict[str, Any]:
    """Run inference on raw image bytes (JPEG/PNG/etc.)."""
    _ensure_loaded()
    assert _session is not None

    img = Image.open(io.BytesIO(data))
    tensor = preprocess_pil(img)

    inp = _session.get_inputs()[0]
    out = _session.get_outputs()[0]
    outputs = _session.run([out.name], {inp.name: tensor.astype(np.float32)})
    logits = np.asarray(outputs[0]).reshape(-1)
    probs = _softmax(logits)
    idx = int(np.argmax(probs))
    confidence = float(probs[idx])

    label: str | None = None
    if _labels and 0 <= idx < len(_labels):
        label = _labels[idx]

    return {
        "class_index": idx,
        "confidence": confidence,
        "label": label,
        "probabilities": probs.tolist(),
    }
