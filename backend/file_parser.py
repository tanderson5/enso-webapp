import numpy as np
import tempfile
from pathlib import Path
from typing import Dict, Tuple, Optional
from fastapi import UploadFile

def parse_noaa_sst(path: Path) -> Tuple[np.ndarray, np.ndarray]:
    """
    Handles NOAA SST file with columns:
    YR MON NINO1+2 ANOM NINO3 ANOM NINO4 ANOM NINO3.4 ANOM
    We want the last ANOM column (index 9) and build decimal year from YR + MON
    """
    data = np.genfromtxt(path, skip_header=1, dtype=np.float64)
    years = data[:, 0]
    months = data[:, 1]
    nino34_anom = data[:, 9]  # last ANOM column

    # build decimal year from separate year and month columns
    time_values = years + (months - 1) / 12.0
    return nino34_anom, time_values


def parse_noaa_ohc(path: Path) -> Tuple[np.ndarray, np.ndarray]:
    """
    Handles NOAA OHC CSV with columns:
    Date (YYYY-MM-DD), central pacific heat content
    """
    import csv
    from datetime import datetime

    dates = []
    values = []

    with open(path, newline='', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # find the date column
            date_key = next((k for k in row if 'date' in k.lower()), None)
            # find the heat content column
            ohc_key = next((k for k in row if k != date_key), None)

            if date_key is None or ohc_key is None:
                raise ValueError("OHC file must have a Date column and a heat content column")

            try:
                dt = datetime.strptime(row[date_key].strip(), '%Y-%m-%d')
                val = float(row[ohc_key])
                # decimal year from date
                time_values = dt.year + (dt.month - 1) / 12.0
                dates.append(time_values)
                values.append(val)
            except (ValueError, KeyError):
                continue

    return np.array(values, dtype=np.float64), np.array(dates, dtype=np.float64)

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
    filename = file.filename.lower()
    contents = await file.read()

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(contents)
        tmp_path = Path(tmp.name)

    try:
        # detect NOAA formats by peeking at the header
        header = contents.decode('utf-8-sig', errors='ignore').split('\n')[0].lower()

        if 'nino' in header or ('yr' in header and 'mon' in header):
            pc1, time_values = parse_noaa_sst(tmp_path)
            return {"pc1": pc1}, time_values

        if 'date' in header and suffix == '.csv':
            # check if it looks like YYYY-MM-DD date format
            second_line = contents.decode('utf-8-sig', errors='ignore').split('\n')[1]
            if len(second_line) > 4 and second_line[4] == '-':
                pc1, time_values = parse_noaa_ohc(tmp_path)
                return {"pc1": pc1}, time_values

        return read_pc_file(tmp_path)
    finally:
        tmp_path.unlink()  # always clean up