# Performance And Repo Audit

Date: `2026-04-02`

This note captures the repo-wide audit requested for performance, Edge UI behavior, repo hygiene, and public-facing documentation.

## Summary

The app did not show one catastrophic bottleneck. The strongest low/medium-effort opportunities were:

- remove redundant facilities dataset fetch/parse work during startup
- stop recreating water-edge `VectorSource` instances when only visibility/style changed
- split the single large production bundle into steadier vendor chunks
- defer the saved-views dialog from the initial app bundle
- fix the active sidebar toggle labels so Edge is not fighting an intentional downward text nudge
- remove generated Vite cache output from version control and clean local-only build/tool artifacts

## Changes Landed

### 1. Startup And Bundle Path

- facilities-derived startup state now goes through the shared cached loader in [`src/lib/services/facilityDataset.ts`](/Users/andrew/Projects/dmsGIS/src/lib/services/facilityDataset.ts)
- store startup now derives region styles, combined-practice defaults, populated codes, and PAR summaries from that shared dataset snapshot instead of re-fetching/parsing the same GeoJSON repeatedly
- [`src/app/App.tsx`](/Users/andrew/Projects/dmsGIS/src/app/App.tsx) now lazy-loads [`SavedViewsDialog.tsx`](/Users/andrew/Projects/dmsGIS/src/components/layout/SavedViewsDialog.tsx) only when opened
- [`SavedViewsDialog.tsx`](/Users/andrew/Projects/dmsGIS/src/components/layout/SavedViewsDialog.tsx) no longer subscribes to the full Zustand store while closed
- [`vite.config.ts`](/Users/andrew/Projects/dmsGIS/vite.config.ts) now splits production output into vendor-oriented chunks (`react`, `ol`, `dragdrop`, `radix`, `zod`, `zustand`, `turf`, shared vendor)

Practical effect:

- less duplicate startup fetch/parse work
- smaller initial app chunk
- better long-term caching characteristics for stable vendor code
- one less always-mounted component re-rendering on every store update

### 2. Runtime Map Hotspot

- [`MapWorkspace.tsx`](/Users/andrew/Projects/dmsGIS/src/features/map/MapWorkspace.tsx) now guards water-edge layer source replacement by resolved source URL
- style/visibility updates no longer recreate those `VectorSource` instances unless the actual URL changes

Practical effect:

- fewer unnecessary vector-source resets on the map side
- lower risk of avoidable reparsing when toggling or restyling those layers

### 3. Edge Toggle Alignment

- active toggle labels in [`src/styles/sidebarExact.css`](/Users/andrew/Projects/dmsGIS/src/styles/sidebarExact.css), [`src/styles/global.css`](/Users/andrew/Projects/dmsGIS/src/styles/global.css), and [`src/styles/sidebarReplacement.css`](/Users/andrew/Projects/dmsGIS/src/styles/sidebarReplacement.css) now use full-button centering rather than a manual downward label offset

Practical effect:

- the `On` / `Ox` / `Off` labels should no longer be visibly pushed down on Windows Edge
- centering is now less dependent on the font-metric differences between macOS and Windows fallback fonts

### 4. Repo Hygiene And Local Cleanup

- `.vite/` is now treated as local-only cache output and has been removed from version control
- local generated artifacts were cleaned from the working repo after validation:
  - `dist/`
  - `test-results/`
  - `output/`
  - `serverless/`
  - stray `.DS_Store` files

### 5. Public README

- [`README.md`](/Users/andrew/Projects/dmsGIS/README.md) was rewritten in a more generic public-facing voice
- internal/military-oriented wording was removed from the top-level product description
- Shields badges were added for stack/hosting/architecture context

## Validation

Completed during this pass:

- `npm test -- --run tests/savedViewActions.test.ts tests/savedViewStore.test.ts tests/savedViews.test.ts`
- `npm test -- --run tests/appStore.test.ts tests/facilityDataset.test.ts`
- `npm run typecheck`
- `npm run build`
- `npm run lint`

Current lint state:

- exits successfully
- still reports `3` warnings
- warnings are advisory hook-dependency follow-ups, not release-blocking errors

## Build Note

Before the bundle split, the production build was producing one large main app chunk at roughly `562 kB` minified.

After this pass, the build now emits:

- app chunk around `230 kB` minified
- OpenLayers vendor chunk around `279 kB`
- React vendor chunk around `193 kB`
- deferred `SavedViewsDialog` chunk around `5.4 kB`

This is a real improvement to startup shape and cacheability, even though the total shipped JavaScript still reflects a substantial mapping application.

## Findings That Remain

### High-signal follow-up opportunities

- repeated feature scans still exist in some interaction paths, especially point/boundary lookup helpers
- some hook-dependency warnings remain in:
  - [`src/components/layout/WorkspaceBottomLeftPane.tsx`](/Users/andrew/Projects/dmsGIS/src/components/layout/WorkspaceBottomLeftPane.tsx)
  - [`src/features/map/MapWorkspace.tsx`](/Users/andrew/Projects/dmsGIS/src/features/map/MapWorkspace.tsx)
- font-stack consistency is still a cross-platform variable because the requested top-of-stack font is not bundled in-repo

### Repo-size / publication decisions that still need an explicit call

- whether inactive compare families under [`public/data/compare/bfe/`](/Users/andrew/Projects/dmsGIS/public/data/compare/bfe) and [`public/data/compare/current-east-bsc/`](/Users/andrew/Projects/dmsGIS/public/data/compare/current-east-bsc) should continue living in GitHub
- whether older non-canonical docs should be moved into a `docs/archive/` path
- whether the local source geopackage under [`facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg`](/Users/andrew/Projects/dmsGIS/facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg) should stay in GitHub or become explicitly local-only provenance input

## Suggested Next Questions

1. Should the inactive compare families (`bfe`, `current-east-bsc`) stay published in GitHub, or should we archive/localize them?
2. Should older baseline/recovery docs be moved into `docs/archive/`, or do you want to keep the current flat doc history?
3. Do you want a follow-up pass focused purely on runtime interaction speed, especially selection/lookup scans and hook-warning cleanup?
