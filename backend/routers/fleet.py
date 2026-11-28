import asyncio
import time
import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

import health
from config import settings
from db.influx import get_query_api
from db.mongo import get_db
from routers.rul import _estimate_rul

log = logging.getLogger("twinlab.fleet")
router = APIRouter()

_SAFE_ID = re.compile(r"^[\w\-]+$")
TREND_WINDOW_MIN = 5   # match the detail chart, which plots the last few hundred readings


def _public(device: dict) -> dict:
    return {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in device.items() if k != "_id"}


@router.get("/fleet")
async def fleet():
    """Every machine with its health verdict, worst first. Cheap: no InfluxDB."""
    docs = await get_db().devices.find({}, {"_id": 0}).to_list(length=500)
    out = []
    for d in docs:
        v = health.verdict(d, health.last_known.get(d["device_id"], {}))
        out.append({**_public(d), "health": v})
    out.sort(key=lambda d: (health.rank(d["health"]["status"]), d.get("name", "")))
    return out


def _history(device_id: str, sensor: str, minutes: int) -> list[tuple[float, float]]:
    flux = f"""
from(bucket: "{settings.influx_bucket}")
  |> range(start: -{minutes}m)
  |> filter(fn: (r) => r._measurement == "sensor_reading")
  |> filter(fn: (r) => r.device_id == "{device_id}")
  |> filter(fn: (r) => r.sensor == "{sensor}")
"""
    pts = []
    for table in get_query_api().query(flux, org=settings.influx_org):
        for rec in table.records:
            ts = rec.get_time()
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            pts.append((ts.timestamp(), float(rec.get_value())))
    return sorted(pts)


@router.get("/devices/{device_id}/health")
async def device_health(device_id: str):
    """Health verdict plus the fault trend, with rate-of-change from the last 30 min."""
    if not _SAFE_ID.match(device_id):
        raise HTTPException(400, "Invalid device_id format")
    device = await get_db().devices.find_one({"device_id": device_id}, {"_id": 0})
    if not device:
        raise HTTPException(404, f"Device '{device_id}' not found")
    readings = health.last_known.get(device_id, {})

    first = health.verdict(device, readings)
    sensor = first["sensors"][0]["sensor"] if first["sensors"] else None
    trend_input = None
    if sensor and _SAFE_ID.match(sensor) and first["status"] != health.NO_SIGNAL:
        try:
            since = first["sensors"][0].get("since_ms")
            minutes = TREND_WINDOW_MIN
            if since:
                minutes = min(30, max(1, int((time.time() * 1000 - since) / 60000) + 1))
            pts = await asyncio.to_thread(_history, device_id, sensor, minutes)
            if since:
                pts = [p for p in pts if p[0] * 1000 >= since] or pts
        except Exception as e:  # log-and-continue: verdict still useful without history
            log.error(f"[fleet] history query failed: {e}")
            pts = []
        if len(pts) >= 2:
            rul = _estimate_rul([p[0] for p in pts], [p[1] for p in pts], sensor,
                                (device.get("thresholds") or {}).get(sensor))
            trend_input = {
                "sensor": sensor,
                "delta": pts[-1][1] - pts[0][1],
                "minutes": (pts[-1][0] - pts[0][0]) / 60,
                "hours_to_limit": rul.get("hours_remaining"),
            }
    v = health.verdict(device, readings, trend_input=trend_input)
    return {**_public(device), "health": v}
