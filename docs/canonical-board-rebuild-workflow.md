# Canonical Board Rebuild Workflow

This note captures the recommended replacement workflow for the app's two canonical board datasets:

- `Current`
- `2026`

It is intentionally about the preprocessing and source-of-truth pipeline, not about changing runtime app behavior.

For the immediate live-app coherent rebuild path, also read:

- `docs/v3.5-full-geometry-redress.md`
- `docs/current-app-baseline-v3.5.md`

That `v3.5` note is the coherent execution strategy from the current runtime state.
This document remains the deeper source/provenance and canonical-workflow reference.

The goal is to preserve all current app semantics while replacing weaker inherited geometry and coarse simplification/clipping with a reproducible official-source workflow.

## Scope

This workflow must preserve:

- current mode logic
- the three `Current` split-ICB ward exceptions
- no coastal border rendering
- internal shared borders only
- separate England ICB and devolved HB overlay families
- shared England/devolved border arcs rendered once, not doubled
- current scenario derivation behavior
- Playground reassignment/dissolve behavior
- GitHub Pages-compatible runtime outputs

## Paired Family Build Rule

`Current` and `2026` should be rebuilt together, not as separate unrelated pipelines.

Accepted order:

1. build one shared canonical board family
2. branch that family into:
   - `Current` unmerged
   - `2026` merged/redrawn under the NHS 2026 rules
3. apply the same runtime preparation philosophy to both
4. derive masks, scenarios, outlines, topology edges, and facilities afterward

Checks should happen at each stage, not only at the end:

- source-stage `2026` changed boards against unions of their `Current` predecessors
- runtime-stage `2026` changed boards against unions of their `Current` predecessors
- downstream scenario products against their parent runtime family

The active paired-stage report for that is now:

- `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`

Current ward-exception source note:

- the three `Current` split-ICB exceptions should be sourced from the official ward `BSC` product, not a legacy anonymous fragment product
- the active official ward source in this repo is:
  - `geopackages/compare_sources/Wards_December_2025_UK_BSC.gpkg`
- keep those splits selective:
  - preserve the parent ICB outer boundary from the canonical current board product
  - rebuild only the internal split pieces from wards
  - regenerate masks only if the shipped outer runtime geometry actually changes materially

## Current Conclusion

The existing April 1, 2026 merger workflow is structurally correct and should be kept.

The part that should change is:

- the provenance of unchanged England boards in the `2026` build
- the canonical `Current` board build provenance
- the final simplification/clipping/preprocessing stage

In particular:

- the unchanged 29 England ICBs in the current `2026` pipeline should come from official April 2023 England ICB BFC, not from Codex v10 carry-forward geometry
- the app should continue to derive scenarios from the two canonical board foundations rather than from bespoke scenario polygons

Current implementation status:

- the England `2026` provenance correction is now in place
- `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py` now sources the unchanged 29 England ICBs from official April 2023 England ICB BFC
- the regenerated England 2026 output now reports:
  - `unchanged_from_official_icb_apr_2023_bfc: 29`
  - `exact_2026_replacements: 7`
- the regenerated UK-wide 2026 board output remains on the expected totals:
  - `icb_count: 36`
  - `lhb_count: 7`
  - `shb_count: 14`
  - `nihb_count: 5`
- a new exact `Current` canonical board builder now exists at:
  - `scripts/build_current_canonical_board_boundaries.py`
- that builder now emits:
  - `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg`
  - `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
- the regenerated `Current` exact canonical product reports:
  - `icb_count: 42`
  - `lhb_count: 7`
  - `shb_count: 14`
  - `nihb_count: 5`
- the runtime preprocessing path has now been cut over to those rebuilt exact foundations through the legacy runtime filenames:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- this means “latest/newest” is ambiguous unless the question says whether it means:
  - the active app-facing runtime products
  - or the newer exact canonical foundation products
- use this rule:
  - live runtime questions -> answer from the active runtime GeoJSONs
  - exact-foundation questions -> answer from the exact canonical products under `geopackages/`
- files currently present in this checkout for that distinction:
  - runtime `Current`: `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
  - runtime `2026`: `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
  - exact canonical `Current`: `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
  - exact canonical `2026`: `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson`
  - exact canonical `2026` GPKG companion: `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_gpkg.gpkg`
- `scripts/preprocess-boundaries.mjs` no longer clips to Natural Earth `10m`; it now performs a topological simplification pass from the rebuilt exact canonical products
- downstream products have been regenerated successfully:
  - scenario board and outline products
  - topology-edge products
  - group outlines
  - facility boundary assignments
- the first live `v3.x` slice remains the `v3.1` baseline
- the second live `v3.x` slice is now in app runtime as the `v3.2` baseline:
  - simplified runtime boundary products are clipped to an OSM-derived UK landmask before topological simplification
  - the visible basemap remains unchanged
  - downstream scenario products, outlines, topology edges, and facility assignments have been regenerated from the clipped runtime products
- the visible `v3.3` basemap-coast alignment pass is now complete:
  - the current single-map runtime keeps the existing Natural Earth-style wider world basemap
  - the visible UK coast is now aligned by layering a regional replacement patch into the existing basemap stack: surrounding Natural Earth land context is preserved, while UK/Ireland land is replaced with the app-product coastline truth and a matching local sea complement
  - that visible alignment is tied to the existing global `Land` and `Sea` controls so it behaves as one basemap feature
- the later visible-patch simplification pass further tightened that contract:
  - the boundary-system-specific local land overlays are now hole-free
  - the local sea patch is now a simple rectangle instead of a complex complement geometry with hundreds of holes
- the `v3.4` inland-water cleanup pass is now in place:
  - preprocessing first derives a hole-free landmask from `UK_Landmask_OSM_simplified_v01_dissolved.geojson`
  - the exact canonical board products are clipped against that hole-free landmask before topological simplification
  - this keeps the outer coastline truth while removing river and inland-water influence from the shipped app-facing boundary products
- later investigation showed that `v3.4` is not a clean final geometry milestone:
  - the shipped simplified board products still contain real interior holes
  - current confirmed cases are in `Highland` (`boundary_code: 17`) in both the `Current` and `2026` shipped products
  - see `docs/v3.4-internal-gap-regression.md`
- the immediate coherent rebuild path has now been executed as `v3.5`:
  - shipped runtime polygons are rebuilt hole-free from the canonical exact products
  - runtime TopoJSON is regenerated from those same shipped polygons
  - topology-edge products, scenario derivatives, visible `Land` / `Sea` alignment assets, and facility assignments are regenerated downstream from that same family
  - the orchestrating rebuild entry is now `scripts/build-runtime-geometry-family.mjs`
  - that rebuild entry now ends by running `scripts/validate-runtime-geometry-family.mjs`, so the shipped family contract is asserted as part of the rebuild itself rather than only by separate test habit
- the `Current` split-ICB special source has now also been replaced selectively inside that family build:
  - `scripts/build_current_ward_split_exact.py` rebuilds the three split ICB cases from `WD_DEC_2025_UK_BSC`
  - `scripts/fix_current_ward_split_parent_coverage.py` adds the canonical parent remainder slivers back so the split product reaches the same parent outer edge as the exact current board source
  - `scripts/build_current_split_icb_runtime.py` dissolves that repaired exact split source to the clean runtime split-ICB product
  - `scripts/create-ward-split.mjs` emits the shipped runtime split product from that three-step rebuild
  - `scripts/build_current_split_internal_arcs.py` emits the small `Current` split-join helper file used for dashed internal split arcs on the map:
    - `public/data/regions/UK_WardSplit_internal_arcs.geojson`
  - accepted Hampshire and Isle of Wight prototype inside that split path:
    - parent-wide facility-seeded ward assignment for `E54000042`
    - explicit Isle of Wight hold to `London & South`
    - explicit correction `Downlands & Forest North` -> `South West`
  - the shipped split runtime export is now precision-normalized only; geometric simplify is intentionally disabled because coastal drift remained visible in the three split-parent coastlines
  - the current shipped split runtime file is:
    - `public/data/regions/UK_WardSplit_simplified.geojson`
  - the exact canonical split companions are:
    - `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
    - `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.gpkg`
    - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson`
    - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.gpkg`
  - `scripts/build-uk-basemap-alignment.mjs` now builds the `Current` landmask from the base current runtime file with the three split parents excluded, plus the shipped split runtime product itself
- defer the previously proposed Devolved Administrations internal-HB Region-border cleanup until after the current continuity/conformance state is reviewed on top of that fuller rebuild path
- after that, the remaining preprocessing work is still to refine coastal/external arc treatment on top of the `v3.2` landmask cutover
- the current restart-safe architecture definition and preprocessing red lines are now recorded separately in:
  - `docs/v3.5-geometry-architecture-redlines.md`
  - use that note before any further `Current` split / outline / landmask rebuild work
- the next active hydro/coast execution brief is now:
  - `docs/v3.7-water-edge-staged-approach.md`
  - use that note before treating rivers, estuaries, inland projections, or Devolved internal-HB Region-border artifacts as another one-off geometry patch
  - the first materialized outputs in that path are draft hydro-normalized landmask profiles under:
    - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_hydronormalized_*.geojson`
  - review-time classified water-edge helper products now also materialize under:
    - `geopackages/outputs/water_edges/*.geojson`
  - the `standard` profile is now the active review clipping source on the rebuild path
  - treat that cutover as review-only until the resulting shipped runtime family is visually confirmed

Active coastline-source note:

- the prepared `v3.2` landmask is:
  - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
- built from:
  - `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`
- this remains a preprocessing-only input; the visible `v3.3` basemap alignment now uses boundary-system-specific browser assets at:
  - `public/data/basemaps/uk_landmask_current_v01.geojson`
  - `public/data/basemaps/uk_seapatch_current_v01.geojson`
  - `public/data/basemaps/uk_landmask_2026_v01.geojson`
  - `public/data/basemaps/uk_seapatch_2026_v01.geojson`

## Canonical Source Inventory

### England

Official canonical England sources:

- ICB April 2023 EN BFC
  - local: `geopackages/Integrated_Care_Boards_April_2023_EN_BFC_-2874981933571631596.gpkg`
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=da81300d4b624a0b81376416c8b5d90e`
- Sub Integrated Care Board Locations April 2023 EN BFC
  - local: `geopackages/Sub_Integrated_Care_Board_Locations_April_2023_EN_BFC_-5517230538851916332.gpkg`
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=fbea8ca039744688b3e18c2849bcaf58`
- Lower layer Super Output Areas December 2011 Boundaries EW BFC (V3)
  - used for the Frimley exact redraw path
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=357ee15b1080431491bf965394090c72`

### Wales

Official canonical Wales source:

- Local Health Boards December 2023 WA BFC
  - local: `geopackages/Local_Health_Boards_December_2023_WA_BFC_-5927802952650685957.gpkg`
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=73a5bf52650244edbd5dd33522042c84`

### Scotland

Best official-equivalent Scotland source currently identified:

- HB Boundaries
  - local working copy: `geopackages/Healthcare_NHS_Health_Boards__Scotland__2695629962780893909.gpkg`
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=d65117de45fa423c8ad42b99ed41e956`

Notes:

- this appears to be an official NHS Scotland / Scottish Government-aligned boundary source
- it is not published as an ONS-style `BFC` dataset, but it is the current best official-equivalent board polygon source

### Northern Ireland

Best official-equivalent Northern Ireland source currently identified:

- Health and Social Care Trusts (NI), February 2018
  - local working copy: `geopackages/nhs_ni_health_boards_bxx_gpkg.gpkg`
  - ArcGIS item:
    `https://www.arcgis.com/home/item.html?id=446d05d126bc45b8890b88c0c88f7be1`

Notes:

- this is not an ONS-style `BFC` dataset
- it appears to be the best currently identified official-equivalent trust boundary source, derived from OSNI/LPS inputs

### Official 2026 England Change References

- ODS workbook:
  `https://digital.nhs.uk/binaries/content/assets/website-assets/services/ods/upcoming-code-changes/ods-change-summary-icb-mergers-phase-1-apr-2026.xlsx`
- Special NHSPD / ODSPD release:
  `https://files.digital.nhs.uk/assets/ods/Reconfig26_NHSPD_and_ODSPD_special.zip`
- Local copies:
  - `geopackages/ICB 2026/ods-change-summary-icb-mergers-phase-1-apr-2026.xlsx`
  - `geopackages/ICB 2026/Reconfig26_NHSPD_and_ODSPD_special.zip`
  - `geopackages/ICB 2026/lsoa21_to_wd25_lad25_best_fit_lookup_v2.csv`

## April 1, 2026 England Change Pattern

The official workbook supports the current 2026 workflow design:

- 4 new ICBs are straightforward SICBL recombinations with no individual LSOA movement
- 2 new ICBs require Frimley LSOA redistribution
- Hampshire and Isle of Wight is retained but boundary-expanded

Locally normalized in:

- `geopackages/ICB 2026/derived/normalized/icb_2026_change_cases.csv`

Expected 2026 target set:

- NHS Central East Integrated Care Board
- NHS Essex Integrated Care Board
- NHS Norfolk and Suffolk Integrated Care Board
- NHS West and North London Integrated Care Board
- NHS Thames Valley Integrated Care Board
- NHS Surrey and Sussex Integrated Care Board
- NHS Hampshire and Isle of Wight Integrated Care Board (retained, expanded)

## Recommended Canonical Build Products

### 1. Current exact canonical board product

New exact source product for `Current`:

- England from official April 2023 ICB BFC
- Wales from official December 2023 LHB BFC
- Scotland from the official-equivalent HB source
- Northern Ireland from the official-equivalent trust source

Suggested outputs:

- `UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg`
- `UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`

Important:

- the 3 split-ICB special cases should remain separate from this base product and continue to be layered via the ward-split path
- do not bake those split pieces into the base canonical board geometry

### 2. 2026 exact canonical board product

New exact source product for `2026`:

- England built entirely from official/workflow-derived geometry:
  - unchanged 29 from official April 2023 ICB BFC
  - 4 merge-only new ICBs dissolved from official SICBL BFC
  - 2 Frimley-derived ICBs rebuilt from official SICBL BFC plus exact transferred LSOAs
  - Hampshire and Isle of Wight rebuilt from official 2023 ICB BFC plus exact transferred LSOAs
- Wales carried through unchanged from official LHB BFC
- Scotland carried through unchanged from the official-equivalent HB source
- Northern Ireland carried through unchanged from the official-equivalent trust source

Suggested outputs:

- `UK_Health_Board_Boundaries_Canonical_2026_exact.gpkg`
- `UK_Health_Board_Boundaries_Canonical_2026_exact.geojson`

## Recommended Script Changes

### Keep

Keep these workflow stages conceptually:

- `geopackages/ICB 2026/scripts/derive_2026_tables.py`
- `geopackages/ICB 2026/scripts/build_2026_exact_boundaries.py`
- `geopackages/ICB 2026/scripts/build_full_uk_2026_board_boundaries.py`
- `scripts/derive-boundary-presets.mjs`
- `scripts/extract-topology-edges.mjs`
- `scripts/extract-group-outlines.mjs`

### Replace / Refactor

#### Replace unchanged 29 carry-forward in England 2026 assembly

Refactor:

- `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py`

Current pattern:

- 29 unchanged boards inherited from Codex v10
- 7 rebuilt targets inserted

Replace with:

- 29 unchanged boards copied from official April 2023 England ICB BFC
- 7 rebuilt targets inserted from the official 2026 workflow outputs

This produces a fully official/workflow-derived England 2026 product.

#### Add a Current exact canonical builder

Add a new script, for example:

- `scripts/build_current_canonical_board_boundaries.py`

Responsibility:

- normalize and combine England/Wales/Scotland/NI official or official-equivalent board sources into one exact `Current` product

#### Replace the final clipping/simplification stage

Replace:

- `scripts/preprocess-boundaries.mjs`

Status:

- this replacement is now partially complete
- the old Natural Earth `10m` clipping stage has been removed from the active runtime build path
- the remaining follow-up is not “whether to replace preprocessing” anymore, but “how to improve the external coastline truth and coastal arc treatment beyond the first topological simplification cut”

Current issues:

- uses Natural Earth `10m` land as final clipping truth
- simplifies uniformly
- does not separate exact internal arcs from external coastal arcs

New preprocessing should:

- build topology/arcs from the exact canonical board products
- preserve internal arcs exactly
- simplify only external/coastal arcs
- rebuild fill polygons from those arcs
- export app-facing `GeoJSON` fills plus internal-edge products

## Recommended Preprocessing Pattern

The correct pattern is:

- exact internals
- curated externals

Not:

- clip everything uniformly
- simplify everything uniformly

Pipeline:

1. read exact canonical `Current` and `2026` board products
2. build shared topology / arc graph
3. classify arcs as:
   - internal shared
   - external coastal
4. keep internal arcs exact
5. quiet/simplify external arcs only
6. rebuild polygons from those arcs
7. export:
   - app-facing simplified fill GeoJSON
   - internal-edge products
   - optional topo products for preprocessing/debug use

This is the step that should absorb coastline truth changes and improve visual agreement with the basemap.

## Runtime Migration Strategy

Keep runtime wiring mostly unchanged at first.

Initial migration should only swap the canonical source products behind the existing runtime seams:

- `src/lib/config/boundarySystems.ts`
- `src/lib/config/viewPresets.json`
- `scripts/derive-boundary-presets.mjs`
- `scripts/extract-topology-edges.mjs`
- `scripts/extract-group-outlines.mjs`

This minimizes runtime regression risk while improving the source geometry and preprocessing quality.

## Validation Checklist

Before runtime cutover, validate:

1. source counts and code coverage for both canonical products
2. England 2026 output against official April 2026 change cases
3. unchanged 29 England ICBs sourced from official BFC, not Codex carry-forward
4. exact continuity of internal shared borders
5. clean suppression of coastal borders in app-facing outputs
6. current ward-split behavior retained for the 3 split ICB cases
7. scenario preset derivation unchanged in meaning
8. Playground reassignment still dissolves/redraws correctly
9. file sizes remain acceptable for GitHub Pages delivery

## Practical Next Implementation Order

1. lock the source inventory and provenance links
2. refactor `build_full_2026_england_icb_boundaries.py`
3. add the new `Current` canonical builder
4. regenerate exact `Current` and exact `2026` canonical products
5. implement new topology-aware preprocessing
6. regenerate simplified app-facing canonical products
7. rerun scenario preset derivation and edge extraction
8. swap runtime inputs only after validation passes

## What Not To Do

- do not treat the current simplified app files as source truth
- do not continue inheriting unchanged 29 England 2026 boards from Codex v10
- do not bake the `Current` split-ward exceptions into the base canonical board product
- do not rely on Natural Earth `10m` land as the final production coastline truth if a better UK coastline source is introduced
- do not move the browser runtime to TopoJSON unless size pressure clearly justifies the extra runtime handling
