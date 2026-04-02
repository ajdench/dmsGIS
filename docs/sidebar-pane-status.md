# Sidebar Pane Status

This document is the current pane-by-pane truth ledger for the production sidebar.

It exists to answer:

- what is live in production now
- what matches the prototype
- what still does not
- which contracts and surfaces are already wired
- which remaining issues are deferred or still open

This is not the strategy document.
Use `docs/prototype-to-production-playbook.md` for the replacement rules.

## Canonical Sidebar Surfaces

Current live production sidebar composition:

- `src/components/layout/RightSidebar.tsx`

Current live exact-shell production primitives:

- `src/components/sidebarExact/`
- `src/styles/sidebarExact.css`

Current live exact pane surfaces:

- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/groups/RegionsPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`

## Global Sidebar Status

### Current state

- production is now running on the exact-shell sidebar path
- the sidebar status/notice surface is now an explicit typed production path:
  - loading + neutral notices use the blue `info` treatment
  - validation / unavailable / not-found notices use the orange `warning` treatment
  - runtime `error` messages use the red error treatment
  - saved-view success notices use the green `success` treatment
  - the live renderer is `src/components/layout/SidebarStatus.tsx`
  - the live notice contract is `notice: AppNotice | null` in `src/store/appStore.ts`
  - the status lane is now runtime-only again and renders only when loading, error, or notice state is present
- pane drag is wired
- row drag is wired where relevant
- pill popovers are anchored from the parent pill
- exact toggle labels, chevrons, handles, and pill geometry have been brought much closer to the prototype
- exact swatch rendering is shared and production-owned
- the live app is now running on the `v3.2` coastline-aligned canonical boundary baseline:
  - `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
  - `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- those runtime files are now clipped to the prepared OSM-derived UK landmask before simplification, while the visible basemap remains unchanged
- the ongoing geometry-source/preprocessing path is documented separately in:
  - `docs/current-app-baseline-v3.3.md`
  - `docs/current-app-baseline-v3.1.md`
  - `docs/canonical-board-rebuild-workflow.md`

### Still important

- some parity polish remains
- a few alignment issues are intentionally deferred rather than being repeatedly re-patched
- the old sidebar path still exists in the repo and should be treated as legacy/provisional
- the current right-sidebar shell/lane contract is now:
  - shell background `#e4e5e8` (human-devised visual correction)
  - shell inline padding `12px`
  - shell block padding `13px`
  - major exact-shell panes fill the inner track width with no extra outline/border treatment
  - major pane gap remains the default `12px`
  - inner concave track radius now matches the major pane radius (`var(--radius-lg)`)

## Basemap

### Live surface

- `src/features/basemap/BasemapPanelExact.tsx`
- field definitions: `src/features/basemap/basemapPanelFields.ts`

### What is in place

- exact-shell pane
- prototype-style top-level pane behavior
- draggable `Land` and `Sea` section cards
- pill popovers using the exact-shell popover path
- pane-level visibility derived from immediate child rows

### What is wired

- real production basemap state through `src/store/appStore.ts`
- land/sea color and opacity controls
- land/sea visibility controls

### Known status

- usable and structurally on the exact path
- not the baseline pane for parent-rail alignment
- has a deferred parent-control alignment drift against the Facilities baseline
- `Land` / `Sea` control alignment drift has also been noted for later dedicated review

### Reference bug status

See:

- `docs/sidebar-parity-bugs.md`

## Facilities

### Live surface

- `src/features/facilities/SelectionPanelExact.tsx`
- PMC field definitions: `src/features/groups/pmcPanelFields.ts`

### What is in place

- exact-shell top-level `Facilities` pane
- internal `PMC` parent section
- draggable PMC child rows
- exact-shell child row popovers
- exact search input placement

### What is wired

- real production facility filter state
- real PMC region state through `src/store/appStore.ts`
- local child-row visibility
- local child-row color
- local child-row opacity
- local child-row size
- local child-row shape
- local child-row border color
- local child-row border opacity
- local child-row border thickness
- global PMC broadcasts for visibility, color, opacity, shape, size, border visibility, border color, border opacity, border thickness
- the Facilities / PMC title popover now keeps one deliberate UI-only distinction:
  - the parent `PMC` row still derives its `On / Ox / Off` state from the child rows
  - the global popover `Border` button is treated as a family control and defaults to `Off` on load/preset switch

### Runtime status

PMC styling is not only UI-wired. It is also wired through runtime seams:

- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `src/features/map/selectionHighlights.ts`
- `src/features/map/tooltipController.ts`
- saved-view snapshot schemas in `src/lib/schemas/savedViews.ts`

### Current status

- Facilities is currently the visual/alignment baseline for other parent rails
- PMC child controls now behave locally where the prototype requires them to
- this is currently the strongest pane in terms of prototype-faithful hierarchy
- unedited interactive Playground workspaces now also build the draft-aware assignment and selected-region outline runtime on first load, so facility clicks use the editable Region-border path even before any board reassignment has been made
- preset/workspace switches now explicitly clear the live selected boundary layer, selected Region layer, selected facility halo, and docked tooltip before paint, instead of relying only on store selection reset

### Remaining watchpoints

- continue to verify popover family parity when new fields are added
- preserve local-vs-global semantics if future PMC styling fields are introduced

## Regions

### Live surface

- `src/features/groups/RegionsPanelExact.tsx`
- field definitions: `src/features/groups/regionsPanelFields.ts`

### What is in place

- exact-shell top-level `Regions` pane
- preset-aware sub-pane card for the active scenario/current basis
- draggable region-group rows
- global Regions pill popover
- per-row popovers with populated fill, unpopulated fill, and border sections
- reset buttons on Regions opacity and border-thickness sliders

### What is wired

- production region-group override state through `src/store/appStore.ts`
- per-group populated fill visibility, colour, and opacity
- `Current` ward-split rendering for the three cross-region ICB cases now comes from `UK_WardSplit_simplified.geojson`; the underlying parent ICB fills are suppressed to avoid darker double-tinting, facility clicks in split wards highlight the shared parent ICB boundary, and the selected Region outline is derived live from `regionFill + wardSplitFill` using snapped union-first geometry merging plus exterior-only outline rendering so the full parent Region border includes the split wards without preserving a new internal seam
- direct clicks on those `Current` split wards now resolve back to the parent ICB for yellow board highlight, while the clicked ward’s assigned `region_ref` is still carried through to selected Region resolution so the Region border follows the ward’s actual split assignment
- `Current` boundary-only clicks now preserve the colour-coded selected Region border again; the regression was that the docked boundary-only tooltip path was clearing the selected Region layer immediately after the synchronous Current outline redraw
- `SJC JMC` no longer carries a default-on green scenario outline layer; the remaining internal board-edge lines are still controlled through the Overlays path, while selection outlines continue to resolve from the scenario lookup dataset
- per-group unpopulated fill visibility, colour, and opacity
- per-group border visibility, colour, opacity, and thickness
- global broadcast for populated opacity, unpopulated opacity, border visibility, border opacity, and border thickness
- preset-aware region fill and outline lookup through `src/lib/config/viewPresets.ts`
- populated v10 / 2026 boundary-code sets derived from enriched facilities data

### Runtime status

Regions styling is not only UI-wired. It is also routed through production map/runtime seams:

- `src/features/map/boundaryLayerStyles.ts`
- `src/features/map/overlayBoundaryReconciliation.ts`
- `src/features/map/boundarySelection.ts`
- `src/features/map/MapWorkspace.tsx`
- `src/lib/scenarioWorkspaceAssignments.ts`
- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/derivedScenarioOutlineSource.ts`

### Known status

- live on the exact-shell production path
- global Border opacity broadcaster is now wired
- scenario board-boundary seam masking fix is retained on the landed config (`boardBoundaryStyle.borderOpacity = 0.35`)
- `DPHC Estimate COA Playground` now runs against the visible `COA 3b` map baseline and supports boundary-unit reassignment through an on-map popover
- Playground reassignment writes draft assignments by boundary unit id and now rebuilds one canonical draft-aware board assignment source for the active `COA 3b` workspace, using the workspace source-preset code-groupings for untouched boards plus draft overrides for edited boards
- the assignment popover is docked to the map bottom-right, and reassigned board fill styling now follows runtime-assigned Region labels while derived Region outlines preserve all dissolved pieces for selected-border rendering
- Playground reassignment now preloads the source-preset board dataset as its baseline assignment source, so first-load editable styling does not capture stale `regionFill` geometry from the previously active mode or fall into grey South East / London and East fills
- Playground editable Region geometry is now a dedicated merged polygon product derived from that canonical board-assignment source, instead of switching `scenarioOutline` between static preset polygons and runtime topology-edge fragments
- during an open Playground edit, selected Region-border redraw now treats the popover/editor-selected `scenarioRegionId` as authoritative instead of depending only on feature-prop timing during the reselect cycle
- after applying a Playground reassignment, the editor-selected Region now stays active even after the assignment popover closes, so the newly dissolved merged Region border can highlight immediately instead of waiting for a reselect
- map-runtime Playground consumers now resolve one authoritative assignment source per render cycle, so board fills, selected Region borders, popover defaults, tooltip identity, facility remapping, and visible-facility PAR summaries all read from the same assignment authority seam
- selected Playground Region highlighting is now driven directly from the editor-selected `scenarioRegionId` plus the merged editable Region geometry source, and editable workspaces no longer fall back to static preset outline fetches for the selected Region border
- facility clicks inside Playground now also resolve draft-aware `scenarioRegionId` / Region-name identity for selected-border redraw, and facility symbol styling/remapping now follows the same authoritative assignment source
- when a facility is clicked in Playground, that facility selection now takes ownership of the selected Region border so a stale board-editor selection cannot repaint over it
- non-Playground scenario facility clicks now resolve selected Region borders through the same derived outline source used by boundary clicks before any static outline fallback
- scenario prefixes are now treated as display-only in the Regions list for `SJC JMC`, `COA 3a`, `COA 3b`, and Playground; stored region names remain unchanged
- when Playground is active, the Regions sub-pane title now reads `Playground`, and the top-right map details card shows the selected Region name without the `COA 3b` prefix
- the bottom-row `DPHC Estimate COA Playground` subtitles (`Start state`) are back on subtitle styling rather than normal row-label styling, so they sit below the title as quiet helper copy instead of reading like peer controls

### Remaining watchpoints

- `groupOrder` and `regionGroupOverrides` are still runtime-only and not yet part of the saved-view schema
- Scottish/Welsh/NI click-testing on the scenario presets is still a recommended manual verification pass

## Labels

### Live surface

- `src/features/labels/LabelPanelExact.tsx`
- field definitions: `src/features/labels/labelPanelFields.ts`

### What is in place

- exact-shell top-level pane
- draggable label section cards
- current row inventory matches the prototype surface:
  - Countries
  - Cities
  - Regions
  - Networks
  - Facilities

### What is wired

- production basemap label state through `src/store/appStore.ts`
- colour, opacity, size, border colour, border opacity, and border width where supported by production basemap state
- saved-view-safe through existing basemap snapshot structures

### Important note

The exact pane inventory is now present, but runtime label rendering coverage depends on the existing production map-layer support. Future label rows must continue to be judged on both:

- sidebar parity
- real map/runtime support

### Known status

- structurally on the exact path
- parent-control rail has a deferred alignment drift relative to Facilities

## Overlays

### Live surface

- `src/features/groups/OverlayPanelExact.tsx`
- field definitions: `src/features/groups/overlayPanelFields.ts`
- family/section selectors: `src/features/groups/overlaySelectors.ts`

### What is in place

- exact-shell top-level pane
- draggable overlay section cards
- row ordering now sticks correctly
- empty-state behavior remains preset-aware
- non-Current presets now surface the shared scenario boundary rows `2026 NHS England ICBs` and `Devolved Administrations Health Boards` instead of an empty state

### What is wired

- overlay visibility
- overlay opacity
- overlay border visibility
- overlay border colour
- overlay border thickness
- overlay border opacity
- `englandIcb` / `devolvedHb` overlay rows now use a Fill + Border mixed-state model: Fill defaults off, Border defaults on, and the row button therefore shows `Ox` by default while the line overlay still renders through the border path
- the top-level Overlays pane toggle now preserves mixed-state aggregation correctly, so multiple `Ox` child rows keep the parent toggle at `Ox`
- overlay Border section now uses the section-header toggle rather than a redundant inner `Visible` field
- overlay Fill section now also uses the section-header toggle; the old full-width inner `Visible` control row has been removed
- devolved Health Board internal-border defaults now match the ICB defaults
- topology-edge extraction now reconciles mirrored one-sided edge fragments into true internal borders before chaining same-pair segments, which fixes the broken Wales-facing `ICB-LHB` lines in `Current` and keeps the repaired borders on the normal Overlays controls path
- regenerated topology-edge artifacts are now covered by a coordinate-range regression test so stale bad exports with million-scale coordinates fail the suite instead of rendering as stray horizontal lines on the map
- overlay boundary sources now use a dev-only cache-busting URL token so live Vite sessions pick up regenerated edge GeoJSON without a stale in-memory source
- production overlay-family metadata
- scenario presets intentionally expose the shared `englandIcb` and `devolvedHb` families in the Overlays pane; Current keeps the broader overlay set alongside those shared families
- shared England/devolved border arcs are owned by `englandIcb` while that overlay is visible, but fall back to `devolvedHb` when `englandIcb` is turned off so Wales/Scotland-to-England borders remain available without a doubled stroke

### Known status

- drag snap-back bug was fixed by seeding and synchronizing order state
- parent-control rail has a deferred alignment drift relative to Facilities

## Shared Exact Kit

### Current live exact-shell files

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

### Current exact-shell status

- exact toggle positioning is in a good state
- exact popover anchoring is in place
- exact shape-button icon sizing now matches the prototype token path
- shape buttons have also been centered in their grid cells as a deliberate production improvement
- trailing-control column is now normalised to `--prototype-drag-handle-width` across all drag handles and disclosure buttons
- chevron SVG is absolutely centred within the trailing-control slot with a confirmed 1px optical correction (`left: calc(50% + 1px)`)
- pane-level toggle column now aligns correctly with child row toggles (`--prototype-pane-toggle-alignment-compensation: 4px`)
- section-card bar handle over-compensation removed; handles flush at the shared right margin

### Improvement already accepted beyond prototype

The prototype shape buttons were not perfectly visually centered either.
Production has intentionally improved this while keeping the rest of the contract aligned.

## Deferred Parity Bugs

Open deferred parity bugs:

1. Parent-control rail alignment drift in Basemap, Labels, and Overlays relative to the Facilities baseline
   - status: deferred
   - this remains the main live exact-shell parity issue and should be handled as a dedicated alignment pass rather than opportunistic pane-local tweaks

Recent resolved items:

1. Pane-level toggle column drift — fixed via `--prototype-pane-toggle-alignment-compensation` token
2. Chevron SVG centering in trailing-control slot — fixed via absolute positioning
3. Section-card bar handle over-compensation — compensation rule removed
4. Scenario board-boundary seam visibility reduced by increasing `boardBoundaryStyle.borderOpacity` from `0.14` to `0.35` in `src/lib/config/viewPresets.json`
5. Regions global Border opacity broadcaster is now wired through the store and `regionsPanelFields.ts`

See:

- `docs/sidebar-parity-bugs.md`

## Legacy / Provisional Sidebar Surfaces

These still exist in the repo and should not be treated as the current truth unless a task explicitly targets them:

- `src/components/sidebar/`
- `src/features/groups/PmcPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`
- `src/components/sidebarReplacement/`

The older pane-shell files (`BasemapPanel.tsx`, `SelectionPanel.tsx`, `LabelPanel.tsx`, `LayerPanel.tsx`, `BasemapPanelReplacement.tsx`) were removed in the `2026-04-02` working-app cleanup pass. The live production truth is the exact-shell path.

## Restart Note - 2026-03-29

- the right sidebar no longer contains a top `DPHC Estimate COA Playground` pane
- that surface now lives in a new bottom workspace row, below the main `map + sidebar` row
- bottom-right pane title: `DPHC Estimate COA Playground`
- bottom-right pane content: a locked internal `2`-column grid
  - top row: `Start state` in both columns
  - bottom row: the existing side-by-side buttons
    - `COA 3a`
    - `COA 3b`
- the subtitle-to-button gap is half the default pane content gap, while the title-to-grid spacing stays on the normal pane rhythm
- these are true playground-entry buttons, not plain preset buttons
- `COA 3a` enters a dedicated `COA 3a` playground workspace
- `COA 3b` enters the existing `COA 3b` playground workspace
- the pane itself now stretches to the same bottom-row height as the cards parent surface, and the subtitle/button block is bottom-aligned inside that height so the buttons sit on the pane’s bottom content margin
- the buttons inherit the rebuilt runtime scenario board products from preset config:
  - `COA 3a` -> `public/data/regions/UK_COA3A_Board_simplified.geojson`
  - `COA 3b` -> `public/data/regions/UK_COA3B_Board_simplified.geojson`
- those scenario board products now share the rebuilt merged `2026 BSC` board geometry basis used by `SJC JMC`
- `Current` remains on the separate unmerged/current `v3.8 BSC` board family
- `COA 3a` / `COA 3b` keep their own scenario colouring via feature-level region labels on top of that merged board basis
- the bottom row no longer uses grey parent shells
- both bottom-row wrappers are transparent layout rails
- the visible bottom-left placeholder and bottom-right playground panel are now the actual pane surfaces, styled like header panes
- the bottom-left pane now exposes a locked `10`-column internal grid
- the bottom-left surface now keeps `0.75rem` outer padding with `0.75rem` internal column gaps, so each internal column division sums to the default seam
- each occupied column now uses a full-width grey title card with the same corner radius as the parent white pane and `0.35rem` internal padding/rhythm
- each grey title card now uses an internal `2`-column by `2`-row grid, with the swatch circle occupying the top-left cell and the title in the top-right cell
- the first internal card column is now fixed to the swatch width, with a single `0.35rem` gap before the flexible title column
- title text in the second column is left-aligned to that column edge
- title text in the second column now uses a tighter `1` line-height plus a `0.5px` downward optical offset, with the swatch cell centered on the same rail, so the first line stays centered to the swatch without increasing overall card height
- title wrapping now uses natural per-word wrapping in this pane rather than the sidebar label helper's non-breaking segments
- each grey title card now keeps the visible swatch/title top row where it already is, but the body below that row now follows one fixed-height `2`-column stack with a dedicated middle band, a flexible spacer, and a bottom metrics block
- all bottom cards now also reserve one fixed title-to-middle spacer row, so the gap between the title rail and the button/inject band is applied equally across the whole row
- all bottom cards now also reserve one smaller fixed bottom-clearance row below the metrics stack, derived from the same title-offset token as the swatch/title rail so the gap below `Total` visually tracks the gap above the title instead of opening wider
- only `Royal Navy` cards use that dedicated middle band for the interactive sidebar-pill button, defaulting to `Regionalise`
- the bottom-right cell now shows the PMC Region PAR for columns `1`-`9` and the overall total PAR in column `10`
- PAR values are left-aligned to the second-column edge like the titles
- the vertical gap between the three PAR readout rows is now slightly looser than before, while the lower edge clearance still resolves from the title-offset token so the stack keeps a matched top/bottom rhythm
- the grey title cards keep `0.35rem` edge insets and now use one fixed card block-size that always reserves the inject/button middle band plus the smaller extra bottom-clearance row, so card height no longer changes by state; wrapped titles are allowed to overlap the reserved gap instead of increasing card height
- in `Current`, columns `1`-`9` continue to show the PMC Region cards
- in `Current`, the `Royal Navy` card now also carries the same `Regionalise` / `Unregionalise` button pattern as the scenario layouts; when enabled, Royal Navy PAR is removed from the special card and added back into the parent PMC Region cards on the canonical Current board-code basis
- in that same Current-only bottom-left surface, the first card uses the display label `Scotland & NI`; this is a card-local label override and does not rename the Region elsewhere in the app
- in `SJC JMC`, the bottom-left pane now follows the Regions pane grouping instead: Scotland, Northern Ireland, and Wales are collapsed into the display label `Devolved Admin...`, then the remaining groups follow in sidebar order (`North`, `Centre`, `South West`, `South East`, `London District`), slot `7` is intentionally left empty, `Overseas` is pinned to column `8`, `Royal Navy` is pinned to column `9`, and `Total` stays in column `10`
- in `COA 3a` and `COA 3b`, the bottom-left pane now follows each preset's Regions pane grouping in the same way, with the scenario Region cards occupying the earlier columns, `Overseas` pinned to column `8`, `Royal Navy` pinned to column `9`, and `Total` in column `10`
- any bottom-left scenario card whose stripped title would be `Devolved Administrations` now uses the display label `Devolved Admin...`, matching the established `SJC JMC` card treatment
- the `DPHC Estimate COA Playground` variants inherit the same bottom-left card contract from their active source preset (`coa3b` for `COA 3a` Playground, `coa3c` for `COA 3b` Playground), but their PAR values are now draft-aware: board reassignment updates the card totals by remapping facility PAR through the active workspace assignment lookup instead of staying on the source preset baseline, and the pane now subscribes to live draft changes so those totals repaint immediately
- the absolute `SJC JMC` total remains anchored to the canonical `Export_30_Mar_26.csv` PAR total; the shipped facilities GeoJSON currently matches that total exactly, and the visible scenario-region cards exclude `Overseas` / `Royal Navy` before those two special cards are added back explicitly so the card sum matches `Total`
- when the scenario `Royal Navy` card button is clicked, it flips to `Unregionalise`, removes the preserved `Royal Navy` PAR from the special card, adds that PAR back into the parent scenario Region cards on the active assignment basis, and shows the added amount in the shared middle band of each receiving card with a small Royal Navy swatch in column `1` and the added PAR in column `2`
- the same interaction now exists in `Current`, but its parent-card redistribution uses the Current preset's board-code group mapping rather than a scenario assignment lookup
- that Current redistribution now also includes the Portsmouth Royal Navy split-parent fallback, so `BP1` contributes to `London & South` in the bottom-left cards instead of being dropped
- that injected Royal Navy contribution row now uses the same real taller middle band as the `Regionalise` pill and is vertically centered inside that band directly, so the navy circle/text sit on the same centreline as the pill while the extra space resolves below
- the `Regionalise` / `Unregionalise` pill in the special `Royal Navy` card now uses a real taller middle band and is vertically centered inside that band directly, so the centering remains visible while the card still keeps extra surrounding clearance
- the previous shared downward optical nudge on the `Regionalise` pill / injected Royal Navy row has been removed; spacing now comes from the fixed shared title-to-middle spacer instead
- within that injected Royal Navy contribution row, the small navy circle is now horizontally centered to the main Region swatch column above rather than left-biased within the first cell
- within that same injected row, the contribution number now keeps the same fixed row and left edge but gets a tiny locked vertical centering correction so it reads on the navy circle centreline
- `SJC JMC` group circles now use the effective populated Fill colour from the Regions pane at `100%` opacity
- `SJC JMC` per-card PAR values now calculate from the assigned `2026` facility board code (`icb_hb_code_2026`) mapped through the preset `codeGroupings`; the devolved card shows the combined total of `JMC Scotland`, `JMC Northern Ireland`, and `JMC Wales`
- columns `1`-`9` now carry PMC Region title cards for the fixed PMC Region list order, using full-opacity Region swatches in row `1` and the Region title in row `2`
- column `10` is reserved for a matching `Total` title card, now with a black circle swatch in row `1`
- every bottom-row card now shows a three-line PAR stack under the middle band:
  - actual Region PAR
  - correction line shown as `n (y%)`
  - the full correction line now renders at the normal non-title size/weight rather than shrinking the parenthetical context
  - final corrected sum on the existing bottom line
- the same three-line stack now also applies to the `Total` card, where the correction line is `8,500 (100%)`
- the final PAR number in each bottom-row card now uses the same `500` weight as the header-pane titles such as `Functions`, while the actual/correction lines stay at the normal non-title weight
- live-checked bottom-row geometry at `1280px` viewport width:
  - map width: `932.6875px`
  - sidebar width: `311.3125px`
  - bottom-left width: `932.6875px`
  - bottom-right width: `311.3125px`
  - main-row to bottom-row gap: `12px`

## Update Rule

Whenever a user-visible pane behavior changes, update this document.

At minimum, update:

- live surface
- what is wired
- known status
- deferred or resolved bugs
