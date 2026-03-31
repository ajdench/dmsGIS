# Current App Baseline v3.1

This document records the recoverable application baseline after the first live canonical-board cutover and the subsequent runtime/selection hardening that followed it.

Treat this as the rollback target if the next geometry/preprocessing pass (`v3.2`) needs to be reversed.

## Baseline Identity

- logical baseline version: `v3.1`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What This Baseline Represents

This baseline is the first live post-`v2` canonical-board runtime state.

It includes:

- exact-shell production sidebar path
- live Regions pane
- saved views dialog
- working lint/test/build path
- Pages-friendly bundle split
- rebuilt exact canonical `Current` and `2026` source foundations behind the live runtime filenames
- topological preprocessing cutover replacing the old Natural Earth clip path
- Current ward-split behavior preserved on the live runtime path
- Playground reassignment and selected-region redraw hardening
- shared overlay edge artifacts regenerated and validated

It does not yet include:

- the next curated app-facing geometry refresh from those rebuilt official/BFC foundations using the chosen `v3.2` preprocessing pass
- improved coastline-source alignment beyond the current first topological simplification cut
- any dual-map or multi-runtime map architecture

## Baseline Runtime Truth

The live app currently runs on:

- `Current` runtime board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` runtime board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

Those filenames are retained, but in `v3.1` they are now derived from rebuilt exact canonical board products rather than the old inherited Codex/Natural Earth clip path.

Supporting live products also include regenerated:

- topology edges
- scenario board products
- scenario outline products
- group outlines
- facility boundary assignments

## Validation Baseline

At this baseline, the expected health checks are:

- `npm run lint`
- `npm run test -- --run`
- `npm run test:e2e`
- `npm run build`

`npm run build` remains the release gate.

## Recovery Path

If the next `v3.2` geometry/preprocessing pass needs to be abandoned or rolled back, the target is:

- return runtime inputs and docs to this `v3.1` state
- preserve the validated post-cutover app behavior

The practical recovery target is therefore:

1. restore these active runtime products:
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
   - associated topology-edge, scenario, outline, and assignment products referenced by runtime config
2. restore runtime config references in:
   - `src/lib/config/boundarySystems.ts`
   - `src/lib/config/viewPresets.json`
   - `src/lib/config/scenarioWorkspaces.ts`
3. restore the validated `v3.1` preprocessing/runtime path:
   - `scripts/build_current_canonical_board_boundaries.py`
   - `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py`
   - `scripts/preprocess-boundaries.mjs`
   - `scripts/derive-boundary-presets.mjs`
   - `scripts/extract-topology-edges.mjs`
   - `scripts/extract-group-outlines.mjs`
   - `scripts/enrich-facilities.mjs`
4. rerun:
   - `npm run lint`
   - `npm run test -- --run`
   - `npm run test:e2e`
   - `npm run build`

If a new major-path implementation checkpoint is opened, keep this baseline recoverable via:

- explicit `jj` checkpoint before `v3.2` work begins
- docs kept aligned with whether runtime is still on `v3.1` or has moved into the next pass

## Next Version Direction

The next path should be treated as `v3.2`.

Its first focus is:

- rebuild and refresh the app-facing simplified runtime outputs and downstream derived products from the rebuilt official/BFC canonical foundations, while keeping the current single-map runtime architecture intact

That means:

- no new dual-map runtime
- no runtime format reset yet
- no change to the app’s selection, overlay, Playground, or ward-split semantics

See:

- `docs/canonical-board-rebuild-workflow.md`
- `docs/current-app-baseline-v2.md`
