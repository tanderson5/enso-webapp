import torch
import numpy as np
from pathlib import Path
from typing import Any, Dict
from argparse import Namespace

import pathlib
import platform

if platform.system() == 'Windows':
    pathlib.PosixPath = pathlib.WindowsPath

CHECKPOINT_PATH = Path(__file__).parent / "checkpoints" / "best_mae_rmse_ohc_full_lstm_sst1_ohc1_lb18_h64_ly1_do0p15_lr0p001_bs64_rmse0p406675_mae0p287616.pt"

# Functions from smoke test script: scale_x, inverse_y

def scale_x(x: np.ndarray, scaler: Dict[str, Any]) -> np.ndarray:
    mean = np.asarray(scaler["mean"], dtype=np.float32)
    std = np.asarray(scaler["std"], dtype=np.float32)
    return ((x - mean) / std).astype(np.float32)


def inverse_y(y: np.ndarray, scaler: Dict[str, Any]) -> np.ndarray:
    return y * float(scaler["std"]) + float(scaler["mean"])

# Run the forecast

from make_model import make_model

checkpoint = torch.load(CHECKPOINT_PATH, map_location="cpu", weights_only=False)
ckpt_args = checkpoint["args"]
feature_names = checkpoint["feature_names"]
lead_times = np.asarray(checkpoint["lead_times"], dtype=np.int64)

lookback = int(ckpt_args["lookback"])
n_features = len(feature_names)

model_args = Namespace(**ckpt_args)
model = make_model(str(ckpt_args["model"]), n_features, len(lead_times), model_args)
model.load_state_dict(checkpoint["model_state_dict"])
model.eval()


def run_forecast(sst_pc1: list[float], ohc_pc1: list[float]) -> dict:
    # shape into (1, 18, 2) - batch of 1, 18 timesteps, 2 features
    x = np.array([[s, o] for s, o in zip(sst_pc1, ohc_pc1)], dtype=np.float32)
    x = x[np.newaxis, :, :]  # (1, 18, 2)

    x_scaled = scale_x(x, checkpoint["x_scaler"])

    with torch.no_grad():
        pred_scaled = model(torch.from_numpy(x_scaled)).cpu().numpy()
    predictions = inverse_y(pred_scaled, checkpoint["y_scaler"])

    return {
        "lead_times": lead_times.tolist(),
        "predictions": predictions[0].tolist(),
    } 
