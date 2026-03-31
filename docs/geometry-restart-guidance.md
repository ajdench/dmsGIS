# Geometry Restart Guidance

This is the single restart brief for future geometry passes in this repository.

It is meant to replace thread-memory as the primary source of guidance after the March 2026 cycle of partial fixes, compare-family experiments, and runtime/source drift.

It should be read before making further changes to:

- `Current`
- `2026`
- scenario board products
- static and dynamic Region borders
- split-ICB support
- topology products
- masks
- facility enrichment
- app-side geometry routing

This file is not a command script. It is a detailed instructional note that records:

- the intended outcome
- the actual current app/runtime contracts
- the source and build chain now present in the repo
- where geometry docks into the UI
- what has repeatedly gone wrong
- what must remain stable
- what needs explicit confirmation before coding

## 1. Outcome To Aim For

The intended product outcome, restated from the user brief, is:

1. Canonical England ICB `BSC` and devolved-administration HB-equivalent canonicals should define the board family.
2. Combined, those board products should define the UK and NI coastal border.
3. Internal borders are ICB/HB borders only.
4. External borders are coastal.
5. Everything should be contiguous.
6. Borders are needed because they support dynamic Regional assignment.
7. `Current` is pre-2026 and does not change those board definitions.
8. NHS 2026 mergers define the merged 2026 family.
9. That merged 2026 family feeds:
   - `SJC JMC`
   - `COA 3a`
   - `COA 3b`
   - both Playgrounds
10. Playground dynamically assigns Regions.
11. Three `Current` cases need Ward-level Regional assignment.
12. Facilities currently carry pre-2026 Regional assignment.
13. Scenario definitions for `SJC JMC`, `COA 3a`, and `COA 3b` are already written into the app.
14. Populated / unpopulated board and Region coloring depends on facility-aware assignment contracts.
15. External arcs and internal arcs should be explicitly defined.
16. Wards should be `BSC`.
17. Internal NHS Regions and ICBs should be `BSC` or the closest equivalent canonical family.

This is the target. Future passes should test every geometry decision against this target rather than against a local artifact that merely “looks closer.”

Core architecture decision:

- the final rebuild should aim for one shared geometry foundation that feeds:
  - `Current`
  - `2026`
  - static scenarios
  - Playground
- future work should avoid inventing separate geometry logic for each of those states where one shared foundation can serve them all

## 2. Repo And Server Truth

### 2.1 Active repo

The active repo for this guidance is:

- `/Users/andrew/Projects/dmsGIS`

### 2.2 Known second checkout

A second checkout exists:

- `/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS`

That second checkout was edited during part of the March 2026 cycle and was accidentally confused with the main repo.

### 2.3 Dev-server trap

At one point:

- edits were being made in one checkout
- `http://127.0.0.1:5173/dmsGIS/` was being served from the other

That caused false conclusions.

Before trusting any visual result, future passes should verify:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
ps -axo pid,ppid,command | rg "vite|npm run dev|node .*vite"
curl -I http://127.0.0.1:5173/dmsGIS/
```

## 3. Current App Geometry Model

This section records how geometry docks into the app today.

### 3.1 Top-level presets

The app does **not** currently have a standalone `2026` preset.

The top bar exposes only:

- `current`
- `coa3a` (`SJC JMC`)
- `coa3b` (`COA 3a`)
- `coa3c` (`COA 3b`)

Source:

- `src/lib/config/viewPresets.json`
- `src/components/layout/TopBar.tsx`

Working decision:

- no additional plain `2026` preset is required
- `SJC JMC`, `COA 3a`, `COA 3b`, and Playground should all be understood as the same merged `2026` board family with different Region assignment / coloration behavior layered on top
- a separate plain `2026` preset would therefore be an inspection convenience only, not a required product state

### 3.2 Boundary-system split

Boundary-system routing is centralized:

- `current` -> `legacyIcbHb`
- all scenario presets -> `icbHb2026`

Source:

- `src/lib/config/boundarySystems.ts`

This means there is already an app-level distinction between:

- the pre-2026 board family
- the 2026 board family

### 3.3 What `Current` loads today

`Current` currently uses:

- board fill:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- lookup boundary:
  - same file
- ward split fill:
  - `public/data/regions/UK_WardSplit_simplified.geojson`
- ward split parent codes:
  - `E54000025`
  - `E54000042`
  - `E54000048`

Source:

- `src/lib/config/viewPresets.json`

### 3.4 What scenario presets load today

`SJC JMC`

- board fill:
  - `public/data/regions/UK_JMC_Board_simplified.geojson`
- visible outline overlay:
  - `public/data/regions/UK_JMC_Outline_arcs.geojson`
- lookup boundary:
  - `public/data/regions/UK_JMC_Outline_simplified.geojson`

`COA 3a`

- board fill:
  - `public/data/regions/UK_COA3A_Board_simplified.geojson`
- visible outline overlay:
  - `public/data/regions/UK_COA3A_Outline_arcs.geojson`
- lookup boundary:
  - `public/data/regions/UK_COA3A_Outline_simplified.geojson`

`COA 3b`

- board fill:
  - `public/data/regions/UK_COA3B_Board_simplified.geojson`
- visible outline overlay:
  - `public/data/regions/UK_COA3B_Outline_arcs.geojson`
- lookup boundary:
  - `public/data/regions/UK_COA3B_Outline_simplified.geojson`

Source:

- `src/lib/config/viewPresets.json`

### 3.5 Playground docking

Playground is **not** a new geometry family.

It is two interactive workspaces layered on top of the static scenario presets:

- `dphcEstimateCoa3aPlayground` based on `coa3b`
- `dphcEstimateCoaPlayground` based on `coa3c`

Source:

- `src/lib/config/scenarioWorkspaces.ts`
- `src/components/layout/ScenarioPlaygroundPane.tsx`

### 3.6 Runtime layer reconciliation

The live map does not hardcode polygon loading in one place only. It routes geometry through:

- preset config
- boundary-system lookup
- overlay-layer reconciliation
- selection/highlight routing
- draft-aware runtime overrides

Important files:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/overlayBoundaryReconciliation.ts`
- `src/features/map/workspaceLookupSources.ts`
- `src/features/map/lookupSources.ts`
- `src/features/map/boundarySelection.ts`
- `src/features/map/selectionHighlights.ts`

### 3.7 Current-specific selection behavior

`Current` is still special in the runtime:

- unsplit Region highlight can be derived live from visible board layers
- split cases rely on ward-split support
- fallback can still involve precomputed outline files

That means `Current` selected Region behavior is not yet one homogeneous preprocess-owned seam.

Working decision for `Current`:

- visible Region borders and selected Region borders should ultimately use the same preprocessed `Current` Region-border geometry
- selection/highlight behavior should differ by styling only
- the current mixed-mode behavior should be treated as transitional, not as the desired final contract

Source:

- `src/features/map/boundarySelection.ts`
- `src/features/map/selectionHighlights.ts`

### 3.8 Scenario-specific selection behavior

Static scenario presets prefer precomputed outline files.

Playground prefers a derived dissolved outline source from live edited assignment runtime.

That means static and dynamic Region-border behavior already differ by design.

Working decision for static presets:

- visible Region borders and selected Region borders should come from the same preprocessed Region-border family
- the difference between them should be styling only
- static presets should not maintain separate geometry logic for:
  - visible Region border overlays
  - selected Region highlight borders

Source:

- `src/features/map/derivedScenarioOutlineSource.ts`
- `src/features/map/scenarioWorkspaceRuntime.ts`

### 3.9 Facilities, populated/unpopulated, and PAR

Facilities geometry behavior is part of the contract.

Important runtime facts:

- facilities come from `public/data/facilities/facilities.geojson`
- styling and selection remap facility Region assignment against the active assignment source
- populated/unpopulated state is derived from facility codes loaded into:
  - `icb_hb_code`
  - `icb_hb_code_2026`
- those sets are currently unioned for styling convenience
- top-bar PAR depends on the active assignment source and visible facility features
- bottom cards use:
  - raw PMC region PAR in `Current`
  - preset-region PAR in static scenarios
  - draft/runtime assignment behavior in Playground

Working decision for facility geography fields:

- each facility record should retain both:
  - a `Current` board reference
  - a `2026` board reference
- this is true even though the stored PMC Region assignment remains pre-2026

This allows:

- `Current` views to resolve directly against the `Current` board family
- `2026` and scenario views to resolve directly against the merged `2026` board family
- pre-2026 PMC Region assignment to remain intact as its own separate contract

Important files:

- `src/store/appStore.ts`
- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/scenarioFacilityMapping.ts`
- `src/features/map/facilityPar.ts`
- `src/lib/workspaceBottomCards.ts`

Working decision for `Current` split-population styling:

- the three special split ICB parents are, by definition, populated
- their split component parts should therefore also be treated as populated
- those component parts should be colored according to their assigned Region
- they should not be reclassified as unpopulated simply because a sub-unit does not independently contain a facility point

## 4. Public Runtime Contracts That Must Stay Stable

These are live app contracts. Internal rebuild names may change, but these paths are currently wired into the UI and should only change as part of an explicit app-contract migration.

### 4.1 Current

- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`
- `public/data/regions/UK_WardSplit_simplified.geojson`
- `public/data/regions/UK_WardSplit_internal_arcs.geojson`
- `public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson`
- `public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson`
- `public/data/regions/UK_Legacy_Region_Outlines_Codex_v01.geojson`

### 4.2 2026

- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`

### 4.3 Scenario board and outline products

- `public/data/regions/UK_JMC_Board_simplified.geojson`
- `public/data/regions/UK_COA3A_Board_simplified.geojson`
- `public/data/regions/UK_COA3B_Board_simplified.geojson`
- `public/data/regions/UK_JMC_Outline_arcs.geojson`
- `public/data/regions/UK_COA3A_Outline_arcs.geojson`
- `public/data/regions/UK_COA3B_Outline_arcs.geojson`
- `public/data/regions/UK_JMC_Outline_simplified.geojson`
- `public/data/regions/UK_COA3A_Outline_simplified.geojson`
- `public/data/regions/UK_COA3B_Outline_simplified.geojson`
- `public/data/regions/outlines/*.geojson`

### 4.4 Supporting runtime products

- `public/data/regions/UK_ICB_LHB_v10_topology_edges.geojson`
- `public/data/regions/UK_Health_Board_2026_topology_edges.geojson`
- `public/data/regions/UK_ICB_LHB_v10_water_edge_classes.geojson`
- `public/data/regions/UK_Health_Board_2026_water_edge_classes.geojson`
- `public/data/facilities/facilities.geojson`
- `public/data/basemaps/uk_landmask_current_v01.geojson`
- `public/data/basemaps/uk_seapatch_current_v01.geojson`
- `public/data/basemaps/uk_landmask_2026_v01.geojson`
- `public/data/basemaps/uk_seapatch_2026_v01.geojson`

## 5. Canonical And Near-Canonical Source Inventory

### 5.1 England

Canonical England board source for the intended family:

- `geopackages/compare_sources/Integrated_Care_Boards_April_2023_EN_BSC.gpkg`

Additional exact/reference sources in use:

- `geopackages/Integrated_Care_Boards_April_2023_EN_BFC_-2874981933571631596.gpkg`
- `geopackages/Sub_Integrated_Care_Board_Locations_April_2023_EN_BFC_-5517230538851916332.gpkg`

### 5.2 Wards

Ward `BSC` source now present in repo:

- `geopackages/compare_sources/Wards_December_2025_UK_BSC.gpkg`

Ward scope should remain limited to the three special `Current` split cases.

### 5.3 Wales

Best board-level canonical/equivalent source currently in repo:

- `geopackages/Local_Health_Boards_December_2023_WA_BFC_-5927802952650685957.gpkg`

### 5.4 Scotland

Best board-level equivalent source currently in repo:

- `geopackages/Healthcare_NHS_Health_Boards__Scotland__2695629962780893909.gpkg`

### 5.5 Northern Ireland

Best board-level equivalent source currently in repo:

- `geopackages/nhs_ni_health_boards_bxx_gpkg.gpkg`

### 5.6 Country-level BSC source

Country-level BSC is present and currently used for some devolved scenario-outline handling:

- `geopackages/compare_sources/Countries_December_2023_UK_BSC.gpkg`

This is useful for country/devolved envelopes and outline replacement, but it is not a board-level HB source.

### 5.7 Working decision on devolved canonicals

The current working decision is:

- England should remain on true board-level `BSC`
- Wales, Scotland, and Northern Ireland should be treated as using the best available board-level official or official-equivalent canonical sources already present in this repo

That means future passes should not block on trying to find stricter devolved board-level `BSC` replacements unless genuinely new evidence appears.

The practical implication is:

- devolved board geometry may remain more detailed than England `BSC`
- that is acceptable as source truth
- any visual-family harmonization should happen in the shared runtime-preparation stage, not by pretending those devolved sources are already board-level `BSC`

## 6. Exact, Runtime, And Compare Products Present In Repo

### 6.1 Exact current products

- `geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson`
- `geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson`
- `geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson`

### 6.2 Exact 2026 products

- `geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson`

### 6.3 v3.8 paired source-family products

- `geopackages/outputs/v38_bsc_runtime_family/UK_ICB_LHB_Boundaries_Current_BSC_source.geojson`
- `geopackages/outputs/v38_bsc_runtime_family/UK_Health_Board_Boundaries_2026_BSC_source.geojson`
- `geopackages/outputs/v38_bsc_runtime_family/SUMMARY.txt`
- `geopackages/outputs/v38_bsc_runtime_family/paired_current_2026_alignment_report.json`

### 6.4 Compare families on disk

The repo already contains compare-family runtime trees, including:

- `public/data/compare/bfe/`
- `public/data/compare/current-east-bsc/`

Those families are useful for review and diagnostics, but they are not the accepted live baseline.

## 7. Actual Build Chain Present In Repo

### 7.1 High-level chain

The current repo has several overlapping build paths. The most relevant chain is:

1. canonical / exact board build
2. paired `v3.8` source-family build
3. runtime board preprocessing
4. scenario derivation
5. topology extraction
6. group outline extraction
7. masks / alignment
8. facilities enrichment

### 7.2 Key scripts

Canonical / exact:

- `scripts/build_current_canonical_board_boundaries.py`
- `scripts/build_current_ward_split_exact.py`
- `scripts/fix_current_ward_split_parent_coverage.py`
- `scripts/build_current_split_icb_runtime.py`
- `scripts/build_current_split_internal_arcs.py`

Paired family and runtime:

- `scripts/build_v38_bsc_source_family.py`
- `scripts/preprocess-boundaries.mjs`
- `scripts/build_v38_current_bsc_runtime_family.mjs`
- `scripts/build_v38_full_bsc_runtime_family.mjs`
- `scripts/validate-runtime-geometry-family.mjs`

Scenarios and outlines:

- `scripts/derive-boundary-presets.mjs`
- `scripts/extract-group-outlines.mjs`
- `scripts/extract-topology-edges.mjs`
- `scripts/buildLegacyRegionOutlines.mjs`

Facilities and masks:

- `scripts/enrich-facilities.mjs`
- `scripts/build-uk-basemap-alignment.mjs`
- `scripts/import-facilities-csv.mjs`

Bootstrap / staged rebuild work:

- `scripts/buildPairedCurrent2026StageTree.mjs`
- `scripts/rebuildFamilyStagePlan.mjs`
- `scripts/validatePairedCurrent2026StageTree.mjs`
- `scripts/promotePairedCurrent2026StageTree.mjs`

## 8. What Is Structurally Right

The following ideas are already correct and should be preserved:

- `Current` and `2026` are treated as paired families, not unrelated products
- the app already centralizes preset config and boundary-system routing
- scenario definitions are config/data-driven in the app
- Playground is correctly treated as dynamic assignment on top of scenario baselines
- split-ICB handling is limited to three specific `Current` parent cases
- public runtime contracts are relatively stable
- compare families are isolated through runtime-map-product tokenization rather than mutating the live baseline

## 9. What Is Still Wrong Or Fragile

This is the most important section for future passes.

### 9.1 The restart guidance itself had drifted

This file previously identified the wrong active repo. That is now corrected here.

### 9.2 There is no explicit `2026` UI preset

This is not a bug by itself, but it is a source of confusion.

The UI exposes:

- `Current`
- three static scenario presets built on 2026
- two dynamic Playgrounds built on those scenarios

It does **not** expose a plain “2026 boards only” inspection mode.

That means visual review of the raw merged board family is harder than it should be.

### 9.3 `Current` selection/highlight is still mixed-mode

`Current` selected Region behavior is not yet cleanly preprocess-owned end to end.

It still mixes:

- live derived board-based Region highlight
- ward-split logic
- precomputed outline fallback

That is one reason `Current` Region-border debugging became cyclical.

### 9.4 The 2026 source family is still mixed

The paired `v3.8` source-family summary is explicit:

- `Current` = `42` direct official BSC + `26` simplified upstream-equivalent boards
- `2026` = `29` direct official BSC + `4` merge-shell seeds + `3` redraw-shell seeds + `26` simplified upstream-equivalent boards

So despite the `BSC-first` framing, the shipped family is still mixed in provenance.

### 9.5 Runtime simplification is still a major drift seam

`scripts/preprocess-boundaries.mjs` still applies runtime clipping + simplification to both `Current` and `2026`.

The alignment report shows that source-stage changed-board agreement can still drift materially at runtime stage.

This matters because users judge the visible runtime product, not the source-stage report.

### 9.6 Scenario derivation still leans on legacy assignment products

Scenario boards are not built from nothing; they still depend on assignment logic and older supporting products.

`JMC` in particular still has lineage dependence on legacy assignment data.

That means a “clean 2026 board family” alone is not enough unless the scenario derivation chain is reviewed at the same time.

### 9.7 Static scenario Region borders are better than before, but still structurally split

The repo now distinguishes:

- visible scenario outline arcs
- polygon lookup products
- precomputed selected-outline files
- live derived outlines for Playground

That is better than dissolve-first runtime logic, but it still means static and dynamic Region-border behavior come from different product classes.

### 9.8 Facilities are a geometry contract, not a side concern

The app’s populated/unpopulated styling, PAR, and bottom cards depend on facility assignment and dual-coded board references.

If:

- `icb_hb_code`
- `icb_hb_code_2026`

or snap/containment logic drift, the geometry may look plausible while the operational behavior is wrong.

### 9.10 Legacy `Current` component products are transitional

The old `Current` component products should be treated as transitional legacy artifacts, not as the long-term geometry basis.

That means future Region-border and assignment logic should prefer:

- board units
- split units
- shared arcs

and should move away from relying on the old component products as the primary geometric source of truth.

### 9.9 The validator does not yet enforce the same strictness as visual review

The alignment report can show meaningful runtime drift while the validator still passes.

That means future passes should not treat “validator green” as sufficient evidence of visual or contractual correctness.

Working decision on acceptance:

- a geometry family should not be accepted just because it builds, tests, or validates green if it still visibly drifts from the intended seam family
- visual seam correctness remains a real acceptance gate, not an optional extra after automated checks

## 10. Current Static And Dynamic Map States That Must Keep Working

Future passes must preserve all of these modes:

### 10.1 Static `Current`

- board fill
- ward split
- split internal arcs
- facility selection
- board selection
- selected Region highlight
- populated / unpopulated coloring
- PAR
- bottom cards

Working decision for the three special `Current` cases:

- Ward geometry defines true sub-ICB split units for those cases
- those split units are then treated as belonging to different Regions for Regional-assignment purposes
- they are not merely hidden assignment helpers behind whole unsplit ICB polygons

At the same time, the app should keep a clear distinction between:

- the normal shipped `Current` Region behavior
- a debug-only ward overlay for those special cases

That debug behavior should be:

- available only in `Current`
- surfaced through the Overlays options
- off by default
- selectable when turned on
- explicitly understood as a debugging/inspection layer, not the normal default presentation

Scope decision for debug geometry overlays:

- this explicit debug-only geometry overlay requirement applies to `Current` split wards only
- it should not be generalized by default to 2026/scenario seams
- the reason is that 2026 is based on whole merged ICB/HB units rather than the same kind of Ward-driven split-parent debugging need

Working decision for populated/unpopulated behavior in those split cases:

- split ICB parent boards are populated by definition
- their child split units inherit that populated status
- Region coloring should therefore follow assigned Region for those split units without introducing unpopulated styling inside the split parent

Working decision for `Current` Region borders:

- the normal visible `Current` Region border and the selected/highlighted `Current` Region border should use the same preprocessed geometry
- only styling should differ between those two presentations

### 10.2 Static scenario presets

- scenario board fill
- static Region outline overlay
- selected Region highlight
- board-name lookup
- facility recoloring / reassignment by scenario board
- PAR and bottom cards by scenario region

Important interpretation:

- these presets are not separate geometry families
- they are plain merged `2026` ICB/HB board tiles with scenario-specific grouping, coloring, and outline behavior applied on top
- future rebuild work should preserve that distinction and avoid letting scenario logic fork the underlying merged board geometry
- future rebuild work should also keep visible and selected Region-border geometry identical in static presets, differing only by style treatment

Working decision on scenario and Playground seam ownership:

- static scenarios and Playground should not alter the underlying merged `2026` board seams themselves
- they should only change Region assignment, grouping, coloring, and the dissolved Region products derived from that same board family
- Region outer borders must dissolve correctly from the shared merged `2026` board family rather than being authored as an independent competing geometry truth

### 10.3 Dynamic Playground

- baseline scenario board family as editable assignment base
- live derived Region dissolve
- draft-aware facility reassignment
- selection/highlight against the edited runtime assignment source

### 10.4 Compare-family review states

The runtime-map-product token system already supports compare families on disk.

That should remain a review tool, not a substitute for correct baseline products.

Working decision for review shipping:

- review/test geometry should be shippable for visual inspection
- but that shipping should be explicit and non-destructive
- review geometry should be activated through a deliberate review switch, review family, or equivalent explicit mechanism
- it should not silently overwrite or replace the accepted live baseline without a conscious cutover decision

Working decision for accepted shipping:

- review and inspection may happen through explicit non-destructive review families
- but the accepted rebuild should ship as one coherent cutover across:
  - `Current`
  - `2026`
  - static scenarios
  - Playground support
- it should not be treated as a piecemeal final ship where one family is accepted long before the others if the shared foundation is still changing

### 10.5 Facility geography contract

Future rebuild work should preserve the distinction between:

- stored PMC Region assignment
- `Current` board reference
- `2026` board reference

The intended long-term contract is:

- PMC Region assignment remains pre-2026
- every facility record carries both board-family references
- scenario and Playground behavior can then use the active board-family reference without overwriting the base PMC Region field

## 11. Practical Rebuild Principles

These are strong recommendations, not inflexible commands.

### 11.1 Rebuild together

Treat `Current` and `2026` as one paired build.

And more broadly:

- treat the whole app as one shared geometry family with controlled branch points
- not as separate ad hoc geometry products for `Current`, each scenario, and Playground

### 11.2 Branch once

The branch point should be:

- `Current` unmerged
- `2026` merged/redrawn under NHS 2026 rules

### 11.3 Keep geometry ownership early

External arcs, internal arcs, and split-unit behavior should be preprocess-owned.

Late runtime dissolve and edge-cancellation should be treated as fallback behavior, not as the primary seam.

For static presets, this should extend to Region-border products:

- one preprocess-owned Region-border family per static preset
- one geometry basis reused for both visible and selected Region borders
- no parallel dissolve path for selected borders when the visible border already exists

Working decision on geometry primacy:

- shared external and internal arc products should be treated as the primary preprocess-owned seam family
- downstream polygons should be rebuilt from those shared arcs where feasible
- future passes should prefer “derive polygons from the shared puzzle pieces” over “derive arcs later from already-finished polygons”

Why this is the best approach in this repo:

- it keeps `Current`, `2026`, static scenarios, and debug overlays on one common seam family
- it reduces later dissolve drift
- it makes visible and selected Region borders easier to keep identical in geometry
- it gives one stable place to validate contiguity and coast/internal-edge ownership

Working decision for Region products:

- Regions should be generated from the shared foundation:
  - board units
  - split units
  - assignments
  - shared arcs
- static presets should ship prebuilt generated Region products from that shared foundation
- Playground should derive Region products dynamically from that same foundation

This avoids:

- hand-maintaining separate Region polygon truth
- separate static vs dynamic geometry logic
- drift between static presets and Playground

### 11.4 Keep the app contract stable until acceptance

Internal staged names can improve.

Public filenames and app-facing paths should stay stable until a reviewed cutover.

This applies especially to the old `Current` component products:

- they may remain as stable public/runtime contracts during transition
- but future rebuild logic should not continue to treat them as the preferred source geometry if board units, split units, and shared arcs are available instead

This same caution applies to review families:

- review builds should be easy to ship for inspection
- but review shipping should not destructively replace the accepted baseline by accident

### 11.5 Validate at each stage, not just at the end

Checks should exist for:

- exact-stage no-overlap / no-gap
- `Current` vs `2026` shared-coast alignment
- changed-board shell behavior
- split-parent containment
- scenario-to-parent seam alignment
- facility dual-family containment
- selected-outline seam correctness

For the three special `Current` split cases, validation should also explicitly check:

- exact ward-to-split assignment correctness
- split-unit containment inside the parent ICB shell
- Region dissolve correctness when those split units are assigned across different Regions
- debug overlay selectability and default-off behavior in the app
- populated styling inheritance from the parent split ICB into all child split units

And across the whole family:

- green automated checks should not override visible seam failure
- if the map still looks wrong, the family is not yet accepted

### 11.6 Treat devolved detail honestly

Do not frame Wales, Scotland, or Northern Ireland as board-level `BSC` if the repo only has more detailed official-equivalent board sources.

Instead:

- preserve them as the canonical board truth for those administrations
- document the provenance explicitly
- apply the agreed shared runtime treatment afterward

This keeps provenance honest while still allowing one coherent runtime family.

## 12. Questions A Future Pass Should Answer In Order

These are the right dependency-order questions. They should be asked one at a time when the answer genuinely changes the next step.

1. What is the exact canonical board family for each administration in this repo, and which of those are truly `BSC` versus equivalent-only?
2. What is the intended runtime/BSC-like treatment for devolved administrations, and how closely should it match England visual coarseness?
3. Should `Current` selected Region borders be derived from exact units then simplified, or from runtime units with authoritative topology support?
4. Should the app gain a plain `2026` inspection mode so the raw merged board family can be reviewed directly?
5. Which scenario products are truly static contracts, and which should remain derived/dynamic?
6. Is the current populated/unpopulated union logic still the intended long-term contract, or should it become family-specific?
7. Which validator thresholds should be tightened so “green” better matches visual acceptance?

## 13. First Recommended Review Sequence

If a future pass is restarting from this document, the most sensible order to review is:

1. verify repo and server truth
2. verify public runtime contracts actually loaded by the app
3. verify canonical source inventory
4. verify `Current` exact and split products
5. verify `2026` exact and changed-board merge/redraw products
6. verify runtime preprocessing drift
7. verify scenario derivation from `2026`
8. verify selected/visible Region-border ownership
9. verify facilities dual-family alignment
10. only then promote or replace live runtime products

## 14. Immediate Restart Notes

At the time of this update:

- the main repo is `/Users/andrew/Projects/dmsGIS`
- the live app is being served from that main repo
- the app is working again at the shell/UI level
- the deeper unresolved problem is still geometry and contract coherence, not UI boot failure

The key lesson from the March 2026 cycle is:

- do not keep patching visible outputs in isolation
- do not trust a green validator without checking the actual runtime/UI seam it is supposed to protect
- do not let exact, runtime, scenario, and facility questions blur together

The right next move is a disciplined paired review and rebuild, not another local visual tweak.

## 15. Clarified Decisions So Far

The following decisions have already been made and should not need re-asking unless the user later changes direction:

- England stays on true board-level `BSC`
- Wales, Scotland, and Northern Ireland use the best available board-level official or official-equivalent canonicals already present in this repo
- no separate plain `2026` preset is required as a product requirement
- `SJC JMC`, `COA 3a`, `COA 3b`, and Playground all sit on the same merged `2026` board family, with different Region assignment / coloration layered on top
- the three special `Current` cases are true Ward-defined split units
- those split units are real parts of their parent ICBs for Regional-assignment purposes
- `Current` should expose a debug-only Ward overlay for those special cases:
  - in Overlays
  - off by default
  - selectable when turned on
- split ICB parents are populated by definition, and their child split units inherit populated status
- static presets should use the same geometry for visible and selected Region borders, with only style differences
- `Current` should also use the same geometry for visible and selected Region borders, with only style differences
- each facility should retain:
  - a `Current` board reference
  - a `2026` board reference
  while keeping its PMC Region assignment as a separate pre-2026 contract
- shared external and internal arc products are the primary puzzle pieces
- polygons should be rebuilt from those shared arcs where feasible
- legacy `Current` component products are transitional, not the preferred long-term geometry basis
- green builds/tests are not enough if the map still looks wrong
- review/test geometry should be shippable for visual inspection, but only through explicit non-destructive switching
- one shared geometry foundation should feed `Current`, `2026`, static scenarios, and Playground
