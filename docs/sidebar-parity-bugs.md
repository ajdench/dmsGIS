# Sidebar Parity Bugs

This note records small but real production-sidebar parity issues that should not be lost while larger replacement work continues.

It is not the replacement plan.
It is not the prototype audit.
It is a lightweight tracker for concrete parity bugs that should be revisited later.

## Resolved items

### 1. Pane-level toggle column drift vs child row toggles

Status:
- resolved

Problem:
- pane-level toggle buttons (Basemap, Facilities, Labels, Overlays) were landing ~1px to the right of child row toggles (Land, Sea, PMC region rows, etc.)
- caused by `--prototype-pane-toggle-alignment-compensation` being set to 3px

Fix:
- `--prototype-pane-toggle-alignment-compensation` bumped from `3px` to `4px` in `src/styles/global.css` and `src/prototypes/sidebarPrototype/prototype.css`
- this shifts all pane-level toggle slots 1px left, landing them on the same column as child row toggles
- confirmed correct by inspector: pane toggle left = child toggle left ✓

### 2. Chevron SVG centering in trailing-control slot

Status:
- resolved

Problem:
- the chevron SVG (`--prototype-disclosure-font-size`, 14.72px) is wider than the trailing-control slot (`--prototype-drag-handle-width`, 11.52px)
- constraining the SVG to slot width made it visually too small
- relying on `justify-content: center` was unreliable when the SVG contributed to grid column sizing

Fix:
- `position: relative; overflow: visible` on the inline disclosure button
- `position: absolute; left: calc(50% + 1px); top: 50%; transform: translate(-50%, -50%)` on the chevron SVG
- the `+1px` is an optical correction for the chevron's slight leftward visual weight bias
- open-state override: `transform: translate(-50%, -50%) rotate(180deg)`
- applied across all four CSS layers: `sidebarExact.css`, `prototype.css`, `global.css`, `sidebarReplacement.css`

### 3. Section-card bar drag handle over-compensation

Status:
- resolved

Problem:
- `.prototype-section-card__bar .prototype-accordion-item__meta` had `margin-right: calc(-1 * var(--prototype-subpane-border-compensation))` — a 1px rightward bleed that misaligned section-card handles vs region-row handles

Fix:
- compensation rule removed from all four CSS layers
- section-card bar handles now flush with the same right column as region-row handles

### 4. Topbar vertical padding mismatch

Status:
- resolved

Problem:
- `.topbar` had `min-height: 72px` with `align-items: center` and 12px padding on all sides
- button content is 34px tall; centering created ~19px visual top/bottom space vs 12px left/right
- padding appeared unequal visually

Fix:
- removed `min-height: var(--topbar-height)` from `.topbar` in `src/styles/global.css`
- updated `--topbar-height` token from `72px` to `58px` (natural height: 34px content + 2 × 12px padding)
- topbar now sizes to content + padding, resulting in equal ~12px visual margins on all sides
- sidebar max-height calculation updated to match new topbar baseline

### 5. Toggle/pill text vertical centering (cross-browser)

Status:
- resolved

Problem:
- toggle labels used `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) translateY(offset)` — fragile across browser engines
- `--prototype-compact-text-offset-y: 1.5px` was a subpixel value; Safari/Chrome/Edge rounded it differently, causing visible drift
- pill value spans had the same `translateY` offset, pushing `nnn%` text below centre

Fix:
- toggle button containers: `display: inline-flex` → `display: inline-grid`
- both label spans: `grid-area: 1/1; place-self: center` (grid-stack replaces absolute positioning)
- optical nudge reinstated as `translateY(1px)` (whole pixel — rounds identically in all engines)
- `--prototype-compact-text-offset-y` changed from `1.5px` → `1px`
- pill value spans: same `translateY(1px)` optical correction applied
- applied across all four CSS layers: `sidebarExact.css`, `prototype.css`, `global.css`, `sidebarReplacement.css`

### 6. Swatch hide-when-off behaviour (sunsetted)

Status:
- sunsetted

Problem:
- `labelPanelFields.ts` and `pmcPanelFields.ts` both set `swatch.opacity = 0` when a row was Off
- this made the colour dot invisible in the pill when a layer was disabled
- intent was to signal inactivity, but in practice the colour dot is most useful when Off (aids re-identification)
- the behaviour was inconsistent: not applied to Basemap, Overlays, or pane-level rows

Decision:
- behaviour sunsetted (not deleted) — preserved as a named, re-activatable pattern
- extracted to `src/lib/sidebar/swatchVisibility.ts` as `resolvePillSwatchOpacity(opacity, visible)`
- global kill-switch: `HIDE_SWATCH_WHEN_OFF = false` in that file
- per-call override available as third argument for future selective use
- both call sites updated to use the helper; inline ternary removed
