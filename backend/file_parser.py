import numpy as np
import tempfile
from pathlib import Path
from typing import Dict, Tuple, Optional
from fastapi import UploadFile

def read_pc_file(path: Path) -> Tuple[Dict[str, np.ndarray], Optional[np.ndarray]]:
    if path.suffix.lower() != ".csv":
        data = np.loadtxt(path, dtype=np.float64)
        if data.ndim != 2 or data.shape[1] < 2:
            raise ValueError(f"{path} must contain a time column followed by PC columns.")
        data[data == -9999.0] = np.nan
        columns = {f"pc{idx}": data[:, idx] for idx in range(1, data.shape[1])}
        return columns, data[:, 0]

    data = np.genfromtxt(path, delimiter=",", names=True, dtype=np.float64, encoding="utf-8-sig")
    if data.dtype.names is None:
        raise ValueError(f"{path} must have a header row with PC columns such as PC1,PC2,...")
    columns: Dict[str, np.ndarray] = {}
    time_values: Optional[np.ndarray] = None
    for name in data.dtype.names:
        normalized = name.strip().lower().replace(" ", "").replace("-", "_")
        if normalized in {"time", "year", "years", "date"}:
            time_values = np.asarray(data[name], dtype=np.float64)
            continue
        columns[normalized] = np.asarray(data[name], dtype=np.float64)
    return columns, time_values


async def parse_upload(file: UploadFile) -> Tuple[Dict[str, np.ndarray], Optional[np.ndarray]]:
    suffix = Path(file.filename).suffix.lower()
    contents = await file.read()

    # write to a temp file so read_pc_file can use its path-based logic
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        return read_pc_file(tmp_path)
    finally:
        tmp_path.unlink()  # always clean up