# Current App Baseline v3.4

This document records the recoverable application baseline after the inland-water cleanup pass on top of the `v3.3` visible basemap alignment work.

Treat this as the active current baseline for the app. If a later `v3.x` pass needs to be reversed, this is the return target.

This baseline is now explicitly the pre-`v3.5` rollback point.
The active current live baseline is now documented in `docs/current-app-baseline-v3.5.md`.

Important qualification:

- this is a recoverable working baseline, not a clean final geometry baseline
- later investigation confirmed that the shipped simplified board products in this state still contain internal holes in at least `Highland`, which can show the basemap beneath the map products
- the broader rendered artefact is not limited to Scotland; `Highland` is the currently confirmed data-hole example, but visible seam/gap behaviour has been observed across multiple ICB/HB areas
- the earlier severe visible Sea-patch wedge/discontinuity issue was directly targeted by simplifying the local patch geometry, and the hidden basemap coastline-border stroke that produced a false pale line in the sea is now disabled in runtime
- this does not yet prove fully clean visible conformance; it does mean those earlier causes should no longer be treated as the primary current diagnosis without rechecking
- that regression is documented separately in `docs/v3.4-internal-gap-regression.md`

## Baseline Identity

- logical baseline version: `v3.4`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What This Baseline Represents

This baseline keeps the same single-map OpenLayers runtime from `v3.3`, but removes inland-water and river-hole influence from the app-facing board products by changing the preprocessing clip mask rather than the runtime map architecture.

It includes:

- all `v3.3` sidebar/runtime/selection behavior
- rebuilt exact canonical `Current` and `2026` source foundations behind the live runtime filenames
- mode-aware visible UK basemap land/sea alignment assets tied to the existing global `Land` and `Sea` controls
- a regional visible basemap replacement patch that preserves surrounding Natural Earth land context while replacing UK and Ireland land/sea geometry with the app-product coastline truth
- codified coastal facility preprocessing against assigned current board polygons
- a new hole-free preprocessing landmask:
  - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson`
- regenerated app-facing runtime products clipped against that hole-free landmask before topological simplification
- regenerated scenario board/outline products, topology edges, group outlines, facilities, and visible UK land/sea patches from the updated runtime board products
- a simplified visible basemap patch contract:
  - the boundary-system-specific local land overlays are now hole-free
  - the local sea patch is now a simple local rectangle rather than a high-hole “box minus land” geometry
  - the hidden basemap country-border coastline stroke is now disabled in runtime, because the current Basemap UI does not expose a dedicated border control and the polygon-outline path was reading as false land bleed in the sea

It does not include:

- a visible basemap provider switch
- dual-map or multi-runtime map architecture
- a completed visible land/sea replacement where the basemap is fully and finally driven by the app-product coastline truth

## Baseline Runtime Truth

The live app currently runs on:

- `Current` runtime board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` runtime board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

For operator questions, use this distinction:

- if the question is about what the live app is currently rendering, treat the two runtime GeoJSONs above as the answer source of truth
- if the question is about the newer exact canonical board foundations behind the runtime products, use the exact canonical products instead

Files currently present in this checkout for that distinction:

- active app-facing runtime `Current`:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- active app-facing runtime `2026`:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- newer exact canonical `Current`:
  - `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
- newer exact canonical `2026` currently present in this checkout:
  - `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson`
  - `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_gpkg.gpkg`

Practical answering rule:

- for questions like “what is the longest ICB/HB name in the live app?”, answer from the active runtime GeoJSON for the relevant boundary basis
- for questions like “what is the longest name in the newest exact canonical board product?”, answer from the exact canonical file for the relevant basis

The hidden preprocessing path now is:

1. build exact canonical board products from official / official-equivalent sources
2. derive a hole-free UK landmask from:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
3. clip those exact products to:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson`
4. topologically simplify the clipped result

The purpose of the hole-free landmask is:

- keep the outer coastline truth from `v3.2`
- stop inland-water holes from imprinting extra river / lake / estuary edges into the shipped app-facing board products

The facility preprocessing path remains:

1. start from `lon_original` / `lat_original` when present, otherwise the current facility point
2. preserve the reviewed current-board assignment when the feature already carries snap metadata
3. snap the point inward only if it still falls outside its assigned current board polygon
4. preserve original coordinates plus snap metadata in `public/data/facilities/facilities.geojson`

At this baseline, the regenerated facility dataset remains at `105/105` facilities intersecting their assigned shipped current board polygons.

The visible UK basemap alignment layers remain boundary-system-specific:

- `public/data/basemaps/uk_landmask_current_v01.geojson`
- `public/data/basemaps/uk_seapatch_current_v01.geojson`
- `public/data/basemaps/uk_landmask_2026_v01.geojson`
- `public/data/basemaps/uk_seapatch_2026_v01.geojson`

Those visible alignment assets are still derived from the shipped simplified board unions for the active boundary system, with Republic of Ireland context added explicitly from `ne_10m_admin_0_countries.geojson`.

The important correction after the first visible-basemap attempts is:

- the local replacement patch now carries surrounding regional Natural Earth land context as well as the exact UK/Ireland replacement geometry
- the local sea patch renders above the global land fill, and the exact local land renders above that
- this removes the rectangular seam that appeared when the replacement patch only carried UK/Ireland land inside the local box
- the later patch-generation simplification pass now strips interior rings from the visible local land overlays and uses a simple rectangle for the local sea patch, reducing the spike / wedge / non-contiguous artefacts caused by the earlier high-hole complement geometry
- the hidden `countryBorders` coastline stroke is disabled in runtime, so a pale coast line showing in the sea should no longer be attributed to that old basemap-border path

## Known Regression At This Baseline

Later investigation confirmed that this `v3.4` state still ships internal holes inside some board product geometries.

Confirmed evidence:

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson` contains `2` interior rings across `68` features
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson` contains `1` interior ring across `62` features
- the currently identified shipped-hole cases are all in `Highland` (`boundary_code: 17`)
- representative hole coordinates found during inspection:
  - `Current`: `[-4.828004, 58.522121]`
  - `Current`: `[-6.310367, 57.161477]`
  - `2026`: `[-6.312419, 57.161486]`
- `Highland` is the currently confirmed feature-level interior-ring example, but the user-observed rendered artefact is broader and should not be treated as Scotland-only

Practical meaning:

- some of the visible “gaps” are real holes in the shipped map-product polygons, not just another basemap seam or overlay-order issue
- some of the earlier visible sea/land mismatch had also been in the local visible basemap replacement geometry itself, not only in the shipped board products
- that local patch geometry has now been simplified, and the hidden basemap coastline-border stroke has been disabled, but the shipped-product hole regression remains open until explicitly resolved
- this means `v3.4` should not be treated as a fully clean geometry milestone
- the next workflow should formalize this regression and resume from the final shipped polygon generation seam, not progress to unrelated region-border cleanup

## Validation Baseline

At this baseline, the expected health checks are:

- `npm run test -- --run`
- `npm run test:e2e`
- `npm run build`

`npm run build` remains the release gate.

`npm run lint` is still tracked separately as a repo-health TODO and must not be overclaimed as clean until that work is finished.

## Recovery Path

If the next `v3.x` geometry/basemap pass needs to be abandoned or rolled back, the target is:

- return runtime inputs and docs to this `v3.4` state
- preserve the validated hole-free preprocessing landmask path plus the `v3.3` visible basemap alignment
- preserve the documented knowledge that this state still carries the known internal-hole regression

The practical recovery target is therefore:

1. restore these active runtime products:
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
   - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
   - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`
   - associated topology-edge, scenario, outline, and facility-assignment products referenced by runtime config
2. restore the active preprocessing coastline inputs:
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
   - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson`
   - `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`
3. restore the active visible alignment assets:
   - `public/data/basemaps/uk_landmask_current_v01.geojson`
   - `public/data/basemaps/uk_seapatch_current_v01.geojson`
   - `public/data/basemaps/uk_landmask_2026_v01.geojson`
   - `public/data/basemaps/uk_seapatch_2026_v01.geojson`
4. restore the validated runtime path:
   - `scripts/preprocess-boundaries.mjs`
   - `scripts/derive-boundary-presets.mjs`
   - `scripts/extract-topology-edges.mjs`
   - `scripts/extract-group-outlines.mjs`
   - `scripts/enrich-facilities.mjs`
   - `scripts/build-uk-basemap-alignment.mjs`
   - `src/features/map/MapWorkspace.tsx`
5. rerun:
   - `npm run test -- --run`
   - `npm run test:e2e`
   - `npm run build`

The prior rollback milestones remain documented separately in:

- `docs/current-app-baseline-v3.3.md`
- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`

## Next Workflow Direction

The next path stays within the `v3.x` geometry/basemap track, but should not assume this baseline solved visible basemap conformance or internal-hole cleanup.

The agreed next workflow is:

1. preserve this `v3.4` state as the last incremental/repair baseline
2. move into `v3.5` as a full coherent geometry redress:
   - new shipped polygon products
   - new authoritative shared-edge products
   - new visible `Land` / `Sea` masks
   - rerun facility preprocessing against the new shipped `Current` products
3. do not progress to the previously proposed Devolved Administrations internal-HB region-border cleanup until the current hole/gap regression is resolved through that fuller rebuild path

Still not planned by default:

- a visible basemap provider switch
- dual-map runtime architecture

Protomaps remains only a future visible-basemap candidate, not part of this `v3.4` baseline.

See also:

- `docs/v3.5-full-geometry-redress.md`
