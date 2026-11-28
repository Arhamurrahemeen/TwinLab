---
name: TwinLab
description: Predictive-maintenance dashboard and Android app where every machine is a swatch on the plant's shade card and only trouble is dyed.
colors:
  indigo: "#1B2F5E"
  indigo-2: "#243C73"
  indigo-ink: "#C9D4EA"
  card: "#EEF1F4"
  tile: "#F7F9FB"
  white: "#FFFFFF"
  rule: "#C6CFDB"
  rule-2: "#DCE2EA"
  ink: "#14203A"
  ink-2: "#55627A"
  danger: "#C8281E"
  danger-2: "#A51E16"
  check: "#E8A317"
  check-tint: "#F6E3B4"
  check-ink: "#7A5200"
  ok: "#2F8F5B"
  nosig: "#7A8591"
  focus: "#3D7BD9"
  selected: "#D6DEF0"
  lab-on-indigo: "#8FC3D4"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 800
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    fontFeature: "tnum"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.45
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.06em"
    fontFeature: "tnum"
  status:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  none: "0px"
  sm: "4px"
  pill: "28px"
spacing:
  hairline: "1px"
  xs: "6px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  gutter: "28px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "11px 18px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "{colors.indigo-2}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  button-outline-on-indigo:
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-danger:
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "10px 14px"
  tab:
    textColor: "{colors.indigo-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 14px"
  tab-active:
    backgroundColor: "{colors.white}"
    textColor: "{colors.indigo}"
  chip-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.white}"
    rounded: "{rounded.none}"
    typography: "{typography.status}"
  chip-check:
    backgroundColor: "{colors.check}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    typography: "{typography.status}"
  chip-ok:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ok}"
    rounded: "{rounded.none}"
    typography: "{typography.status}"
  chip-no-signal:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    typography: "{typography.status}"
  fleet-tile:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "14px 18px"
  fleet-tile-big:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.none}"
    padding: "20px 22px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 11px"
  top-bar:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.white}"
    height: "64px"
    padding: "0 28px"
---

# Design System: TwinLab

## Overview

**Creative North Star: "The Shade Card"**

A textile dye-house shade card: an indigo-dyed shell holds a pale card mount, and each machine is a swatch window cut into it. Undyed swatches are healthy; only trouble takes colour. The worst machine is mounted first and biggest. The system serves two readers who never share a screen: the maintenance head at a laptop or a wall TV in the control room, and the owner on a mid-range Android phone opening a push alert. Both must know which machine is in trouble in under a second, from across a room, without reading colour.

Density is operational, not decorative. Surfaces are flat panes separated by 1px hairline rules (the fleet grid draws its rules with a 1px gap over a `rule`-coloured ground), not by floating cards. The machine itself is the interface: every tile carries a live, drag-to-rotate 3D twin whose breaching part glows, and status is a word first, then an icon, a pattern and a colour.

Web (`frontend/src/index.css`) and Android (`ui/theme/Color.kt`) share the same hex tokens and the same face, Archivo. The status verdict is never computed in a client: `backend/health.py` returns `danger | check | ok | no_signal`, and both clients only draw it.

**Key Characteristics:**
- Indigo shell (top bar, ribbon, Floor view ground), pale card mount, white and tile panes.
- Status = word + icon + pattern + colour, never colour alone.
- Worst-first ordering everywhere: ribbon, fleet grid, Floor view.
- Square corners on content; 4px only on controls.
- Archivo throughout, tabular figures on by default.
- One live 3D twin per machine, glowing only on the breaching part.

## Colors

A cold, undyed indigo-and-paper palette in which saturated colour is reserved for machine status.

### Primary
- **Dye-Vat Indigo** (#1B2F5E): the shell. Top bar, shade-card ribbon ground, Floor view (TV) ground, primary buttons, modal and chat top borders, user chat bubbles, selection highlight.
- **Indigo Raised** (#243C73): hover state on anything sitting on indigo (tabs, primary buttons, outline buttons, chat FAB).
- **Indigo Mist** (#C9D4EA): secondary text on indigo (inactive tabs, live clock, TV subtitle).

### Status (the only dyed colours)
- **Alarm Red** (#C8281E) / **Deep Alarm** (#A51E16): DANGER. Solid chip fill, throbbing between the two. Also the twin's part glow, the danger pin, the danger trend border, field errors and the destructive button text.
- **Turmeric Amber** (#E8A317) with **Amber Tint** (#F6E3B4): CHECK. Always a 135deg hatch of the two, never a flat amber fill. **Amber Ink** (#7A5200) is reserved for amber-family text.
- **Mill Green** (#2F8F5B): OK. Outline and text only on white; green is never a fill.
- **Slate Grey** (#7A8591): NO SIGNAL. Dot pattern, dashed borders.

### Neutral
- **Card Mount** (#EEF1F4): page background; hover row fill; NO SIGNAL chip ground.
- **Swatch Tile** (#F7F9FB): fleet tiles at rest (turn white on hover).
- **White** (#FFFFFF): big tile, side panel, feed, modals, label windows inside patterned chips.
- **Hairline** (#C6CFDB) and **Fine Hairline** (#DCE2EA): grid rules, borders, dividers, input strokes.
- **Ink** (#14203A) and **Ink Soft** (#55627A): primary and secondary text.
- **Focus Blue** (#3D7BD9): focus ring and the selected-part glow on the twin; never a status.
- **Selected** (#D6DEF0): Android selected-container colour.
- **Lab Teal on Indigo** (#8FC3D4): the "Lab" half of the wordmark on indigo. The logo colours navy #1B395B and teal #2B768B stay in `Color.kt` for the wordmark only.

### Named Rules
**The Only-Trouble-Is-Dyed Rule.** Red, amber, green and grey are status, nothing else. No decorative use, no brand accent in a status hue; chrome stays indigo, ink and paper.

**The Never-Colour-Alone Rule.** Every status mark carries the word (DANGER, CHECK, OK, NO SIGNAL), its icon (bar-in-disc, warning triangle, tick, cross) and its pattern (solid, hatch, outline, dots). The ribbon chip on Android is the one place the word is dropped for width; icon and pattern remain.

**The Backend-Owns-Status Rule.** Clients never derive status from raw readings. `backend/health.py` is the single source; `RANK` (danger, check, no_signal, ok) only orders it.

## Typography

**Display Font:** Archivo (variable, wght 100–900, wdth 62–125%), self-hosted at `/fonts/archivo-latin*.woff2`; Android `R.font.archivo_variable`. Fallback `system-ui, sans-serif`.
**Body Font:** Archivo.

**Character:** One industrial grotesque for everything, heavy at the top (800) for distance reading and medium in body. `font-variant-numeric: tabular-nums` is set on `body` so live readings never jitter.

### Hierarchy
- **Display** (800, 40px, 1.1, -0.01em): the machine-detail headline reading; Floor view wordmark and clock. 30px at phone width.
- **Headline** (800, 28–34px): machine name on the detail stage (34px), big fleet tile (28px), TV tile (30px).
- **Title** (700, 16–22px): tile names (17px), readings (16px), feed heading (22px, 800), modal title (20px, 800).
- **Body** (500–600, 13–15px, 1.45–1.5): paragraphs capped at 62ch; secondary text in Ink Soft.
- **Label** (600–700, 11–12px, 0.06–0.08em): table column headers (uppercase), threshold column labels, the SIMULATED / REAL tag.
- **Status** (800, 0.02em, line-height 1): the chip word, sized by context: sm 11px, md 20px, lg 22px, xl clamp(34px, 4vw, 56px), tv clamp(28px, 2.6vw, 46px), xxl 52px.

### Named Rules
**The Across-The-Room Rule.** The status word is the largest type in its container. The worst machine's chip runs full-width at xl or xxl.

## Layout

The fleet view is a CSS grid `1.45fr 1fr 1fr minmax(300px, 330px)` with rows `minmax(240px, 1fr)` and a 1px gap over a Hairline ground, so tiles read as windows cut into one card. The worst machine takes the first column as a double tile spanning every row (`--rows`); the Needs-attention feed holds the last column. Above it, the shade-card ribbon is an indigo band of one chip per machine, worst first, columns `minmax(150px, 1fr)`, gap 10px. Machine detail is a `1.35fr 1fr` split: the 3D stage left, the reading/trend/sensor side panel right.

Horizontal gutter is 28px (16px at phone width); internal padding steps 6 / 10 / 14 / 18 / 22px. Breakpoints: at 1180px the fleet drops to two columns with the big tile and feed spanning full width and detail stacks; at 640px the fleet is one column, tabs and the Floor view button hide from the top bar, the summary grid goes two-up.

Floor view (TV) is the indigo ground with a `repeat(4, 1fr)` status summary and a `repeat(var(--cols), 1fr)` grid of white tiles, rows `minmax(300px, 1fr)`, gap 14px.

All web twins render into **one** fixed, full-viewport WebGL canvas (`.twin-canvas`, pointer-events none) that is scissored into each tile's rect (`frontend/src/twin/stage.js`). Never add a per-tile canvas.

## Elevation & Depth

Flat by default. Depth comes from tonal layering (indigo shell, Card Mount, Tile, White) and 1px rules, not from shadows; content tiles and panels carry none. Shadows exist only on things that float above the page.

### Shadow Vocabulary
- **Pin lift** (`box-shadow: 0 4px 12px rgba(20, 32, 58, .18)`): part label pins over the 3D twin.
- **Floating panel** (`box-shadow: 0 24px 60px rgba(14, 20, 36, .35)`): modals and the chat panel.
- **FAB** (`box-shadow: 0 10px 24px rgba(14, 20, 36, .3)`): the chat button.

### Named Rules
**The No-Soft-Card Rule.** Tiles, feed, side panel and chips never take a drop shadow. If it sits in the grid, it is flat.

## Shapes

Content is square: chips, tiles, ribbon swatches, trend boxes, pins and modals have no radius. Controls (buttons, tabs, inputs, small icon buttons) use a 4px radius. The chat FAB is the one pill (28px). Round shapes are reserved for indicator dots (the live pulse, typing dots).

Borders carry meaning: 2px solid on status chips and trend boxes (red, amber, or dashed grey by status), 1px Hairline on inputs and charts, a 6px indigo top border on modals and the chat panel. A dashed 1px outline marks the "add machine" tile.

## Components

### Status Chip (signature)
Word + icon + pattern + colour, 2px border, square, weight 800. Web `StatusChip` in `frontend/src/status.jsx`; Android `StatusChip` in `ui/common/StatusDot.kt`, same encoding.
- **DANGER:** solid Alarm Red, white text, throbs to Deep Alarm (1.6s web, 800ms reverse tween Android). Icon: bar in a translucent disc.
- **CHECK:** 135deg hatch of amber and amber tint (6px stripes), ink word in a white window. Icon: warning triangle.
- **OK:** white ground, green outline and green word. Icon: tick.
- **NO SIGNAL:** Card Mount with grey 8px dot grid, grey border, ink word in a white window. Icon: cross.
- **Zero variant** (`chip--zero`): transparent on indigo for zero-count summary cells.
- Throb stops under `prefers-reduced-motion` (web) and when animator scale is 0 (Android).

### 3D Twin (signature)
Procedural three.js models (`frontend/src/twin/models.js`, exported to .glb for both clients) for genset, compressor and a motor/pump fallback. Naming contract: `part_<name>` meshes (own materials per part so one can glow), `pin_<name>` empties for label pins, `spin_<name>` nodes driven by the `run` animation clip. The breaching part glows emissive red (pulsing) on DANGER or amber on CHECK; the selected part glows Focus Blue; the machine shakes on DANGER; the run clip plays only while the backend reports the machine running. Drag to rotate on detail. Android renders the same .glb through Filament (`ui/twin/Twin3D.kt`) with one shared engine.

### Part Pins
White label, 2px ink border, 700 13px, with a 22px stem, projected to follow `pin_` nodes. Danger pins fill red; check pins take the hatch; no-signal pins go dashed grey; the selected pin gets the 3px focus outline.

### Buttons
- **Shape:** gently squared (4px).
- **Primary:** Dye-Vat Indigo, white 700 15px, 11px 18px; hover Indigo Raised; disabled at 55% opacity.
- **Secondary (`btn-s`):** white, 1px Hairline, 600 13px; hover border goes Ink Soft.
- **Outline on indigo (`btn-o`):** 1px #8FA3CC border, white text; hover Indigo Raised fill.
- **Danger:** red text, transparent border that turns red on hover/focus.
- **Focus:** 3px Focus Blue outline, 2px offset, global.

### Navigation
Indigo top bar, 64px: wordmark (800 24px, "Lab" in Lab Teal), plant tabs (600 15px, Indigo Mist; hover Indigo Raised; active is a white tab with indigo text, `aria-pressed`), a live indicator (green pulsing dot, red when offline) and the Floor view button. Android uses the same indigo bar via `TwinLabTopBar`.

### Fleet Tiles
Square Tile panes, 14px 18px padding, turning white on hover. Name 700 17px, one reading line, SIMULATED/REAL tag top-right (REAL in indigo). The worst-machine tile is white, 20px 22px, 28px name, 30px reading, xl chip.

### Trend Card
2px border coloured by status (dashed grey for no signal), bold 19px trend title, 15px explanation at 62ch, and a flat list of checks on Card Mount chips.

### Inputs
White, 1px Hairline, 4px radius, 9px 11px; focus is a 2px Focus Blue outline with matching border. Errors in Alarm Red 600.

## Do's and Don'ts

### Do:
- **Do** take every status from `backend/health.py` and draw it with `StatusChip`; add the word, icon and pattern, not just a colour.
- **Do** order machines worst first (danger, check, no_signal, ok) in every list, ribbon and grid.
- **Do** use the shared hex tokens; a new colour goes into both `index.css` and `Color.kt`.
- **Do** separate panes with 1px rules over a Hairline ground.
- **Do** follow the `part_` / `pin_` / `spin_` / `run` naming contract for any new machine model.
- **Do** render new web twins through the shared scissored canvas in `stage.js`.

### Don't:
- **Don't** use red, amber, green or grey for anything that is not machine status.
- **Don't** fill with flat amber or flat green; CHECK is hatched, OK is outlined.
- **Don't** put drop shadows on tiles, panels or chips; shadows are for floating layers only.
- **Don't** round content corners; 4px is for controls.
- **Don't** compute or override status in a client.
- **Don't** present simulated data without its SIMULATED tag.
