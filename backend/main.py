from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from file_parser import parse_upload
import numpy as np
import os

app = FastAPI()

import math

def clean_floats(values: list) -> list:
    return [None if math.isnan(v) else v for v in values]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://enso-webapp.netlify.app",
    ],
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
    # if both have time, align by time
    if sst_time is not None and ohc_time is not None:
        sst_dict = dict(zip(sst_time.tolist(), sst_pc1.tolist()))
        ohc_dict = dict(zip(ohc_time.tolist(), ohc_pc1.tolist()))

        all_times = sorted(set(sst_dict) | set(ohc_dict), reverse=True)

        valid_pairs = []
        for t in all_times:
            sst_val = sst_dict.get(t)
            ohc_val = ohc_dict.get(t)
            if sst_val is None or ohc_val is None:
                continue
            if math.isnan(sst_val) or math.isnan(ohc_val):
                continue
            valid_pairs.append((t, sst_val, ohc_val))
            if len(valid_pairs) == 18:
                break

        if len(valid_pairs) < 18:
            raise HTTPException(400, f"Only {len(valid_pairs)} valid overlapping time steps found, need 18")

        valid_pairs.reverse()
        return (
            [p[1] for p in valid_pairs],
            [p[2] for p in valid_pairs],
            [p[0] for p in valid_pairs],
            len(sst_pc1),
            len(ohc_pc1),
            len(valid_pairs),
        )

    # mixed case: one has time, other doesn't
    # slice each independently from the end since both end at the same date
    if sst_time is None and ohc_time is not None:
        sst_vals = [v for v in sst_pc1.tolist() if not math.isnan(v)]
        ohc_items = [(t, v) for t, v in zip(ohc_time.tolist(), ohc_pc1.tolist()) if not math.isnan(v)]

        if len(sst_vals) < 18 or len(ohc_items) < 18:
            raise HTTPException(400, f"Need at least 18 valid rows in each file")

        sst_18 = sst_vals[-18:]
        ohc_18 = ohc_items[-18:]

        return (
            sst_18,
            [v for _, v in ohc_18],
            [t for t, _ in ohc_18],
            len(sst_pc1),
            len(ohc_pc1),
            18,
        )

    if sst_time is not None and ohc_time is None:
        sst_items = [(t, v) for t, v in zip(sst_time.tolist(), sst_pc1.tolist()) if not math.isnan(v)]
        ohc_vals = [v for v in ohc_pc1.tolist() if not math.isnan(v)]

        if len(sst_items) < 18 or len(ohc_vals) < 18:
            raise HTTPException(400, f"Need at least 18 valid rows in each file")

        sst_18 = sst_items[-18:]
        ohc_18 = ohc_vals[-18:]

        return (
            [v for _, v in sst_18],
            ohc_18,
            [t for t, _ in sst_18],
            len(sst_pc1),
            len(ohc_pc1),
            18,
        )

    # neither has time — slice last 18 from each independently
    sst_vals = [v for v in sst_pc1.tolist() if not math.isnan(v)]
    ohc_vals = [v for v in ohc_pc1.tolist() if not math.isnan(v)]

    if len(sst_vals) < 18 or len(ohc_vals) < 18:
        raise HTTPException(400, f"Need at least 18 valid rows in each file")

    return (
        sst_vals[-18:],
        ohc_vals[-18:],
        None,
        len(sst_pc1),
        len(ohc_pc1),
        18,
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
        "times": times,   
        "sst_total_rows": sst_total,
        "ohc_total_rows": ohc_total,
        "overlap_rows": overlap,
    }

class ForecastInput(BaseModel):
    sst_pc1: list[float]
    ohc_pc1: list[float]

from model import run_forecast

@app.post("/forecast")
async def forecast(data: ForecastInput):
    return run_forecast(data.sst_pc1, data.ohc_pc1)

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)