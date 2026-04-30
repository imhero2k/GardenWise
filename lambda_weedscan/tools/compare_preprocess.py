"""One-off: compare preprocessing variants vs ONNX (run inside image)."""
import json
import sys

import numpy as np
import onnxruntime as ort
from PIL import Image

MODEL = "/opt/model/weedscan19_epoch_300.ort"
CONFIG = "/opt/model/weedscan.json"


def main() -> None:
    path = sys.argv[1]
    raw = json.load(open(CONFIG))
    mean = np.array(json.loads(raw["CustomVision.Preprocess.NormalizeMean"]), dtype=np.float32)
    std = np.array(json.loads(raw["CustomVision.Preprocess.NormalizeStd"]), dtype=np.float32)
    cw = int(raw["CustomVision.Preprocess.CropWidth"])
    ch = int(raw["CustomVision.Preprocess.CropHeight"])

    def prep(bgr: bool, div255: bool) -> np.ndarray:
        im = Image.open(path).convert("RGB")
        w, h = im.size
        if w < h:
            new_w, new_h = cw, max(1, int(round(h * (cw / w))))
        else:
            new_h, new_w = ch, max(1, int(round(w * (ch / h))))
        im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)
        left = (new_w - cw) // 2
        top = (new_h - ch) // 2
        im = im.crop((left, top, left + cw, top + ch))
        a = np.asarray(im, dtype=np.float32)
        if bgr:
            a = a[..., ::-1]
        if div255:
            a = a / 255.0
            a = (a - (mean / 255.0)) / (std / 255.0)
        else:
            m = mean.reshape(1, 1, 3)
            s = std.reshape(1, 1, 3)
            if bgr:
                m = m[:, :, ::-1]
                s = s[:, :, ::-1]
            a = (a - m) / s
        a = np.transpose(a, (2, 0, 1))[None, ...]
        return a.astype(np.float32)

    sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    inp_name = sess.get_inputs()[0].name
    out_name = sess.get_outputs()[0].name

    def run(tag: str, x: np.ndarray) -> None:
        y = sess.run([out_name], {inp_name: x})[0].reshape(-1)
        spread = float(y.max() - y.min())
        pr = np.exp(y - y.max())
        pr /= pr.sum()
        i = int(pr.argmax())
        print(f"{tag}\targmax={i}\ttop_p={float(pr.max()):.5f}\tspread={spread:.4f}")

    for bgr in (False, True):
        for div in (False, True):
            run(f"bgr={bgr} div255={div}", prep(bgr, div))


if __name__ == "__main__":
    main()
