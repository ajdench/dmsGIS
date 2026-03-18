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

## Version control workflow

- Use `jj` for local checkpointing in this repo.
- Create a local JJ commit after every logical/completed change so work is not left only in the working copy.
- Do not push or create the Git/GitHub-facing commit flow unless the user explicitly asks, for example with `Commit to Git`.
- Before any user-requested Git commit/push flow, update project documentation and local memory with relevant completed changes first (`AGENTS.md`, `README.md`, and local Codex memory when applicable).
- When the user explicitly asks to commit to Git, treat that as: update docs/memory first, ensure the colocated JJ/Git state is aligned, then complete the Git workflow and any requested GitHub Pages-related push/deploy step.

## Current implementation notes

- GitHub Pages target: Vite `base` defaults to `/dmsGIS/` and can be overridden via `VITE_BASE_PATH`.
- Version control: `jj` (Jujutsu) is installed and this repo is initialized as a colocated Git/JJ repo; `git` and `jj` operate on the same repository, and `main` is tracked against `main@origin`.
- Layer manifest: fetches `data/manifests/layers.manifest.json`, validated as `{ layers: [...] }`; manifest paths must be relative (no leading slash) and are resolved against `import.meta.env.BASE_URL`.
- Map core: OpenLayers map is mounted in `src/features/map/MapWorkspace.tsx` with local Natural Earth basemap fixed to `localDetailed` at `10m` detail.
- Basemap data is local under `public/data/basemaps/` (no runtime internet requirement for basemap rendering).
- Basemap controls: source and detail-level dropdowns are removed from UI; only style/visibility controls remain.
- Basemap data scope: `50m` basemap assets were removed from runtime usage and from `public/data/basemaps/`; `10m` is the active operational dataset.
- Basemap performance behavior:
  - `Sea labels` and `Major cities` vector sources are lazy-loaded only when those toggles are enabled.
  - Label datasets now use lighter `110m` files (`ne_110m_geography_marine_polys.geojson`, `ne_110m_populated_places_simple.geojson`) to reduce startup payload and parse cost.
  - Legacy heavy `10m` label datasets (`ne_10m_geography_marine_polys.geojson`, `ne_10m_populated_places.geojson`) were removed from `public/data/basemaps/`.
- Facilities dataset is sourced from `public/data/facilities/facilities.geojson` (derived from `facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg`) with per-feature defaults (`default_visible`, `point_color_hex`, `point_alpha`).
- Layout model: workspace now uses map + right sidebar (left sidebar removed).
- Right sidebar pane order is: Basemap, Facilities, Labels, Overlays.
- Right sidebar now also surfaces runtime layer loading/error status above the pane stack.
- Facilities pane contains an embedded PMC collapsible sub-pane plus a compact `Search facilities...` input at the bottom.
- Overlays pane now lists boundary datasets (not facility-region rows) with popovers per item.
- Current Overlays items in `Current` mode are:
  - `PMC populated care board boundaries` (`UK_Active_Components_Codex_v10_geojson.geojson`)
  - `PMC unpopulated care board boundaries` (`UK_Inactive_Remainder_Codex_v10_geojson.geojson`)
  - `Care board boundaries` (`UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`)
- View presets are `Current`, `COA 3a`, `COA 3b`, and `COA 3c`.
- `COA 3a`, `COA 3b`, and `COA 3c` keep PMC points active on the map but currently show an empty `Overlays` pane.
- `COA 3a` swaps the selectable boundary layer to `ICB / Health Board boundaries` using `public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`.
- `COA 3a` uses the board polygons themselves as the overlay, with JMC colors applied by board assignment (`jmc_name`) and the same thin grey board outlines used for the Current-mode board layer.
- `COA 3a` board polygons use a precomputed `is_populated` property in `public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`: the current COA hue is the unpopulated tone, and populated boards use a darker version of that same hue.
- Groups model remains PMC-first for the embedded Facilities sub-pane: a bold collapsible `PMC` section with a header display element that opens popover controls.
- PMC popover controls currently include: visible, border color, border opacity, global opacity, symbol shape (`circle|square|diamond|triangle`), symbol size.
- Region rows remain individually configurable via popovers: visible, fill color, symbol size, fill opacity, border on/off, border color, border opacity.
- Region ordering in the embedded PMC facility list is fixed to: Scotland & Northern Ireland; North; Wales & West Midlands; East; South West; Central & Wessex; London & South.
- Global opacity behavior is broadcast-style: changing PMC global opacity sets all region opacities in unison; individual region opacity can then be adjusted independently until global is changed again.
- Facility map symbol rendering now uses global shape controls plus per-region fill/border/size style values.
- Size behavior is dual-scope:
  - Global PMC size changes apply to all regions.
  - Region popover size changes apply locally to the selected region only.
- Care board map interaction: clicking inside a visible `Care board boundaries` polygon highlights that boundary in yellow and shows the boundary name in the docked map tooltip.
- `COA 3a` boundary interaction reuses the same selectable boundary path as `Care board boundaries`; the displayed board name still resolves from `boundary_name`, while the polygon fill color comes from the assigned JMC region.
- Point map interaction (PMC facilities):
  - Clicking a point opens a docked tooltip in the top-right of the map pane.
  - Tooltip content order is: facility name; pager row (`< Page n of y >`); boundary name.
  - Pager is shown for point mode (including `Page 1 of 1`) and hidden for boundary-only mode.
  - Boundary name and boundary highlight for point selection are resolved from the point geometry coordinate (data-driven), not from raw click position.
  - Boundary-only clicks show boundary name only (no pager controls).
  - Point selection highlight is luminous yellow (`#fffb00`) and is drawn outside the symbol edge with border-aware offset.
  - Point paging groups only facilities that visually overlap or nearly overlap at the current zoom, and the nearest clicked facility is always `Page 1`.
  - Overlap grouping is computed in screen space and responds dynamically to zoom level plus current symbol size/shape.
- Layer order is explicit: point symbols and point selection highlight render above care-board boundary layers/highlights.
- Boundary overlay z-order is explicit: PMC unpopulated below PMC populated, both below care board boundaries.
- Map click handling is unified into a single `singleclick` flow (point-first, boundary fallback) to avoid duplicate hit detection/event-path overhead.
- Region boundary performance behavior: boundary `VectorSource` instances are stable and only re-created when a layer path changes; style/visibility updates no longer reset sources.
- Style performance behavior: basemap label styles and region boundary styles use per-function caches to reduce per-feature style object allocation during render.
- Basemap seam handling: land/sea fill styles include same-color `1px` stroke to hide anti-aliased join seams.
- Current defaults:
  - PMC global symbol size `3.5`
  - PMC populated care board boundaries default opacity `30%`
  - PMC populated/unpopulated care board boundary border defaults match (`#ffffff` at `0%`)
  - Region/facility defaults are color-only (internal alpha values ignored at load/render defaults)
  - Border opacity defaults to `0` for region-style layers unless explicitly set
  - Basemap visibility defaults: Land labels off, Major cities off, Sea labels off
- Layer UI: standalone `LayerPanel` is currently removed from rendered sidebar layout.
- Legacy `LeftSidebar` and standalone `FacilitySearchPanel` components are removed from the current implementation.
- Shared slider UI is centralized in `src/components/controls/SliderField.tsx` and used across Groups/Basemap/Overlays with synced slider + numeric input + in-box +/- controls.
- Global visual tokens are centralized in `src/styles/global.css` (`:root` CSS variables for spacing, sizing, typography, colors, radius, shadows, popover/control dimensions).
- Current UI baseline for restart:
- Global rhythm target is `0.75rem` between pane/sub-pane elements via tokens in `src/styles/global.css`.
- Right sidebar grey container width is derived from the top-bar `Open` to `Reset` button span plus `0.75rem` side padding on each side; internal white panes should sit flush to those gutters rather than centered in extra space.
- Right sidebar outer grey pane remains fixed-width; the map pane absorbs width loss first.
- The app now uses a minimum layout width plus horizontal overflow instead of stacking the right sidebar below the map or wrapping the top-bar action buttons.
- Canvas/pane colors are tokenized (`--canvas-bg` lighter, `--pane-bg` darker) and applied to body vs pane containers.
- Pane radii use default radius token; map pane container also uses default radius token.
- Groups: only `PMC` title remains bold; non-title labels are regular weight.
- Placeholder helper text should be small (`var(--font-size-small)`) and without trailing full stops.
- Facility search input uses compact control height (`.input--compact`) to match Basemap dropdown display height.
- Color inputs inside popovers (`.color-input--popover`) use bordered rounded style with inner swatch radius control.
- Native browser number spinner controls are disabled in slider numeric inputs; only custom +/- controls are shown.
- CSS: global styles imported through `src/main.tsx` (no direct link in `index.html`).
- Playwright: `playwright.config.ts` boots Vite on port `4180`; e2e checks app shell visibility via role-based locators.
- Tests: `tests/appStore.test.ts` covers PMC global opacity broadcast, global size propagation with per-region override, and boundary layer opacity clamping.

## Next steps

1. Extract point selection, overlap grouping, tooltip paging, and boundary-resolution logic out of `src/features/map/MapWorkspace.tsx` into smaller focused units; this is the highest-risk interaction area and the biggest source of recent regressions.
2. Add direct tests for map interaction behavior: nearest clicked facility is `Page 1`, only visually overlapping points page together at the current zoom, and point grouping responds correctly to symbol size/shape changes.
3. Centralise view preset definitions so preset IDs, labels, ordering, and state behavior are driven from one source instead of being split across sidebar UI and store logic.
4. Split `GroupPanel` responsibilities so PMC controls and Overlays controls are no longer handled by the same component.
5. Add explicit tests for region styling logic (PMC global broadcast opacity, border controls, shape/size controls, default visibility behavior).
6. Decide whether region style choices should persist across reloads (local storage and/or serverless write-back).
7. Continue UI cleanup pass to eliminate any remaining compounded spacing rules in Groups/Popover areas if visual inconsistency remains.
8. Future basemap task: if multi-scale basemap is needed again, reintroduce additional preprocessed scales with explicit product sign-off (current runtime is fixed to `10m`).
9. Keep working areas separated: app UI work vs geodata preprocessing; avoid cross-threading changes when user flags wrong development area.
10. When deploying to a different subpath, set `VITE_BASE_PATH` accordingly.

## Forbidden shortcuts

- Do not embed secrets in frontend code.
- Do not collapse typed models into `any`.
- Do not bypass schemas when reading or writing persisted configs.
