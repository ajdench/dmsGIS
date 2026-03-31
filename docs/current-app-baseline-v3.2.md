# Current App Baseline v3.2

This document records the recoverable application baseline after the first coastline-truth alignment pass on top of the `v3.1` canonical-board cutover.

Treat this as the active current baseline for the app. If a later `v3.x` pass needs to be reversed, this is the return target.

## Baseline Identity

- logical baseline version: `v3.2`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What This Baseline Represents

This baseline keeps the same visible single-map runtime introduced in `v3.1`, but changes the hidden preprocessing coastline truth used to shape the canonical board products.

It includes:

- all `v3.1` sidebar/runtime/selection behavior
- rebuilt exact canonical `Current` and `2026` source foundations behind the live runtime filenames
- an OSM-derived UK landmask used as the preprocessing coast/land truth before simplification
- regenerated simplified runtime board products clipped to that landmask
- regenerated topology edges, scenario board products, scenario outline products, group outlines, and facility boundary assignments from the clipped products
- unchanged visible basemap/runtime provider and unchanged single-map OpenLayers architecture

It does not include:

- a visible basemap provider switch
- dual-map or multi-runtime map architecture
- a final external-arc-only refinement pass that distinguishes coastal simplification from internal shared-border treatment

## Baseline Runtime Truth

The live app currently runs on:

- `Current` runtime board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` runtime board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

In `v3.2`, those files are now produced by:

1. building exact canonical board products from official / official-equivalent sources
2. clipping those exact products to:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
3. topologically simplifying the clipped result

The prepared landmask source currently comes from:

- `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`

That source is used only for preprocessing. The visible app basemap remains the current local Natural Earth-based runtime path.

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

If the next `v3.x` geometry/preprocessing pass needs to be abandoned or rolled back, the target is:

- return runtime inputs and docs to this `v3.2` state
- preserve the validated OSM-landmask preprocessing path and current app behavior

The practical recovery target is therefore:

1. restore these active runtime products:
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`
   - associated topology-edge, scenario, outline, and facility-assignment products referenced by runtime config
2. restore the active preprocessing inputs:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01.geojson`
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
   - `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`
3. restore the validated `v3.2` preprocessing/runtime path:
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

The prior pre-OSM-landmask rollback milestone remains documented separately in:

- `docs/current-app-baseline-v3.1.md`

## Next Version Direction

The next path should stay within the `v3.x` geometry-preprocessing track.

The agreed next two steps are:

1. `v3.3`: align the visible UK basemap coast to the new `v3.2` board/coast truth without changing the single-map runtime architecture
2. `v3.4`: remove river and inland-water influence from app-facing border/tile/polygon products where those seams are incorrectly behaving like outer coastline
3. `v3.5`: remove Region-border noise that currently sits along internal Health Board boundaries inside the Devolved Administrations region only

Still not planned by default:

- a visible basemap provider switch
- dual-map runtime architecture

Protomaps remains only a future visible-basemap candidate, not part of this `v3.2` preprocessing baseline.

See:

- `docs/canonical-board-rebuild-workflow.md`
- `docs/current-app-baseline-v3.1.md`
