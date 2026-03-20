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

## Internal architecture principles

Apply these principles to future development in this repo:

1. Keep a stable production spine.
   Typed domain models, schemas, store contracts, runtime map seams, and shared config are the source of truth.
2. Put meaning in domain modules, not presentation components.
   UI components should render and dispatch; business meaning belongs in `src/lib/` and focused feature helpers.
3. Keep large components orchestration-focused.
   Extract bounded responsibilities into testable helpers, but stop extracting once the parent reads mainly as orchestration.
4. Prefer config/data over runtime special cases.
   New overlays, scenarios, and similar behavior should slot in through shared config and prepared data where possible.
5. Keep production and prototype intentionally separate.
   Prototype code explores interaction and visuals; production code carries runtime correctness and maintainability.
6. Promote by pattern, not by copy.
   When a prototype idea is approved, rebuild it on top of production state/contracts rather than copying prototype code wholesale.
7. Put persistence behind explicit versioned boundaries.
   Saved, restored, or shared state should always flow through schemas and storage/service interfaces.
8. Prefer typed state objects over scattered scalar fields when a feature grows.
   The facility-filter model is the pattern to follow.
9. Promote shared primitives/tokens only when they are truly shared and stable.
10. Validate against actual release risk.
   `npm run build` remains the release gate.
11. Add tests at the seam where behavior is introduced or extracted.
12. Prefer progressive promotion over broad rewrites.

Working stance:

- improve the shipped production app before expanding future-facing capability areas
- keep future functionality areas documented, but do not let them displace current production improvement work unless explicitly prioritized
- keep prototype exploration active but isolated until promotion is explicit

## Version control workflow

- Use `jj` for local checkpointing in this repo.
- Create a local JJ commit after every logical/completed change so work is not left only in the working copy.
- Do not push or create the Git/GitHub-facing commit flow unless the user explicitly asks, for example with `Commit to Git`.
- Before any user-requested Git commit/push flow, update project documentation and local memory with relevant completed changes first (`AGENTS.md`, `README.md`, and local Codex memory when applicable).
- When the user explicitly asks to commit to Git, treat that as: update docs/memory first, ensure the colocated JJ/Git state is aligned, then complete the Git workflow and any requested GitHub Pages-related push/deploy step.

## Prototype workflow

- Parallel UI prototype work may exist in this repo as a separate development activity.
- Prototype work is intentionally isolated and should not be treated as production code unless explicitly promoted.
- Current prototype pattern:
  - dedicated HTML entry such as `sidebar-prototype.html`
  - isolated React entry under `src/prototypes/`
  - mock data and local component state
  - no dependency on the production OpenLayers map pane
  - no dependency on the production Zustand store unless explicitly stated
- The production app path remains the source of truth:
  - `index.html`
  - `src/main.tsx`
  - `src/app/App.tsx`
- If prototype files exist under `src/prototypes/`, treat them as intentional parallel work, not dead code.
- Do not fold prototype code into the main app unless explicitly asked.
- Do not remove, refactor, or clean up prototype files just because they are not used by the main app.
- Do not assume prototype behavior should match production wiring yet.
- When changing the main app, avoid coupling to prototype-only components or styles.
- When discussing future UI work, keep production recommendations separate from prototype recommendations unless the user explicitly asks to promote prototype work.
- The current sidebar prototype uses a prototype-local top bar shell, Radix accordion primitives for pane expansion, and a custom floating PMC row editor/callout driven by local state.
- When prototype interaction math becomes non-trivial, extract it into a dedicated helper/hook and add focused tests before treating the area as stable.

## Current implementation notes

- GitHub Pages target: Vite `base` defaults to `/dmsGIS/` and can be overridden via `VITE_BASE_PATH`.
- Version control: `jj` (Jujutsu) is installed and this repo is initialized as a colocated Git/JJ repo; `git` and `jj` operate on the same repository, and `main` is tracked against `main@origin`.
- Layer manifest: fetches `data/manifests/layers.manifest.json`, validated as `{ layers: [...] }`; manifest paths must be relative (no leading slash) and are resolved against `import.meta.env.BASE_URL`.
- Map core: OpenLayers map is mounted in `src/features/map/MapWorkspace.tsx` with local Natural Earth basemap fixed to `localDetailed` at `10m` detail.
- Architecture direction:
  - treat overlay families as distinct products: ICB/HB boundaries, JMC regions, future NHS regions, and future scenario regions should be independently addressable overlay types rather than folded into one ad hoc preset path
  - treat scenario region assignment as data/config, not hard-coded map logic
  - prefer preprocessing and scenario metadata tables over runtime geometry inference where possible
  - keep facility metadata extensible so new attributes can be added without reworking map interaction code
  - keep saved-state contracts explicit and versioned before choosing storage/auth implementations
  - keep deployment static-first so the built frontend can be served from a minimal Docker image with all dependencies compiled at build time
  - leave a clean upgrade path from static hosting to authenticated profile/state services without rewriting the frontend architecture
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
- The Facilities search input is now wired to production state and filters visible/selectable PMC facilities through the shared facility record model (`FacilityRecord.searchText`), not just local input state.
- Overlays pane now lists boundary datasets (not facility-region rows) with popovers per item.
- Visible preset labels, dataset paths, scenario region groupings, palette values, and boundary overrides are now centralized in `src/lib/config/viewPresets.json` with runtime helpers in `src/lib/config/viewPresets.ts`.
- Scenario assignment names and codes are now part of the shared config model: `src/lib/config/scenarioAssignments.ts` resolves scenario region names/codes from the preset config, and the COA board-generation scripts consume the same assignment metadata instead of hard-coded code rules.
- Overlay family metadata now exists on the canonical production overlay model (`overlayLayers` in the store; `OverlayLayerStyle` / `RegionBoundaryLayerStyle` in types) with `boardBoundaries`, `scenarioRegions`, future `nhsRegions`, and future `customRegions`.
- Facility properties now have a schema layer in `src/lib/schemas/facilities.ts`, with `src/lib/facilities.ts` providing normalized facility records and feature-property access for current runtime consumers.
- Facility filter state now has an explicit schema in `src/lib/schemas/facilities.ts`, and `src/lib/facilityFilters.ts` owns production filter definitions/matching so future metadata facets can reuse the same typed facility-filter path.
- The active production facility filter path is currently search-only; if metadata facets return later, they should plug back into the same shared typed contract rather than a parallel UI-only state path.
- Saved-state schemas and helpers now live in `src/lib/schemas/savedViews.ts` and `src/lib/savedViews.ts`.
  - `MapSessionState` captures the runtime map/session snapshot
  - `NamedSavedView` adds repository-facing saved-view metadata
  - `UserSavedView` adds ownership
  - `ShareableSavedView` adds share policy
  - the model is schema-versioned now, but storage/auth implementation is intentionally still separate
- A local browser-backed saved-view storage boundary now exists in `src/lib/services/savedViewStore.ts`, with schema-backed list/save/get/delete helpers routed through `src/lib/browser/savedViewActions.ts`.
- The production `TopBar` now opens an in-app saved-views dialog (`src/components/layout/SavedViewsDialog.tsx`) for local save/open/delete flows instead of using browser prompts.
- Store snapshot/apply support now exists for saved views: production state includes saved-view dialog mode, map viewport state, current selection state, and schema-backed map-session snapshot/apply helpers in `src/store/appStore.ts`.
- Current Overlays items in `Current` mode are:
  - `PMC populated care board boundaries` (`UK_Active_Components_Codex_v10_geojson.geojson`)
  - `PMC unpopulated care board boundaries` (`UK_Inactive_Remainder_Codex_v10_geojson.geojson`)
  - `Care board boundaries` (`UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`)
- Visible preset labels are `Current`, `SJC JMC`, `COA 3a`, and `COA 3b`; the internal preset ids remain `current`, `coa3a`, `coa3b`, and `coa3c`.
- `SJC JMC`, `COA 3a`, and `COA 3b` keep PMC points active on the map but currently show an empty `Overlays` pane.
- `SJC JMC` uses `public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson` as the selectable `ICB / Health Board boundaries` layer and uses JMC region-derived fill styling on the board polygons themselves.
- `COA 3a` uses `public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson` plus `public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson`.
- `COA 3b` uses `public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson` plus `public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson`.
- Scenario board polygons are the rendered overlay in `SJC JMC`, `COA 3a`, and `COA 3b`; the outer region boundary overlay is off by default and is used mainly for selected region highlighting.
- Scenario board polygons use precomputed assignment metadata (`jmc_name`, `jmc_code`, `is_populated`) rather than runtime facility-in-polygon calculation.
- `COA 3b` introduces `COA 3b London and East`, which groups the London District boards with `NHS Norfolk and Suffolk Integrated Care Board`, `NHS Central East Integrated Care Board`, and `NHS Essex Integrated Care Board`.
- Production sidebar panel responsibilities are now split:
  - `src/features/groups/PmcPanel.tsx` owns the embedded Facilities/PMC controls
  - `src/features/groups/OverlayPanel.tsx` owns the right-sidebar Overlays pane
  - `src/features/groups/overlaySelectors.ts` owns overlay-family metadata, helpers, and section builders for production UI filtering
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
- Scenario boundary interaction reuses the same selectable boundary path as `Care board boundaries`; the displayed board name still resolves from `boundary_name`, while the polygon fill color comes from the assigned scenario region.
- Point map interaction (PMC facilities):
  - Clicking a point opens a docked tooltip in the top-right of the map pane.
  - Tooltip content order is: facility name; pager row (`< Page n of y >`); boundary name.
  - Pager is shown for point mode (including `Page 1 of 1`) and hidden for boundary-only mode.
  - Boundary name and boundary highlight for point selection are resolved from the point geometry coordinate (data-driven), not from raw click position.
  - Boundary-only clicks show boundary name only (no pager controls).
  - Point selection highlight is luminous yellow (`#fffb00`) and is drawn outside the symbol edge with border-aware offset.
  - Point paging groups only facilities that visually overlap or nearly overlap at the current zoom, and the nearest clicked facility is always `Page 1`.
  - Overlap grouping is computed in screen space and responds dynamically to zoom level plus current symbol size/shape.
  - Point hit detection, overlap grouping, point coordinate parsing, and tooltip-entry assembly are now extracted into `src/features/map/pointSelection.ts` instead of living only inside `MapWorkspace.tsx`.
  - Boundary-name resolution, selected-boundary JMC resolution, and selected-region outline feature resolution are now extracted into `src/features/map/boundarySelection.ts`.
  - Docked tooltip rendering/state synchronization now routes through `src/features/map/tooltipController.ts` instead of being fully inlined in `MapWorkspace.tsx`.
  - Point-first vs boundary-fallback click orchestration now routes through `src/features/map/singleClickSelection.ts`.
  - Selected point, selected boundary, and selected JMC outline highlight synchronization now routes through `src/features/map/selectionHighlights.ts`.
  - Lookup-source selection now routes through `src/features/map/lookupSources.ts`.
  - Overlay lookup/assignment dataset bootstrapping now routes through `src/features/map/overlayLookupBootstrap.ts`.
  - Map shell setup/teardown now routes through `src/features/map/mapWorkspaceLifecycle.ts`.
  - Viewport apply/read synchronization now routes through `src/features/map/viewportSync.ts`.
  - Runtime layer reconciliation now routes through `src/features/map/runtimeLayerReconciliation.ts`.
  - Overlay boundary-layer reconciliation now routes through `src/features/map/overlayBoundaryReconciliation.ts`.
  - Boundary-layer styling now routes through `src/features/map/boundaryLayerStyles.ts`.
  - Facility-layer styling now routes through `src/features/map/facilityLayerStyles.ts`.
  - Shared point-symbol/color helpers now route through `src/features/map/mapStyleUtils.ts`.
  - Activating a different production preset now clears the transient live selection state before the new preset view is shown.
  - Production interaction coverage now also includes boundary-only tooltip hiding/reset behavior, scenario outline resolution, and filtered overlapping-point selection paths.
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
- Tests also cover shared preset config, extracted point/boundary/tooltip modules, overlay-family classification for current vs scenario boundary layers, the saved-view domain contract, local saved-view storage, and saved-view action helpers.

## Next steps

1. Treat the current `MapWorkspace` hardening/modularization pass as complete unless a new bounded hotspot appears.
2. Keep future overlay lookup products generic.
   JMC is just the first overlay-lookup example. New NHS/custom overlay families should plug into the same metadata and bootstrap path rather than introducing a JMC-specific runtime fork.
3. Keep the production facility filter path simple unless a real workflow needs more.
   Search is the current active production filter surface. If metadata facets return later, they should reuse the same typed contract rather than reintroducing ad hoc UI state.
4. Extend saved-view storage beyond local browser storage only after the production map/runtime seams are stable.
   Keep `SavedViewStore` as the boundary, keep schema validation mandatory, and add remote implementations behind the same contract later.
5. Add a production Docker path once the current map/runtime hardening phase is complete.
6. Keep working areas separated: production app vs prototype sidebar vs geodata preprocessing.
7. When deploying to a different subpath, set `VITE_BASE_PATH` accordingly.

## Future functionality areas

Functional areas:

- facility-filter usability and saved-filter behavior
- richer saved-view management and future remote storage
- future overlay families such as NHS/custom regions
- export completion/polish
- authenticated identity/share behavior for saved views
- explicit promotion of approved prototype interaction patterns

Non-functional areas:

- build/release validation discipline
- broader workflow and interaction testing
- map/runtime performance
- deployment/container path
- clearer production/prototype promotion rules

## Forbidden shortcuts

- Do not embed secrets in frontend code.
- Do not collapse typed models into `any`.
- Do not bypass schemas when reading or writing persisted configs.
