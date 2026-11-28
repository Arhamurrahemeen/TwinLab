---
version: 1
slug: "frontend-src-app-jsx"
primary_target: "frontend/src/App.jsx"
related_targets: ["android/app/src/main/java/com/omnitex/twinlab/ui/assets/AssetListScreen.kt"]
---

Scope: TwinLab web dashboard (fleet, machine detail, floor view) + Android app list/detail. Mode: Operate.
Audience: maintenance/ops head (laptop + wall TV), owner (Android, push-driven). Job: know which machine is in trouble in under a second, then why.
Constraint: status must never depend on colour alone (panel feedback). Backend health verdict is the single source of status.

## Direction contract
THESIS: Every machine is a mounted swatch on the plant's shade card and only trouble is dyed; refuses the category default of a grey card grid with small coloured status pills.
OWN-WORLD: Indigo-dyed shell (#1B2F5E) for bar, ribbon and TV ground; pale card mount (#EEF1F4) with hairline-ruled swatch windows; status chips that are word + icon + pattern: DANGER solid red throbbing, CHECK amber hatched, OK green outline, NO SIGNAL dotted grey. Archivo throughout, tabular figures. No soft shadow cards.
STORY: Visitor sees the worst machine first and biggest, reads its status word from across a room, opens it, sees the 3D twin with the breaching part glowing, reads "This machine is showing X trend", what to check first, and since when.
FIRST VIEWPORT: Indigo top bar (wordmark, plant tabs, live clock, Floor view button); shade-card ribbon of one chip per machine, worst first; fleet grid of live 3D twins with the worst machine in a double tile spanning all rows; Needs attention feed in the right column. Primary action: click a twin tile to open the machine.
FORM: Shade Card (textile dye-house shade card), position 6 of 7 on the grounded list. seed:17496e3b47341409. Signature interaction: drag-to-rotate 3D twin whose breaching part glows and whose part pins follow the model; signature motion: DANGER chip throb + machine shake, run animation only while the backend says running.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
