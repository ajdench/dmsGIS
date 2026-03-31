# Current App Baseline v3.6

This document records the recoverable application baseline after the rebuild-phase formalization pass.

Treat this as the active current baseline for the app.

If a later geometry or runtime pass needs to be reversed, this is the first return target. The prior major rebuild rollback point remains:

- `docs/current-app-baseline-v3.5.md`

## Baseline Identity

- logical baseline version: `v3.6`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What `v3.6` Adds On Top Of `v3.5`

`v3.6` does not intentionally change the app contract.

It formalizes the rebuild contract that `v3.5` established:

1. the runtime geometry family rebuild is now expected to end with an explicit shipped-artifact validator
2. `Current` and `2026` are now held to the same formal downstream validation standard
3. the accepted split-ICB, mask, outline, and facility behaviors are now guarded as pipeline invariants instead of relying only on thread memory and ad hoc test selection

## Active Runtime Truth

The live app still runs on the same shipped runtime products as the accepted `v3.5` state:

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- `public/data/regions/UK_WardSplit_simplified.geojson`
- `public/data/regions/UK_WardSplit_internal_arcs.geojson`
- `public/data/basemaps/uk_landmask_current_v01.geojson`
- `public/data/basemaps/uk_seapatch_current_v01.geojson`
- `public/data/basemaps/uk_landmask_2026_v01.geojson`
- `public/data/basemaps/uk_seapatch_2026_v01.geojson`
- `public/data/facilities/facilities.geojson`

The runtime/sidebar/store behavior is intentionally unchanged from the accepted `v3.5` contract.

## Formal Rebuild Contract

The orchestrating runtime-family rebuild entry remains:

- `scripts/build-runtime-geometry-family.mjs`

It now formally ends with:

- `scripts/validate-runtime-geometry-family.mjs`

That validator enforces the shipped-family contract for:

- `Current` and `2026` board counts, extents, and hole-free output
- `Current` and `2026` topology-edge products
- scenario board/outline derivative counts
- `Current` split runtime counts, helper-arc counts, and Hampshire accepted spot checks
- local `Land` / `Sea` patch extents
- split-product validity and neighbor-overlap limits
- facility containment against both shipped `Current` and shipped `2026` board products

## Validation Baseline

`v3.6` was validated with:

- `node scripts/build-runtime-geometry-family.mjs`
- `npm run test -- --run`
- `npm run build`
- `npm run test:e2e`

`npm run build` remains the release gate.

## Recovery Path

If a later pass needs to be abandoned:

1. restore the `v3.6` shipped products and build scripts
2. rerun:
   - `node scripts/build-runtime-geometry-family.mjs`
   - `npm run test -- --run`
   - `npm run build`
   - `npm run test:e2e`

The earlier rollback milestones remain separately documented in:

- `docs/current-app-baseline-v3.5.md`
- `docs/current-app-baseline-v3.4.md`
- `docs/current-app-baseline-v3.3.md`
- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`

## Next Version

`v3.6` is the final documented state of this rebuild-formalization version.

The next version should start from this baseline and be documented separately as:

- `docs/v3.7-next-phase.md`
