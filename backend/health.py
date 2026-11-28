"""
TwinLab health verdict — the one place that decides how a machine is doing.

Web dashboard and Android app both render this verdict; neither re-derives it.
Severity follows the alert engine (alerts.CRITICAL_MAX), and "running" follows
the run-hours meter (alerts.OFF_AMPS / VIB_RUNNING_G), so a status chip, an
alert and the twin's spinning fan can never disagree.
"""

import time

from alerts import CRITICAL_MAX, OFF_AMPS, VIB_RUNNING_G

# {device_id: {sensor: {value, unit, ts, rx}}} — rx is server receive time (ms).
# Written by the MQTT thread in main.py; read by the fleet/health endpoints.
last_known: dict = {}

STALE_S = 60   # no reading for this long → NO SIGNAL

# {(device_id, sensor): ms when the current breach started} — "since when?" for the UI.
# In-memory like last_known; a backend restart restarts the clock (shown as "for under a minute").
_breach_since: dict = {}
_ok_since: dict = {}        # {(device_id, sensor): ms the sensor came back inside its limits}
CLEAR_AFTER_S = 60          # a breach only "ends" after this long back in limits (noise near the line won't reset it)

DANGER, CHECK, OK, NO_SIGNAL = "danger", "check", "ok", "no_signal"
_RANK = {DANGER: 0, CHECK: 1, NO_SIGNAL: 2, OK: 3}

LABELS = {
    "temperature": "Temperature", "humidity": "Humidity", "vibration": "Vibration",
    "load_current": "Load current", "fuel_level": "Fuel level",
    "accel_x": "Accel X", "accel_y": "Accel Y", "accel_z": "Accel Z",
}

# (sensor, direction) → trend name. Direction "up" = rising / above max.
_TREND = {
    ("temperature", "up"): "an overheating trend",
    ("temperature", "down"): "a temperature drop trend",
    ("humidity", "up"): "a moisture build-up trend",
    ("vibration", "up"): "a rising vibration trend",
    ("load_current", "up"): "an overload trend",
    ("load_current", "down"): "a load drop trend",
    ("fuel_level", "down"): "a fuel loss trend",
}

# What to look at first. Things to check, never a diagnosis.
_CHECKS = {
    ("temperature", "genset"): ["Radiator fan and belt", "Coolant level", "Load on the genset"],
    ("temperature", "compressor"): ["Cooling fan and intake filter", "Oil level", "Room ventilation"],
    ("temperature", None): ["Cooling fan and airflow", "Load on the machine", "Room temperature"],
    ("humidity", None): ["Condensate drain", "Room ventilation", "Water near electrical boxes"],
    ("vibration", None): ["Mounting bolts", "Bearings and coupling", "Belt tension and alignment"],
    ("load_current", None): ["Connected load", "Cable joints for heating", "Motor or alternator temperature"],
    ("fuel_level", None): ["Fuel tank and lines for leaks", "Tank lock", "Recent refuelling log"],
}


def sensor_status(sensor: str, value: float, bounds: dict | None) -> tuple[str, str | None]:
    """(status, side) for one reading. Mirrors alerts.evaluate's severity rule."""
    if not bounds:
        return OK, None
    lo, hi = bounds.get("min"), bounds.get("max")
    if hi is not None and value > hi:
        return (DANGER if sensor in CRITICAL_MAX else CHECK), "max"
    if lo is not None and value < lo:
        return CHECK, "min"
    return OK, None


def is_running(readings: dict) -> bool:
    lc = readings.get("load_current", {}).get("value")
    vib = readings.get("vibration", {}).get("value")
    return (lc is not None and lc > OFF_AMPS) or (vib is not None and vib > VIB_RUNNING_G)


def _fmt(v: float) -> str:
    return f"{v:.2f}".rstrip("0").rstrip(".") if abs(v) < 10 else f"{v:.1f}".rstrip("0").rstrip(".")


def verdict(device: dict, readings: dict, now_ms: int | None = None, trend_input: dict | None = None) -> dict:
    """
    Health of one machine.
    readings:    last_known[device_id]
    trend_input: optional {"sensor", "delta", "minutes", "hours_to_limit"} from history (fleet router).
    """
    now_ms = now_ms or int(time.time() * 1000)
    thresholds = device.get("thresholds") or {}
    last_rx = max((r.get("rx") or r.get("ts") or 0 for r in readings.values()), default=0)
    stale = not readings or (now_ms - last_rx) > STALE_S * 1000

    sensors = []
    for name in device.get("sensors") or list(readings):
        r = readings.get(name)
        b = thresholds.get(name) or {}
        if r is None or stale:
            st, side, val = NO_SIGNAL, None, (r or {}).get("value")
        else:
            val = r["value"]
            st, side = sensor_status(name, val, b)
        key = (device.get("device_id"), name)
        if st in (DANGER, CHECK):
            _breach_since.setdefault(key, now_ms)
            _ok_since.pop(key, None)
        elif st == OK and key in _breach_since:
            back = _ok_since.setdefault(key, now_ms)
            if now_ms - back >= CLEAR_AFTER_S * 1000:
                _breach_since.pop(key, None)
                _ok_since.pop(key, None)
        sensors.append({
            "sensor": name, "label": LABELS.get(name, name.replace("_", " ").title()),
            "value": val, "unit": (r or {}).get("unit", ""),
            "min": b.get("min"), "max": b.get("max"), "status": st, "side": side,
            "since_ms": _breach_since.get(key) if st in (DANGER, CHECK) else None,
        })

    if stale:
        status = NO_SIGNAL
    else:
        live = [s for s in sensors if s["status"] != NO_SIGNAL]
        status = min((s["status"] for s in live), key=_RANK.get, default=OK)

    worst = min(sensors, key=lambda s: _RANK[s["status"]], default=None)
    return {
        "status": status,
        "running": (not stale) and is_running(readings),
        "last_seen_ms": last_rx or None,
        "sensors": sorted(sensors, key=lambda s: _RANK[s["status"]]),
        "headline": _headline(worst, status, now_ms, last_rx),
        "trend": _trend(device, sensors, status, now_ms, last_rx, trend_input),
    }


def _headline(worst, status, now_ms, last_rx):
    if status == NO_SIGNAL:
        if not last_rx:
            return "No data received yet"
        return f"Last seen {_ago(now_ms - last_rx)}"
    if not worst or worst["value"] is None:
        return ""
    return f"{worst['label']} {_fmt(worst['value'])} {worst['unit']}".strip()


def _ago(ms: int) -> str:
    m = int(ms / 60000)
    if m < 1:
        return "under a minute ago"
    if m < 60:
        return f"{m} min ago"
    return f"{m // 60} h {m % 60} min ago"


def _trend(device, sensors, status, now_ms, last_rx, ti):
    kind = device.get("asset_type")
    kind = "genset" if kind in ("genset", "generator") else kind
    if status == NO_SIGNAL:
        return {"name": None, "title": "No trend: sensor offline",
                "text": "TwinLab can't judge a trend without data." + (f" Last reading {_ago(now_ms - last_rx)}." if last_rx else ""),
                "checks": ["Sensor power", "WiFi at the machine"]}

    breach = next((s for s in sensors if s["status"] in (DANGER, CHECK)), None)
    # An in-limit sensor heading for its limit within a day is also a trend (rule-based RUL).
    approaching = None
    if not breach and ti and ti.get("hours_to_limit") is not None and ti["hours_to_limit"] < 24:
        approaching = next((s for s in sensors if s["sensor"] == ti["sensor"]), None)

    s = breach or approaching
    if not s:
        return {"name": None, "title": "No fault trend",
                "text": "All readings are steady and inside their limits.", "checks": []}

    if breach:
        direction = "up" if s["side"] == "max" else "down"
    else:
        direction = "up" if (ti.get("delta") or 0) >= 0 else "down"
    name = _TREND.get((s["sensor"], direction)) or f"an unusual {s['label'].lower()} trend"
    lim = s["max"] if direction == "up" else s["min"]
    u = s["unit"]

    if breach:
        text = f"{s['label']} is {_fmt(s['value'])} {u}, {'above' if direction == 'up' else 'below'} the {_fmt(lim)} {u} limit."
    else:
        text = f"{s['label']} is {_fmt(s['value'])} {u} and heading for the {_fmt(lim)} {u} limit."
    if breach and s.get("since_ms"):
        mins = int((now_ms - s["since_ms"]) / 60000)
        text += f" It has been outside the limit for {'under a minute' if mins < 1 else f'{mins} min'}"
        if ti and ti.get("sensor") == s["sensor"] and ti.get("delta") is not None:
            text += f" and moved {ti['delta']:+.1f} {u} since then"
        text += "."
    elif ti and ti.get("sensor") == s["sensor"] and ti.get("delta") is not None and ti.get("minutes") is not None:
        span = "under a minute" if ti["minutes"] < 1 else f"the last {int(ti['minutes'])} min"
        text += f" It changed {ti['delta']:+.1f} {u} in {span}."
    if approaching:
        h = ti["hours_to_limit"]
        text += f" At this rate it crosses the limit in about {_fmt(h) + ' h' if h >= 1 else str(max(1, round(h * 60))) + ' min'}."

    checks = _CHECKS.get((s["sensor"], kind)) or _CHECKS.get((s["sensor"], None)) or []
    return {"name": name, "title": f"This machine is showing {name}", "text": text,
            "checks": checks, "sensor": s["sensor"]}


def rank(status: str) -> int:
    return _RANK.get(status, 9)


if __name__ == "__main__":
    now = 1_000_000_000
    gen = {"device_id": "G", "asset_type": "genset", "sensors": ["temperature", "humidity", "load_current"],
           "thresholds": {"temperature": {"max": 85}, "humidity": {"max": 85}}}
    fresh = lambda v, u="": {"value": v, "unit": u, "ts": 0, "rx": now - 1000}

    # 1. Critical-sensor max breach → danger, overheating trend, genset checks
    v = verdict(gen, {"temperature": fresh(96, "°C"), "humidity": fresh(50, "%"), "load_current": fresh(41, "A")}, now,
                {"sensor": "temperature", "delta": 22.0, "minutes": 22})
    assert v["status"] == DANGER and v["running"], v
    assert v["trend"]["title"] == "This machine is showing an overheating trend"
    assert "outside the limit for under a minute and moved +22.0 °C since then" in v["trend"]["text"] and v["trend"]["checks"][0] == "Radiator fan and belt"
    assert v["headline"] == "Temperature 96 °C" and v["sensors"][0]["sensor"] == "temperature"

    # 2. Non-critical breach → check (mirrors alerts: humidity is not in CRITICAL_MAX)
    v = verdict(gen, {"temperature": fresh(70), "humidity": fresh(91, "%")}, now)
    assert v["status"] == CHECK and v["trend"]["name"] == "a moisture build-up trend"

    # 3. Stale → no_signal regardless of values
    old = {"temperature": {"value": 96, "unit": "°C", "ts": 0, "rx": now - 14 * 60_000}}
    v = verdict(gen, old, now)
    assert v["status"] == NO_SIGNAL and v["headline"] == "Last seen 14 min ago" and not v["running"]

    # 4. Nothing received at all → no_signal
    assert verdict(gen, {}, now)["status"] == NO_SIGNAL

    # 5. In limits but approaching within a day → OK status with a trend
    v = verdict(gen, {"temperature": fresh(80, "°C")}, now, {"sensor": "temperature", "delta": 6.0, "minutes": 30, "hours_to_limit": 0.4})
    assert v["status"] == OK and v["trend"]["name"] == "an overheating trend" and "24 min" in v["trend"]["text"]

    # 6. Healthy and steady
    v = verdict(gen, {"temperature": fresh(60, "°C")}, now)
    assert v["status"] == OK and v["trend"]["name"] is None

    # 7. Breach onset is remembered across calls and cleared when back in limits
    gen["device_id"] = "G2"
    verdict(gen, {"temperature": fresh(96, "°C")}, now)
    later = verdict(gen, {"temperature": {"value": 97, "unit": "°C", "ts": 0, "rx": now + 59_000}}, now + 60_000)
    assert later["sensors"][0]["since_ms"] == now, later["sensors"][0]
    # a brief dip back inside the limit does not reset the clock…
    verdict(gen, {"temperature": {"value": 60, "unit": "°C", "ts": 0, "rx": now + 119_000}}, now + 120_000)
    assert verdict(gen, {"temperature": {"value": 97, "unit": "°C", "ts": 0, "rx": now + 129_000}}, now + 130_000)["sensors"][0]["since_ms"] == now
    # …only a full CLEAR_AFTER_S back in limits does
    verdict(gen, {"temperature": {"value": 60, "unit": "°C", "ts": 0, "rx": now + 139_000}}, now + 140_000)
    verdict(gen, {"temperature": {"value": 60, "unit": "°C", "ts": 0, "rx": now + 199_000}}, now + 200_000)
    assert verdict(gen, {"temperature": {"value": 97, "unit": "°C", "ts": 0, "rx": now + 200_500}}, now + 201_000)["sensors"][0]["since_ms"] == now + 201_000

    # 8. Running: vibration above VIB_RUNNING_G with no load_current
    assert is_running({"vibration": {"value": VIB_RUNNING_G + 0.01}}) and not is_running({"vibration": {"value": 0.0}})
    print("[health] self-check passed")
