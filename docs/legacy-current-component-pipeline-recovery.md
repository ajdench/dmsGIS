# Legacy Current Component Pipeline Recovery

This note records the current understanding of the `Current` active/inactive component products and the safest recovery path for rebuilding them.

It exists because these files now have two distinct truths:

- they are reproducibly rebuilt in the staged paired pipeline for `Current` confirmation
- but that rebuild still uses the preserved legacy `v10` component GPKGs, not a new paired-board-derived component pipeline

The public runtime products are:

- `public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson`

## Why They Are Special

These two files are not simple subsets of the current board family.

They carry component-level semantics that are not present on the current board product itself:

- `component_id`
- `component_name`
- `source_type`
- `parent_code`
- `parent_name`
- `region_ref`
- `point_count`
- `fill_color_hex`
- `fill_alpha`
- `style_role`

Observed `source_type` values in the shipped `v10` products include:

- `icb_full_single_region`
- `icb_lad_split_multi_region`
- `lhb_full_with_points`
- `scot_ni_board`
- `icb_no_points`
- `lhb_no_points`

That means the products encode:

- component segmentation
- populated vs unpopulated status
- per-parent region mapping
- style metadata

and are therefore a legacy preprocessing family of their own.

## What The Repo Still Has

The good news is that the repo still contains the original `v10` component artifacts, not just the public runtime copies:

### Public runtime copies

- `public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson`

### Matching GeoJSON siblings

- `geopackages/UK_Active_Components_Codex_v10_geojson.geojson`
- `geopackages/UK_Inactive_Remainder_Codex_v10_geojson.geojson`

### Matching GPKG sources

- `geopackages/UK_Active_Components_Codex_v10_gpkg.gpkg`
  - layer: `active_components`
- `geopackages/UK_Inactive_Remainder_Codex_v10_gpkg.gpkg`
  - layer: `inactive_remainder`

### Likely older predecessor lineage

- `geopackages/UK_Active_Components_Codex_v09_gpkg.gpkg`
- `geopackages/UK_Inactive_Remainder_Codex_v09_gpkg.gpkg`
- `geopackages/Legacy/UK_DPHC_SubICB_AGOL_Ready_Codex_v1.gpkg`
- `geopackages/Legacy/UK_DPHC_SubICB_AGOL_Ready_Codex_v2.gpkg`
  - layer: `dphc_subicb_components`

So this is not a “missing data” problem. It is a “missing documented build path” problem.

## Why They Are Not Rebuildable From The Current Bootstrap Alone

The current paired rebuild bootstrap has:

- current board polygons
- current selected-outline products
- facilities export
- scenario derivations

But that is not enough to regenerate these component files directly, because:

1. The current facilities export no longer carries parent board code fields required for straightforward recomputation.
2. The `icb_lad_split_multi_region` geometry split logic is not implemented in this checkout.
3. The `region_ref` assignment for split parents is part of the older component preprocessing semantics, not inferred from the current board family alone.
4. The component style metadata looks preprocessing-owned rather than runtime-owned.

## Current Safe Recovery Status

The repo now has a safe reproducible export step for these products:

- `scripts/buildCurrentComponentLookupsFromGpkg.mjs`

That step:

- exports the preserved `v10` GPKG layers with `ogr2ogr`
- normalizes the top-level GeoJSON contract:
  - `type`
  - `name`
  - `crs`
  - `features`
- writes stage-`80` current component lookup outputs that can be promoted back into the stable public filenames

So for `Current`-only confirmation, these products are no longer merely “carry-forward copies.”

## Safe Recovery Goal

Recover a dedicated legacy-current-component pipeline that outputs:

- `uk_current_active_components_lookup.geojson`
- `uk_current_inactive_components_lookup.geojson`

and only then promotes those into:

- `public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson`

## Recommended Recovery Stages

### Stage A: Source inventory

Confirm and catalogue:

- `v10` GPKG layer schema
- `v09 -> v10` feature-count drift
- any preserved split-parent lineage in the legacy GPKGs

### Stage B: Semantic extraction

Write a small inspection tool that reports:

- all `source_type` values
- all parents with multiple `region_ref` values
- all component counts by parent
- all parents with `point_count = 0`

This should become the explicit contract test surface for the rebuilt component pipeline.

### Stage C: Rebuild scope decision

Choose one of:

1. Reconstruct from original legacy component GPKG sources and document that as the canonical source of truth.
2. Reconstruct from current boards + restored split/LAD logic + facility-parent mapping.

The first path is lower risk for parity.
The second path is cleaner long-term but depends on rebuilding older split logic first.

### Stage D: Promotion boundary

Keep the paired stage tree honest:

- stage `80` selected outlines can remain rebuilt from upstream stages
- stage `80` current active/inactive components can now be rebuilt from canonical `v10` GPKG source and promoted for `Current` confirmation
- but they should still be treated as a legacy-source rebuild, not yet as the final paired-board-derived component solution

## Recommendation

The next implementation pass should not try to “infer” these files from the simplified current board and facility pipeline.

The safest route remains:

1. treat the `v10` component GPKGs as the canonical short-term recovery source
2. keep the new export/parity step in place for stable `Current` confirmation
3. only later replace that with a deeper paired-board-derived component stage once the split/LAD/facility-parent rules are restored

The carry-forward status is therefore gone for the short-term export path, but the long-term architectural replacement work still remains.
