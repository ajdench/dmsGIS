# Geo Web App

A static-first geospatial web application for viewing UK facility datasets, toggling prepared overlays, grouping facilities, adjusting labels, saving named map configurations, and exporting map images.

## Purpose

This project provides a browser-based operational map workspace that sits between full GIS tooling and simple map viewers.

Heavy geospatial preparation happens outside the app in QGIS or equivalent. The web app focuses on configuration, presentation, selection, grouping, label control, saving, and export.

## Recommended stack

- React
- TypeScript
- Vite
- OpenLayers
- Zustand
- Zod
- Vitest
- Playwright

## Quick start

```bash
npm install
npm run dev
```

## Useful commands

```bash
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e
jj status
```

## Current repo status

- `npm run test` is currently passing.
- `npm run typecheck` is currently passing.
- `npm run build` is currently passing.

Current validation read:

- `npm run build` is the release gate for this repo.
- `npm run test` and `npm run typecheck` are useful fast signals, but they should not be treated as a substitute for `build`.
- recent production work has focused on shrinking `src/features/map/MapWorkspace.tsx` by extracting testable map helpers rather than expanding product scope.

Why this matters:

- the repo previously had a gap where `test` and `typecheck` were green while `build` was red
- that specific gap is now fixed, but contributors should still treat `npm run build` as the release gate, not just `npm run test`
- keeping this section explicit makes future regressions easier to spot during review

## Deployment target

- GitHub Pages: https://ajdench.github.io/dmsGIS/

## Documents

- `docs/specification.md`
- `docs/internal-architecture-principles.md`
- `docs/parallel-ui-prototype-workflow.md`
- `src/prototypes/sidebarPrototype/README.md`
- `src/prototypes/sidebarPrototype/VERSIONS.md`
- `AGENTS.md`
- `docs/prompts/`

## Notes

- Runtime layer load/error status is surfaced in the active right sidebar.
- Boundary overlay ordering is explicit so populated, unpopulated, and care-board layers render consistently.
- Store coverage now includes PMC/global region styling behavior in `tests/appStore.test.ts`.
- Visible preset labels are `Current`, `SJC JMC`, `COA 3a`, and `COA 3b`.
- Right sidebar width is derived from the top-bar action-button span plus `0.75rem` side gutters so the internal white panes align cleanly inside the grey container.
- The right sidebar pane is named `Overlays`; in `SJC JMC`, `COA 3a`, and `COA 3b` it is intentionally empty for now while PMC points remain active on the map.
- The workspace keeps the right sidebar fixed-width and uses horizontal overflow at narrow widths instead of stacking the sidebar below the map.
- Point tooltip paging is based on visible screen-space overlap at the current zoom and current symbol size/shape, with the nearest clicked facility shown first.
- Current scenario architecture is moving toward distinct overlay families and data-driven scenario assignment:
  - ICB / HB boundaries
  - JMC / scenario regions
  - future NHS regions
  - future custom/manual regions
- The canonical production store model now uses `overlayLayers`, so board-boundary overlays and scenario-region overlays are no longer named as if they were all the same boundary-layer concept.
- Deployment direction is static-first and container-friendly: the app should build to compiled static assets that can be served from a minimal Docker image.
- Future authenticated features should sit behind a storage/auth abstraction so profile-backed saved states and cross-user sharing can be added without changing the core map architecture.
- Saved-state domain contracts now exist in `src/lib/schemas/savedViews.ts` and `src/lib/savedViews.ts`, separating:
  - transient map session state
  - named saved views
  - user-owned saved views
  - shareable saved views
- The saved-state contract covers scenario choice, basemap state, layer/overlay state, region styles, facility presentation/filter state, viewport, and current selection.
- A local browser-backed saved-view store now exists in `src/lib/services/savedViewStore.ts`, with schema-backed save/open/delete helpers in `src/lib/browser/savedViewActions.ts`.
- The production top bar `Open` and `Save` actions now open an in-app saved-views dialog (`src/components/layout/SavedViewsDialog.tsx`) instead of browser prompts.
- The current saved-view implementation is local-only and unauthenticated; repository/serverless storage and sharing remain future work behind the same contract.
- Current scenario datasets include:
  - `UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`
  - `UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
  - `UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`
- Shared preset/scenario configuration now lives in `src/lib/config/viewPresets.json` and `src/lib/config/viewPresets.ts`; runtime UI/store code and scenario preprocessing scripts read from that shared definition.
- Shared scenario assignment resolution now also lives in `src/lib/config/scenarioAssignments.ts`, so scenario region names and codes no longer depend on hard-coded COA script conditionals.
- Boundary-system catalog metadata now lives in `src/lib/config/boundarySystems.ts`, making the split explicit between the legacy Current boundary basis and the 2026 ICB/HB basis used by scenario work.
- Scenario workspace baseline metadata now lives in `src/lib/config/scenarioWorkspaces.ts`, so the current scenario presets can be treated as baseline workspaces for future editable Playground behavior instead of only as hard-coded runtime presets.
- Runtime map lookup sources now also distinguish between:
  - authoritative boundary-system lookup sources
  - scenario outline lookup sources
  This keeps current behavior but reduces the direct preset-to-file coupling inside the map selection path.
- Stable scenario boundary-assignment helpers now live in `src/lib/scenarioWorkspaceAssignments.ts`, so future reassignment work can target boundary-unit ids and scenario-region ids instead of depending only on display-name matching.
- Derived editable-workspace summaries now live in `src/lib/scenarioWorkspaceDerived.ts`, so future region redraw and calculation work has a production-side source of truth to build from.
- The production store now has explicit scenario-workspace draft/editor state in `src/store/appStore.ts`, including active workspace tracking, boundary reassignment drafts, and derived workspace access for future Playground behavior.
- The production map runtime can now also build a draft-aware scenario assignment source in `src/features/map/scenarioWorkspaceRuntime.ts`, so boundary/point selection and selected-region highlighting can start respecting edited assignments before full region redraw is implemented.
- Scenario layer reconciliation can now consume that draft-aware runtime source for the visible scenario map layers, so edited assignments can start affecting what is drawn on the map before true dissolved bespoke outlines are introduced.
- Derived scenario outline generation now uses Turf dissolve in `src/features/map/derivedScenarioOutlineSource.ts`, so edited assignments can produce clean merged Region outlines instead of only grouped board geometries.
- Facility property normalization and derived facility-record helpers now live in `src/lib/schemas/facilities.ts` and `src/lib/facilities.ts`, so current runtime consumers read typed facility metadata instead of raw feature properties directly.
- The Facilities pane search is now wired into production state and filters both visible point rendering and point selection through `FacilityRecord.searchText`.
- Facility filters now use an explicit typed model in `src/lib/facilityFilters.ts`, backed by schema state in `src/lib/schemas/facilities.ts`, even though the active production filter path is currently search-only.
- The production Facilities pane currently exposes search-only filtering; if metadata facets return later, they should reuse the same shared typed filter contract rather than a parallel UI-only path.
- Saved-view and map-session behavior is covered in `tests/savedViews.test.ts`.
- Local saved-view persistence and action helpers are covered in `tests/savedViewStore.test.ts` and `tests/savedViewActions.test.ts`.
- Production panel responsibilities are split: `src/features/groups/PmcPanel.tsx` for PMC controls, `src/features/groups/OverlayPanel.tsx` for the right-sidebar overlay controls, and `src/features/groups/overlaySelectors.ts` for overlay-family metadata, filtering, and section building.
- Point-selection and overlap-grouping logic now lives in `src/features/map/pointSelection.ts`, with direct tests in `tests/pointSelection.test.ts`.
- Boundary/JMC resolution logic now lives in `src/features/map/boundarySelection.ts`, with direct tests in `tests/boundarySelection.test.ts`.
- Docked tooltip rendering/state synchronization now lives in `src/features/map/tooltipController.ts`, with direct tests in `tests/tooltipController.test.ts`.
- Map click-selection orchestration now lives in `src/features/map/singleClickSelection.ts`, with direct tests in `tests/singleClickSelection.test.ts`.
- Selection highlight synchronization now lives in `src/features/map/selectionHighlights.ts`, with direct tests in `tests/selectionHighlights.test.ts`.
- Lookup-source selection now lives in `src/features/map/lookupSources.ts`, with direct tests in `tests/lookupSources.test.ts`.
- Overlay lookup/assignment dataset bootstrapping now lives in `src/features/map/overlayLookupBootstrap.ts`, with direct tests in `tests/overlayLookupBootstrap.test.ts`.
- Map shell setup/teardown now lives in `src/features/map/mapWorkspaceLifecycle.ts`, with direct tests in `tests/mapWorkspaceLifecycle.test.ts`.
- Viewport synchronization now lives in `src/features/map/viewportSync.ts`, with direct tests in `tests/viewportSync.test.ts`.
- Runtime layer reconciliation now lives in `src/features/map/runtimeLayerReconciliation.ts`, with direct tests in `tests/runtimeLayerReconciliation.test.ts`.
- Overlay boundary-layer reconciliation now lives in `src/features/map/overlayBoundaryReconciliation.ts`, with direct tests in `tests/overlayBoundaryReconciliation.test.ts`.
- Boundary-layer styling now lives in `src/features/map/boundaryLayerStyles.ts`, with direct tests in `tests/boundaryLayerStyles.test.ts`.
- Facility-layer styling now lives in `src/features/map/facilityLayerStyles.ts`, with direct tests in `tests/facilityLayerStyles.test.ts`.
- Shared map color/symbol helpers now live in `src/features/map/mapStyleUtils.ts`.
- Interaction coverage now also includes boundary-only tooltip hiding/reset behavior, scenario outline resolution, and filtered overlapping-point selection paths.
- Overlay-family classification is covered in `tests/appStore.test.ts`, which now checks the distinction between `boardBoundaries` and `scenarioRegions`.
- Overlay selector, section-builder, and family-metadata behavior is covered in `tests/overlaySelectors.test.ts`.
- Scenario assignment resolution is covered in `tests/scenarioAssignments.test.ts`.
- Facility schema normalization is covered in `tests/facilitySchema.test.ts`.
- `jj` (Jujutsu) is installed and this repo is initialized as a colocated Git/JJ repo, so both `git` and `jj` commands can be used in the same working directory.
- The local JJ bookmark `main` is tracking `main@origin`.
- Parallel UI prototype work may exist under `src/prototypes/` with dedicated HTML entries such as `sidebar-prototype.html`; treat that work as intentionally isolated from the production app unless explicitly promoted.
- The current sidebar prototype is modularized under `src/prototypes/sidebarPrototype/` with shared seed data in `data.ts`, shared UI primitives in `PrototypeControls.tsx`, extracted floating-callout geometry in `floatingCallout.ts`, shared accordion wrappers in `PrototypeAccordion.tsx`, and local prototype rules in `src/prototypes/sidebarPrototype/README.md`.
- The current sidebar prototype is isolated from production runtime state: it uses a prototype-local top bar shell, mock/local UI state, Radix accordion primitives for pane expansion, and a custom floating PMC row editor instead of the production store or map pane.
- The floating callout geometry contract is covered directly in `tests/floatingCallout.test.ts` so top clamp, bottom clamp, and drift behavior can be tuned without re-deriving the math from component code.

## Current production focus

The current production focus is improving the shipped production app before expanding into more future-facing capability areas.

Near-term production priorities:

1. Improve production workflows and usability in existing domain areas before taking on more breadth.
2. Keep future overlay families data-driven through shared overlay metadata/bootstrap paths rather than preset-specific runtime forks.
3. Keep prototype exploration separate until a specific interaction pattern is approved for promotion.
4. Keep `npm run build` as the authoritative health check before describing the app as deployable.

## Future functionality areas

Functional areas:

- facility-filter usability and saved-filter behavior
- richer saved-view management and future remote storage
- future overlay families such as NHS/custom regions
- export completion and polish
- any explicit promotion of approved prototype interaction patterns

Non-functional areas:

- build/release validation discipline
- broader workflow and interaction testing
- map/runtime performance
- deployment/container path
- architecture consistency and clearer promotion rules from prototype to production

Planned production-architecture direction for the future Playground:

- treat `Current` as a baseline on the legacy ICB/HB boundary system
- treat `SJC JMC`, `COA 3a`, and `COA 3b` as baseline scenario workspaces on the 2026 ICB/HB boundary system
- move toward editable boundary-unit assignment plus derived scenario-region redraw, instead of relying on bespoke static outline files as the primary source of truth
- keep editable workspace state in a dedicated production draft/editor layer rather than mutating preset config directly at runtime

See [docs/internal-architecture-principles.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/docs/internal-architecture-principles.md) for the working rules that should guide future development across both production and prototype paths.
