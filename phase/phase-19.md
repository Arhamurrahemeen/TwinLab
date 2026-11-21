# Phase 19 — Twin shake fix + sim vibration control

## Goal
The Android twin was jittering wildly: `simulator.py` had no `vibration` branch, so it published the
generic `50 ± 10` fallback (~53 "g") and pinned the shake at max (60 px @ ~11 Hz). Give the simulator a
real g-scale vibration driven by a new sim-control slider, and cap the twin's shake so bad data can't
throw it around.

## Structure & steps
1. `simulator.py` — `vibration` branch: `base_values.vibration` (default 0.05 g) ± small noise; overload injector bumps it.
2. `backend/routers/sim.py` — add `vibration: 0.05` to default `base_values`.
3. `sim-control/src/components/DeviceControl.jsx` — Vibration slider (0–1 g, step 0.01).
4. `android/.../domain/TwinMapping.kt` — retune `SHAKE_GAIN` / `SHAKE_MAX` to g-scale (max ≈ 12 px).
5. Found while recording the demo: opening an asset from a push showed ~1 s "SIGNAL LOST" then ~2 s green "OK"
   under the title "Asset" before flipping to CRITICAL: health was computed against empty thresholds until
   `loadStatic()` finished (which also waited on alerts + per-sensor history).
   - `ui/detail/AssetDetailViewModel.kt` — publish `device` as soon as `getDevices()` returns; health = UNKNOWN
     and twin neutral until the device (thresholds) is known.
   - `ui/detail/AssetDetailScreen.kt` — "CONNECTING…" (neutral colour) instead of "SIGNAL LOST" before the first
     device load / WS message.
6. `domain/Health.kt` — add `vibration` to `CRITICAL_SENSORS` to match `backend/alerts.py` `_CRITICAL_MAX` (Phase 16
   drift: a vibration breach showed WARNING on the twin while the push said CRITICAL). Test updated.

## Start commands
```powershell
docker compose up -d
.venv\Scripts\python ingestion.py
.venv\Scripts\python simulator.py
cd backend; ..\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd sim-control; npm run dev
cd android; .\gradlew :app:testDebugUnitTest :app:installDebug
```

## Expected outcome
- Sim devices publish `vibration` ≈ 0.05 g, not ~53. Slider moves it; >0.15 g fires the vibration alert.
- Twin on the phone sits calm at baseline, visibly shakes (but stays on-screen) at high vibration.
