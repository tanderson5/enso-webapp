from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from file_parser import parse_upload
import numpy as np

app = FastAPI()

import math

def clean_floats(values: list) -> list:
    return [None if math.isnan(v) else v for v in values]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_pc1(cols: dict, label: str):
    pc1 = cols.get("pc1")
    if pc1 is None:
        pc1 = cols.get(f"{label}_pc1")
    if pc1 is None:
        raise HTTPException(400, f"{label.upper()} file must contain a PC1 column")
    return pc1

def align_and_slice(sst_pc1, sst_time, ohc_pc1, ohc_time):
    if sst_time is not None and ohc_time is not None:
        sst_dict = dict(zip(sst_time.tolist(), sst_pc1.tolist()))
        ohc_dict = dict(zip(ohc_time.tolist(), ohc_pc1.tolist()))
        common = sorted(set(sst_dict) & set(ohc_dict))

        # filter to times where both values are non-null
        common = [
            t for t in common
            if not math.isnan(sst_dict[t]) and not math.isnan(ohc_dict[t])
        ]

        if len(common) < 18:
            raise HTTPException(400, f"Only {len(common)} overlapping non-null time steps, need at least 18")

        latest = common[-18:]
        return (
            [sst_dict[t] for t in latest],
            [ohc_dict[t] for t in latest],
            latest,
            len(sst_pc1),
            len(ohc_pc1),
            len(common),
        )

    # no time columns — zip together and filter positionally
    pairs = [
        (s, o) for s, o in zip(sst_pc1.tolist(), ohc_pc1.tolist())
        if not math.isnan(s) and not math.isnan(o)
    ]

    if len(pairs) < 18:
        raise HTTPException(400, f"Only {len(pairs)} rows with both SST and OHC non-null, need at least 18")

    latest = pairs[-18:]
    return (
        [p[0] for p in latest],
        [p[1] for p in latest],
        None,
        len(sst_pc1),
        len(ohc_pc1),
        len(pairs),
    )

@app.post("/parse")
async def parse_files(
    sst_file: UploadFile = File(...),
    ohc_file: UploadFile = File(...),
):
    try:
        sst_cols, sst_time = await parse_upload(sst_file)
        ohc_cols, ohc_time = await parse_upload(ohc_file)
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

    sst_pc1 = extract_pc1(sst_cols, "sst")
    ohc_pc1 = extract_pc1(ohc_cols, "ohc")

    sst_18, ohc_18, times, sst_total, ohc_total, overlap = align_and_slice(
        sst_pc1, sst_time, ohc_pc1, ohc_time
    )

    return {
        "sst_pc1": clean_floats(sst_18),
        "ohc_pc1": clean_floats(ohc_18),
        "sst_total_rows": sst_total,
        "ohc_total_rows": ohc_total,
        "overlap_rows": overlap,
    }


class ForecastInput(BaseModel):
    sst_pc1: list[float]
    ohc_pc1: list[float]

@app.post("/forecast")
async def forecast(data: ForecastInput):
    # model inference goes here
    return {"lead_times": list(range(1, 25)), "predictions": [0.0] * 24}