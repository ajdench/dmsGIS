# dmsGIS

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![OpenLayers](https://img.shields.io/badge/OpenLayers-10-1F6B75)
![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-222222?logo=githubpages&logoColor=white)
![Architecture](https://img.shields.io/badge/Architecture-Static--first-4B5563)

`dmsGIS` is a static-first geospatial web app for exploring prepared UK facility, boundary, and scenario datasets in the browser.

It is designed as an operational viewing workspace rather than a full GIS editor. Heavy preprocessing happens before runtime; the frontend focuses on map display, selection, styling, saved configurations, and export-oriented workflows.

## What It Does

- displays prepared facility points against boundary and region overlays
- supports multiple view presets and an editable scenario workspace
- lets users tune visibility, colours, borders, labels, and symbol presentation
- supports local save/open flows for map configurations
- keeps runtime data delivery compatible with GitHub Pages

## Stack

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

## Runtime Notes

- the accepted live runtime token is currently `acceptedV38`
- runtime product routing is configured in:
  - [`src/lib/config/runtimeMapProducts.json`](/Users/andrew/Projects/dmsGIS/src/lib/config/runtimeMapProducts.json)
- the accepted runtime family currently resolves under:
  - [`public/data/compare/shared-foundation-review/`](/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review)
- stable public file names are still used in places while underlying source lineage and rebuild ownership continue to improve

## Publication Scope

- the only compare family that should currently be treated as live shipped runtime is:
  - [`public/data/compare/shared-foundation-review/`](/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review)
- the inactive families below are retained for diagnostics, provenance, and recovery, but are not accepted runtime:
  - [`public/data/compare/bfe/`](/Users/andrew/Projects/dmsGIS/public/data/compare/bfe)
  - [`public/data/compare/current-east-bsc/`](/Users/andrew/Projects/dmsGIS/public/data/compare/current-east-bsc)
- local rebuild/source material should stay in ignored working roots such as:
  - [`geopackages/`](/Users/andrew/Projects/dmsGIS/geopackages)
  - `local-archive/`
- publication-scope audit note:
  - [`docs/publication-scope-audit-2026-04-02.md`](/Users/andrew/Projects/dmsGIS/docs/publication-scope-audit-2026-04-02.md)

## Data Refresh Workflow

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
- enriches facilities with prepared boundary metadata
- rebuilds the accepted runtime family so the live app stays aligned
- verifies that the accepted runtime facilities file remains an exact copy of the canonical enriched facilities artifact
- prints a validation summary for counts, totals, duplicate ids, and shared groupings

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
5. [`docs/publication-scope-audit-2026-04-02.md`](/Users/andrew/Projects/dmsGIS/docs/publication-scope-audit-2026-04-02.md)
6. [`docs/current-app-baseline-v3.8.md`](/Users/andrew/Projects/dmsGIS/docs/current-app-baseline-v3.8.md)
7. [`docs/geometry-restart-guidance.md`](/Users/andrew/Projects/dmsGIS/docs/geometry-restart-guidance.md)

## Key Documentation

- [`docs/agent-handover.md`](/Users/andrew/Projects/dmsGIS/docs/agent-handover.md)
- [`docs/main-repo-review-2026-03-31.md`](/Users/andrew/Projects/dmsGIS/docs/main-repo-review-2026-03-31.md)
- [`docs/publication-scope-audit-2026-04-02.md`](/Users/andrew/Projects/dmsGIS/docs/publication-scope-audit-2026-04-02.md)
- [`docs/current-app-baseline-v3.8.md`](/Users/andrew/Projects/dmsGIS/docs/current-app-baseline-v3.8.md)
- [`docs/geometry-restart-guidance.md`](/Users/andrew/Projects/dmsGIS/docs/geometry-restart-guidance.md)
- [`docs/shared-foundation-review-execution-log.md`](/Users/andrew/Projects/dmsGIS/docs/shared-foundation-review-execution-log.md)
- [`docs/playground-grey-runtime-bug.md`](/Users/andrew/Projects/dmsGIS/docs/playground-grey-runtime-bug.md)

## Version Control

- local checkpointing uses `jj`
- this repo is a colocated `jj` / `git` repo
- do not assume the working copy is on `main`; check before publishing
- keep generated local cache files out of source control
- use `local-archive/` for future local-only archive/source material rather than leaving ad hoc large artifacts at the repo root

## Notes

- this app is GitHub Pages compatible
- geospatial preprocessing should stay out of runtime where possible
- prototype work may exist in parallel; do not treat it as production unless it is explicitly promoted
