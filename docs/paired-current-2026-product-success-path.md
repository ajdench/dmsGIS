# Paired Current/2026 Product Success Path

This document defines the clean rebuild target for the UK board products in this repo.

It exists to stop further late-stage geometry tweaking and to reset the work around one paired preprocessing contract for:

- `Current` (`legacyIcbHb`)
- `2026` (`icbHb2026`)

The goal is not to invent new runtime concepts. The goal is to rebuild the existing product families so they share one coherent upstream truth and one coherent downstream derivation pattern.

## Why This Exists

The current repo state mixes:

- authoritative board products
- scenario assignment products
- selected-region outline products
- dissolve-derived lookup products
- runtime-derived scenario outlines

That has allowed visual drift between:

- `Current`
- `2026`
- scenario Region borders
- internal ICB/HB seams

The correct fix is preprocessing-owned geometry, not more runtime or per-pane patching.

## Non-Negotiable Build Rules

### 1. England canonical source

England ICB `BSC` is the canonical coastal and internal boundary source for both families.

That means:

- `Current` England boards come directly from the official unmerged ICB `BSC` family
- `2026` England boards are built by merging those same ICB `BSC` boards according to the NHS 2026 merger rules
- no new exposed coastal linework should come from SICBL dissolves, wards, or downstream scenario geometry

### 2. Ward source scope

Ward `BSC` is only for the three special split `Current` ICB internals.

Ward products must not become a general coastline or 2026-merge source.

### 3. Devolved administrations

Wales, Scotland, and Northern Ireland must start from one authoritative board-level canonical source per administration, then move through one shared runtime preparation philosophy so they visually sit in the same family as England.

### 4. Paired build

`Current` and `2026` should be rebuilt together, not as unrelated pipelines.

The branch point is:

- `Current`: keep unmerged
- `2026`: apply the 2026 merge rules

Everything after that should stay parallel where possible.

### 5. Shared runtime treatment

Both families should go through the same runtime-design philosophy:

- same visual coarseness target
- same topological cleanup philosophy
- same downstream arc ownership model

### 6. Downstream derivatives

Masks, topology edges, scenario boards, visible outline arcs, lookup polygons, and facility enrichment should all derive from the shipped board family outputs, not from ad hoc side products.

## Stable Public App Contracts

These are the public runtime products already wired into the app. Internal rebuild names may change, but these promotion targets must remain stable unless the user explicitly approves a runtime contract migration.

Important naming rule:

- public filenames below are stable runtime contracts and may still contain legacy labels such as `v10`
- staged rebuild outputs should use the newer paired-family naming model instead
- a legacy token in a public filename should not be read as permission to keep using older preprocessing across the paired rebuild

Current repo progress note:

- the staged bootstrap now rebuilds the public `Current` and `2026` board products from canonical GPKG sources before promotion
- that is a real improvement in source ownership, even though the full paired canonical/runtime branch model is not yet fully implemented in this checkout

### Current (`legacyIcbHb`)

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`
  - current board display and interaction basis
- `public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson`
  - populated component lookup and Region mapping support
- `public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson`
  - unpopulated component lookup and Region mapping support
- `public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson`
  - currently wired selected Region outline product
- `public/data/regions/UK_Legacy_Region_Outlines_Codex_v01.geojson`
  - conservative fallback sibling artifact

### 2026 (`icbHb2026`)

- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson`
  - current 2026 board display and interaction basis in this repo

### Scenario presets

- `public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`
- `public/data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson`
- `public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson`
- `public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson`

### Shared supporting contract

- `public/data/facilities/facilities.geojson`
  - must keep both current and 2026 board references consistent with the rebuilt board families

Current special case:

- the two public `Current` component lookup products still use legacy `v10` names because they are stable runtime contracts
- in the staged rebuild tree they should be treated as current-component lookup products, not as the naming model for the rest of the paired pipeline
- their present canonical source is the preserved `v10` component GPKG layers, which is acceptable for `Current` confirmation before a deeper component-pipeline replacement exists
- typed config and runtime seams that must continue to resolve:
  - `src/lib/config/boundarySystems.ts`
  - `src/lib/config/viewPresets.json`
  - `src/features/map/lookupSources.ts`
  - `src/features/map/currentRegionRuntime.ts`
  - `src/features/map/scenarioWorkspaceRuntime.ts`

## New Internal Stage Model

The repo should use new internal stage names and output names for preprocessing work, while promoting the final accepted outputs back into the stable public file contracts above.

Recommended internal rebuild root:

- `geopackages/outputs/paired_current_2026_rebuild/<run_id>/`

Recommended stage layout:

1. `10_exact_canonical/`
2. `20_paired_runtime_source/`
3. `30_shipped_runtime_boards/`
4. `40_current_split_products/`
5. `50_topology_edges/`
6. `60_scenario_board_derivations/`
7. `70_visible_outline_arcs/`
8. `80_lookup_polygons_and_selected_outlines/`
9. `90_masks_and_alignment/`
10. `100_facilities_enrichment/`
11. `110_validation_and_promotion/`

## Recommended Internal Output Names

These names are intentionally descriptive and should be preferred for internal stage artifacts.

### Exact canonical

- `uk_boards_current_exact_canonical.geojson`
- `uk_boards_2026_exact_canonical.geojson`

### Paired runtime source

- `uk_boards_current_runtime_source.geojson`
- `uk_boards_2026_runtime_source.geojson`

### Shipped runtime boards

- `uk_boards_current_runtime.geojson`
- `uk_boards_2026_runtime.geojson`

### Current split-only

- `uk_boards_current_split_exact.geojson`
- `uk_boards_current_split_runtime.geojson`
- `uk_boards_current_split_internal_arcs.geojson`

### Topology

- `uk_boards_current_topology_edges.geojson`
- `uk_boards_2026_topology_edges.geojson`

### Scenario board derivations

- `uk_regions_jmc_runtime_from_2026.geojson`
- `uk_regions_coa3a_runtime_from_2026.geojson`
- `uk_regions_coa3b_runtime_from_2026.geojson`

### Outline products

- `uk_regions_jmc_visible_outline_arcs.geojson`
- `uk_regions_coa3a_visible_outline_arcs.geojson`
- `uk_regions_coa3b_visible_outline_arcs.geojson`
- `uk_regions_current_selected_outline.geojson`
- `uk_regions_jmc_selected_outline.geojson`
- `uk_regions_coa3a_selected_outline.geojson`
- `uk_regions_coa3b_selected_outline.geojson`

### Masks

- `uk_landmask_current_runtime.geojson`
- `uk_landmask_2026_runtime.geojson`
- `uk_seapatch_current_runtime.geojson`
- `uk_seapatch_2026_runtime.geojson`

### Facilities

- `uk_facilities_enriched_current_2026.geojson`

## Processing Order

The correct order is:

1. Build exact canonical boards.
2. Fork into `Current` and `2026`.
3. Apply 2026 mergers inside the 2026 branch only.
4. Apply paired runtime preparation.
5. Build Current split products.
6. Extract topology once from the shipped boards.
7. Build scenarios from the shipped 2026 boards.
8. Build visible outline arcs from shared topology, not fresh dissolves.
9. Build selected-lookup polygons from stable preprocessing outputs.
10. Build masks from the shipped board families.
11. Re-enrich facilities against both families.
12. Validate, then promote to the existing public filenames.

## What Must Never Happen Again

- deriving exposed 2026 coastline from SICBL dissolve geometry
- using ward geometry for general board coastlines
- rebuilding static scenario Region borders from fresh dissolve-only logic
- letting runtime fixups own geometry that should be preprocessing-owned
- changing public app-facing filenames as a side effect of internal rebuild cleanup

## Definition Of Success

The paired rebuild is successful when all of the following are true:

- `Current` remains visually correct and stable
- `2026` shared coast matches the same England ICB `BSC` coastal truth where unchanged
- scenario Region borders sit exactly on their parent ICB/HB seam family
- internal borders remain contiguous
- masks follow the shipped boards without inventing new edge behavior
- facilities remain correctly aligned for both `Current` and `2026`
- the app keeps resolving through the same public runtime file contracts
