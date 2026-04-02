# Agent Handover

This is the canonical handover document for continuing development in this repository.

Use this document as the first read for any new Codex, Claude Code, or similar coding-agent session.

Current repo-wide assessment note:

- `docs/main-repo-review-2026-03-31.md`
- `docs/recovery-state-2026-04-01-main-repo.md`

Current repo-recovery note:

- on 1 April 2026, active work crossed between the real main repo at `/Users/andrew/Projects/dmsGIS` and the separate iCloud checkout under `Library/Mobile Documents/.../dmsGIS`
- treat `docs/recovery-state-2026-04-01-main-repo.md` as the canonical record of:
  - the local commit line above GitHub `main`
  - the detached-HEAD state in the main repo
  - the fact that `jj` history remained intact
  - the fact that the iCloud checkout does not currently carry the same Facilities / Combined Practices runtime surface

Current replay/runtime-asset note:

- after the full saved local line was replayed onto a clean GitHub-`main` base, one more runtime contract bug surfaced and is now part of the recovery truth:
  - `data/manifests/layers.manifest.json` stays on the stable public root
  - only the layer entries inside that manifest are runtime-rewritten into the active family
  - in this app's dev setup, asset URLs remain base-path aware and resolve under `/dmsGIS/data/...`, not `/data/...`

Current runtime-product governance note:

- the accepted live runtime token is now:
  - `acceptedV38`
- runtime token source remains:
  - `src/lib/config/runtimeMapProducts.json`
- the accepted token still points at:
  - `public/data/compare/shared-foundation-review/`
- this is an intentional interim governance decision:
  - the accepted `v3.8` family remains rooted in the review-family data tree until a later explicit physical promotion moves it back under `public/data/...`
  - but the active token should no longer present that accepted runtime as if it were still merely a temporary review family

Current naming-governance note:

- the repo still intentionally carries a mix of older public contract names and newer internal/runtime-family names
- this should be treated as a deliberate sequential replacement process
- stable public names may remain in place while:
  - source lineage is improved
  - preprocess ownership is improved
  - runtime routing is improved
- broad public renaming should happen only through an explicit cutover, not as incidental cleanup during geometry repair

## Purpose

This handover exists to let a new coding agent resume work without re-deriving:

- project purpose
- current architecture
- current sidebar replacement state
- accepted working patterns
- next-step priorities
- validation and checkpoint discipline

This document is a stable operator-facing summary.

## Working Preference

For investigations, implementation, preprocessing, tooling, testing, and debugging across this repo:

- prefer whichever dependencies and tools are most architecturally sensible for the task
- if a missing dependency is small and low-risk, install it directly rather than stopping momentum
- if the dependency/setup choice is a major decision, pause and ask before proceeding
- do not silently let missing packages derail the work without either installing them or surfacing the blocker clearly

This is especially relevant for the geospatial side of the app, where `GDAL`, `Turf`, and similar supporting tools are often the most sensible fit, but the rule is not limited to geometry work.

Communication preference now promoted to repo guidance:

- after each non-trivial implementation or debugging pass, provide a short plain-English summary of:
  - the most recent development
  - the practical meaning of that change
  - the next sensible step
- this is especially important during visual-check/debug loops so the user does not have to infer state from internal filenames, checkpoints, or code-level terminology alone

Current preset-switch contract note:

- changing production map state between `Current`, `SJC JMC`, `COA 3a`, `COA 3b`, and Playground should clear transient selection state only:
  - selected facility ids
  - selected ICB / Health Board name
  - selected JMC / scenario Region name
- live PMC point presentation state should persist across those mode switches:
  - global symbol shape
  - global symbol size
  - per-Region point style settings
  - combined-practice point/border styling
- `Reset active view preset` is intentionally different:
  - it should still restore the active preset baseline instead of carrying customized point presentation state forward

Current selection-summary contract note:

- when an `ICB / Health Board` remains selected without an active facility point selection, the TopBar PAR pane should still show the selected region summary:
  - `Region`
  - `Baseport`
  - `Total`
- this should be produced through the shared PAR-summary path rather than a presentation-only fallback, so point-selected and boundary-only summaries stay on one calculation contract

Current validated repo-health note:

- the confirmed `v3.8` main-repo baseline is currently clean through `npm run lint`, `npm run test -- --run`, `npm run build`, and `npm run test:e2e`
- startup facilities-derived store state now routes through one cached dataset loader in `src/lib/services/facilityDataset.ts`, so the app no longer re-fetches/parses the same facilities GeoJSON repeatedly during `loadLayers()`
- production build output is now manually chunked in `vite.config.ts`, and the saved-views dialog is now lazy-loaded from `src/app/App.tsx`; the main app chunk is no longer sitting in one warning-sized block
- water-edge modifier layers in `src/features/map/MapWorkspace.tsx` now only recreate `VectorSource` instances when the underlying source URL changes, not on every style/visibility update
- the active sidebar toggle labels now use full-button centering instead of a manual downward text nudge, which is the intended fix for the Windows Edge `On` / `Ox` / `Off` label drift
- `.vite/` is local-only cache output and should not be tracked or republished from this repo
- facility runtime metadata derived from the facilities GeoJSON should now be loaded through one shared cached fetch path in `src/lib/services/facilityDataset.ts`, so startup state derivation and the Facilities search field do not each re-fetch and re-parse the same dataset independently

Current paired-runtime-family note:

- `Current` and `2026` should be treated as one paired build, not as two unrelated products
- the branch point is the NHS 2026 merge/redraw stage applied to the shared canonical family
- England ICB `BSC` is the canonical England coastal / board truth on both sides
- ward `BSC` is only for the three special `Current` split internals
- the active paired-stage measurement artifact is:
  - `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`
- that report measures the seven changed England 2026 boards against unions of their `Current` predecessor boards at source and runtime stages, and is the right first check when scenario / 2026 East geometry appears to drift away from the `Current` orange baseline

Current shared-foundation review note:

- the accepted live runtime family is currently tokenized as:
  - `acceptedV38`
- runtime token source:
  - `src/lib/config/runtimeMapProducts.json`
- accepted data root:
  - `public/data/compare/shared-foundation-review/`
- review execution history:
  - `docs/shared-foundation-review-execution-log.md`
- accepted review outcomes so far:
  - `Current` split-region borders were fixed by removing the bad whole-parent `Hampshire and Isle of Wight` assignment and rebuilding `Current` outlines from dissolve-derived group geometry
  - static scenario Region-border overlays now prefer dissolve-derived group exteriors instead of the brittle topology-mesh-first path
  - `SJC JMC` `London District` is a real separate Region in the review family and now uses London purple (`#8767ac`) so it reads separately from `JMC South East`
  - Playground dynamic scenario borders now prefer a dedicated preloaded shared `2026` topology-edge source and only fall back to polygon dissolve when no edge source exists
  - same-Region internal seams in Playground should therefore now be removed at the seam-selection stage rather than being left for dissolve cleanup to infer later
  - a later Playground regression was traced to `src/lib/config/scenarioWorkspaces.ts`, where interactive baseline assignment datasets were still loading from raw `data/regions/...` preset paths instead of the active accepted runtime-family root; keep Playground baseline assignment paths aligned with `resolveRuntimeMapProductPath(...)`
  - Playground runtime source authority is now composed through `src/features/map/playgroundRuntimeSession.ts` instead of being recombined ad hoc inside `MapWorkspace.tsx`; keep baseline source choice, runtime assignment source, derived outline source, diagnostics, and layer override composition together there
  - the next optimisation boundary on top of that session now lives in `src/features/map/scenarioAssignmentAuthority.ts`; keep downstream assignment lookups and future indexing/caching there rather than reintroducing point-selection- or PAR-specific lookup copies
  - architectural map for future optimisation work:
    - `docs/map-runtime-architecture-map-2026-04-02.md`
  - the selected ICB / Health Board helper outline is intentionally a stronger large dashed yellow overlay so active board selection remains readable while Playground reassignment/border behavior continues to stabilize
  - remaining `Current` split-case visual defects should currently be understood as a seam-ownership problem, not as a source-provenance problem:
    - parent `Current` boards are still on the accepted `BSC-first` family
    - split internals are still built from official ward `BSC`
    - the residual white-gap / non-coincident-border issue appears when the app mixes:
      - whole-parent ICB helper geometry
      - split-region selection geometry derived from split polygons
      - and separately prepared outline products
  - the next repair path for `Current` split cases should therefore be:
    - preprocessing-owned
    - contract-preserving
    - shared-seam-first
  - keep the public app/runtime paths stable:
    - `public/data/regions/UK_WardSplit_simplified.geojson`
    - `public/data/regions/UK_WardSplit_internal_arcs.geojson`
    - `public/data/regions/outlines/current_*.geojson`
  - improve the build lineage behind those paths instead of inventing new app-facing runtime files mid-repair
  - runtime should prefer prepared split-aware `Current` outline products again once they are rebuilt from the same seam family as:
    - the parent ICB shell
    - the split internals
    - the selected Region-border arcs
  - that repair is now partly executed:
    - `scripts/extract-group-outlines.mjs` now rebuilds `Current` `current_*.geojson` Region outlines from one prepared split-aware topology of the live `Current` family
    - hidden split parents are excluded from the whole-board side of that topology
    - ward-split features are inserted into the same topology with group ownership from `region_ref`
    - the per-group outline arc is then meshed from that prepared topology instead of being derived from per-group dissolve alone
  - a separate Current-only debug overlay is now part of the intended split-case inspection contract:
    - overlay family id: `wardSplitWards`
    - runtime file: `public/data/compare/shared-foundation-review/regions/UK_WardSplit_Canonical_Current_exact.geojson`
    - source lineage: `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
    - scope: only the three split parents, not all UK wards
  - selection rule for that debug overlay:
    - when `wardSplitWards` is visible, those exact split wards become directly selectable and the docked `ICB / Health Board` header should show `ward_name`
    - when `wardSplitWards` is off, normal split-parent selection behavior remains in force
  - `Current` runtime selection should now prefer those prepared `current_*.geojson` files again rather than the recent live `deriveCurrentGroupOutlineFeature(...)` shortcut in `MapWorkspace.tsx`
  - visual acceptance of the split-case white-gap issue should therefore now be judged against:
    - the rebuilt prepared outline files under `public/data/compare/shared-foundation-review/regions/outlines/`
    - not against the older live-derived split outline path
  - operational caveat:
    - in this checkout, the plain `public/data/regions/` board family is incomplete/stale for these outline rebuilds
    - the accepted live rebuild target is the runtime-family tree under:
      - `public/data/compare/shared-foundation-review/regions/`
  - latest split-shell repair outcome:
    - `scripts/build_current_ward_split_exact.py` now includes an explicit Hampshire override for `Chilworth, Nursling & Rownhams` -> `South West`
    - `scripts/build_current_split_icb_runtime.py` now rebuilds dissolved split runtime geometry through a shell-first partition of:
      - canonical parent ICB shell
      - clipped split-region seams
    - this is the right pattern because ward borders must not outrank the parent ICB shell
    - companion artifacts are now expected to be refreshed together after that rebuild:
      - `UK_WardSplit_simplified.geojson`
      - `UK_WardSplit_internal_arcs.geojson`
      - `current_*.geojson` under `regions/outlines/`
  - current residual blocker after that repair:
    - split-specific validation improved substantially, but still reports a small remaining shell-coverage sliver in the accepted compare-family tree
    - latest measured blocker:
      - `E54000025` missing shell coverage still around `660.9 m²`
    - so future work should treat the remaining split-case white-gap issue as not fully closed yet
    - the likely remaining seam is the last agreement between the rebuilt split runtime partition and the shipped simplified parent board shell, not the ward assignment map itself
  - detached split-case outline fragments are now also guarded at the outline-export stage:
    - `scripts/extract-group-outlines.mjs` first prunes any `Current` split-aware outline component that sits wholly inside a split-parent shell without touching that shell boundary
    - `scripts/extract-group-outlines.mjs` now also prunes any `Current` outline component with zero dissolved-exterior coverage, so exported stray fragments fail before ship instead of surviving as stable artifacts
    - split-aware `Current` outline runs now also have non-reference endpoint tails trimmed back to the dissolved exterior
    - the specific west-Hampshire / `Blackwater` spur was later traced to a deterministic `Blackwater` / `Redlynch & Landford` shared-boundary artifact in the shipped split-aware `Current` outline exports, so `scripts/extract-group-outlines.mjs` now explicitly excludes that known segment family and its legacy tip endpoints for `Central & Wessex` and `South West`
    - `tests/currentGroupOutlineContracts.test.ts` now guards both contracts on the shipped accepted-runtime outline files:
      - no exported `Current` outline components with zero dissolved-exterior coverage
      - no missing dissolved-exterior components for split-aware `Current` groups
      - split-aware `Current` outline endpoints must land back on the dissolved exterior
      - the known `Blackwater` spur segment family must be absent from `current_central_wessex.geojson` and `current_south_west.geojson`
      - the known `Blackwater` spur tip endpoints must be absent from `current_central_wessex.geojson` and `current_south_west.geojson`
      - the known `Blackwater` spur tip is now remapped back to the shared root at approximately `[-1.619751051433103, 50.958566891040576]`
      - no component may remain wholly inside the local `Blackwater` spur box after remapping
    - practical interpretation:
      - the accepted-runtime `Current` outline guard is now aimed at shipped risk, not a broad orphan heuristic that can over-flag valid split-aware components
    - current verified state:
      - the Hampshire / Dorset `Current` border between `Central & Wessex` and `South West` is present again in the shipped outline exports
      - direct geometry inspection confirmed:
        - shared-root endpoint count present in both exported outline files
        - zero endpoints on the old bad `Blackwater` tip coordinates
        - zero remaining spur-only components in the local `Blackwater` box
- current inspection address:
  - `http://127.0.0.1:5174/dmsGIS/`

Current branch-hygiene note:

- merged codex publish branches on GitHub have now been pruned from `origin/*`
- merged-safe local branches `codex/restore-london-south-royal-navy-current` and `codex/review-family-staging` were deleted
- remaining non-`main` local branches should currently be treated as either:
  - active worktree branches
  - recovery anchors
  - intentionally unmerged historical branches

Current facilities dataset note:

- active facilities source is now the replacement `30 Mar 2026` export imported through:
  - `scripts/import-facilities-csv.mjs`
- active runtime file:
  - `public/data/facilities/facilities.geojson`
- archived previous active file:
  - `public/data/facilities/facilities_legacy_pre_2026-03-30.geojson`
- current imported counts:
  - `135` total facilities
  - `118` matched to `Current` UK boards
  - `118` matched to merged `2026` UK boards
  - the `17` misses are the expected `Overseas` facilities outside UK boundary products
- normalization rules now baked into the importer:
  - `Hamworthy Napier Road Medical Centre` missing Region -> `South West`
  - `Scotland & North` -> `Scotland & Northern Ireland`
  - `Royal Navy Baseport` -> `Royal Navy`
- facilities marked `Closed` in the replacement CSV now import with `default_visible = 0`
- runtime point styling and direct point-hit selection must both honor `default_visible = 0`; a visible PMC region must not resurrect closed facilities
- `Royal Navy` is now a production PMC region and uses `#000080`
- one documented coordinate override exists for `Nairobi Medical Centre` because the replacement CSV omits its coordinates
- facilities refresh is now meant to follow one explicit preprocessing-owned path:
  1. canonical CSV input
  2. `scripts/import-facilities-csv.mjs`
  3. `scripts/enrich-facilities.mjs`
  4. accepted runtime-family rebuild through `scripts/build-shared-foundation-review-family.mjs`
- operator-facing wrapper command:
  - `npm run refresh:facilities`
- wrapper script:
  - `scripts/refresh-facilities-from-export.mjs`
- the wrapper prints validation summaries for:
  - counts
  - PAR totals
  - duplicate `id` groups
  - shared `active_dmicp_id` groups
- current facilities source-of-truth rule:
  - do not hand-edit `public/data/compare/shared-foundation-review/facilities/facilities.geojson` as the primary update path
  - refresh from the export and rebuild the accepted runtime family instead
  - the accepted review-family facilities artifact is now expected to be an exact copy of the canonical enriched `public/data/facilities/facilities.geojson`
  - `scripts/build-shared-foundation-review-family.mjs` now throws if that parity is broken

Current Exact-sidebar convention note:

- popover section titles/splits stay as-is, but comparable field order is now normalized across the live Exact sidebar:
  - Facilities / PMC point sections: `Shape`, `Colour`, `Size`, `Opacity`
  - other comparable sections: `Colour`, `Size`, `Thickness`, `Opacity` where applicable
  - two-field sections still follow the same order: `Colour`, `Opacity` or `Thickness`, `Opacity`
- shared copy/reset helper-button treatment now lives in `src/components/sidebarExact/ExactFields.tsx`
- accepted helper-button behavior:
  - helper glyphs stay white down to `45%` opacity
  - transition below `45%` is shared between copy/reset helpers
  - support underlay is glyph-shaped
  - inner swatch border appears only below about `10%` opacity
  - PMC Border copy helpers must stay decoupled from PMC Points opacity
- the global Facilities / PMC `Points > Colour` control now has a reset helper that restores per-region default palette colours from the active preset
- the Facilities / PMC title popover now has one intentional split in semantics:
  - the main `PMC` row still reads `On / Ox / Off` from the child list items
  - the global popover `Border` button is a family control surface and now defaults to `Off` on load/preset switch instead of reflecting row-border aggregation

Current top-bar selection note:

- the `Population at Risk (PAR)` header pane is no longer a placeholder-only label
- it now uses a true internal production summary grid with six rows:
  - `Facility:`
  - `Practice:`
  - `Region:`
  - `Baseport:`
  - `Correction:`
  - `Total:`
- the grid is now a locked fixed-outer-column pattern:
  - left column = labels with trailing `:`
  - middle column = centered correction context only
  - right column = right-aligned values
- the left and right PAR columns now size at the pane level from their largest text fills, not independently per row
- the PAR pane now uses a fixed-height distributed internal row stack, so the top and bottom rows stay anchored while interior spacing remains even
- PAR rows use a stable three-column row grid so the left and right columns do not drift when the correction context is present
- only two PAR row-specific optical nudges are approved:
  - `Facility` may sit a tiny touch lower
  - `Total` may sit a tiny touch higher
- current locked PAR tuning tokens in `src/components/layout/topBar.css` are:
  - `--topbar-spacer-par-grid-font-size: 0.55rem`
  - `--topbar-spacer-par-fixed-height: 4rem`
  - `--topbar-spacer-par-grid-offset-y: calc(var(--topbar-cluster-label-offset-y) - 0.07em)`
- `Practice PAR` is derived from the selected facility’s `combined_practice`
- `Region PAR` must continue to follow the active displayed region/assignment basis rather than assuming only raw PMC region names
- `Baseport PAR` remains Royal-Navy-only, but must follow active board geography:
  - Clyde -> Scotland / Highland basis
  - Devonport -> South West / Devon basis
  - Portsmouth -> London & South / Hampshire and Isle of Wight basis on `Current`
- raw selected contribution is `Region PAR + Baseport PAR`
- `Correction PAR` is that selected contribution as a share of the overall visible PAR total, applied to a fixed `8,500` base and displayed as `(n% of 8500) value`
- the correction number itself stays at the normal PAR value size; only the parenthetical context is visually reduced
- displayed `Total PAR` is `Region PAR + Baseport PAR + Correction PAR`
- the second middle header pane now has a locked combined-practice contract:
  - non-combined / empty state stays titled `Combined Practice`
  - combined state switches to `Combined Medical Practice`
  - the `Combined Medical Practice` title now keeps a small locked `1px` downward visual offset in `src/components/layout/topBar.css` via `.topbar__spacer-label--practice-combined` so it aligns better with the live combined-practice summary block
  - the combined-practice name stays anchored to the same summary line treatment as PAR `Facility:`
  - default member layout is stacked independent lines
  - `Portsmouth Combined Medical Practice` is the only approved special-case grid treatment, with long names collapsed into full-width bottom rows

Current deferred map-runtime bug note:

- the `0%` zoom-floor world framing remains deferred work
- intended contract:
  - no wrap
  - sea-colour background beyond the visible world
  - centered cropped world view in the map pane without Antarctica
- current behavior can still drift vertically on later zoom-out steps and clip part of the southern hemisphere
- the most recent extra diagnostics expansion in the zoom pane was backed out; keep the zoom pane visually minimal and solve the issue later at the OpenLayers `View` constraint seam instead of by layering more zoom-pane instrumentation
- extra live map diagnostics still exist programmatically on `window.__dmsGISMapDiagnostics` for future debugging if needed

Current scenario-outline processing note:

- visible static scenario Region-boundary overlays should now be treated as preprocessing-owned arc products, not dissolve-time runtime approximations
- the visible overlay files are now:
  - `public/data/regions/UK_JMC_Outline_arcs.geojson`
  - `public/data/regions/UK_COA3A_Outline_arcs.geojson`
  - `public/data/regions/UK_COA3B_Outline_arcs.geojson`
- those files are merged topology-derived arc collections built from the shipped board products in `scripts/extract-group-outlines.mjs`
- the older polygon files remain in place only for scenario lookup / hit-testing:
  - `public/data/regions/UK_JMC_Outline_simplified.geojson`
  - `public/data/regions/UK_COA3A_Outline_simplified.geojson`
  - `public/data/regions/UK_COA3B_Outline_simplified.geojson`
- static scenario selection now prefers the precomputed per-group topology outline files under `public/data/regions/outlines/`
- live derived outline sources remain first-choice only for Playground / draft-aware selection
- Playground / draft-aware scenario borders should now also be treated as topology-edge-first:
  - preferred input = shipped `2026` topology edges from a dedicated preloaded source plus the live assignment map
  - fallback only = polygon dissolve when no edge source is available
  - this replaces the earlier drift where Playground tried to rediscover Region borders from dissolved board polygons or indirectly from a visible overlay-layer source

Browser automation note:

- repo-local terminal Playwright CLI usage should prefer bundled Chromium, not the local Google Chrome app
- this repo now carries `.playwright/cli.config.json` to force `browserName: chromium` with `channel: chromium`
- if `playwright-cli` starts asking for Chrome again, verify that config file is present before assuming Chrome must be installed system-wide

For detailed implementation status and execution rules, also read:

1. `docs/sidebar-pane-status.md`
2. `docs/prototype-to-production-playbook.md`
3. `docs/agent-continuation-protocol.md`
4. `docs/current-app-baseline-v3.8.md`
5. `docs/current-app-baseline-v3.7.md`
6. `docs/current-app-baseline-v3.6.md`
7. `docs/current-app-baseline-v3.5.md`
8. `docs/current-app-baseline-v3.4.md`
9. `docs/v3.4-internal-gap-regression.md`
10. `docs/v3.5-full-geometry-redress.md`
11. `docs/v3.7-next-phase.md`
12. `docs/canonical-board-rebuild-workflow.md`

## Current Baseline And Next Major Path

The recoverable current production baseline is explicitly documented in:

- `docs/current-app-baseline-v3.8.md`

The prior rollback point is documented in:

- `docs/current-app-baseline-v3.7.md`

The earlier rollback milestones are preserved in:

- `docs/current-app-baseline-v3.6.md`
- `docs/current-app-baseline-v3.5.md`

The prior rollback milestones are preserved in:

- `docs/current-app-baseline-v3.4.md`
- `docs/current-app-baseline-v3.3.md`
- `docs/current-app-baseline-v3.2.md`
- `docs/current-app-baseline-v3.1.md`

`v3.7` is now the immediate return target below the active `v3.8` runtime family.

Important qualification:

- `v3.6` is the locked rebuild-formalization baseline
- `v3.5` remains the first live coherent geometry-family rebuild, not another incremental repair slice
- the `v3.4` regression history remains important context for why the rebuild was needed
- see `docs/current-app-baseline-v3.6.md`, then `docs/current-app-baseline-v3.5.md`, then `docs/current-app-baseline-v3.4.md` and `docs/v3.4-internal-gap-regression.md` for the transition history

The approved next major path is documented in:

- `docs/v3.7-next-phase.md`
- `docs/v3.7-water-edge-staged-approach.md`
- `docs/v3.7-coastal-envelope-compare-plan.md`
- `docs/v3.8-bsc-runtime-family-spec.md`
- `docs/paired-current-2026-product-success-path.md`
- `docs/paired-current-2026-execution-checklist.md`

The longer canonical-source and preprocessing replacement workflow remains documented in:

- `docs/canonical-board-rebuild-workflow.md`

Use that split this way:

- `docs/current-app-baseline-v3.8.md` = the active full-UK `BSC-first` runtime family baseline
- `docs/current-app-baseline-v3.7.md` = the prior compare/inspection rollback point
- `docs/current-app-baseline-v3.6.md` = the prior locked rebuild-formalization baseline
- `docs/current-app-baseline-v3.5.md` = the prior coherent rebuild rollback point
- `docs/v3.5-full-geometry-redress.md` = the architectural rationale for that coherent rebuild path
- `docs/v3.6-rebuild-phase-replication-plan.md` = the rebuild-formalization execution brief that has now been completed
- `docs/v3.7-next-phase.md` = the next version boundary after `v3.6`
- `docs/v3.7-water-edge-staged-approach.md` = the first active `v3.7` hydro/coast classification design and tokenization slice
- `docs/v3.7-coastal-envelope-compare-plan.md` = the next approved preprocessing compare path after the water-edge runtime-masking approach proved insufficient
- `docs/v3.8-bsc-runtime-family-spec.md` = the approved replacement direction after the `v3.7` compare path proved insufficient; use this for the next full-UK rebuild phase
- `docs/paired-current-2026-product-success-path.md` = the concrete paired rebuild/reset brief for the next full product-family rebuild; use this before any further board/scenario/outline patching
- `docs/paired-current-2026-execution-checklist.md` = the practical script/stage implementation map for that paired rebuild; use this when converting the reset brief into actual execution work
- `docs/canonical-board-rebuild-workflow.md` = the deeper source/provenance workflow and longer-term canonical replacement record
- current `v3.7` execution status:
- shared draft hydro/water-edge config is in place
- hydro-normalized landmask profile artifacts have been materialized under `geopackages/outputs/uk_landmask/`
- review-time classified water-edge arc helper products are now materialized under `geopackages/outputs/water_edges/`
- the earlier water-edge runtime border-modifier treatment is now superseded diagnostic work, not the active shipped solution
- `src/lib/config/waterEdgeTreatment.json` is now `draft-not-active`
- the approved replacement direction for that unsuccessful runtime-masking seam is now the official-source coastal-envelope compare path
- local official compare inputs are already materialized under `geopackages/compare_sources/`:
  - `Integrated_Care_Boards_April_2023_EN_BFC.gpkg` (`42` features)
  - `Integrated_Care_Boards_April_2023_EN_BGC.gpkg` (`42` features)
  - `Local_Health_Boards_December_2023_WA_BFC.gpkg` (`7` features)
  - `Local_Health_Boards_December_2023_WA_BGC.gpkg` (`7` features)
- source acquisition for the first England/Wales compare pass is therefore complete
- the failed live-mutating compare workflow has now been replaced by an isolated compare-family workflow
- the first prepared compare family is:
  - `public/data/compare/bfe/`
- there is now an additional isolated East-only inspection family:
  - `public/data/compare/current-east-bsc/`
- the active runtime token is now:
  - `src/lib/config/runtimeMapProducts.json`
  - `activeProductId: "baseline"`
- the rejected review token was:
  - `activeProductId: "bfe"`
- that `bfe` compare family uses:
  - England `NHS England Regions EN BFE` for outer coast
  - Wales `LHB WA BFE` for outer coast
  - Scotland `UK Countries BFE` for outer coast
  - Northern Ireland `UK Countries BFE` for outer coast
- compare families are now built via:
  - `node scripts/build-runtime-compare-family.mjs bfe`
- the live baseline files under `public/data/regions/` and `public/data/basemaps/` are no longer mutated by compare swaps
- the East-only inspection family token-swaps facilities as well:
  - compare manifest path resolves through the runtime token
  - compare facilities path resolves to `public/data/compare/current-east-bsc/facilities/facilities.geojson`
  - that compare facilities file is filtered to `region: "East"`
- review result: the tokenized `bfe` compare family still showed coastal inaccuracies and artefacts and is not an accepted shipped replacement
- East-only `Current` review work also confirmed that the compare/reconstruction branch is not the final solution; it is diagnostic only
- approved `v3.8` direction is now implemented:
  - direct `BSC-first` full-UK runtime rebuild across both `Current` and `2026`
  - runtime/store/sidebar/app contracts preserved
  - land-sea mask workflow preserved
  - `Current` split-ICB runtime rebuilt against the new `BSC` parents
- first concrete `v3.8` source-family builder exists:
  - `scripts/build_v38_bsc_source_family.py`
  - outputs under `geopackages/outputs/v38_bsc_runtime_family/`
- measured first-slice source composition from that builder:
  - `Current`
    - `42` direct official England ICB `BSC`
    - `26` devolved boards now pass through a gentle upstream-derived `BSC-like` simplification before runtime emission
  - `2026`
    - `29` direct official England ICB `BSC`
    - `4` England `ICB` features now keep their exact SICBL-derived 2026 internals but are constrained to predecessor `Current` / official ICB `BSC` shells
    - `3` England `ICB` features now keep their exact 2026 redraw logic but are constrained to those same predecessor `Current` / official ICB `BSC` shells
    - `26` devolved boards now pass through a gentle upstream-derived `BSC-like` simplification before runtime emission
- full-family orchestrator now exists:
  - `scripts/build_v38_full_bsc_runtime_family.mjs`
- full-family result:
  - the live `Current` and `2026` runtime families now rebuild from the mixed `v3.8` source family and pass masks, facilities, split-ICB, and full geometry validation
- important paired-process correction after the first broad `BSC-like` pass:
  - the real operator-facing drift was that `Current` and `2026` had stopped following the same runtime treatment philosophy
  - the rejected intermediate state was:
    - `Current` runtime preprocessing = clip + topological simplify
    - `2026` runtime preprocessing = clip-only
  - that made the merged `2026` family and scenario products visibly denser and more river/inlet-heavy than `Current`
  - active `v3.8` rule is now:
    - `Current` runtime preprocessing = clip + topological simplify (`5%`)
    - `2026` runtime preprocessing = clip + topological simplify (`5%`)
  - the merged `2026` runtime export now also reapplies the changed-England predecessor-shell constraint after simplification, using the already-built `Current` runtime family as the shell baseline
  - paired-stage measurement is now written to:
    - `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`
  - current measured result there:
    - source-stage max extra area outside predecessor `Current` shells: `0.0 m²`
    - runtime-stage max extra area outside predecessor `Current` shells: `333.9 m²`
  - facility placement is now symmetric too:
    - `scripts/enrich-facilities.mjs` snaps against the assigned `Current` board first and the assigned `2026` board second when needed
  - this restores one shared runtime design language while still keeping `118/118` domestic facilities inside both shipped board families
- scenario-outline correction after the mixed-family cut:
  - `SJC JMC`, `COA 3a`, `COA 3b`, and both COA Playgrounds remain on the merged `2026` board basis for fills/assignment
  - but their Region-border products no longer dissolve devolved groups from the mixed `2026` board family
  - devolved scenario groups now come from official `Countries_December_2023_UK_BSC.gpkg`
  - English scenario groups still dissolve from the merged `2026` board family
  - files regenerated through this seam:
    - `public/data/regions/UK_JMC_Outline_simplified.geojson`
    - `public/data/regions/UK_COA3A_Outline_simplified.geojson`
    - `public/data/regions/UK_COA3B_Outline_simplified.geojson`
    - `public/data/regions/outlines/coa3a_*.geojson`
    - `public/data/regions/outlines/coa3b_*.geojson`
    - `public/data/regions/outlines/coa3c_*.geojson`
  - selected/group Region-border files now prefer topology-derived exterior arcs from the shipped board products before any dissolve fallback
  - that keeps the thick selected Region border on the same arc network as the internal ICB/HB seams instead of drifting through an independent dissolve-first path
- important 2026 source guardrail from the first live cut:
  - the `4` merge-only England 2026 boards must not be rebuilt as whole-ICB `BSC` dissolves
  - that created real overlapping runtime polygons and visible double-dark fills in:
    - `NHS Central East Integrated Care Board`
    - `NHS Essex Integrated Care Board`
    - `NHS Norfolk and Suffolk Integrated Care Board`
  - the live correction is:
    - keep the exact SICBL-derived 2026 internal recombination logic
    - rebuild those `4` boards as one overlapping East component inside predecessor `Current` / official ICB `BSC` shells in the source-family builder
    - apply the same overlapping-component rule to the `3` Frimley-driven redraw boards
    - rebuild those changed components again after 2026 runtime simplification so the shipped file cannot drift back outside the shared `Current` coastal envelopes
    - at runtime, let those rebuilt components yield to already-built neighboring unchanged 2026 boards where those neighbors meet them, so the final family stays overlap-free
- important split-runtime hardening landed during that cut:
  - `scripts/build_current_split_icb_runtime.py` must clip the split runtime product to live parent geometry in projected CRS before reprojection, then normalize again after reprojection
  - otherwise `E54000025` can reintroduce tiny invalid/overlapping slivers and fail the runtime geometry gate
  - the shipped split GeoJSON must now also be written at `7` decimal places; at `6`, reprojection rounding can push `E54000048` back into a false overlap with neighboring current boards even though the dissolved GPKG remains clean
- geometry-family validation now also includes a coarse main-board overlap guard, so billion-square-metre runtime overlaps cannot pass silently again
- `scripts/validate-runtime-geometry-family.mjs` now also matches the current live scenario basis correctly:
  - `UK_JMC_Board_simplified.geojson` expected count is `62`, not the older `68`
  - domestic facility containment checks now exclude the expected `Overseas` rows from the replacement facilities CSV
- refreshed official `BSC` source bundle is now local under:
  - `geopackages/compare_sources/`
  - refreshed by `scripts/fetch_v37_coastal_compare_sources.py`
  - notable current files:
    - `Integrated_Care_Boards_April_2023_EN_BSC.gpkg`
    - `NHS_England_Regions_January_2024_EN_BSC.gpkg`
    - `Countries_December_2023_UK_BSC.gpkg`
- new stable default-off reference overlays now exist in the production overlay model:
  - `NHS England Regions (2024 BSC)`
    - family `nhsRegions`
    - path `public/data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson`
    - built from the official ONS `NHS England Regions (January 2024) EN BSC` source by `scripts/build_official_overlay_products.py`
  - `SJC JMC`
    - family `customRegions`
    - path `public/data/regions/UK_JMC_Outline_simplified.geojson`
    - grouping definitions still come from `viewPresets.json`
    - the current-mode overlay now uses the same rebuilt runtime JMC outline family as the scenario presets, so the overlay contract no longer diverges by mode
- `NHS England Regions (2024 BSC)` remains a stable reference overlay product
- `SJC JMC` now follows the rebuilt runtime JMC outline path so its overlay behavior stays consistent across `Current` and scenario modes
- scenario presets now also expose the shared `nhsRegions` and `customRegions` overlay families in the Overlays pane
  - the scenario `SJC JMC` overlay row is now labeled `SJC JMC`
  - and targets `public/data/regions/UK_JMC_Outline_simplified.geojson`
- East-only inspection builder:
  - `node scripts/build-current-east-bsc-family.mjs`
- East-only exact source builder:
  - `scripts/build_current_east_bsc_exact.py`
- important East-only source rule:
  - use official `Integrated Care Boards (April 2023) EN BSC` as the East outer shell
  - keep `Current` East internal board geometry from the canonical exact `Current` source
  - keep the stable dissolved East split component separate from the board reconstruction
  - include the hidden `E54000025` split parent in the East reconstruction network so neighboring East boards do not absorb the split territory
  - keep the East local landmask based on the visible East polygons only, excluding the hidden full parent shell for `E54000025`
  - keep the East review runtime board export unsimplified; the simplified export was reintroducing small split-to-board overlaps and visible outline artefacts
- guardrail: the three special `Current` split parents (`E54000025`, `E54000042`, `E54000048`) must not be mutated by the experimental coastal-compare exact-product path until that compare builder is explicitly made split-aware; otherwise Lancashire/Hampshire/Hertfordshire split colouring and coverage regress
- guardrail: dissolved Region outline extraction should prefer dissolve-to-exterior output before raw topology mesh, because compare-era board edges can stop being perfectly coincident across admin joins and leak false internal borders into selected Region outlines

When answering operator questions about “latest/newest board products”, keep this distinction explicit:

- live app/runtime questions use the active runtime GeoJSONs
- newer exact-foundation questions use the exact canonical products under `geopackages/`

Current file reality in this checkout:

- runtime `Current` source of truth:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- runtime `2026` source of truth:
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- runtime `Current` split-ICB source of truth:
  - `public/data/regions/UK_WardSplit_simplified.geojson`
- exact canonical `Current` source of truth:
  - `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
- exact canonical `Current` split-ICB companion currently present:
  - `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
  - `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.gpkg`
  - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson`
  - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.gpkg`
- exact canonical `2026` files currently present:
  - `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson`
  - `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_gpkg.gpkg`

So, for example:

- “what is the longest ICB/HB name in the live app?” should be answered from the runtime GeoJSON for the relevant basis
- “what is the longest ICB/HB name in the newest exact canonical product?” should be answered from the exact canonical file for the relevant basis

The first two live `v3.x` pipeline slices are now complete and are treated as:

- `v3.1`: canonical-board provenance/runtime cutover
- `v3.2`: OSM-landmask coastline-truth pass on top of that cutover

Current `v3.2` state:

- the England `2026` builder no longer inherits the unchanged 29 ICBs from Codex/v10 geometry
- those unchanged boards are now sourced from official April 2023 England ICB BFC in `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py`
- the regenerated England 2026 output remains on the expected 36-board total, and the regenerated UK-wide 2026 output remains on the expected 62-board total
- a new exact `Current` canonical board builder now also exists at `scripts/build_current_canonical_board_boundaries.py`
- that builder emits the exact `Current` canonical artifact under `geopackages/outputs/full_uk_current_boards/`
- the regenerated exact `Current` canonical product is on the expected 68-board total:
  - 42 `ICB`
  - 7 `LHB`
  - 14 `SHB`
  - 5 `NIHB`
- runtime preprocessing is now cut over to those rebuilt exact `Current` and `2026` canonical products via `scripts/preprocess-boundaries.mjs`
- the app is still using the legacy public runtime filenames, but those files are now derived from the new canonical exact foundations rather than the old Codex/Natural Earth clip path
- preprocessing now clips those exact board products against:
  - `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
- that landmask is prepared from:
  - `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`
- the visible basemap has not changed; `v3.2` only changes the hidden preprocessing coastline truth
- downstream derived products have been regenerated and validated:
  - scenario board/outline products
  - topology edges
  - group outlines
  - facility boundary assignments
- validation is green on the cutover state:
  - `npm run test -- --run`
  - `npm run build`
  - `npm run test:e2e`
- the visible UK basemap is now also aligned to the `v3.2` coastline truth through a dedicated UK land overlay and matching UK-local sea patch in the existing single-map runtime
- that visible alignment is tied to the existing global `Land` and `Sea` controls so it behaves as one unified basemap feature rather than a new standalone layer row
- the first `v3.3` attempt surfaced a visible box artifact from a stray continental polygon in the visible UK land asset; the shipped `v3.3` baseline filters that fragment out before runtime use
- the shipped `v3.3` baseline now uses real visible UK land/sea patch assets rather than a halo approximation
- the latest `v3.3` tightening step makes those visible UK land/sea patch assets boundary-system-specific:
  - `Current` uses `public/data/basemaps/uk_landmask_current_v01.geojson` and `public/data/basemaps/uk_seapatch_current_v01.geojson`
  - `2026`-basis modes use `public/data/basemaps/uk_landmask_2026_v01.geojson` and `public/data/basemaps/uk_seapatch_2026_v01.geojson`
- those assets are derived from the shipped simplified board union for the active boundary system, with Republic of Ireland context added explicitly from `ne_10m_admin_0_countries.geojson`; this removes the remaining “same source family but different final shape” drift and makes the visible land edge conform to the shipped app product coastline for the active mode
- the later visible-basemap correction also preserves the surrounding Natural Earth regional land context inside the local replacement patch, instead of replacing the box with UK/Ireland land only; the local sea patch now renders above global land and the exact local land renders above that, removing the visible rectangular seam
- the later visible-patch simplification pass now makes the boundary-system-specific local land overlays hole-free and replaces the previous high-hole “box minus land” sea geometry with a simple local sea rectangle
- the hidden basemap `countryBorders` coastline stroke is now disabled in runtime:
  - the current Basemap UI exposes Land and Sea only, not a separate border control
  - leaving polygon-outline country borders on by default was producing a false pale coastline line in the sea even when Sea opacity was `0%`
- the live `v3.4` preprocessing path now removes inland-water holes from the OSM-derived preprocessing landmask before clipping the canonical board products:
  - source landmask: `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved.geojson`
  - active clip mask: `geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson`
- the purpose of that `v3.4` change is to keep the outer coastline truth while stopping river and inland-water holes from leaking into the shipped app-facing boundary products as unwanted pseudo-coastal seams
- later investigation found that the shipped simplified board products in this same `v3.4` state still contain real interior holes:
  - `Current` shipped product: `2` interior rings across `68` features
  - `2026` shipped product: `1` interior ring across `62` features
  - the currently confirmed feature-level interior-ring case from quick inspection is `Highland` (`boundary_code: 17`)
  - representative coordinates:
    - `Current`: `[-4.828004, 58.522121]`
    - `Current`: `[-6.310367, 57.161477]`
    - `2026`: `[-6.312419, 57.161486]`
- treat those as real polygon-hole regressions, not just visible basemap seam artifacts
- there is also a separate remaining visible seam where the Sea mask sits roughly `1-3px` too far inward from the land edge
- later screenshot review and Playwright inspection also showed a more severe visible Sea-patch continuity artefact:
  - in some places the Sea patch is not fully contiguous with the surrounding sea
  - spike / wedge-shaped artefacts can appear in the local replacement seam
- do not scope the rendered artefact to Scotland only; the user-observed seam/gap behaviour appears across multiple ICB/HB areas, even though `Highland` is the current confirmed data-hole example
- a later corrective pass simplified the visible patch geometry itself:
  - local land overlays are now hole-free
  - local sea patches are now simple rectangles
  - preliminary Playwright inspection looked materially healthier after that change
- the hidden coastline-border stroke has since been disabled as well, so that former pale-line cause should no longer be treated as live runtime truth
- do not “fix” any remaining visible land/sea seam in isolation if it risks conflicting with the shipped-hole cleanup or reintroducing box/halo-style patch artifacts
- do not assume a remaining seam is still the old high-hole Sea-patch geometry or hidden border path without rechecking current runtime behaviour first
- facility preprocessing now treats the assigned `Current` ICB/HB polygon as the authoritative coastal truth for facility placement: `scripts/enrich-facilities.mjs` restores original source coordinates where present, preserves reviewed coastal assignments when snap metadata already exists, and only snaps a facility inward when it still falls outside its assigned current board product
- the regenerated `public/data/facilities/facilities.geojson` is now back to `105/105` facilities intersecting their assigned shipped current board polygons, with `Chepstow Medical Centre` again preserved as a reviewed coastal snap (`snap_basis: assigned_current_boundary`)
- the first live `v3.5` coherent rebuild is now in place:
  - shipped runtime polygons are rebuilt as a hole-free family from the canonical exact products
  - runtime TopoJSON is regenerated from those same hole-free shipped polygons
  - topology-edge products, scenario derivatives, outline derivatives, visible `Land` / `Sea` assets, and facility assignments are regenerated downstream from that same family
  - the orchestrating rebuild entry is now `scripts/build-runtime-geometry-family.mjs`
  - shipped polygon holes are now at `0` for both runtime board products
  - facility containment remains `105/105` against the shipped current product, with `Chepstow Medical Centre` retained as the reviewed coastal snap
- the `Current` special split-ICB source has now been selectively replaced to match the canonical-source family:
  - `scripts/build_current_ward_split_exact.py` now rebuilds the three split ICB cases from official `WD_DEC_2025_UK_BSC`
  - the exact ward `BFC` source remains available locally as provenance/fallback, but it is no longer the active split-build input
  - the ward `BSC` switch was accepted only after the full-path split rebuild preserved the accepted exact assignment keys by porting the Hampshire explicit overrides for `Newbury Greenham` and `Redlynch & Landford`
  - `scripts/fix_current_ward_split_parent_coverage.py` adds the canonical parent remainder slivers back by adjacency, so the visible split fill reaches the same parent coastal edge as the exact canonical ICB product
  - `scripts/build_current_split_icb_runtime.py` dissolves that repaired exact split source to the clean app-facing split-ICB runtime product
  - `scripts/create-ward-split.mjs` now wraps all three steps and emits the shipped runtime split product
  - the shipped runtime split product is now `8` clean dissolved split features, while the exact split source is now `957` features with ward/LAD identifiers plus `76` canonical parent remainder features across the three special split parents
  - `scripts/build_current_split_internal_arcs.py` now also emits `public/data/regions/UK_WardSplit_internal_arcs.geojson`, a `Current`-only helper file containing the internal shared split joins for those three parents
  - the accepted Hampshire and Isle of Wight (`E54000042`) prototype is now:
    - parent-wide facility-seeded ward assignment
    - Isle of Wight explicitly held to `London & South`
    - west-most Hampshire explicit correction:
      - `Downlands & Forest North` -> `South West`
  - Winchester (`E07000094`) remains split only across `London & South` and `South West`
  - accepted Hampshire spot checks:
    - `Badger Farm and Oliver's Battery` -> `South West`
    - `Bishop's Waltham` -> `London & South`
    - `Totland & Colwell` -> `London & South`
  - runtime export of `public/data/regions/UK_WardSplit_simplified.geojson` is now precision-normalized only; geometric simplify is intentionally disabled because it caused visible coastal drift in the three split parents
  - the split-join helper file is rendered in production as dashed neutral-grey internal arcs and is intentionally not exposed as a separate overlay/sidebar control
  - `scripts/build_current_split_icb_runtime.py` now also performs a post-dissolve small-fragment cleanup step before runtime export, reassigning detached sub-`1,000,000 m²` pieces to the nearest dominant split-region body within the same parent ICB
  - that builder now also normalizes again after reprojection to `EPSG:4326`, dropping microscopic degenerate parts created by the transform before the dissolved exact and shipped runtime split products are written
  - the shipped split runtime is now also clipped to the live `Current` parent runtime polygons during export, so split fills do not materially overlap neighboring current-board fills
  - `scripts/build-uk-basemap-alignment.mjs` now builds the `Current` landmask from the base current runtime file with the three split parent codes removed, plus the shipped split runtime product itself
  - this means the visible `Current` land edge in those three special cases now follows the shipped split runtime product rather than the hidden unsplit parent geometry
  - the split runtime export seam is now hardened end-to-end:
    - `public/data/regions/UK_WardSplit_simplified.geojson` is geometrically valid
    - `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson` is geometrically valid
  - the coherent `v3.5` rebuild automatically reran basemap alignment after this replacement; no `public/data/basemaps` files changed in git, so no `Land` / `Sea` refresh was needed for this selective internal replacement
- follow-up execution on `2026-04-01` resolved the confirmed split-runtime white-gap regression:
  - the live base `Current` board runtime in `public/data/compare/shared-foundation-review/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson` stayed hole-free throughout
  - the live split-runtime product in `public/data/compare/shared-foundation-review/regions/UK_WardSplit_simplified.geojson` was measured at `171` interior rings before repair and is now back to `0`
  - the same repair also returned `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson` to `0` interior rings
  - the fix path had three parts:
    - `scripts/build_current_ward_split_exact.py` now resolves the legacy active-components source from the real repo paths instead of assuming a removed `public/data/regions/full-res/...` input
    - `scripts/build_current_split_icb_runtime.py` now resolves the live `Current` board source robustly, strips holes again in the final export stage, and post-processes the written split outputs so the file-write path cannot reintroduce residual rings
    - `src/features/map/boundaryLayerStyles.ts` now gives `wardSplitFill` the same subtle seam-masking stroke treatment as `regionFill`, so ordinary anti-alias slivers are reduced in the split-parent cases too
  - `scripts/validate-runtime-geometry-family.mjs` now explicitly asserts hole-free split runtime and hole-free dissolved split exact outputs, so this class of regression should fail the family gate next time instead of slipping through
  - the accepted compare-family split artifacts were refreshed from the rebuilt runtime outputs even though the larger review-family rebuild still has unrelated stale-path failures later in its chain
  - future `Current` white-gap reports should now be triaged in this order:
    - first confirm whether the live split-runtime artifact is still hole-free
    - then treat any remaining slivers as render-path seam masking or a separate border-contiguity issue rather than assuming another interior-ring regression
  - a follow-up split-case border mismatch was then fixed in the live map runtime:
    - `deriveCurrentGroupOutlineFeature(...)` now derives `Current` selected Region outlines from the live split-aware geometry on the map instead of bailing out to the older precomputed file path whenever split features are present
    - split-click selection now intentionally uses a hybrid basis:
      - yellow selected-boundary helper = the whole parent ICB/HB boundary
      - selected `Current` Region outline = the Region of the split part that was actually clicked
    - the parent highlight clone now carries the clicked split `region_ref`, so the Region selection follows the clicked split side instead of the parent-board default mapping
    - this should remove the earlier mismatch where split cases could show a whole-parent Region default, a different selected Region border, and a split fill that did not agree with either
  - two unrelated review/build seams remain documented for future cleanup:
    - `scripts/build-shared-foundation-review-family.mjs` still later trips over a missing compare-family water-edge class file during `build_group_inland_outline_modifiers.py`
    - `scripts/validate-runtime-geometry-family.mjs` still assumes local basemap mask artifacts under `public/data/basemaps/`, which are not present in this checkout
- the next confirmed issue after the coherent rebuild is a render-path seam, not stale geometry delivery:
  - the live app is serving the rebuilt runtime products on `http://127.0.0.1:4173/dmsGIS/`
  - the remaining white slivers seen at tighter zooms are now being treated as `regionFill` anti-alias seams in the render path
  - `src/features/map/boundaryLayerStyles.ts` now gives `regionFill` a seam-only stroke when explicit borders are off
  - that seam stroke is intentionally much lighter and thinner than an explicit Region border, so `Border: Off` should no longer read as a second coloured border mode
- the reported London & South facility-selection regression has now been traced to the `Current` Region-outline fallback seam, not to bad facility data:
  - the live click path could hit the facility, but `deriveCurrentGroupOutlineFeature(...)` could throw during Turf union for some London & South `Current` selections
  - `src/features/map/boundarySelection.ts` now returns `null` instead of throwing from that derivation path, allowing the existing async precomputed-outline fallback to finish the selection/highlight flow
  - the precomputed `Current` outline files now also rebuild split-region groups via dissolve-to-exterior geometry when ward-split features are involved, replacing the older mixed-feature mesh route that could bring split-internal arcs back into the selected Region border
  - a fresh Playwright check on `Southwick Park Medical Centre` in the Portsmouth cluster now selects normally in the live app
  - if similar reports recur, start by checking `boundarySelection.ts`, not the facilities dataset
- the next geometry execution step should now follow the new architecture note in `docs/v3.5-geometry-architecture-redlines.md`:
  - treat the remaining problem as an atomic product-family issue, not a series of runtime/UI patches
  - keep the sidebar/runtime/store contract stable
  - make `Current` split-ICB preprocessing contiguous and zero-drift before rebuilding outlines and masks again
- the rebuild chain now also includes a formal shipped-artifact gate:
  - `scripts/validate-runtime-geometry-family.mjs`
  - `scripts/build-runtime-geometry-family.mjs` now ends by running that validator
  - treat failures there as build-chain regressions, not optional warnings
  - `2026` is now covered there as a full downstream family too:
    - board outputs
    - topology-edge outputs
    - scenario board/outline derivatives
    - facility containment against `icb_hb_code_2026`

## Project Summary

This repository contains a static-first geospatial web app for UK facility mapping and saved map configurations.

The app is not a general-purpose GIS editor. It consumes prepared geospatial datasets and provides an operational UI for:

- map viewing
- facility grouping
- layer control
- label control
- scenario viewing and future scenario editing foundations
- saved map configurations
- export

## Stable Production Spine

The production source of truth remains:

- React + TypeScript + Vite
- OpenLayers map runtime
- Zustand app store in `src/store/appStore.ts`
- typed schemas in `src/lib/schemas/`
- shared config in `src/lib/config/`
- production map/runtime seams in `src/features/map/`

These should continue to be treated as the stable architectural spine.

## Sidebar Replacement Summary

The approved sidebar prototype under `src/prototypes/sidebarPrototype/` is the production sidebar target:

- visually
- interaction-wise
- structurally

The important conclusion from the earlier failed promotion work is:

- incremental approximation of the old production sidebar was the wrong strategy
- the correct strategy is controlled production-side replacement
- production and prototype must remain separate codepaths
- production-owned exact equivalents should replace the old sidebar shell and pane surfaces

The repo is now on that replacement path.

Current live production sidebar composition uses the exact-shell path:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebarExact/`
- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/groups/RegionsPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`

Current accepted shell/lane contract for the exact-shell right sidebar:

- shell background is `#e4e5e8` as a human-devised visual correction
- shell inline padding stays at the default `12px`
- shell top/bottom padding keeps a small `+1px` correction (`13px`)
- major exact-shell panes fill the inner track width directly
- no additional pane outline/border treatment is active on the major panes
- inner concave track radius matches the major pane radius (`var(--radius-lg)`)

The older shared sidebar path under `src/components/sidebar/` and the older pane surfaces still exist in the repo, but they should be treated as provisional or legacy unless explicitly reactivated.

## Current Architecture State

### Production map/runtime

The map/runtime modularization pass is substantially complete.

Important current production seams include:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `src/features/map/selectionHighlights.ts`
- `src/features/map/tooltipController.ts`
- `src/features/map/singleClickSelection.ts`
- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/derivedScenarioOutlineSource.ts`
- `src/features/map/scenarioFacilityMapping.ts`
- `src/features/map/scenarioFacilityMetrics.ts`

### Scenario/draft foundations

Editable scenario foundations are in place:

- boundary-system catalog: `src/lib/config/boundarySystems.ts`
- scenario-workspace catalog: `src/lib/config/scenarioWorkspaces.ts`
- boundary assignment helpers: `src/lib/scenarioWorkspaceAssignments.ts`
- derived workspace summaries: `src/lib/scenarioWorkspaceDerived.ts`
- combined scenario summaries: `src/lib/scenarioWorkspaceSummaries.ts`
- production draft/editor state: `src/store/appStore.ts`

Interactive Playground workspaces now also seed their draft-aware assignment and derived-outline runtime before the first reassignment is made. The latest follow-up fixed a stale-startup seam: editable workspaces now preload their source-preset board dataset as the canonical baseline assignment source, instead of capturing whichever `regionFill` source happened to be live during the first render pass. That removes the first-load grey fallback seen in parts of South East / London and East when entering Playground from another mode.

Important current qualification:

- that earlier Playground grey-fallback fix should not be treated as full closure
- a newer intermittent Playground bug is still open, where some boards can later fall back to neutral grey after reassignment and later reload / re-entry even though polygons still render and facility points can still keep Region colours
- the current bug note for that unresolved runtime path is:
  - `docs/playground-grey-runtime-bug.md`
- current best reading:
  - this is a draft-aware runtime source-selection / refresh bug in the Playground assignment path
  - not a canonical geometry-source failure
  - not a GitHub Pages-only issue
  - not a facilities-data issue
- local programmatic diagnostics now exist for the next reproduction pass:
  - `window.__dmsGISPlaygroundDiagnostics`
  - `window.__dmsGISPlaygroundDiagnosticsHistory`

Preset/workspace switching now also clears the actual OpenLayers selection/highlight layers and docked tooltip before paint. Store selection reset alone was not sufficient once later Playground/runtime work reintroduced stale visual state on mode switches.

### Sidebar exact kit

The current production-owned exact sidebar primitives live in:

- `src/components/sidebarExact/ExactAccordion.tsx`
- `src/components/sidebarExact/ExactDragHandle.tsx`
- `src/components/sidebarExact/ExactFields.tsx`
- `src/components/sidebarExact/ExactMetaControls.tsx`
- `src/components/sidebarExact/ExactMetricPill.tsx`
- `src/components/sidebarExact/ExactPopover.tsx`
- `src/components/sidebarExact/ExactRowShells.tsx`
- `src/components/sidebarExact/ExactSwatch.tsx`
- `src/components/sidebarExact/ExactToggleButton.tsx`
- `src/components/sidebarExact/SidebarAccordion.tsx`
- `src/components/sidebarExact/SidebarControls.tsx`
- `src/components/sidebarExact/SidebarSortable.tsx`
- `src/components/sidebarExact/floatingCallout.ts`
- `src/components/sidebarExact/useSidebarDndSensors.ts`

Shared exact-shell CSS currently lives in:

- `src/styles/sidebarExact.css`

Global tokens and shared app tokens remain in:

- `src/styles/global.css`

## Current Validation State

At the time of this handover:

- `npm run typecheck` is passing
- `npm run test` is passing
- `npm run test:e2e` is passing
- `npm run build` is passing
- despite the green suite, a real live facility click-selection regression remains open for some London & South sites:
  - reported examples include Portsmouth-area clustered facilities and some individual London & South facilities
  - current data review does not point to bad region names, hidden defaults, or duplicate coordinates for the London & South facilities file rows
  - the strongest current reading is a live point-selection / browser hit-path issue not yet captured by the automated suite
  - do not dismiss this bug just because `npm run test` and `npm run test:e2e` are green
- `npm run lint` is not yet back to a clean main-repo baseline; the flat config is restored, but follow-up ignore/scope cleanup is now tracked in `docs/project-todo.md`
- the app is now running on runtime boundary products regenerated from the rebuilt exact canonical `Current` and `2026` foundations, clipped to an OSM-derived UK landmask before simplification; the visible basemap remains unchanged
- `scripts/enrich-facilities.mjs` now includes a tight `50m` nearest-boundary fallback after exact point-in-polygon and an assigned-current-board snap contract for reviewed coastal facilities; the current facility file is back to `105/105` spatial containment against the shipped current board product
- `scripts/build-uk-basemap-alignment.mjs` now regenerates the visible UK land/sea patch from the shipped simplified board union plus explicit Ireland context, rather than from the earlier broader dissolved landmask alone
- the regenerated `UK_ICB_LHB_v10_topology_edges.geojson` and `UK_Health_Board_2026_topology_edges.geojson` artifacts are back on valid lon/lat geometry after a stale bad export briefly produced long horizontal stray lines and hid the expected internal grey ICB/HB border networks
- `Current` ward-split rendering is now fully corrected on the production path: the three split ICB cases are sourced from `UK_WardSplit_simplified.geojson`, the underlying parent ICB fills are suppressed to avoid darker double-tinting, facility clicks in split wards now highlight the shared parent ICB boundary, and the selected Region outline is derived live from `regionFill + wardSplitFill` using snapped union-first geometry merging plus exterior-only outline rendering so the full parent Region border includes the split wards without preserving a new internal seam
- split-ward polygons in `Current` are no longer treated as selectable mini-boards; both direct clicks and facility-driven boundary resolution now collapse ward-split hits back to the full parent ICB for yellow board highlighting, while preserving the clicked ward’s assigned `region_ref` so the selected Region border still follows the specific split-region assignment rather than the parent board’s default region
- `Current` boundary-only clicks now preserve the selected colour-coded Region border again; the recent regression was in the docked tooltip path, which was clearing the selected Region layer after the synchronous Current outline redraw even though scenario modes re-added theirs asynchronously
- `SJC JMC` no longer shows an always-on green scenario-outline overlay by default; internal board-edge borders remain governed by the normal Overlays controls, while selected-region highlighting still uses the lookup/selection outline path
- Overlays sub-item Border controls now include `Colour`, `Thickness`, and `Opacity`, with the section toggle in the standard popover header position rather than a redundant inner `Visible` row
- Overlays now use a true Fill/Border mixed-state contract for `englandIcb` and `devolvedHb`: Fill defaults `Off`, Border defaults `On`, the row toggle therefore shows `Ox` by default, and line-only overlay families remain visible when only the Border section is enabled
- the top-level Overlays pane toggle now aggregates row states correctly, so multiple child `Ox` rows keep the parent at `Ox` rather than collapsing it to `Off`
- Devolved Health Board internal-border defaults now match the ICB internal-border defaults in the Overlays path
- overlay runtime styling now uses rounded line caps and joins for both `englandIcb` and `devolvedHb`, reducing visibly broken joins without changing control semantics
- shared England/devolved border arcs in the 2026 topology edge product now fall back to the `devolvedHb` overlay only when `englandIcb` is hidden, so those borders remain available through either overlay without double-darkening when both are visible
- the newer `englandIcb` / `devolvedHb` overlay-family model remains on the Current preset, and non-Current presets now intentionally expose both shared scenario boundary rows in the Overlays pane: `2026 NHS England ICBs` and `Devolved Administrations Health Boards`
- the `DPHC Estimate COA Playground` button is now live on top of the visible `COA 3b` preset, and clicking a board in that mode opens an on-map Region-assignment popover that writes draft boundary-unit assignments back into the production scenario-workspace store
- Playground reassignment now rebuilds one canonical draft-aware board assignment source for the active `COA 3b` workspace, using the workspace source-preset code-groupings for untouched boards plus draft overrides for edited boards, so every board consistently carries `scenario_region_id`
- the Region-assignment popover is now docked to the map bottom-right instead of following click coordinates, and draft reassignment styling now resolves live board fills from runtime-assigned Region labels while derived Region outlines preserve all dissolved pieces instead of only the first geometry
- editable scenario runtime now captures a stable baseline assignment source from the visible `regionFill` board layer instead of falling back to the old JMC assignment lookup source, preventing COA 3b Playground reassignment from drifting onto stale geometry or grey fallback styling after edits
- editable scenario Region geometry is now a dedicated merged polygon product derived from that canonical board-assignment source; it no longer flips between static preset outlines and runtime topology-edge fragments
- Playground Region selection now treats the editor’s pending/selected Region as authoritative over stale popover baseline state, so a newly reassigned board keeps the new Region selection/highlight instead of appearing to snap back to its earlier baseline Region on immediate reselect
- during an open Playground edit, selected Region-border redraw now treats the popover/editor-selected `scenarioRegionId` as authoritative instead of trusting feature-prop timing during the reselect cycle
- after a Playground reassignment is applied, the map now clears the transient assignment-popover/editor action state instead of leaving the chosen Region button latched; the saved reassignment should remain on the map, but the action pane returns to a neutral state until the next board is selected
- top-bar preset buttons should reflect the actual live map mode, not the stored fallback standard preset: when either Playground workspace is active, the `Current` / `SJC JMC` / `COA 3a` / `COA 3b` row should show no active button, leaving the active Playground button as the exclusive mode indicator
- Playground map-runtime consumers now resolve one authoritative assignment source per render cycle through `src/features/map/scenarioAssignmentAuthority.ts`
- that authoritative source now feeds:
  - board-fill styling
  - selected Region-border redraw
  - Playground popover default Region selection
  - facility point remapping/styling in the map runtime
  - tooltip Region identity
  - visible-facility PAR summaries
- Playground selected-Region highlighting is now driven directly from the editor-selected `scenarioRegionId` plus the merged editable Region geometry source, and editable workspaces no longer fall back to static preset outline fetches for the selected Region border
- facility clicks inside Playground now also carry draft-aware `scenarioRegionId` / Region-name identity for selected-border redraw, and facility symbol styling now follows that same authoritative assignment source
- when a facility is clicked in Playground, that facility selection now takes ownership of the selected Region border instead of allowing a stale board-editor Region selection to repaint over it
- non-Playground static scenario clicks now prefer the precomputed topology-aligned Region-outline files first, so the thick selected border stays on the same shipped board-arc network as the visible ICB/HB seams
- Playground / draft-aware selection still uses the live derived Region-outline source first, because that path needs to reflect edited assignments immediately
- scenario prefixes are now handled as display-only formatting in the Regions pane for `SJC JMC`, `COA 3a`, `COA 3b`, and Playground, so UI rows can show plain region names while saved/runtime region identities stay unchanged
- Playground now labels the Regions sub-pane as `Playground`, and its top-right map details card strips the `COA 3b` prefix from the displayed Region name only
- topology-edge preprocessing now repairs mirrored one-sided edge fragments before chaining contiguous segments, so Wales-facing England/Health Board borders that survived clipping/simplification as paired externals are promoted back to true internal edges
- that repair fixes the visible `Current` England/Wales `ICB-LHB` gaps: all six v10 cross-border pairs now resolve to one continuous internal edge each, including `NHS Shropshire, Telford and Wrekin Integrated Care Board` against both `Betsi Cadwaladr University Health Board` and `Powys Teaching Health Board`
- a high-priority follow-up remains in `docs/project-todo.md`: rebuild the authoritative shared ICB/HB edge product in preprocessing rather than continuing to rely on repair passes over clipped/simplified polygon artifacts, especially ahead of future Playground border/region editing work
- overlay boundary source URLs now carry a dev-only cache-busting query token, so regenerated public GeoJSON edge files are refetched during active Vite sessions instead of remaining stuck on the first-loaded `VectorSource`
- the live saved-view / export / reset status path is not a separate toast library; it is the typed sidebar status surface in `src/components/layout/SidebarStatus.tsx`, driven by `notice: AppNotice | null` in `src/store/appStore.ts`
- sidebar status tones are now explicit:
  - blue `info` for loading + neutral notices
  - orange `warning` for unavailable / validation / not-found notices
  - green `success` for saved-view success notices
  - red `error` for runtime error messages
- the status lane is runtime-only again; it should not show baked-in example banners unless explicitly reintroduced for a temporary review pass

Release gate:

- `npm run build`

Do not describe the app as healthy or releasable unless `npm run build` is green.

## What A New Agent Should Read First

Read in this order:

1. `AGENTS.md`
2. `README.md`
3. `docs/agent-handover.md`
4. `docs/sidebar-pane-status.md`
5. `docs/prototype-to-production-playbook.md`
6. `docs/agent-continuation-protocol.md`
7. `docs/current-app-baseline-v3.6.md`
8. `docs/current-app-baseline-v3.5.md`
9. `docs/current-app-baseline-v3.4.md`
10. `docs/v3.4-internal-gap-regression.md`
11. `docs/v3.5-full-geometry-redress.md`
12. `docs/v3.7-next-phase.md`
13. `docs/canonical-board-rebuild-workflow.md`
14. `docs/sidebar-parity-bugs.md`

For outstanding product-level tasks (user-derived, not parity bugs):

15. `docs/project-todo.md`

For deferred future preprocessing ideas that affect geometry build order:

16. `docs/arc-smoothing-future-plan.md`

Read these after that if the task touches sidebar history or prototype boundaries:

17. `docs/sidebar-production-reset-plan.md`
18. `docs/sidebar-thread-reactivation.md`
19. `src/prototypes/sidebarPrototype/PROMOTION.md`
20. `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
21. `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`

## Immediate Development Priorities

Use mission-command judgment within these priorities.

1. Keep the shipped production app stable.
2. Continue exact prototype-to-production sidebar replacement only through production-owned codepaths.
3. Prefer shared exact-shell improvements over pane-local hacks when the issue is structural.
4. Record deferred parity bugs explicitly instead of leaving them in thread history.
5. Keep future scenario/editable-workspace work behind the typed production domain/store seams.

## Known Remaining Sidebar Work Areas

See `docs/sidebar-pane-status.md` for the exact pane-by-pane inventory.

High-level remaining areas:

- deferred parent-rail alignment drift in Basemap, Labels, and Overlays
- runtime/manual verification of scenario boundary-code classification in devolved boards
- keep populated / unpopulated scenario fill styling facilities-driven across both current/v10 and merged/2026 board families; do not reintroduce a `current => v10, everything else => 2026` assumption in map styling
- future topology-safe arc smoothing is documented separately in `docs/arc-smoothing-future-plan.md` and should be treated as a preprocessing workflow task, not a runtime styling task
- remaining exact-parity polish where identified during live review
- continued cleanup/retirement of older sidebar paths once the exact path is fully settled
- any remaining map/runtime wiring needed for newer exact-sidebar controls

## Architecture Optimization Still Worth Doing

These are not all immediate tasks, but they are valid future cleanup/improvement targets.

1. Retire legacy sidebar paths once exact-shell parity is stable.
2. Reduce duplicated token/class bridging between exact-shell and earlier sidebar generations.
3. Keep store-facing UI contracts focused and typed so future sidebar work stays config-driven.
4. Keep saved-view snapshots aligned with any added style/runtime fields.
5. Continue to prefer measured rendered geometry over inferred CSS reasoning when alignment gets non-trivial.

## Restart Note - 2026-03-29

Playground entry is now explicitly split by source preset.

- right sidebar now has a dedicated top pane titled `DPHC Estimate COA Playground`
- that pane owns two buttons:
  - `COA 3a`
  - `COA 3b`
- `COA 3a` activates a new interactive workspace baseline:
  - `dphcEstimateCoa3aPlayground`
  - source preset: `coa3b`
  - runtime board product: `public/data/regions/UK_COA3A_Board_simplified.geojson`
- `COA 3b` keeps using:
  - `dphcEstimateCoaPlayground`
  - source preset: `coa3c`
  - runtime board product: `public/data/regions/UK_COA3B_Board_simplified.geojson`
- `Current` stays on the rebuilt unmerged/current `v3.8 BSC` board family (`68` boards)
- `SJC JMC`, `COA 3a`, and `COA 3b` derive from the rebuilt merged `2026 BSC` board family (`62` boards)
- `COA 3a` and `COA 3b` keep their own scenario region labels on the board features (`region_name`), so they differ by assignment contract while sharing the merged scenario geometry basis
- playground-mode runtime checks are now keyed off a helper that recognises either interactive workspace id, not just the older `COA 3b` one
- saved-view session state now persists `activeScenarioWorkspaceId` in addition to `activeViewPreset`, so restoring a saved session can distinguish `COA 3a` playground from `COA 3b` playground explicitly
- the `DPHC Estimate COA Playground` surface is no longer inside the right sidebar
- it now lives in a new bottom workspace row:
  - bottom-left rail spans the map column width and now hosts a `10`-column title-pill surface
  - bottom-right rail spans the sidebar column width and hosts the playground pane surface
- the bottom-right playground pane now uses its own internal `2`-column grid:
  - a subtitle row sits directly below the title, with `Start state` in each column
  - the existing `COA 3a` / `COA 3b` buttons stay on the row below in the same two columns and at the same footprint
  - the vertical gap between that new subtitle row and the button row is half the default pane content gap
- the bottom row no longer uses grey parent pane shells; the visible bottom-left placeholder and bottom-right playground elements are themselves the pane surfaces, styled like header panes
- the bottom-left surface now owns a locked internal `10`-column contract through `.workspace-bottom-shell__surface--left-grid`
- the bottom-left surface keeps `0.75rem` outer padding plus `0.75rem` internal column gaps, so each internal column division resolves to the default seam instead of doubling it
- each occupied bottom-left column now renders a full-width grey title card using the same radius as the parent white pane, with `0.35rem` internal padding/rhythm
- each grey title card now keeps the swatch circle anchored in the same top-left cell and the title in the same top-right position, but the body below that top row is now a content-height `2`-column stack with a dedicated middle band, a flexible spacer, and a bottom metrics block
- only `Royal Navy` cards use that dedicated middle band for the interactive sidebar-pill button, defaulting to `Regionalise`, without moving the visible swatch/title top row
- the first internal card column is now fixed to the swatch width, with a single `0.35rem` gap before the flexible title column
- title text in the second column is left-aligned to that column edge
- title text in the second column now uses a tighter `1` line-height plus a `1px` downward optical offset so the first line stays centered to the swatch without increasing overall card height
- title wrapping now uses natural per-word wrapping in this pane rather than the sidebar label helper's non-breaking segments
- the bottom-right cell now shows the PMC Region PAR for columns `1`-`9` and the overall total PAR in column `10`
- PAR values are left-aligned to the second-column edge like the titles
- the grey title cards keep `0.35rem` top/bottom inset, but card height is now driven by the content stack rather than a collapsed fixed-height internal rail; the tallest middle-band card sets the shared bottom-row height and the rest stretch to match it
- in `Current`, columns `1`-`9` continue to show the PMC Region cards
- in `Current`, the `Royal Navy` card now also carries the `Regionalise` / `Unregionalise` control; while regionalised, Royal Navy PAR is removed from the special card and added back into the parent PMC Region cards on the canonical Current board-code basis
- in that same Current-only bottom-left surface, `Scotland & Northern Ireland` now renders as the card-local display label `Scotland & NI`; this does not rename the Region anywhere else
- in `SJC JMC`, the bottom-left pane now follows the Regions pane grouping instead: Scotland, Northern Ireland, and Wales are collapsed into the display label `Devolved Admin...`, then the remaining groups follow in sidebar order (`North`, `Centre`, `South West`, `South East`, `London District`), slot `7` is intentionally left empty, `Overseas` is pinned to column `8`, `Royal Navy` is pinned to column `9`, and `Total` stays in column `10`
- `COA 3a` and `COA 3b` now use the same bottom-left scenario-card pattern: earlier columns follow the active preset's Region-group order, `Overseas` is pinned to column `8`, `Royal Navy` is pinned to column `9`, and `Total` stays in column `10`
- any scenario bottom-left card whose stripped Region title would be `Devolved Administrations` now displays as `Devolved Admin...`, so `SJC JMC`, `COA 3a`, `COA 3b`, and their Playground equivalents share the same shortened devolved label
- `SJC JMC` group circles now use the effective populated Fill colour from the Regions pane at `100%` opacity
- `SJC JMC` per-card PAR values now calculate from the assigned `2026` facility board code (`icb_hb_code_2026`) mapped through the preset `codeGroupings`; the devolved card shows the combined total of `JMC Scotland`, `JMC Northern Ireland`, and `JMC Wales`
- for the bottom-left `SJC JMC` cards only, `Overseas` and `Royal Navy` are preserved as explicit special PAR buckets instead of being folded into their assigned scenario-region cards; this keeps the visible card sum aligned with the absolute `Total`
- the same `Overseas` / `Royal Navy` preservation rule now applies to `COA 3a` and `COA 3b`, so all three scenario presets reconcile to the same absolute total
- the bottom-left scenario-card PAR path is now draft-aware for interactive Playground workspaces: `src/components/layout/WorkspaceBottomLeftPane.tsx` derives active workspace totals from loaded facility PAR records plus the live scenario-workspace assignment lookup, and it now subscribes directly to workspace-draft changes so Playground board reassignment immediately updates the displayed Region totals without a preset reload
- clicking the scenario `Royal Navy` card pill now toggles `Regionalise` / `Unregionalise`: while regionalised, the special `Royal Navy` card clears its own preserved PAR, the same PAR is added back into the parent scenario Region cards on the active assignment basis, and each receiving card shows that added Royal Navy contribution in the shared middle band with a small Royal Navy swatch at left and the added PAR at right
- the same interaction now applies in `Current`, but the redistribution path uses the Current preset's boundary-code grouping instead of a scenario assignment lookup
- that Current redistribution path now also includes the Portsmouth Royal Navy split-parent fallback, so `BP1` contributes to `London & South` in the bottom-left cards instead of being dropped
- that injected Royal Navy contribution row now lives in the shared middle band across receiving Region cards, with reserved top/bottom clearance so the bottom metrics stack can stay anchored while the card grows downward as needed
- the `Regionalise` / `Unregionalise` control pill in the special `Royal Navy` card now uses that same middle-band contract with extra clearance above and below the button, plus the tiny locked downward optical correction so it still reads on the same horizontal plane
- within that injected Royal Navy contribution row, the small navy circle is now horizontally centered to the main Region swatch column above rather than left-aligned within the first cell
- within that same injected row, the contribution number now keeps its existing row rail and horizontal anchor but carries a tiny locked vertical centering correction so the text reads on the small navy circle centreline instead of slightly high
- the absolute `Total` remains anchored to the canonical `Export_30_Mar_26.csv` PAR sum, which currently matches the shipped `public/data/facilities/facilities.geojson` total exactly (`175,649`)
- columns `1`-`9` render PMC Region title cards for the fixed PMC order, with the full-opacity swatch in row `1` and the Region title in row `2`
- column `10` is reserved for the matching `Total` title card, now with a black circle swatch in row `1`
- every bottom-row card now renders a three-line PAR stack below the middle band:
  - top line = actual Region PAR on the active assignment basis
  - middle line = correction value shown as `n (y%)`
  - that middle correction line now stays at the normal non-title size/weight across the whole row rather than shrinking the parenthetical context
  - bottom line = corrected sum, which keeps the existing final-total rail
- that same contract now also applies to the `Total` card:
  - actual total PAR
  - `8,500 (100%)` correction
  - corrected total sum
- the final PAR number in each bottom-row card now uses the same `500` weight as the header-pane titles such as `Functions`, while the actual/correction lines stay on the normal non-title weight
- the playground panel keeps the same `COA 3a` / `COA 3b` wiring and rebuilt runtime board products
- the bottom-right playground pane uses a content-height header with no bottom padding, so the visible title-bottom-to-buttons gap resolves to the default seam instead of inheriting a tall fixed header
- combined-practice family-ring default colours are now chosen by a perceptual-distance scorer in `src/lib/combinedPractices.ts`, not just by stable palette order: the selector avoids the parent facility point-colour family, avoids the Current-region colour family, and deconflicts already-assigned same-region and nearby combined-practice colours before falling back to tiny named overrides
- combined-practice family rings and visible PMC point borders should now be treated as outer point treatments in `src/features/map/mapStyleUtils.ts`, not as inside-band decoration:
  - the fill keeps its own footprint
  - the combined-practice family ring sits outside the point footprint when present
  - the visible point border sits outside the current outer point treatment, so it wraps either the plain point or the point-plus-combined ring
  - the luminous selected-point ring must therefore start from the true outermost rendered point edge for plain, bordered, combined, and bordered-plus-combined points
  - canvas padding must be derived from that final rendered outer footprint so larger point sizes and stacked outer treatments do not clip
- PMC point borders still default to off in the loaded region style state, and enabling them from older zero-opacity state should promote them back to a visible default border
- live-checked bottom-row geometry at `1280px` viewport width:
  - map width and bottom-left width: `932.6875px`
  - sidebar width and bottom-right width: `311.3125px`
  - main-row to bottom-row gap: `12px`
  - playground title-bottom-to-buttons gap: `12px`

Practical rule:

- do not collapse the two playground entry paths back into one mutable workspace that swaps source presets at click time
- keep each playground baseline explicit in config/store/save-state so restore behavior and future draft persistence remain unambiguous

## Handover Rule

When ending a non-trivial thread:

- checkpoint with `jj`
- update the relevant canonical docs
- update `docs/sidebar-pane-status.md` if pane truth changed
- update `docs/sidebar-parity-bugs.md` if a bug is deferred
- update `docs/agent-handover.md` and `docs/agent-continuation-protocol.md` if the strategy or handoff rules changed

This is the rule that should preserve seamless transfer between coding agents.

## 2026-04-01 Recovery

Canonical repo:

- `/Users/andrew/Projects/dmsGIS`

Do not treat the iCloud checkout as the production source of truth:

- `/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS`

What was recovered in the canonical repo:

- the app was not permanently lost; it was broken by a real runtime/layout regression after repo-path confusion
- dev asset URL builders were sending some GeoJSON fetches to `/dmsGIS/data/...` in local dev, which returned the HTML app shell instead of JSON
- `MapWorkspace.tsx` was also bypassing runtime-product rewriting for boundary-system lookup paths by iterating the raw `BOUNDARY_SYSTEMS` constant
- scenario workspace baselines were keeping raw `lookupBoundaryPath` values instead of runtime-rewritten ones
- the live shell layout was also broken because layout-critical `display: grid` / `display: flex` behavior was still relying on `@apply`, but the served app was computing `.app-shell` and `.workspace-grid` as `display: block`

Recovered by:

- centralizing dev/prod asset URL resolution in `src/lib/runtimeAssetUrls.ts`
- routing manifest/facility/overlay/basemap loaders through that helper
- switching boundary-system lookup loading to resolved boundary-system paths
- rewriting scenario workspace lookup paths through the active runtime-family resolver
- hardening the shell CSS with explicit layout declarations for:
  - `html, body, #root`
  - `.app-shell`
  - `.workspace-grid`
  - `.sidebar`
  - `.map-panel`
  - `.panel`
- then hardening the map container sizing explicitly for:
  - `.map-panel__inner`
  - `.map-canvas`
  - `.map-canvas .ol-viewport`
  - `.map-canvas .ol-overlaycontainer`
  - `.map-canvas .ol-overlaycontainer-stopevent`

Verified on the live dev app:

- no startup JSON parse errors from failed GeoJSON loads
- no `Loading layers...` banner after settle
- no `Error:` banner after settle
- no `No regions loaded.` banner after settle
- map left / sidebar right / bottom row aligned correctly again
- OpenLayers viewport and zoom controls render at full pane height again

Recovery note:

- `docs/recovery-state-2026-04-01-main-repo.md`

## 2026-04-02 Follow-up

- Playground Region reassignment should preserve the active scenario-workspace editor selection when the assignment popover applies a new Region:
  - closing the popover manually can still clear the transient selection state
  - but applying a reassignment should leave the editor focused on the newly assigned Region so the dissolved derived outline can refresh and highlight immediately
- the `ScenarioPlaygroundPane` "Start state" copy should use subtitle treatment, not normal sidebar row-label treatment
- Playground board fills, selected Region borders, assignment-popover defaults, facility remapping, tooltip identity, and visible-facility PAR summaries now all route through one active assignment-authority seam:
  - runtime assignment source construction remains in `src/features/map/scenarioWorkspaceRuntime.ts`
  - active authority selection now lives in `src/features/map/scenarioAssignmentAuthority.ts`
  - runtime composition stays in `src/features/map/playgroundRuntimeSession.ts`
  - future optimization work should treat `scenarioAssignmentAuthority.ts` as the first lookup/indexing boundary instead of reintroducing per-consumer lookup logic
- architecture map:
  - `docs/map-runtime-architecture-map-2026-04-02.md`
