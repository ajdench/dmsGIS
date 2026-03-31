# Current App Baseline v2

This document records the recoverable application baseline from before the first live `v3.x` canonical-board cutover.

Treat this as the rollback target if the active `v3.x` geometry-source and preprocessing path needs to be reversed.

## Baseline Identity

- logical baseline version: `v2`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What This Baseline Represents

This baseline is the pre-`v3.x` shipped app state before the canonical-source and preprocessing reset was cut into runtime.

It includes:

- exact-shell production sidebar path
- live Regions pane
- current scenario presets and Playground runtime foundations
- saved views dialog
- working lint/test/build path
- Pages-friendly bundle split
- current `Current` ward-split behavior
- current 2026 merger workflow outputs and current simplified canonical boundary products

It does not yet include:

- rebuilt canonical `Current` board source from fully official board provenance
- rebuilt canonical `2026` board source where all 36 England ICBs come from official/workflow-derived geometry
- topology-aware replacement for the current simplify-and-clip pipeline

## Baseline Runtime Truth

The current app still runs on:

- `Current` canonical board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` canonical board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

Those were the active runtime foundation at the `v2` point-in-time before the `v3.x` cutover.

## Validation Baseline

At this baseline, the expected health checks are:

- `npm run lint`
- `npm run test -- --run`
- `npm run build`

`npm run build` remains the release gate.

## Recovery Path

If the active `v3.x` geometry/pipeline work needs to be abandoned or rolled back, the target is:

- return runtime inputs to the active v2 canonical files
- return docs to the v2 baseline/read order state
- restore the validated exact-shell production app behavior

The practical recovery target is therefore:

1. restore these active runtime products:
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
   - associated topology-edge and outline products currently referenced by runtime config
2. restore runtime config references in:
   - `src/lib/config/boundarySystems.ts`
   - `src/lib/config/viewPresets.json`
3. restore scenario-derivation and preprocessing behavior to the current production path:
   - `scripts/derive-boundary-presets.mjs`
   - `scripts/extract-topology-edges.mjs`
   - `scripts/extract-group-outlines.mjs`
   - `scripts/preprocess-boundaries.mjs`
4. rerun:
   - `npm run lint`
   - `npm run test -- --run`
   - `npm run build`

If a major-path implementation branch/checkpoint is opened, keep this baseline recoverable via:

- explicit `jj` checkpoint before geometry-pipeline work begins
- docs kept aligned with whether runtime is still on v2 or has moved to the `v3.x` path

## Next Major Version Direction

The next major path should be treated as the `v3.x` canonical-board rebuild series after v2.

Its defining changes will be:

- rebuilt canonical `Current` board product from official or official-equivalent board sources
- rebuilt canonical `2026` board product with all 36 England ICBs coming from official/workflow-derived geometry
- topology-aware preprocessing with exact internal borders and curated external coastlines

See:

- `docs/canonical-board-rebuild-workflow.md`
