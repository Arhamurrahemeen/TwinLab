# Phase 20 — Shade Card redesign: one health verdict, 3D twins on web + Android

## Goal
Testers could not read machine status at a glance (red/yellow/green needed several seconds). Redesign the web dashboard and the Android app around 3D digital twins of every machine, with status shown as a word + pattern + shape (DANGER / CHECK / OK / NO SIGNAL), worst machine first. The backend becomes the single place that decides each machine's status and fault trend, so web and app can never disagree.

## Structure & steps
1. **Backend: one health verdict** — `backend/health.py` (new): owns the live last-known cache (moved out of `main.py`, now stamped with server receive time), classifies every sensor and the whole machine (`danger` / `check` / `ok` / `no_signal`), decides `running`, and writes the fault trend ("This machine is showing an overheating trend" + rate + check-first list). Severity rule reuses `alerts.CRITICAL_MAX`; running reuses `alerts.OFF_AMPS` / `VIB_RUNNING_G`. `__main__` self-check.
   - `backend/routers/fleet.py` (new): `GET /fleet` (every machine + health, worst first), `GET /devices/{id}/health` (adds the trend, with rate from InfluxDB history).
   - `backend/routers/rul.py`: `_estimate_rul` accepts the device's real thresholds instead of only its hard-coded table.
2. **3D models without .glb files** — `frontend/src/twin/models.js` builds genset, air compressor and generic motor/pump in three.js (named parts `part_<name>`, spin animation clips). `frontend/scripts/build-models.mjs` exports them to `frontend/public/models/*.glb` and `android/app/src/main/assets/models/*.glb`. One source, two clients; real models can replace the files later.
3. **Web dashboard (Shade Card)** — `frontend/`: add `three`. New shell: indigo top bar + plant tabs, shade-card ribbon (one chip per machine, worst first), fleet grid of live 3D twins (worst machine double-size), "Needs attention" feed, machine detail (orbit twin, part pins, fault trend box, chart with limit + onset, sensor table, Edit / Delete), Floor view (TV). Existing Register / Edit / Chat keep working, restyled. One WebGL canvas scissored into every twin view.
4. **Android app** — add SceneView (Filament). Status from the backend health verdict (`Health.kt` local copy of the rule deleted). Machines list: summary + ribbon + rows with 3D twins + status chips. Detail: draggable 3D twin, glowing breaching part, DANGER chip, fault trend box, sensor chips, chart. Shade Card theme (indigo, Archivo).
5. Docs: CLAUDE.md roadmap row, DESIGN.md + PRODUCT.md, README run notes.

## Start commands
```powershell
docker compose up -d
.venv\Scripts\python ingestion.py
.venv\Scripts\python simulator.py
cd backend; ..\.venv\Scripts\uvicorn main:app --reload --host 0.0.0.0 --port 8000
cd frontend; npm install; npm run models; npm run dev        # http://localhost:5173
cd sim-control; npm run dev
# Android: open android/ in Android Studio, run on a phone on the same LAN
```

## Expected outcome
- `GET /fleet` returns all machines with `health.status` in {danger, check, ok, no_signal}, worst first; a machine with no data for 60 s is `no_signal`.
- Injecting "overheat" in sim-control turns the genset DANGER on web and phone within ~5 s; its detail shows "This machine is showing an overheating trend".
- Every machine on the dashboard is a draggable/rotatable 3D twin; clicking opens its detail. TV floor view readable from across a room.
- Android list + detail show the same statuses as web; detail twin drags and the breaching part glows.
- `python backend/health.py` self-check passes; `gradlew :app:testDebugUnitTest` passes; `npm run build` passes.

---
## ✅ Actually achieved

**Shipped**
- **Backend single verdict.** `backend/health.py` owns `last_known`, now stamped with server receive time `rx` (ESP32 `ts` isn't wall-clock). It also owns per-sensor and per-machine status (`danger` / `check` / `ok` / `no_signal`), `running`, `headline`, the breach start `since_ms` (which survives brief dips: it clears only after `CLEAR_AFTER_S` = 60 s back in limits), and the fault trend ("This machine is showing an overheating trend", what happened, check-first list). `alerts._CRITICAL_MAX` became the public `CRITICAL_MAX` and is shared. New `routers/fleet.py` serves `GET /fleet` and `GET /devices/{id}/health`; the latter computes the trend delta from InfluxDB since the breach start. `rul._estimate_rul` now uses each device's real thresholds instead of only its hard-coded table. `__main__` self-check covers all of this.
- **3D models without .glb files.** `frontend/src/twin/models.js` builds a procedural genset, air compressor and generic motor/pump; `npm run models` writes them to `frontend/public/models/` and `android/app/src/main/assets/models/`. Naming contract: `part_*`, `pin_*`, `spin_*` and a "run" clip.
- **Web (Shade Card).**
  - Screens: indigo sticky top bar with plant tabs and day/date clock; shade-card ribbon (worst first); fleet grid of live 3D twins with the worst machine in a double tile; "Needs attention" feed showing only conditions that are still active; machine detail with an orbit twin, part pins that follow the model, a glowing and dyed breaching part, the trend box, a chart with limit and onset, a sensor table, and Edit / Delete; Floor view (TV) at `#/floor`.
  - All twins draw through one scissored WebGL canvas.
  - Deleted `DeviceList`, `AlertsPanel`, `RulCard`, `SensorChart` and the `recharts` dependency. Archivo is self-hosted.
- **Android.**
  - SceneView 2.2.1 (Filament): a `Twin3D` composable shared by the list rows and the detail screen, with the breaching part dyed and pulsing, the run animation only while running, grey for NO SIGNAL, and drag/pinch on detail.
  - `StatusChip` shows word + icon + pattern.
  - Shade Card theme with bundled Archivo.
  - Status comes from `/fleet` and `/health`. The local copy of the rule (`Health.kt healthStatus`), `TwinMapping`, `TwinView`, `Gauge` and `Sparkline` are deleted, and `TwinPartsTest` replaces the old tests.
- **Docs.** `PRODUCT.md` and `DESIGN.md` (plus `.impeccable/design.json`) are written, and the CLAUDE.md stack rows and roadmap are updated.

**Deviations**
- SceneView is pinned to 2.2.1, because 3.x+ needs AGP 9, Kotlin 2.4 and compileSdk 37 (a toolchain upgrade wasn't in scope).
- Tapping a part to select it works on web only. On Android, the sensor chips select the part.

**Gotchas**
- three's GLTFLoader de-duplicates node names (`part_engine_1`), so lookups strip `_\d+$`.
- Gradle 8.9 fails on Android Studio's bundled JDK 25; use JDK 21 (`~/.jdks/jbr-21.0.11`).
- Hash-only navigation doesn't reload the page, so screenshots silently ran stale hot-swapped code until captures used a fresh query string.

**Not verified**
- No Android emulator image or device was available. The app compiles, the unit tests pass and the debug APK builds (~51 MB, every ABI), but the 3D screens have not been seen on a phone yet.
- The models are deliberately simple. Fan and chiller share the motor/pump model, as approved.
