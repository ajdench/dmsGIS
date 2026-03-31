# Current App Baseline v3.3

This document records the recoverable application baseline after the visible UK basemap coast alignment pass on top of the `v3.2` canonical-board and OSM-landmask cutover.

Treat this as the pre-`v3.4` rollback baseline for the app. If the inland-water cleanup pass needs to be reversed, this is the return target.

## Baseline Identity

- logical baseline version: `v3.3`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What This Baseline Represents

This baseline keeps the same single-map OpenLayers runtime from `v3.2`, but now brings the visible UK basemap land/coast treatment into line with the improved board-coast truth already used underneath the boundary products.

Important status note:

- this baseline is stable and recoverable, but it still carries the known residual mismatch that led to the start of `v3.4`
- specifically, the app-facing board products can still carry river / inland-water influence from the preprocessing landmask, even though the outer coast and visible basemap alignment work were materially improved

It includes:

- all `v3.2` sidebar/runtime/selection behavior
- rebuilt exact canonical `Current` and `2026` source foundations behind the live runtime filenames
- the `v3.2` OSM-derived UK landmask preprocessing truth for simplified board products
- a visible UK basemap land overlay sourced from that same coastline family
- a visible UK-local sea patch derived as the local complement of that same filtered land shape
- the UK-visible land and sea patches tied to the existing global `Land` and `Sea` controls so the UK basemap alignment behaves as one unified basemap feature
- a filtered visible UK/Ireland landmask with the stray continental fragment removed
- a codified facility preprocessing rule that treats the assigned `Current` ICB/HB product as the authoritative coastal placement truth for reviewed coastal facilities
- a mode-aware visible-land derivation where `Current` uses the shipped simplified `Current` board union and scenario/Playground modes use the shipped simplified `2026` board union, with Republic of Ireland context added explicitly rather than inherited through the older dissolved OSM land patch

It does not include:

- a visible basemap provider switch
- dual-map or multi-runtime map architecture
- the planned river / inland-water cleanup pass
- the planned Devolved Administrations internal-HB region-border cleanup

## Baseline Runtime Truth

The live app currently runs on:

- `Current` runtime board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` runtime board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

The hidden preprocessing path from `v3.2` remains:

1. build exact canonical board products from official / official-equivalent sources
2. clip those exact products to:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
3. topologically simplify the clipped result

The facility preprocessing path now also treats the shipped `Current` board product as the authoritative coastline for coastal facility placement:

1. start from `lon_original` / `lat_original` when present, otherwise the current facility point
2. preserve the reviewed current-board assignment when the feature already carries snap metadata
3. snap the point inward only if it still falls outside its assigned current board polygon
4. preserve original coordinates plus snap metadata in `public/data/facilities/facilities.geojson`

At this baseline, the regenerated facility dataset is back to `105/105` facilities intersecting their assigned shipped current board polygons.

The visible `v3.3` basemap alignment layers now use boundary-system-specific assets:

- `public/data/basemaps/uk_landmask_current_v01.geojson`
- `public/data/basemaps/uk_seapatch_current_v01.geojson`
- `public/data/basemaps/uk_landmask_2026_v01.geojson`
- `public/data/basemaps/uk_seapatch_2026_v01.geojson`

Those visible UK land files are now derived from:

1. the shipped simplified board union for the active boundary system
2. an explicit Republic of Ireland context polygon from `ne_10m_admin_0_countries.geojson`

This replaced the earlier “same source family” land patch and the later one-size-fits-both-mode union, so the visible basemap land edge now conforms exactly to the shipped app product coastline for the active mode while still keeping Ireland as contextual non-app land.

The visible UK basemap alignment is wired through:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/mapWorkspaceLifecycle.ts`

and is intentionally tied to the existing global basemap controls:

- `Land` controls the visible UK land overlay fill
- `Sea` controls the visible UK-local sea patch colour/opacity

No separate basemap row or extra control was introduced for this alignment layer.

## Validation Baseline

At this baseline, the expected health checks are:

- `npm run test -- --run`
- `npm run test:e2e`
- `npm run build`

`npm run build` remains the release gate.

`npm run lint` is still tracked separately as a repo-health TODO and must not be overclaimed as clean until that work is finished.

## Recovery Path

If the next `v3.x` geometry/basemap pass needs to be abandoned or rolled back, the target is:

- return runtime inputs and docs to this `v3.3` state
- preserve the validated visible UK basemap alignment and `v3.2` preprocessing path

The practical recovery target is therefore:

1. restore these active runtime products:
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`
   - associated topology-edge, scenario, outline, and facility-assignment products referenced by runtime config
2. restore the active visible/preprocessing coastline inputs:
   - `public/data/basemaps/uk_landmask_current_v01.geojson`
   - `public/data/basemaps/uk_seapatch_current_v01.geojson`
   - `public/data/basemaps/uk_landmask_2026_v01.geojson`
   - `public/data/basemaps/uk_seapatch_2026_v01.geojson`
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01.geojson`
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
   - `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`
3. restore the validated runtime path:
   - `src/features/map/MapWorkspace.tsx`
   - `src/features/map/mapWorkspaceLifecycle.ts`
   - `scripts/preprocess-boundaries.mjs`
   - `scripts/derive-boundary-presets.mjs`
   - `scripts/extract-topology-edges.mjs`
   - `scripts/extract-group-outlines.mjs`
   - `scripts/enrich-facilities.mjs`
4. rerun:
   - `npm run test -- --run`
   - `npm run test:e2e`
   - `npm run build`

The prior rollback milestones remain documented separately in:

- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`

## Next Version Direction

The next path stays within the `v3.x` geometry/basemap track.

The agreed next steps are:

1. `v3.4`: remove river and inland-water influence from app-facing border/tile/polygon products where those seams are incorrectly behaving like outer coastline
2. `v3.5`: remove Region-border noise that currently sits along internal Health Board boundaries inside the Devolved Administrations region only

Still not planned by default:

- a visible basemap provider switch
- dual-map runtime architecture

Protomaps remains only a future visible-basemap candidate, not part of this `v3.3` baseline.

See:

- `docs/canonical-board-rebuild-workflow.md`
- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`
