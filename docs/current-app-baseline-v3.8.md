# Current App Baseline v3.8

This document records the active `v3.8` runtime state after the full-UK `BSC-first` runtime family cutover across both `Current` and `2026`.

Treat this as the active live baseline in the main repo.

For the next clean paired rebuild/reset path from source, also read:

- `docs/paired-current-2026-product-success-path.md`

The prior rollback point remains:

- `docs/current-app-baseline-v3.7.md`

## Baseline Identity

- logical baseline version: `v3.8`
- package version at time of writing: `0.1.0`
- repo path: `/Users/andrew/Projects/dmsGIS`

## Naming Note

This baseline still uses a mix of:

- older public contract names
- newer internal build/review/runtime-family names

That should be treated as deliberate sequential replacement, not accidental inconsistency.

Current rule:

- public app/runtime file names stay stable when they are still part of the live contract
- newer source lineage, preprocess logic, and runtime routing can be improved behind those stable names
- review-family and accepted-runtime token names are allowed to be newer and clearer
- broad public-path renaming should wait for an explicit cutover, not happen opportunistically mid-rebuild

So when an older filename remains in place here, it does not automatically mean the old processing lineage is still authoritative.

## Runtime Family

The app contract is unchanged, but the shipped runtime geometry family is now rebuilt from the `v3.8` source family.

Important paired-build rule:

- `Current` and `2026` are built together from one shared canonical family
- the explicit branch point is the 2026 NHS merge/redraw stage
- ward `BSC` is only used for the three special `Current` split internals, not as a general 2026 coastal source
- the active paired-stage comparison artifact is:
  - `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`
- that report now includes:
  - `boardEntries` for the seven changed England 2026 boards
  - `componentEntries` for the overlapping changed-board clusters
- use it when checking whether non-`Current` East products have drifted away from the orange `Current` baseline

### Current

`Current` runtime boards now rebuild from:

- `42` direct official England ICB `BSC`
- `26` devolved boards rebuilt from gently simplified upstream geometry for a shared runtime `BSC-like` family

The shipped runtime files remain the same public contract:

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`

### 2026

`2026` runtime boards now rebuild from:

- `29` direct official England ICB `BSC`
- `4` merge-only England boards rebuilt from exact 2026 SICBL internals constrained to predecessor `Current` / official ICB `BSC` shells
- `3` Frimley-driven England boards rebuilt from exact 2026 redraw geometry constrained to those same predecessor `Current` / official ICB `BSC` shells
- `26` devolved boards rebuilt from gently simplified upstream geometry for a closer `BSC-like` runtime family

Important `v3.8` correction:

- the `4` merge-only England 2026 boards must not be rebuilt as whole-ICB `BSC` dissolves
- that introduced large overlaps across:
  - `NHS Central East Integrated Care Board`
  - `NHS Essex Integrated Care Board`
  - `NHS Norfolk and Suffolk Integrated Care Board`
- they now keep the exact 2026 SICBL-derived internal recombination logic
- but their outer geometry is constrained back to the union of the predecessor official 2023 ICB `BSC` shells
- this removes the non-BSC inlet/coastal detail that had been leaking through the raw SICBL `BFC` merge path
- the same shell rule now also applies to the `3` Frimley-driven redraw boards
- their exact redraw logic is preserved, but they are rebuilt as one overlapping component from predecessor `Current` / official ICB `BSC` shells so they cannot introduce new coastal protrusions versus the orange `Current` baseline

The shipped runtime files remain the same public contract:

- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`

Important preprocessing seam:

- both `Current` and `2026` now use the same runtime treatment in `scripts/preprocess-boundaries.mjs`:
  - clip + topological simplify (`5%`)
- the earlier `2026 = clip-only` experiment was backed out after it made the merged and scenario products visibly denser than `Current`
- the merged `2026` export now also reapplies the changed-England predecessor-shell constraint after simplification
  - changed-board components rebuild from the already-built `Current` runtime shell
  - then yield to already-built neighboring 2026 runtime boards where those neighbors meet them
- the active paired-stage report is:
  - `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`
- current measured result from that report:
  - source-stage max extra area outside predecessor `Current` shells: `0.0 m²`
  - runtime-stage max extra area outside predecessor `Current` shells: `333.9 m²`
- facility preprocessing is now symmetric too:
  - `scripts/enrich-facilities.mjs` snaps inward against the assigned `Current` boundary first and the assigned `2026` boundary second when needed
- this restores one shared processing design across both runtime families while preserving `118/118` domestic facility containment in both systems

## Split-ICB Contract

The three `Current` split parents remain intact:

- `E54000025`
- `E54000042`
- `E54000048`

Their internal assignment is now built from the official ward `BSC` source:

- `geopackages/compare_sources/Wards_December_2025_UK_BSC.gpkg`

The exact ward `BFC` source remains available as fallback/provenance input:

- `geopackages/WD_DEC_2025_UK_BFC_-2745845960906252656.gpkg`

Ward `BSC` was promoted after the full three-parent split rebuild path preserved the accepted exact assignment keys once the Hampshire explicit overrides were ported for:

- `Newbury Greenham`
- `Redlynch & Landford`

Important `v3.8` hardening:

- `scripts/build_current_split_icb_runtime.py` now clips split runtime features to live parent runtime geometry in projected CRS before reprojection
- then normalizes again after reprojection
- the shipped split GeoJSON is also written at `7` decimal places so reprojection rounding does not reintroduce tiny overlaps against neighboring current boards
- this prevents tiny invalid/overlapping slivers from reappearing against the new `BSC` parent family

Current split-outline follow-up:

- selected `Current` Region-border highlight for split cases should now route back through the precomputed `current_*.geojson` outline contract
- those `current_*.geojson` files are now rebuilt from one prepared split-aware topology of the live `Current` family:
  - whole non-split boards are included once with their assigned Region group
  - hidden split parents are excluded from the whole-board side
  - ward-split features are inserted with group ownership from `region_ref`
  - the final per-group outline arc is meshed from that shared topology
- this is the current preferred path because it keeps `Current` split Region borders on one prepared seam family instead of rediscovering them from runtime dissolve
- in this checkout the accepted live rebuild target for those outline files is:
  - `public/data/compare/shared-foundation-review/regions/outlines/`
  - not the incomplete/stale plain `public/data/regions/outlines/` mirror

## Overlays

Stable default-off overlays remain part of the production overlay model:

- `NHS England Regions (2024 BSC)`
  - `public/data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson`
- `SJC JMC`
  - `Current` overlay path: `public/data/regions/UK_JMC_Outline_arcs.geojson`

Scenario presets now also expose the shared overlay families in the Overlays pane:

- `NHS Regions`
- `Custom Regions`

For scenario presets, the `SJC JMC` overlay row uses the same rebuilt runtime JMC outline:

- `public/data/regions/UK_JMC_Outline_arcs.geojson`
- displayed in the overlay row as `SJC JMC`

This is additive overlay wiring only. It does not change the scenario preset contract itself.

Scenario-region outline note:

- the scenario board products still sit on the merged `2026` family
- but the scenario Region-border products are no longer a pure dissolve of that mixed source family
- `SJC JMC`, `COA 3a`, `COA 3b`, and the two COA Playgrounds now use a hybrid outline source:
  - English scenario groups still dissolve from the merged `2026` runtime board family
  - devolved scenario groups now use official `Countries (December 2023) UK BSC`
- affected files:
  - visible overlay arc collections:
    - `public/data/regions/UK_JMC_Outline_arcs.geojson`
    - `public/data/regions/UK_COA3A_Outline_arcs.geojson`
    - `public/data/regions/UK_COA3B_Outline_arcs.geojson`
  - polygon lookup products retained for hit-testing / lookup:
  - `public/data/regions/UK_JMC_Outline_simplified.geojson`
  - `public/data/regions/UK_COA3A_Outline_simplified.geojson`
  - `public/data/regions/UK_COA3B_Outline_simplified.geojson`
  - `public/data/regions/outlines/coa3a_*.geojson`
  - `public/data/regions/outlines/coa3b_*.geojson`
  - `public/data/regions/outlines/coa3c_*.geojson`
- this was done to stop scenario Region borders from inheriting the older devolved geometry still present inside the mixed `2026` board family
- selected/group Region borders now also prefer topology-derived exterior arcs from the shipped board products before any dissolve fallback
- that keeps the thick selected Region border sitting on the same arc network as the internal ICB/HB seams instead of approximating them through a separate dissolve first
- static scenario selection now prefers those precomputed topology-aligned outline files
- the visible scenario Region-boundary overlay now also uses merged topology-derived arc collections per preset instead of the dissolve-first polygon lookup products
- the dissolve-first polygon outline files remain only as scenario lookup / hit-test products via `lookupBoundaryPath`
- live derived Region-outline sources remain the first-choice path only for Playground / draft-aware selection

## Sidebar Popover And Helper-Control Conventions

The active Exact sidebar now uses one normalized field-order convention inside existing popover sections:

- Facilities / PMC point sections: `Shape`, `Colour`, `Size`, `Opacity`
- other comparable sections: `Colour`, `Size`, `Thickness`, `Opacity` where applicable
- where only two comparable fields exist, order still stays fixed:
  - `Colour`, `Opacity`
  - `Thickness`, `Opacity`

Section titles and section splits are intentionally unchanged. Only field order was normalized.

Shared helper-button treatment is also now explicit and centralized in:

- `src/components/sidebarExact/ExactFields.tsx`

Current accepted behavior:

- copy and reset helper buttons use the same shared rendering path
- helper glyphs stay visually white from `100%` down to `45%` opacity
- only below `45%` do they transition toward the low-opacity grey state
- the low-opacity support underlay is glyph-shaped, not a generic patch
- the inner swatch border stays off above about `10%` opacity, then fades in below that
- at `0%`, the inner swatch border resolves to the same default grey used by the outer helper treatment

PMC-specific accepted behavior:

- the global `Points > Colour` control in the Facilities / PMC title popover now has a reset helper
- that reset restores all PMC region colours to their original per-region preset defaults
- PMC `Border` copy helpers no longer borrow `Points` opacity; they preview their own fill colours at full opacity
- scenario populated / unpopulated fill styling now resolves from one effective facilities-driven populated-code set spanning both current/v10 and merged/2026 board families, so non-Current presets and Playground stay correct when their board basis changes

Top-bar selection behavior:

- when a facility is selected, the `Population at Risk (PAR)` header pane now shows:
  - `Facility PAR: x`
  - `Region PAR: y`
- `Facility PAR` comes from the selected facility record
- `Region PAR` is summed from the active facilities source on the same assignment/display-region basis currently used by the header

## Masks, Facilities, And Derived Products

The rebuilt runtime family also regenerated:

- topology edges
- scenario board derivatives
  - `Current` stays on the rebuilt unmerged/current `v3.8 BSC` board family (`68` boards)
  - `SJC JMC`, `COA 3a`, and `COA 3b` derive from the rebuilt merged `2026 BSC` board family (`62` boards)
  - the two COA Playgrounds inherit that same merged scenario board basis from their source presets
  - scenario differences are assignment / colour contracts layered on the merged board family
  - the merged scenario products now visibly follow the rebuilt `2026` BSC-like runtime family itself, not only the earlier hybrid selected-outline correction
- dissolved group outlines
  - scenario dissolved Region outlines now use the hybrid BSC outline source above for devolved groups
  - selected/group Region-outline files now prefer topology-first exterior arcs for seam alignment
- inland-water outline subsets
- land / sea masks
- facilities boundary assignments

Active facilities dataset is now the replacement `30 Mar 2026` export:

- active file:
  - `public/data/facilities/facilities.geojson`
- archived legacy file retained but no longer active:
  - `public/data/facilities/facilities_legacy_pre_2026-03-30.geojson`
- importer:
  - `scripts/import-facilities-csv.mjs`
- source:
  - `Export_30_Mar_26.csv`

Current facilities baseline notes:

- `135` facilities total
- `118` match `Current` shipped board polygons
- `118` match merged `2026` board polygons
- the `17` unmatched facilities are the expected `Overseas` records outside the UK board products
- `Hamworthy Napier Road Medical Centre` is normalized to `South West`
- `Scotland & North` is normalized to `Scotland & Northern Ireland`
- `Royal Navy Baseport` rows normalize to the new `Royal Navy` PMC region
- `Royal Navy` now uses navy blue `#000080`
- facilities with `Status = Closed` now import with `default_visible = 0`
- runtime facility rendering and point-hit selection now both respect `default_visible = 0` even when the parent PMC region itself remains visible
- the legacy reviewed coastal snap count is no longer the active metric; the replacement import currently needs `0` assigned-current-boundary snaps after enrichment
- `Nairobi Medical Centre` uses one importer-level coordinate override because the replacement CSV is missing its latitude / longitude fields

## Runtime Token

The active runtime token is now the accepted `v3.8` family token:

- `src/lib/config/runtimeMapProducts.json`
- `activeProductId: "acceptedV38"`

Important qualification:

- the accepted token currently still resolves to:
  - `data/compare/shared-foundation-review/...`
- this is intentional for now
- the governance fix is that the active token now names the family as accepted runtime rather than as a temporary review-only product
- a later explicit physical promotion can still move the same accepted family back under `public/data/...` if desired

The older compare families remain on disk for historical reference only:

- `bfe`
- `currentEastBsc`

They are not the active runtime family.

## Deferred Runtime Note

The current `v3.8` baseline keeps the improved startup framing and world-floor zoom work, but one map-runtime issue remains deferred:

- the `0%` zoom-floor world framing can still drift vertically on later zoom-out steps
- this can push the visible world upward and clip part of the southern hemisphere even when horizontal centering is correct
- the latest diagnostics-heavy zoom-pane expansion was not retained; map diagnostics now stay available programmatically through `window.__dmsGISMapDiagnostics`, but are hidden from the visible zoom control

Treat this as follow-up map-runtime work, not as a reason to reopen the accepted `v3.8` geometry-family baseline.

## Validation

This baseline passed:

- `node scripts/build_v38_full_bsc_runtime_family.mjs`
- `node scripts/validate-runtime-geometry-family.mjs`
- `npm run test -- --run tests/runtimeGeometryValidation.test.ts tests/runtimeMapProducts.test.ts tests/layersService.test.ts tests/appStore.test.ts tests/overlaySelectors.test.ts tests/overlayBoundaryReconciliation.test.ts tests/overlayPanelFields.test.ts`
- `npm run test -- --run tests/appStore.test.ts tests/overlaySelectors.test.ts tests/overlayBoundaryReconciliation.test.ts tests/overlayPanelFields.test.ts tests/runtimeMapProducts.test.ts tests/layersService.test.ts tests/basemapAlignment.test.ts tests/boundarySystems.test.ts`
- `npm run build`
