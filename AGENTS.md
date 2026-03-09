# AGENTS.md

## Project identity

This repository contains a static-first geospatial web app for UK facility mapping and saved map configurations.

The application is not a full GIS editor. It consumes prepared geospatial datasets and provides an operational GUI for layer control, facility grouping, label adjustment, configuration persistence, and export.

## Rules

1. Use React + TypeScript + Vite.
2. Use OpenLayers as the primary mapping engine.
3. Keep the frontend GitHub Pages compatible.
4. Treat write-back as serverless-assisted.
5. Keep geospatial preprocessing out of runtime where possible.
6. Use TypeScript everywhere in app code.
7. Prefer small files and focused functions.
8. Do not put business logic inside presentation components.
9. Centralise schemas in `src/lib/schemas/`.
10. Add or update tests for non-trivial logic.

## Current implementation notes

- GitHub Pages target: Vite `base` defaults to `/dmsGIS/` and can be overridden via `VITE_BASE_PATH`.
- Layer manifest: fetches `data/manifests/layers.manifest.json`, validated as `{ layers: [...] }`; manifest paths must be relative (no leading slash) and are resolved against `import.meta.env.BASE_URL`.
- Map core: OpenLayers map is mounted in `src/features/map/MapWorkspace.tsx` with local Natural Earth basemap fixed to `localDetailed` at `10m` detail.
- Basemap data is local under `public/data/basemaps/` (no runtime internet requirement for basemap rendering).
- Basemap controls: source and detail-level dropdowns are removed from UI; only style/visibility controls remain.
- Basemap data scope: `50m` basemap assets were removed from runtime usage and from `public/data/basemaps/`; `10m` is the active operational dataset.
- Facilities dataset is sourced from `public/data/facilities/facilities.geojson` (derived from `facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg`) with per-feature defaults (`default_visible`, `point_color_hex`, `point_alpha`).
- Layout model: workspace now uses map + right sidebar (left sidebar removed).
- Right sidebar pane order is: Basemap, Facilities, Labels, Layers.
- Facilities pane contains an embedded PMC collapsible sub-pane plus a compact `Search facilities...` input at the bottom.
- Layers pane now lists boundary datasets (not facility-region rows) with popovers per item.
- Current Layers items are:
  - `PMC populated care board boundaries` (`UK_Active_Components_Codex_v10_geojson.geojson`)
  - `PMC unpopulated care board boundaries` (`UK_Inactive_Remainder_Codex_v10_geojson.geojson`)
  - `Care board boundaries` (`UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`)
- Groups model remains PMC-first for the embedded Facilities sub-pane: a bold collapsible `PMC` section with a header display element that opens popover controls.
- PMC popover controls currently include: visible, border color, border opacity, global opacity, symbol shape (`circle|square|diamond|triangle`), symbol size.
- Region rows remain individually configurable via popovers: visible, fill color, fill opacity, border on/off, border color, border opacity.
- Region ordering in the embedded PMC facility list is fixed to: Scotland & Northern Ireland; North; Wales & West Midlands; East; South West; Central & Wessex; London & South.
- Global opacity behavior is broadcast-style: changing PMC global opacity sets all region opacities in unison; individual region opacity can then be adjusted independently until global is changed again.
- Facility map symbol rendering now uses global shape/size controls plus per-region fill/border style values.
- Care board map interaction: clicking inside a visible `Care board boundaries` polygon highlights that boundary in yellow and shows a tooltip with its boundary name.
- Current defaults:
  - PMC global symbol size `3.5`
  - Region/facility defaults are color-only (internal alpha values ignored at load/render defaults)
  - Border opacity defaults to `0` for region-style layers unless explicitly set
  - Basemap visibility defaults: Land labels off, Major cities off, Sea labels off
- Layer UI: standalone `LayerPanel` is currently removed from rendered sidebar layout.
- Shared slider UI is centralized in `src/components/controls/SliderField.tsx` and used across Groups/Basemap/Layers with synced slider + numeric input + in-box +/- controls.
- Global visual tokens are centralized in `src/styles/global.css` (`:root` CSS variables for spacing, sizing, typography, colors, radius, shadows, popover/control dimensions).
- Current UI baseline for restart:
- Global rhythm target is `0.75rem` between pane/sub-pane elements via tokens in `src/styles/global.css`.
- Canvas/pane colors are tokenized (`--canvas-bg` lighter, `--pane-bg` darker) and applied to body vs pane containers.
- Pane radii use default radius token; map pane container also uses default radius token.
- Groups: only `PMC` title remains bold; non-title labels are regular weight.
- Placeholder helper text should be small (`var(--font-size-small)`) and without trailing full stops.
- Facility search input uses compact control height (`.input--compact`) to match Basemap dropdown display height.
- Color inputs inside popovers (`.color-input--popover`) use bordered rounded style with inner swatch radius control.
- Native browser number spinner controls are disabled in slider numeric inputs; only custom +/- controls are shown.
- CSS: global styles imported through `src/main.tsx` (no direct link in `index.html`).
- Playwright: `playwright.config.ts` boots Vite on port `4180`; e2e checks app shell visibility via role-based locators.

## Next steps

1. Future basemap task: if multi-scale basemap is needed again, reintroduce additional preprocessed scales with explicit product sign-off (current runtime is fixed to `10m`).
2. Add explicit tests for region styling logic (PMC global broadcast opacity, border controls, shape/size controls, default visibility behavior).
3. Decide whether region style choices should persist across reloads (local storage and/or serverless write-back).
4. Keep working areas separated: app UI work vs geodata preprocessing; avoid cross-threading changes when user flags wrong development area.
5. Continue UI cleanup pass to eliminate any remaining compounded spacing rules in Groups/Popover areas if visual inconsistency remains.
6. When deploying to a different subpath, set `VITE_BASE_PATH` accordingly.

## Forbidden shortcuts

- Do not embed secrets in frontend code.
- Do not collapse typed models into `any`.
- Do not bypass schemas when reading or writing persisted configs.
