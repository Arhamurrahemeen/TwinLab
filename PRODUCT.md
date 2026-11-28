# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

The repo has two design surfaces: the React + Vite web dashboard (`frontend/`, platform `web`) and a native Kotlin + Jetpack Compose Android app (`android/`, platform `android`, Material 3). The sim-control mini-app (`sim-control/`) is an internal demo tool, not a buyer surface.

## Users

- **Owner (buyer):** owns the plant or SME. Does not sit at a dashboard. Uses the Android app: gets a push alert, opens it, and needs to know in under a second which machine is in trouble and how bad it is.
- **Maintenance / ops head (or the owner's son):** uses the web dashboard, both on a laptop at a desk (clicking into one machine, reading trends) and on a wall TV in the control room (read from across the room, nobody touching it).
- Shown to technical and non-technical evaluators (incubator panels, plant visitors). Feedback (2026-11): the current UI is hard to read, and red/yellow/green status needs several seconds of attention to understand.

## Product Purpose

TwinLab is a Predictive Maintenance (PdM) platform: non-invasive sensors on critical machines, a live digital-twin view of each machine, and push alerts that flag failure before it happens. Success: the owner never loses a machine to a failure that the data warned about, and anyone can tell machine status at a glance.

## Positioning

APM 4.0: wireless, non-invasive condition monitoring with a standalone cloud. No deep OT/SCADA integration (unlike MindSphere, Predix, Maximo, ThingWorx). PKR-billed. The real competitor is the spreadsheet and the ledger. TwinLab complements existing workflows and never asks the owner to change how he works. Never frame it as a cheap clone of a Western platform.

## Operating Context

- Lead vertical: Textile + FMCG enterprise plants (SCADA-present, with gaps on gensets, compressors, chillers, HVAC, older lines), plus SME feeders (hospitals, guest houses).
- Machines are grouped by plant/site (e.g. "NFL SITE Karachi").
- Alerts arrive as FCM push on the Android app, in English + Roman Urdu, rupee-anchored.
- Phones on the LAN reach the backend by IP; the app is often used on mid-range Android phones.

## Capabilities and Constraints

- Live sensors: temperature, humidity, accel_x/y/z, vibration (real ESP32 node); fuel_level and load_current are simulator-only (no fuel sensor or CT clamp owned).
- Alert rules: per-device min/max thresholds (critical severity on temperature, load_current, vibration max breach; warning otherwise), fuel-theft rule (simulator only), run-hours → consumable reorder.
- Rule-based RUL (linear extrapolation), Groq chat assistant on the dashboard.
- Machine types needing their own 3D digital twin: **genset**, **air compressor**, and a **generic motor/pump** fallback for every other asset type.
- Digital twins are real 3D, drag-to-rotate, on both web and Android (confirmed 2026-11-27). This adds a 3D library to each client.
- On-screen UI language: English only. Roman Urdu stays in push alerts and alert messages.
- Stack is locked (see CLAUDE.md): React + Vite dashboard, Kotlin + Compose single-module Android app, FastAPI backend.

## Brand Commitments

- Name: **TwinLab** (one word, capital T and L; never "TwinLab AI"). Built by OmniteX.
- Logo and wordmark assets in `assets/` (`TwinLab_Transparent.png`, `TwinLab_Wordmark_Transparent.png`); brand guidelines in `assets/OmniteX_Brand_Guidelines_v1.docx`.
- Brand colours sampled from the logo: navy `#1B395B`, teal `#2B768B`.
- Simulated devices carry a SIMULATED badge; never present simulated data as real hardware.

## Evidence on Hand

- Seeded demo plant: NFL devices (standby genset, air compressor, process chiller, cold storage) in `seed_nfl.py`.
- One real hardware node, `TL-B49244` (bench only, never mounted on a spinning machine).
- No customer deployments, testimonials or benchmarks exist yet. Don't fabricate any.

## Product Principles

1. **Status in one glance.** Machine state must be readable in under a second, from across a room, without relying on colour alone.
2. **The machine is the interface.** Show the machine itself (its digital twin), not a table about it.
3. **Owner and operator are different people.** The owner wants "is anything wrong, which one"; the maintenance head wants trends and thresholds.
4. **Complement, never replace.** Fit the plant's existing routines; no new process for the owner.
5. **Honest data.** Simulated vs real, stale vs live, and uncalibrated values are always visible.

## Accessibility & Inclusion

Status must not depend on red/yellow/green colour alone (panel feedback, plus colour-vision deficiency). Pair colour with words, shapes and motion. The wall-TV view must be legible at 3–5 m.
