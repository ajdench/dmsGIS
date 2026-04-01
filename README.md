# dmsGIS

`dmsGIS` is a static-first geospatial web app for viewing UK defence medical facility data against prepared care-board and scenario boundaries.

It is designed as an operational mapping workspace rather than a full GIS editor. Heavy geospatial processing happens before runtime; the app focuses on viewing, selection, styling, saved configurations, and controlled scenario exploration.

## What The App Does

- displays UK facility points on a prepared map
- supports `Current`, `SJC JMC`, `COA 3a`, and `COA 3b` map states
- renders prepared ICB / Health Board and Region-style overlays
- supports editable Playground reassignment workflows
- lets users adjust layer visibility and styling
- supports local save/open flows for map configurations
- exports map output from the browser

## Tech Stack

- React
- TypeScript
- Vite
- OpenLayers
- Zustand
- Zod
- Vitest
- Playwright

## Quick Start

```bash
npm install
npm run dev
```

Default local app:

- [http://127.0.0.1:5173/dmsGIS/](http://127.0.0.1:5173/dmsGIS/)

If that port is already in use:

```bash
npm run dev -- --host 127.0.0.1 --port 5174
```

## Common Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run test:e2e
npm run refresh:facilities
jj status
```

## Release Gate

The release gate for this repo is:

```bash
npm run build
```

`test` and `lint` are important, but they do not replace a successful production build.

## Deployment

- GitHub Pages: [https://ajdench.github.io/dmsGIS/](https://ajdench.github.io/dmsGIS/)
- Vite `base` defaults to `/dmsGIS/`
- override with `VITE_BASE_PATH` when deploying to a different subpath

## Repo Structure

- [`src/app/`](/Users/andrew/Projects/dmsGIS/src/app) app shell
- [`src/features/map/`](/Users/andrew/Projects/dmsGIS/src/features/map) map runtime, interaction, styling, and overlay reconciliation
- [`src/store/`](/Users/andrew/Projects/dmsGIS/src/store) production Zustand state
- [`src/lib/config/`](/Users/andrew/Projects/dmsGIS/src/lib/config) preset, boundary-system, and runtime-product configuration
- [`src/lib/schemas/`](/Users/andrew/Projects/dmsGIS/src/lib/schemas) typed data contracts
- [`public/data/`](/Users/andrew/Projects/dmsGIS/public/data) prepared runtime datasets
- [`scripts/`](/Users/andrew/Projects/dmsGIS/scripts) preprocessing and data-build helpers
- [`tests/`](/Users/andrew/Projects/dmsGIS/tests) unit and seam tests
- [`docs/`](/Users/andrew/Projects/dmsGIS/docs) handover, baseline, and processing notes

## Current Runtime Notes

- the accepted live runtime token is currently `acceptedV38`
- runtime product routing is configured in:
  - [`src/lib/config/runtimeMapProducts.json`](/Users/andrew/Projects/dmsGIS/src/lib/config/runtimeMapProducts.json)
- the accepted runtime family currently resolves under:
  - [`public/data/compare/shared-foundation-review/`](/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review)
- legacy public file names are still used in places as stable app/runtime contracts while underlying source lineage is improved behind them

## Facilities Refresh Workflow

- canonical facilities source input:
  - `Export_30_Mar_26.csv`
- canonical generated facilities artifact:
  - [`public/data/facilities/facilities.geojson`](/Users/andrew/Projects/dmsGIS/public/data/facilities/facilities.geojson)
- accepted runtime facilities artifact currently consumed by the live app token:
  - [`public/data/compare/shared-foundation-review/facilities/facilities.geojson`](/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review/facilities/facilities.geojson)

Use this command when the facilities export changes:

```bash
npm run refresh:facilities
```

What it does:

- imports the canonical export CSV into `public/data/facilities/facilities.geojson`
- enriches facilities with boundary-code metadata
- rebuilds the accepted `shared-foundation-review` runtime family so the live app stays aligned
- prints a validation summary for:
  - counts
  - PAR totals
  - duplicate ids
  - shared `active_dmicp_id` groups

Optional:

```bash
node scripts/refresh-facilities-from-export.mjs --input /absolute/path/to/new-export.csv
node scripts/refresh-facilities-from-export.mjs --skip-accepted-runtime-rebuild
```

## Recommended Read Order For A New Coding Session

1. [`AGENTS.md`](/Users/andrew/Projects/dmsGIS/AGENTS.md)
2. [`README.md`](/Users/andrew/Projects/dmsGIS/README.md)
3. [`docs/agent-handover.md`](/Users/andrew/Projects/dmsGIS/docs/agent-handover.md)
4. [`docs/main-repo-review-2026-03-31.md`](/Users/andrew/Projects/dmsGIS/docs/main-repo-review-2026-03-31.md)
5. [`docs/current-app-baseline-v3.8.md`](/Users/andrew/Projects/dmsGIS/docs/current-app-baseline-v3.8.md)
6. [`docs/geometry-restart-guidance.md`](/Users/andrew/Projects/dmsGIS/docs/geometry-restart-guidance.md)

## Key Documentation

- [`docs/agent-handover.md`](/Users/andrew/Projects/dmsGIS/docs/agent-handover.md)
- [`docs/main-repo-review-2026-03-31.md`](/Users/andrew/Projects/dmsGIS/docs/main-repo-review-2026-03-31.md)
- [`docs/current-app-baseline-v3.8.md`](/Users/andrew/Projects/dmsGIS/docs/current-app-baseline-v3.8.md)
- [`docs/geometry-restart-guidance.md`](/Users/andrew/Projects/dmsGIS/docs/geometry-restart-guidance.md)
- [`docs/shared-foundation-review-execution-log.md`](/Users/andrew/Projects/dmsGIS/docs/shared-foundation-review-execution-log.md)
- [`docs/playground-grey-runtime-bug.md`](/Users/andrew/Projects/dmsGIS/docs/playground-grey-runtime-bug.md)

## Version Control

- local checkpointing uses `jj`
- this repo is a colocated `jj` / `git` repo
- do not assume the current working copy is on `main`; check before pushing
- when preparing GitHub updates, prefer a narrow publish scope and avoid bundling unrelated experiments

## Notes

- this app is GitHub Pages compatible
- geospatial preprocessing should stay out of runtime where possible
- prototype work may exist in parallel; do not treat it as production unless it is explicitly promoted
