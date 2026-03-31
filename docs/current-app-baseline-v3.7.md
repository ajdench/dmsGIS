# Current App Baseline v3.7

This document records the current `v3.7` runtime state after the tokenized `BFE` compare review was rejected and the isolated `Current East` `BSC` inspection slice was activated.

Treat this as the current live runtime family in the main repo.

The prior rollback point remains:

- `docs/current-app-baseline-v3.6.md`

## Baseline Identity

- logical baseline version: `v3.7`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`

## What This Slice Changes

This `v3.7` slice replaced the failed live-mutating compare workflow with an isolated runtime compare family.

The prepared `bfe` compare family exists under:

- `public/data/compare/bfe/`

The active `Current East` inspection family exists under:

- `public/data/compare/current-east-bsc/`

That compare family is built from:

- England outer coast from official `NHS England Regions (January 2024) EN BFE`
- Wales outer coast from official `Local Health Boards (December 2023) WA BFE`
- Scotland outer coast from official `Countries (December 2023) UK BFE`
- Northern Ireland outer coast from official `Countries (December 2023) UK BFE`
- internal ICB/HB boundaries remain from the canonical board products

The prepared `bfe` coastal-envelope landmask source is:

- `geopackages/outputs/uk_landmask/UK_Landmask_v37_bfe_coastal_envelope.geojson`

The East-only `BSC` inspection family is built from:

- East `Current` internal board geometry from the canonical `Current` exact board product
- East outer coast from official `Integrated Care Boards (April 2023) EN BSC`
- the stable dissolved `Current` East split component from `UK_SplitICB_Current_Canonical_Dissolved.geojson`
- an East-only facilities subset derived from the stable baseline facilities file using `region: "East"`
- the hidden `E54000025` split parent included in the reconstruction network, then filtered back out of the visible board product
- an intentionally unsimplified East runtime board export so the review state shows the reconstructed geometry directly instead of a second delivery-step artefact

The sibling full-UK `bsc` source inputs remain on disk, but there is still no accepted full-UK `bsc` runtime compare family.

Its local official source bundle is:

- `geopackages/compare_sources/Integrated_Care_Boards_April_2023_EN_BFC.gpkg`
- `geopackages/compare_sources/Integrated_Care_Boards_April_2023_EN_BGC.gpkg`
- `geopackages/compare_sources/Integrated_Care_Boards_April_2023_EN_BSC.gpkg`
- `geopackages/compare_sources/Local_Health_Boards_December_2023_WA_BFC.gpkg`
- `geopackages/compare_sources/Local_Health_Boards_December_2023_WA_BGC.gpkg`
- `geopackages/compare_sources/NHS_England_Regions_January_2024_EN_BFE.gpkg`
- `geopackages/compare_sources/NHS_England_Regions_January_2024_EN_BSC.gpkg`
- `geopackages/compare_sources/Local_Health_Boards_December_2023_WA_BFE.gpkg`
- `geopackages/compare_sources/Countries_December_2023_UK_BFE.gpkg`
- `geopackages/compare_sources/Countries_December_2023_UK_BSC.gpkg`

## Runtime Truth

The app still uses the same runtime file contract and sidebar/store behavior, but runtime map-product paths are now resolved through:

- `src/lib/config/runtimeMapProducts.json`

Current active token:

- `activeProductId: "currentEastBsc"`

The stable fallback token remains:

- `activeProductId: "baseline"`

The rejected earlier compare token was:

- `activeProductId: "bfe"`

That compare token rewrote map-product reads from `data/...` to:

- `data/compare/bfe/...`

The live baseline files under `public/data/regions/` and `public/data/basemaps/` are not rewritten by the swap.

In the East-only inspection family, facilities are now token-swapped too:

- manifest path resolves through the active runtime token
- `data/facilities/facilities.geojson` resolves to `public/data/compare/current-east-bsc/facilities/facilities.geojson`
- that compare facilities file contains only the `East` facilities

Current inspection outcome:

- the app is intentionally showing only the rebuilt `Current` East group for inspection
- the local current land/sea mask is intentionally limited to the East area only
- the rest of UK `Current` is intentionally absent in this review state

Earlier review outcome:

- the tokenized `BFE` compare family did not produce an acceptable result
- visible coastal inaccuracies and artefacts remained
- the compare family is preserved for reference only
- the app has been switched back to the stable baseline token

Guardrails tightened on the active runtime path:

- the three special `Current` split parents (`E54000025`, `E54000042`, `E54000048`) remain source-of-truth on the stable canonical parent geometry until the coastal-compare path is made split-aware
- dissolved group-outline extraction now prefers dissolve-to-exterior output before falling back to raw topology mesh, so cross-border Region outlines do not preserve stray internal admin arcs when source edges are no longer perfectly coincident

Prepared compare-family contents now include:

- current / 2026 simplified board products
- topology-edge products
- scenario board / outline products
- group-outline and inland-water-outline products
- current / 2026 aligned land / sea mask products
- copied stable split-ICB helper products so app contracts remain intact during compare review

Swap token:

- `src/lib/config/runtimeMapProducts.json`
- `activeProductId: "baseline" | "bfe" | "currentEastBsc"`

## Water-Edge Prototype Status

The earlier `v3.7` water-edge runtime modifier treatment is no longer active in the shipped app path.

Current status:

- `src/lib/config/waterEdgeTreatment.json` is now `draft-not-active`
- classified water-edge products remain materialized for reference/research
- runtime water-edge border modifier layers are no longer part of the active shipped visual contract

## Validation

The active East-only inspection path passed:

- `node scripts/build-current-east-bsc-family.mjs`
- `npm run test -- --run tests/runtimeMapProducts.test.ts tests/layersService.test.ts tests/boundarySystems.test.ts tests/basemapAlignment.test.ts tests/boundaryArtifactExtents.test.ts`
- `npm run build`

The earlier isolated compare-path plumbing also passed:

- `node scripts/build-runtime-geometry-family.mjs`
- `npm run test -- --run`
- `npm run build`
- `npm run test:e2e`

## Recovery Path

If the rejected `bfe` compare cut needs to be revisited:

1. keep `src/lib/config/runtimeMapProducts.json` on `activeProductId: "baseline"` unless a new compare review is explicitly requested
2. rerun:
   - `npm run test -- --run tests/runtimeMapProducts.test.ts tests/boundarySystems.test.ts tests/basemapAlignment.test.ts`
   - `npm run build`
