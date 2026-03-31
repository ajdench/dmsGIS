# Shared Foundation Review Execution Log

This file records the execution history for the first non-destructive shared-foundation review-family build in the main repo.

Repo:

- `/Users/andrew/Projects/dmsGIS`

Purpose:

- build a full review family for visual inspection
- do so without silently overwriting the accepted baseline runtime family
- keep a clear record of what succeeded, what failed, what was retried, and what was fixed

## Goal

Build a review family under:

- `public/data/compare/shared-foundation-review/`

and make it switchable via the runtime-map-product token rather than by overwriting:

- `public/data/...`

## Inputs And Existing Foundations Reused

The review-family build reuses the existing `v3.8` paired-family path already present in the repo:

- `scripts/build_v38_bsc_source_family.py`
- `scripts/preprocess-boundaries.mjs`
- `scripts/report_paired_current_2026_alignment.py`
- `scripts/extract-topology-edges.mjs`
- `scripts/create-ward-split.mjs`
- `scripts/derive-boundary-presets.mjs`
- `scripts/extract-group-outlines.mjs`
- `scripts/build_group_inland_outline_modifiers.py`
- `scripts/build-uk-basemap-alignment.mjs`
- `scripts/enrich-facilities.mjs`
- `scripts/buildLegacyRegionOutlines.mjs`
- `scripts/validate-runtime-geometry-family.mjs`

## New Shipping Mechanism Added

### New runtime-map-product token

Added:

- `sharedFoundationReview`

Files updated:

- `src/lib/config/runtimeMapProducts.json`
- `src/lib/schemas/runtimeMapProducts.ts`

Purpose:

- allow explicit switching to a review family rooted at:
  - `data/compare/shared-foundation-review`

### New builder

Added:

- `scripts/build-shared-foundation-review-family.mjs`

Purpose:

- mirror the needed runtime tree under `public/data/compare/shared-foundation-review/`
- rebuild review geometry/products into that tree
- validate the resulting review family

### New package script

Added:

- `build:shared-foundation-review-family`

in:

- `package.json`

## Concrete Files Changed In This Execution

Source/config/docs:

- `scripts/build_v38_bsc_source_family.py`
- `scripts/build-shared-foundation-review-family.mjs`
- `src/lib/config/runtimeMapProducts.json`
- `src/lib/schemas/runtimeMapProducts.ts`
- `package.json`
- `docs/shared-foundation-review-execution-log.md`

Primary generated review-family tree:

- `public/data/compare/shared-foundation-review/...`

Primary staged review report/output tree:

- `geopackages/outputs/review_families/shared-foundation-review/...`

Known shared-output side-effect area touched by the build flow:

- `geopackages/outputs/full_uk_current_boards/...`
- `public/data/regions/UK_WardSplit_simplified.geojson`
- `public/data/regions/UK_WardSplit_internal_arcs.geojson`

## Exact Execution Sequence Used

High-level command used:

- `node scripts/build-shared-foundation-review-family.mjs`

That review-family builder performed this ordered flow:

1. copied baseline `regions`, `basemaps`, `facilities`, and `manifests` trees into `public/data/compare/shared-foundation-review/`
2. ran `scripts/build_v38_bsc_source_family.py` with staged review output overrides
3. ran `scripts/preprocess-boundaries.mjs` into the review `regions` tree
4. ran `scripts/report_paired_current_2026_alignment.py` into the review report area
5. ran `scripts/extract-topology-edges.mjs`
6. ran `scripts/create-ward-split.mjs` with review `REGIONS_DIR`
7. ran `scripts/derive-boundary-presets.mjs` with review `REGIONS_DIR`
8. ran `scripts/extract-group-outlines.mjs` with review `REGIONS_DIR`
9. ran `scripts/build_group_inland_outline_modifiers.py` with review `REGIONS_DIR`
10. ran `scripts/build-uk-basemap-alignment.mjs` with review `REGIONS_DIR` and review `BASEMAPS_DIR`
11. ran `scripts/enrich-facilities.mjs` with review `REGIONS_DIR` and review facilities path
12. ran `scripts/buildLegacyRegionOutlines.mjs` with review output overrides
13. ran `scripts/validate-runtime-geometry-family.mjs` against the review-family directories

Post-build release-gate command used:

- `npm run build`

## Failures, Fixes, Retries

### Failure avoided before first full run

Problem found during review:

- `scripts/build_v38_bsc_source_family.py` referenced `os.environ`
- but did not import `os`

Fix:

- added `import os`

Why it mattered:

- without that fix, the staged/review-family output overrides would not work reliably

### No hard build failure after the fix

After fixing the missing import, the first full run of:

- `node scripts/build-shared-foundation-review-family.mjs`

completed successfully.

### No cleanup retry was required afterward

No partial output wipe or manual cleanup step was needed between:

- fixing the missing `import os`
- running the first full review-family build
- running the final app build with the review token active

### Warnings observed

The build emitted known GDAL warnings during the split rebuild:

- `OGR_G_Length() called against a non-curve geometry type`

These warnings were noisy but did not stop the build.

## Important Behavior Observed

### Non-destructive with respect to live runtime baseline

The review family was built under:

- `public/data/compare/shared-foundation-review/`

This means the accepted live runtime files under:

- `public/data/regions/`
- `public/data/basemaps/`
- `public/data/facilities/`

were not overwritten by the review-family build itself.

### Shared preprocessing outputs still updated

One important caveat:

- `scripts/create-ward-split.mjs` still writes exact/runtime split artifacts to the shared preprocessing/output area:
  - `geopackages/outputs/full_uk_current_boards/...`
  - and the live `public/data/regions/UK_WardSplit_*.geojson` path during its normal internal flow

In this execution, that did not break the accepted review-shipping goal because the app-facing baseline was not switched automatically.

But it is a real recovery note:

- the review-family build is non-destructive at the runtime token level
- it is not yet fully sandboxed from all shared preprocessing outputs

This was an observed side effect, not just a theoretical risk:

- the working copy after the run included updated shared split outputs
- those shared split outputs should therefore be treated as touched by this review pass

## Successful Outputs Produced

Review root created:

- `public/data/compare/shared-foundation-review/`

Confirmed key outputs:

- `regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- `regions/UK_JMC_Board_simplified.geojson`
- `regions/UK_COA3A_Board_simplified.geojson`
- `regions/UK_COA3B_Board_simplified.geojson`
- `regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson`
- `regions/UK_WardSplit_simplified.geojson`
- `facilities/facilities.geojson`
- `manifests/layers.manifest.json`
- `basemaps/uk_landmask_current_v01.geojson`
- `basemaps/uk_landmask_2026_v01.geojson`

The review-family tree also includes:

- topology edges
- water-edge classes
- scenario outline arcs
- per-group outline files
- inland-water outline companions
- full-res mirror files needed by downstream scripts

## Validation Results

The review-family build finished with:

- `=== validate-runtime-geometry-family ===`
- `Runtime geometry family validation passed.`

The paired source-family summary for the review run remained:

- `current_count: 68`
- `current_official_bsc: 42`
- `current_exact_upstream_bsc_like_simplified: 26`
- `y2026_count: 62`
- `y2026_official_bsc: 29`
- `y2026_exact_2026_sicbl_merge_bsc_shell_seed: 4`
- `y2026_exact_2026_redraw_bsc_shell_seed: 3`
- `y2026_exact_upstream_bsc_like_simplified: 26`

Paired alignment report summary for the review run:

- `sourceStageMaxExtraAreaM2: 0.0`
- `sourceStageMaxSymmetricDifferenceM2: 0.0`
- `runtimeStageMaxExtraAreaM2: 333.9`
- `runtimeStageMaxSymmetricDifferenceM2: 48154304.71`

Important note:

- this means the review family is build-valid
- it does **not** mean it is automatically visually accepted
- the runtime-stage symmetric-difference drift remains large enough that visual inspection is still required

### App build validation

With the review token active, the main app build also completed successfully:

- `npm run build`

Observed build result:

- TypeScript build passed
- Vite production build passed
- only the existing chunk-size warning remained

## Facilities Result

Review-family facilities enrichment result:

- `135` facilities
- `118` matched to `Current`
- `118` matched to `2026`
- `17` expected overseas misses
- `snapped into assigned current boundary: 1`
- `snapped into assigned 2026 boundary: 3`

## Shipping Decision

This review family is intended for explicit visual inspection.

It should be activated only by deliberate runtime-token switching, not by silently replacing the accepted baseline.

That decision matches:

- `docs/geometry-restart-guidance.md`

## Activation State

The review family is now explicitly activated for inspection.

Current runtime-map-product state:

- `activeProductId: sharedFoundationReview`

This means the app is intentionally pointed at:

- `public/data/compare/shared-foundation-review/`

for visual inspection.

It does **not** mean the baseline family under:

- `public/data/...`

has been accepted as replaced.

## Recovery Notes

Local recovery anchors should be kept after each logical stage.

Key recovery points for this execution should include:

1. before review-family builder/wiring
2. after review-family builder + token registration
3. after first successful review-family build
4. after explicit activation of the review token for visual inspection

## Current Status At End Of This Log Entry

At the end of this log entry:

- the review-family artifacts exist
- runtime validation passed
- the production app build passed with the review token active
- the review token is explicitly active for inspection
- visual acceptance is still pending

## Second Review Retry: Current Split-Region Outline Correction

After the first review cutover was inspected in-browser, one important `Current` defect remained:

- special split-ICB Region borders were still showing internal seams instead of dissolving cleanly
- `London & South` was also incorrectly enveloping split parts of `Hampshire and Isle of Wight`

### What was wrong

Two separate causes were found.

1. `src/lib/config/viewPresets.json` still contained:

- `E54000042: "London & South"`

inside `Current` `codeGroupings`, even though `E54000042` is one of the three split-parent ICBs and should be handled only through split units.

2. `scripts/extract-group-outlines.mjs` was building `Current` group outline files from:

- runtime whole-board polygons
- runtime ward-split polygons

and it preferred a topology mesh pass before dissolve.

That worked poorly for `Current` split cases because the runtime board/split seams did not line up well enough to cancel internal borders reliably.

### Fix applied

Changed:

- removed `E54000042` from `Current` `codeGroupings` in `src/lib/config/viewPresets.json`
- changed `scripts/extract-group-outlines.mjs` so `Current` group outlines now prefer polygon dissolve directly, instead of the runtime topology-mesh path

### Rebuild performed

Re-ran:

- `node scripts/build-shared-foundation-review-family.mjs`

Result:

- review-family outputs rebuilt successfully
- `Runtime geometry family validation passed`

Focused tests also passed:

- `tests/viewPresets.test.ts`
- `tests/buildLegacyRegionOutlines.test.ts`
- `tests/boundarySelection.test.ts`
- `tests/selectionHighlights.test.ts`

### Measured improvement in Current review outlines

Part counts in `public/data/compare/shared-foundation-review/regions/outlines/*.geojson` changed as follows:

- `current_east`: `63 -> 7`
- `current_london_south`: `21 -> 13`
- `current_central_wessex`: `4 -> 2`
- `current_south_west`: `44 -> 7`
- `current_wales_west_midlands`: `181 -> 44`
- `current_north`: `73 -> 15`

Interpretation:

- the split-related internal-seam problem was materially reduced
- but visual acceptance is still required, especially for:
  - `London & South`
  - `Wales & West Midlands`
  - `North`

## Third Review Retry: Scenario Outline Ownership Correction

After the `Current` split fix, the next structural issue on the 2026/scenario side was identified:

- static scenario outlines were not fully owned by the merged `2026` board family
- some devolved-administration outline products were being replaced with UK country geometry

### What was wrong

Two scripts were still introducing country-geometry replacement into static scenario border products.

1. `scripts/derive-boundary-presets.mjs`

- `UK_JMC_Outline_simplified.geojson`
- `UK_COA3A_Outline_simplified.geojson`
- `UK_COA3B_Outline_simplified.geojson`

were being dissolved from merged `2026` boards and then partially replaced with country-level geometry.

2. `scripts/extract-group-outlines.mjs`

- `UK_JMC_Outline_arcs.geojson`
- `UK_COA3A_Outline_arcs.geojson`
- `UK_COA3B_Outline_arcs.geojson`
- `regions/outlines/coa3*.geojson`

could also replace devolved groups with country-level geometry before writing the per-group outline files.

That contradicted the agreed model:

- static scenarios and Playground should use the same merged `2026` board seams
- Region outer borders should dissolve from that same merged board family

### Fix applied

Changed:

- removed country-outline replacement from `scripts/derive-boundary-presets.mjs`
- removed country-group replacement from `scripts/extract-group-outlines.mjs`

Resulting rule:

- scenario outline polygons and scenario outline arcs now derive directly from the merged `2026` board family

### Rebuild and validation

Re-ran:

- `node scripts/build-shared-foundation-review-family.mjs`

Focused tests passed:

- `tests/runtimeMapProducts.test.ts`
- `tests/scenarioOutlineConsistency.test.ts`
- `tests/viewPresets.test.ts`
- `tests/buildLegacyRegionOutlines.test.ts`
- `tests/boundarySelection.test.ts`
- `tests/selectionHighlights.test.ts`

### New guardrail added

Added:

- `tests/scenarioOutlineConsistency.test.ts`

Purpose:

- ensure static scenario visible and selected Region borders stay on the same preprocessed geometry family in the review build

### Observed output change

The dissolved scenario outline products became much smaller after the fix:

- `UK_JMC_Outline_simplified.geojson`: `0.61 MB -> 0.15 MB`
- `UK_COA3A_Outline_simplified.geojson`: `0.60 MB -> 0.15 MB`
- `UK_COA3B_Outline_simplified.geojson`: `0.61 MB -> 0.16 MB`

Interpretation:

- devolved scenario borders are now being built from the same merged-board seam family instead of from substituted country-level geometry

## Fourth Review Retry: Scenario Region-Border Internal Seam Leak

After the scenario ownership fix, static scenario modes still showed thick Region-border linework leaking along internal 2026 board seams in examples including:

- `Central East`, `Northamptonshire`, `Norfolk and Suffolk`, `Lincolnshire`
- `Kent and Medway`, `Surrey and Sussex`
- `Thames Valley`, `Central East`
- London ICB groupings

The yellow highlight was explicitly ruled out in review. The remaining issue was the static Region-border product itself.

### Failed broad retry that was rejected

An experiment temporarily changed:

- `scripts/preprocess-boundaries.mjs`
  - `const Y2026_SIMPLIFY_PERCENTAGE = '';`

Purpose:

- test whether removing the final 2026 simplify step would preserve the seam family

Observed result:

- output size increased sharply
- topology-edge counts jumped
- union-level runtime alignment did not improve
- this did not solve the actual Region-border leak

Recovery:

- reverted `Y2026_SIMPLIFY_PERCENTAGE` to `'5%'`

### Secondary display tweak reverted

A temporary selected-board highlight tweak in:

- `src/features/map/MapWorkspace.tsx`

was also reverted because it was only for inspection and not part of the real geometry fix.

### What was wrong

The real fault was in:

- `scripts/extract-group-outlines.mjs`

For static scenario presets, the script still preferred:

- topology mesh from already preprocessed board polygons

and only fell back to dissolve if that mesh path failed completely.

That is brittle when adjacent 2026 boards do not share perfectly identical edges after preprocessing. In those cases the Region-border file can leak along internal board seams even though the scenario assignment itself is correct.

### Fix applied

Changed:

- `scripts/extract-group-outlines.mjs`

New rule:

- static preset Region-border arcs now prefer `groupExteriorArcFromDissolve(...)`
- topology mesh is kept only as a fallback if dissolve produces no usable exterior line

Also updated the log wording so successful outputs are no longer labelled topology-derived when they were actually produced from dissolve.

### Rebuild and validation

Re-ran:

- `node scripts/build-shared-foundation-review-family.mjs`

Checks passed:

- `npm run test -- --run tests/scenarioOutlineConsistency.test.ts tests/runtimeMapProducts.test.ts tests/viewPresets.test.ts tests/boundarySelection.test.ts tests/selectionHighlights.test.ts`
- `npm run build`
- `scripts/validate-runtime-geometry-family.mjs` via the review builder

### Test note

An extra strict test was attempted to force scenario Region-border arcs to match dissolved outline exteriors byte-for-byte.

That check was removed again because equivalent closed linework can still differ in:

- coordinate precision
- vertex placement
- line segmentation

The fix itself was kept; only the over-strict representation check was discarded.

### Recovery state

The review family remains active and explicit:

- `src/lib/config/runtimeMapProducts.json`
  - `activeProductId: sharedFoundationReview`

Review address:

- `http://127.0.0.1:5174/dmsGIS/`

## Fifth Review Retry: JMC London District Visual Separation

After the scenario dissolve fix, one JMC issue remained:

- `London District` was correctly assigned as its own Region
- its outline geometry existed and was closed
- but it still did not read as its own bordered Region in visual inspection

### What was wrong

The problem was not missing geometry.

Both files already contained a valid `London District` feature:

- `public/data/compare/shared-foundation-review/regions/UK_JMC_Outline_arcs.geojson`
- `public/data/compare/shared-foundation-review/regions/UK_JMC_Outline_simplified.geojson`

The real problem was styling in:

- `src/lib/config/viewPresets.json`

`London District` in `coa3a` was using the same green as `JMC South East`:

- fill
- border
- outline

So London visually collapsed into the neighbouring South East styling even though the Region grouping itself was correct.

### Fix applied

Changed `coa3a` / `London District` styling in:

- `src/lib/config/viewPresets.json`

from the South East green to the established London purple:

- `#8767ac`

This updated:

- `color`
- `borderColor`
- `colors.populated`
- `colors.unpopulated`
- `colors.outline`

### Validation

Checks passed:

- `npm run test -- --run tests/viewPresets.test.ts tests/runtimeMapProducts.test.ts tests/boundarySelection.test.ts tests/selectionHighlights.test.ts`
- `npm run build`
