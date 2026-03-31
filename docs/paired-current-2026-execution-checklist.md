# Paired Current/2026 Execution Checklist

This document turns the paired rebuild strategy into an execution sequence for this repo.

It is intentionally concrete:

- what to build
- in what order
- which current repo assets are inputs
- what should be kept stable
- what should be validated before promotion

## Working Rule

Do not patch visible geometry products directly unless the change is part of the staged paired rebuild.

Geometry work should now move through one controlled build path and then promote accepted outputs back into the stable public contracts.

## Stage 10: Exact Canonical Boards

### Goal

Create one exact canonical board family for `Current` and one for `2026`.

### Inputs

- England official ICB `BSC`
- authoritative devolved administration board sources
- NHS 2026 merge rules for the affected English ICBs

### Output intent

- `uk_boards_current_exact_canonical.geojson`
- `uk_boards_2026_exact_canonical.geojson`

### Validation

- unchanged shared coast matches the same canonical truth
- 2026 changed boards equal the correct predecessor unions or redraw outputs
- no gaps or overlaps in each family

## Stage 20: Paired Runtime Source Boards

### Goal

Prepare both families through the same runtime-design philosophy before any downstream derivations.

### Rules

- same cleanup philosophy on both branches
- no special one-off runtime seam that only applies to 2026
- no coastline invention from side products

### Output intent

- `uk_boards_current_runtime_source.geojson`
- `uk_boards_2026_runtime_source.geojson`

### Validation

- shared coast between unchanged Current/2026 areas still aligns
- changed 2026 boards remain within the intended canonical shell logic

## Stage 30: Shipped Runtime Boards

### Goal

Produce the board products that downstream work will actually use.

### Output intent

- `uk_boards_current_runtime.geojson`
- `uk_boards_2026_runtime.geojson`

### Promotion targets in this repo

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson`

### Validation

- no invalid geometry
- no overlaps inside either family
- no visible shared-coast drift versus the canonical expectation

## Stage 40: Current Split Products

### Goal

Build the three special split `Current` ICB internals from ward `BSC`.

### Current repo context

Ward `BSC` should be used only here.

### Output intent

- `uk_boards_current_split_exact.geojson`
- `uk_boards_current_split_runtime.geojson`
- `uk_boards_current_split_internal_arcs.geojson`

### Validation

- split products stay inside their parent Current shells
- shared split arcs remain contiguous
- no leakage into unrelated areas

## Stage 50: Topology Edges

### Goal

Extract one authoritative arc network from the shipped board products.

### Output intent

- `uk_boards_current_topology_edges.geojson`
- `uk_boards_2026_topology_edges.geojson`

### Validation

- edge network reproduces shipped board seams exactly
- external and internal arcs are reusable downstream without re-dissolve
- bootstrap status in this checkout:
  - stage `50` now derives real `Current` and `2026` topology-edge products from the staged shipped boards
  - the public `uk_internal_borders.geojson` contract is still staged from the stable basemap source in this checkout, not rebuilt from board topology yet
  - stage `90` masks are still placeholders and remain blocked from promotion by default

## Stage 60: Scenario Board Derivations

### Goal

Derive scenario board products from the shipped 2026 family, not from legacy side products.

### Current repo scripts to review

- `scripts/createCoa3aBoardAssignments.mjs`
- `scripts/createCoa3bBoardAssignments.mjs`
- `scripts/stampCoa3aBoardPopulation.mjs`

### Likely change

These scripts should either be:

- kept but repointed to staged 2026 inputs
- or replaced by a single scenario-derivation step fed from the paired rebuild outputs

### Output intent

- `uk_regions_jmc_runtime_from_2026.geojson`
- `uk_regions_coa3a_runtime_from_2026.geojson`
- `uk_regions_coa3b_runtime_from_2026.geojson`

### Promotion targets in this repo

- `public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`
- `public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`

### Validation

- scenario board fills and names resolve from config as expected
- no geometry drift beyond the shipped 2026 board seams

## Stage 70: Visible Outline Arcs

### Goal

Build static visible Region-border overlays from authoritative topology arcs, not fresh dissolve-only geometry.

### Output intent

- `uk_regions_jmc_visible_outline_arcs.geojson`
- `uk_regions_coa3a_visible_outline_arcs.geojson`
- `uk_regions_coa3b_visible_outline_arcs.geojson`

### Promotion targets in this repo

- `public/data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson`
- `public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson`
- `public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson`

### Validation

- Region borders sit exactly on the parent board arc family
- no visual offset alongside internal ICB/HB seams
- bootstrap status in this checkout:
  - stage `70` now derives the visible JMC / COA outline products from the staged scenario board assignments instead of snapshotting the old public files
  - this is now board-owned and deterministic, though it is still dissolve-based rather than a true shared-topology arc subset

## Stage 80: Lookup Polygons And Selected Outlines

### Goal

Keep selection lookup and selected-outline products preprocessing-owned and deterministic.

### Current repo context

Current already has a dedicated selected Region outline product:

- `public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson`

This stage should also own the equivalent static scenario lookup/selected products rather than relying on click-time dissolve.

### Current repo script to keep and improve

- `scripts/buildLegacyRegionOutlines.mjs`

### Validation

- board-to-region mapping stays stable
- selected-region products are calmer than raw component geometry
  - `Current` selected-region products use external boundary linework assembled from clean exact-stage unit geometry:
    - exact current boards for single-region parents
    - exact dissolved split units for the three multi-region current parents
  - same-region split seams are therefore excluded from the highlighted Region border source path
- scenario selected outlines align to the same arc family as the visible overlays
- bootstrap status in this checkout:
  - selected-outline products are now explicitly derived from upstream staged outline products:
    - `Current` from stage `40`, which now derives from rebuilt canonical current-component outputs rather than copied public component files
    - scenarios from stage `70`
  - the live `Current` clean selected-outline product (`UK_Legacy_Region_Outlines_Codex_v02_clean.geojson`) has now been re-owned in preprocessing as external linework built from exact current board geometry plus exact dissolved split units, replacing the earlier broken component-dissolve path
  - `UK_Active_Components_Codex_v10_geojson.geojson` and `UK_Inactive_Remainder_Codex_v10_geojson.geojson` are now reproducibly rebuilt into stage `80` from their preserved canonical `v10` GPKG layers
  - staged validation now marks those two files as `promotable`
  - this is a safe `Current`-only confirmation step, not yet a full semantic replacement of the older component pipeline
  - current evidence in this checkout says those two files are not reconstructible from the available simplified board + facilities inputs alone:
    - they carry component segmentation such as `icb_lad_split_multi_region`
    - they carry `region_ref`, `point_count`, and style-role metadata
    - the current facilities file no longer carries parent board codes needed to recompute them directly
  - treat a future rebuild of those two files from paired current boards as a dedicated legacy component-pipeline task, not as a trivial filter of the current board family
  - the concrete recovery note for that deeper task now lives in:
    - `docs/legacy-current-component-pipeline-recovery.md`

## Stage 90: Masks And Alignment

### Goal

Build land/sea alignment products from the shipped board families after board geometry is settled.

### Validation

- no new coastline behavior appears here
- masks inherit the board geometry family, they do not redefine it
- bootstrap status in this checkout:
  - stage `90` now derives real internal `Current` and `2026` landmask products from staged shipped board unions
  - the public `ne_10m_land.geojson` and `ne_10m_ocean.geojson` contracts are still treated as blocked placeholders, because this checkout does not yet have a truthful paired rebuild for those Natural Earth-facing files

## Stage 100: Facilities Enrichment

### Goal

Re-enrich facilities after both board families are stable.

### Rules

- facilities must continue to resolve against both Current and 2026 board systems
- snapping or containment logic must not be one-family-only in principle

### Promotion target

- `public/data/facilities/facilities.geojson`

### Validation

- board-code fields stay consistent
- no unexpected facility drops or cross-boundary drift

## Stage 110: Validation And Promotion

### Goal

Fail fast before any promotion into `public/data/...`.

### Required checks

- build geometry validity
- no overlap/gap regressions
- changed-board Current/2026 alignment
- split-parent containment
- scenario border alignment to topology
- facilities alignment against both families
- `npm run build`

### Promotion rule

Only after all stage validations pass should outputs be copied or promoted into the stable public runtime filenames already used by:

- `src/lib/config/boundarySystems.ts`
- `src/lib/config/viewPresets.json`
- `src/features/map/lookupSources.ts`
- `src/features/map/currentRegionRuntime.ts`
- `src/features/map/scenarioWorkspaceRuntime.ts`

## Current Repo Implementation State

This checkout now has a first safe paired-build bootstrap entrypoint:

- `scripts/buildPairedCurrent2026StageTree.mjs`
- `node scripts/buildPairedCurrent2026StageTree.mjs`

What it currently does:

- creates a staged internal rebuild tree under `geopackages/outputs/paired_current_2026_rebuild/<run_id>/`
- snapshots the current public board/facility/runtime contract files into an internal workspace
- now rebuilds the `Current` and `2026` board products for stage `10` from their canonical GPKG sources before copying them onward through stages `20` and `30`
- reruns the currently available preprocessing scripts inside that internal workspace
- snapshots the currently available lookup and basemap-side placeholder contracts into stage folders too
- records both a build manifest and a machine-readable validation report
- includes a guarded promotion script so only a clean staged run can be copied back into `public/data/...`
- blocks promotion of known placeholder topology/mask products unless explicitly forced

What it does not yet do:

- rebuild true exact canonical `Current` and `2026` board families
- rebuild shared topology/masks from first principles
- replace the fuller paired geometry pipeline that will eventually be needed

Right now, the repo still has only partial preprocessing scripts in `scripts/`, notably:

- `buildLegacyRegionOutlines.mjs`
- `createCoa3aBoardAssignments.mjs`
- `createCoa3bBoardAssignments.mjs`
- `stampCoa3aBoardPopulation.mjs`

So the next real implementation step after this bootstrap layer is:

1. widen the orchestrator so it owns real canonical and runtime board rebuild stages
2. add shared topology and mask stages to that same internal tree
3. replace the current placeholders with true paired products where the source tooling exists
4. validate there first
5. promote to `public/data/...` only at the end

That is the safest path for this repo from here.
