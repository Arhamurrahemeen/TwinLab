import logging
import re
from datetime import datetime, timezone

import numpy as np
from fastapi import APIRouter, HTTPException

from config import settings
from db.influx import get_query_api
from db.mongo import get_db

log = logging.getLogger("twinlab.rul")
router = APIRouter()

_SAFE_ID = re.compile(r'^[\w\-]+$')

# Per-sensor normal operating thresholds.
# RUL counts down to the point where value crosses the threshold.
THRESHOLDS = {
    "temperature": {"max": 40.0,  "min": 5.0},
    "humidity":    {"max": 85.0,  "min": 10.0},
    "accel_x":     {"max": 0.5,   "min": -0.5},
    "accel_y":     {"max": 0.5,   "min": -0.5},
    "accel_z":     {"max": 1.6,   "min": 0.4},
    "gyro_x":      {"max": 5.0,   "min": -5.0},
    "gyro_y":      {"max": 5.0,   "min": -5.0},
    "gyro_z":      {"max": 5.0,   "min": -5.0},
    "vibration":   {"max": 0.8,   "min": -0.8},
    "current":     {"max": 15.0,  "min": 0.0},
}

MIN_POINTS = 10
STABLE_LABEL = "stable"


def _estimate_rul(times_s: list, values: list, sensor: str, bounds: dict | None = None) -> dict:
    """Linear extrapolation to threshold breach. Returns hours or STABLE_LABEL.
    bounds = the device's own {"min","max"} for this sensor; falls back to the generic table."""
    thresholds = bounds if bounds and (bounds.get("max") is not None or bounds.get("min") is not None) else THRESHOLDS.get(sensor)
    if not thresholds or len(values) < MIN_POINTS:
        return {"sensor": sensor, "status": STABLE_LABEL, "hours_remaining": None, "trend": "unknown"}

    t = np.array(times_s, dtype=float)
    v = np.array(values, dtype=float)

    # Normalise time to seconds from first point
    t0 = t[0]
    t_rel = t - t0

    coeffs = np.polyfit(t_rel, v, 1)   # slope, intercept
    slope = coeffs[0]                   # units per second
    current = v[-1]

    if abs(slope) < 1e-9:
        return {"sensor": sensor, "status": STABLE_LABEL, "hours_remaining": None, "trend": "flat"}

    trend = "rising" if slope > 0 else "falling"

    # Find which threshold is being approached
    hi, lo = thresholds.get("max"), thresholds.get("min")
    if slope > 0 and hi is not None and current < hi:
        gap = hi - current
    elif slope < 0 and lo is not None and current > lo:
        gap = current - lo
    else:
        return {"sensor": sensor, "status": STABLE_LABEL, "hours_remaining": None, "trend": trend}

    seconds_remaining = gap / abs(slope)
    hours_remaining = round(seconds_remaining / 3600, 1)

    if hours_remaining > 720:   # more than 30 days — treat as stable
        return {"sensor": sensor, "status": STABLE_LABEL, "hours_remaining": None, "trend": trend}

    return {
        "sensor": sensor,
        "status": "warning" if hours_remaining < 24 else "ok",
        "hours_remaining": hours_remaining,
        "trend": trend,
    }


@router.get("/{device_id}/rul")
async def get_rul(device_id: str):
    if not _SAFE_ID.match(device_id):
        raise HTTPException(400, "Invalid device_id format")

    # Query all sensors for this device in one Flux call
    flux = f"""
from(bucket: "{settings.influx_bucket}")
  |> range(start: -2h)
  |> filter(fn: (r) => r._measurement == "sensor_reading")
  |> filter(fn: (r) => r.device_id == "{device_id}")
  |> tail(n: 50)
"""
    try:
        tables = get_query_api().query(flux, org=settings.influx_org)
    except Exception as e:
        log.error(f"[InfluxDB] RUL query failed: {e}")
        raise HTTPException(500, "InfluxDB query failed")

    # Group by sensor
    sensor_data: dict[str, list] = {}
    for table in tables:
        for record in table.records:
            sensor = record.values.get("sensor", "")
            if not sensor:
                continue
            if sensor not in sensor_data:
                sensor_data[sensor] = []
            ts = record.get_time()
            if isinstance(ts, datetime):
                epoch_s = ts.replace(tzinfo=timezone.utc).timestamp() if ts.tzinfo is None else ts.timestamp()
            else:
                epoch_s = float(ts)
            sensor_data[sensor].append((epoch_s, record.get_value()))

    device = await get_db().devices.find_one({"device_id": device_id}, {"thresholds": 1}) or {}
    bounds_by_sensor = device.get("thresholds") or {}

    results = []
    for sensor, points in sensor_data.items():
        points.sort(key=lambda x: x[0])
        times = [p[0] for p in points]
        values = [p[1] for p in points]
        results.append(_estimate_rul(times, values, sensor, bounds_by_sensor.get(sensor)))

    return results
