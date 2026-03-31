# Current App Baseline v3.5

This document records the recoverable application baseline after the first full coherent geometry-family rebuild.

Treat this as the active current baseline for the app.

If a later geometry pass needs to be reversed, this is the first return target. The prior incremental rollback point remains:

- `docs/current-app-baseline-v3.4.md`

## Baseline Identity

- logical baseline version: `v3.5`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`
- primary dev server path: `http://127.0.0.1:4173/dmsGIS/`

## What Changed In `v3.5`

`v3.5` replaces the incremental repair model with one coordinated live geometry family:

1. shipped app-facing polygon products
2. shared-edge topology products
3. visible UK `Land` / `Sea` alignment assets
4. ward-conforming `Current` split-ICB products
5. facility preprocessing against the shipped `Current` polygons

The runtime app behavior is intentionally preserved:

- same single-map OpenLayers runtime
- same layer controls and overlay-family behavior
- same selection/highlight behavior
- same scenario and Playground behavior
- same split-ward `Current` behavior
- same coastal facility treatment contract

## Live Runtime Truth

The live app currently runs on these boundary products:

- `Current` runtime board source:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `2026` runtime board source:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`

The corresponding topology edge products are:

- `public/data/regions/UK_ICB_LHB_v10_topology_edges.geojson`
- `public/data/regions/UK_Health_Board_2026_topology_edges.geojson`

The visible boundary-system-specific basemap alignment assets are:

- `public/data/basemaps/uk_landmask_current_v01.geojson`
- `public/data/basemaps/uk_seapatch_current_v01.geojson`
- `public/data/basemaps/uk_landmask_2026_v01.geojson`
- `public/data/basemaps/uk_seapatch_2026_v01.geojson`

The exact canonical source products behind the runtime family remain:

- `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
- `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson`

The active `Current` split-ICB runtime source is now also explicit:

- `public/data/regions/UK_WardSplit_simplified.geojson`

The exact canonical split-ICB companion products are:

- `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.gpkg`
- `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
- `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.gpkg`
- `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson`

## `v3.5` Build Contract

The coherent live-family build order is now explicit in:

- `scripts/build-runtime-geometry-family.mjs`

It runs:

1. `scripts/preprocess-boundaries.mjs`
2. `scripts/extract-topology-edges.mjs`
3. `scripts/derive-boundary-presets.mjs`
4. `scripts/create-ward-split.mjs`
5. `scripts/extract-group-outlines.mjs`
6. `scripts/build-uk-basemap-alignment.mjs`
7. `scripts/enrich-facilities.mjs`
8. `scripts/validate-runtime-geometry-family.mjs`

Important implementation change:

- shipped runtime polygons are now made hole-free after topology-preserving simplify/clip, and the runtime TopoJSON is then regenerated from those same hole-free shipped polygons
- the `Current` split-ICB special source is now rebuilt from official ward BFC and then exported to the shipped runtime split product without geometric simplify; only coordinate precision is normalized
- the dissolved runtime split build now also performs a small-fragment cleanup pass before export, reassigning detached sub-`1,000,000 m²` pieces to the nearest dominant split-region body within the same parent ICB
- the split runtime build now also normalizes again after reprojection to `EPSG:4326`, dropping microscopic degenerate parts created by the transform before the dissolved exact and shipped runtime split products are written
- the shipped split runtime is now also clipped to the live `Current` parent runtime polygons during export, so split fills do not materially overlap neighboring current-board fills

That means the live fills, line products, masks, and facility assignment are now rebuilt from one coordinated output family rather than through separate repair seams.

The final rebuild step is now a formal artifact gate, not just an informal test expectation. `scripts/validate-runtime-geometry-family.mjs` verifies the shipped family shape contract after rebuild:

- `Current` and `2026` board counts/extents remain correct and hole-free
- `Current` and `2026` topology-edge products retain valid lon/lat internal-edge output
- downstream scenario board/outline products retain their expected shipped counts
- `Current` split runtime count, parent counts, and helper arc counts remain correct
- accepted Hampshire split spot-checks remain intact
- land/sea mask patch extents remain within the accepted local replacement contract
- split runtime and dissolved exact products remain valid
- split runtime does not materially overlap neighboring boards
- facilities still sit inside their assigned shipped current and shipped `2026` board products

## Current Confirmed Results

Confirmed after the `v3.5` rebuild:

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
  - `68` features
  - `0` interior rings
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
  - `62` features
  - `0` interior rings
- `public/data/facilities/facilities.geojson`
  - `105/105` facilities intersect their assigned shipped current board polygons
  - `Chepstow Medical Centre` remains the one reviewed coastal snap
  - `snap_basis = assigned_current_boundary`
- `public/data/regions/UK_WardSplit_simplified.geojson`
  - `8` clean dissolved split-ICB features
  - `3` parent ICBs:
    - `E54000025`
    - `E54000042`
    - `E54000048`
  - split count by parent:
    - `E54000025`: `3`
    - `E54000042`: `3`
    - `E54000048`: `2`
  - every shipped split feature now has:
    - `assignment_basis = ward_bfc_with_parent_remainder`
  - this is the app-facing visible split product
  - runtime export is precision-normalized only; geometric simplify is intentionally disabled because even light simplify caused visible coastal drift in the three special split parents
  - shipped runtime split product is geometrically valid across all `8` features
- `public/data/regions/UK_WardSplit_internal_arcs.geojson`
  - `5` shipped split-join helper features
  - contains only shared internal split joins inside the three special `Current` parents
  - rendered as dashed neutral-grey special-case arcs in `Current`
  - inherits visibility and border defaults from the `Pre-2026 NHS England ICBs` control
  - dash/gap spacing is equal-length
  - intentionally not exposed as a separate sidebar/overlay control
- `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
  - `957` exact split-source features
  - Hampshire and Isle of Wight (`E54000042`) now uses the accepted prototype split rule:
    - parent-wide facility-seeded ward assignment across the split parent
    - explicit Isle of Wight hold to `London & South`
    - explicit west-most Hampshire correction:
      - `Downlands & Forest North` -> `South West`
  - Winchester (`E07000094`) remains assigned at ward level across:
    - `London & South`
    - `South West`
  - Hampshire exact assignment basis counts are now:
    - `facility_region_seed_nearest_hampshire_parent`: `241`
    - `facility_region_seed_isle_of_wight_hold`: `39`
    - `facility_region_seed_explicit_hampshire_override`: `1`
    - `canonical_parent_remainder_by_adjacency`: `27`
  - the accepted spot checks are:
    - `Badger Farm and Oliver's Battery` -> `South West`
    - `Bishop's Waltham` -> `London & South`
    - `Downlands & Forest North` -> `South West`
    - `Totland & Colwell` -> `London & South`
  - `76` `canonical_parent_remainder_by_adjacency` features across all three special split parents stitch the canonical parent outer edge back onto the ward-defined internals, so the visible split fill reaches the same parent coast as the exact current ICB source
- `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson`
  - dissolved exact split companion is geometrically valid across all `8` features
- `public/data/basemaps/`
  - `scripts/build-uk-basemap-alignment.mjs` now builds the `Current` landmask from:
    - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`, excluding:
      - `E54000025`
      - `E54000042`
      - `E54000048`
    - plus `public/data/regions/UK_WardSplit_simplified.geojson`
  - this means the visible `Current` land edge now follows the shipped split runtime product directly in the three special split parents

Confirmed after the first post-`v3.5` render-path cleanup:

- `src/features/map/boundaryLayerStyles.ts`
  - `regionFill` now uses a very subtle seam-only stroke when explicit borders are off
  - this is intentionally much lighter than the explicit Region border path, so `Border: Off` does not read as a second coloured border mode
  - the stroke remains only to suppress white anti-aliased gaps between adjacent filled polygons

Later split-runtime hardening:

- `scripts/build_current_split_icb_runtime.py` now runs a post-dissolve cleanup step
- the cleanup keeps dominant region bodies and reassigns detached small fragments to the nearest dominant split-region body within the same parent
- the export path now validates cleanly after reprojection:
  - `public/data/regions/UK_WardSplit_simplified.geojson` is valid
  - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson` is valid

## Validation Baseline

The `v3.5` rebuild was validated with:

- `npm run test -- --run`
- `npm run build`
- `npm run test:e2e`

`npm run build` remains the release gate.

Later live-selection hardening:

- the reported London & South facility click-selection regression was not traced to bad facility data
- the live point-selection path was healthy enough to find the facilities, but `Current` Region-highlight derivation for some London & South clicks could throw during on-the-fly outline union
- `src/features/map/boundarySelection.ts` now makes `deriveCurrentGroupOutlineFeature(...)` fail safe and return `null` instead of throwing, so the existing precomputed outline fallback can complete the selection flow
- the precomputed `Current` group outline files for split-region selection are now rebuilt through a dissolve-to-exterior path when ward-split geometry is involved, instead of the older mixed-feature mesh path that could reintroduce split-internal arcs into the selected Region border
- a fresh Playwright browser check on `Southwick Park Medical Centre` in the Portsmouth cluster now selects normally with the tooltip path intact and no fresh console errors beyond the existing canvas warning

## Recovery Path

If a later geometry pass needs to be abandoned:

1. restore the `v3.5` runtime products under `public/data/regions/`
2. restore the `v3.5` visible alignment assets under `public/data/basemaps/`
3. restore `public/data/facilities/facilities.geojson`
4. restore:
   - `scripts/build-runtime-geometry-family.mjs`
   - `scripts/preprocess-boundaries.mjs`
   - `scripts/extract-topology-edges.mjs`
   - `scripts/derive-boundary-presets.mjs`
   - `scripts/create-ward-split.mjs`
   - `scripts/build_current_ward_split_exact.py`
   - `scripts/extract-group-outlines.mjs`
   - `scripts/build-uk-basemap-alignment.mjs`
   - `scripts/enrich-facilities.mjs`
5. rerun:
   - `node scripts/build-runtime-geometry-family.mjs`
   - `npm run test -- --run`
   - `npm run build`
   - `npm run test:e2e`

The prior rollback milestones remain documented separately in:

- `docs/current-app-baseline-v3.4.md`
- `docs/current-app-baseline-v3.3.md`
- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`

## Next Workflow Direction

`v3.5` is no longer the active live baseline.

It is now the prior coherent rebuild rollback point beneath:

- `docs/current-app-baseline-v3.6.md`

If further geometry work is needed, start from the `v3.5` coherent family build and avoid reopening the older patch-based seams unless a fresh regression proves necessary.

The current architectural red lines for that next pass are now recorded in:

- `docs/v3.5-geometry-architecture-redlines.md`
