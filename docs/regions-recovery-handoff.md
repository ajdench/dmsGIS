# Regions Pane Recovery Handoff

This document captures the complete findings from inspecting the `infallible-davinci` worktree, comparing it to the current `main` checkout, and assessing what is needed to land the Regions pane on `main`.

---

## Source of Truth

| Item | Value |
|------|-------|
| Branch | `claude/infallible-davinci` (worktree is not on any branch — detached HEAD) |
| Commit hash (worktree HEAD) | `1bafb0f` — "Fix multiline label trigger to use non-breaking space, change app background to #ecedee" |
| Worktree path | `/Users/andrew/Projects/dmsGIS/.claude/worktrees/infallible-davinci` |
| Main HEAD | `d4d411d` — "Add AI coding assistant handover doc for 2026-03-25" (2 commits ahead of worktree HEAD) |

**Committed vs uncommitted state:**

The worktree HEAD is `1bafb0f`, which is the same commit from which the main branch also diverges (main is 2 commits ahead: `053acf7` and `4a078b5`). The Regions pane implementation lives **entirely in the worktree working tree as uncommitted changes** — it has never been committed to any branch.

The worktree has:
- 40+ modified source files (all unstaged)
- 14 deleted GeoJSON files from `public/data/regions/` (old full-resolution files replaced by simplified versions)
- 22 new untracked files (new GeoJSON assets, scripts, source files)

None of these changes have been staged or committed.

---

## Recovered Files

### New files (exist only in worktree, not in main)

**Production source:**

| File | Summary |
|------|---------|
| `src/features/groups/RegionsPanelExact.tsx` | The Regions pane React component — full exact-shell implementation with DndContext, SidebarSortablePane, ExactSectionCardShell, per-row popovers, global pill, and drag reordering |
| `src/features/groups/regionsPanelFields.ts` | Field definitions and pure logic helpers: `buildRegionsPanelRows`, `buildRegionsGlobalPillSections`, `buildRegionsGlobalPillSummary`, `getEffectiveGroupStyle`, `buildMixedSwatches` |

**Documentation:**

| File | Summary |
|------|---------|
| `docs/ai-coding-assistant-handover-2026-03-25.md` | End-of-session handover doc describing Regions pane work completed, code review findings, and open bugs — this exists as untracked in the worktree but is already committed on main (`d4d411d`) |

**New GeoJSON data assets:**

| File | Summary |
|------|---------|
| `public/data/regions/UK_COA3A_Outline_simplified.geojson` | COA 3a preset outer outline |
| `public/data/regions/UK_COA3B_Outline_simplified.geojson` | COA 3b preset outer outline |
| `public/data/regions/UK_Health_Board_2026_topology_edges.geojson` | 2026 HB boundary topology edges |
| `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson` | Simplified 2026 HB boundaries (replaces exact version) |
| `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json` | TopoJSON version of above |
| `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson` | Simplified v10 boundaries (replaces full-resolution version) |
| `public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json` | TopoJSON version of above |
| `public/data/regions/UK_ICB_LHB_v10_topology_edges.geojson` | v10 topology edges |
| `public/data/regions/UK_JMC_Board_simplified.geojson` | Simplified JMC board polygons |
| `public/data/regions/UK_JMC_Outline_simplified.geojson` | JMC outer outline |
| `public/data/regions/UK_WardSplit_simplified.geojson` | Ward-split sub-polygons for Current preset |
| `public/data/regions/full-res/` | Directory of full-resolution GeoJSON files (backup/reference) |
| `public/data/regions/outlines/` | Directory of 26 per-group exterior arc outline files (one per region per preset, used by `loadGroupOutlineFeature`) |

**New preprocessing scripts:**

| File | Summary |
|------|---------|
| `scripts/create-ward-split.mjs` | Generates ward-split GeoJSON for Current preset |
| `scripts/derive-boundary-presets.mjs` | Derives simplified boundary files for all presets |
| `scripts/enrich-facilities.mjs` | Enriches facilities GeoJSON |
| `scripts/extract-group-outlines.mjs` | Extracts per-group exterior arc outlines into `public/data/regions/outlines/` |
| `scripts/extract-topology-edges.mjs` | Extracts shared-edge topology for seam rendering |
| `scripts/preprocess-boundaries.mjs` | Master preprocessing runner |

### Modified files (different between worktree and main)

**Critical path — must be ported:**

| File | What changes |
|------|-------------|
| `src/types/index.ts` | Adds `RegionGroupStyleOverride` interface (26 lines) with `visible`, `populatedFillVisible`, `unpopulatedFillVisible`, `populatedFillColor`, `unpopulatedFillColor`, `populatedOpacity`, `unpopulatedOpacity`, `borderVisible`, `borderColor`, `borderOpacity`, `borderWidth` |
| `src/store/appStore.ts` | Adds `populatedV10Codes`, `populated2026Codes` state fields; adds `regionGroupOverrides` map; adds 14 new store actions (`setRegionGroupVisible`, `setRegionGroupPopulatedFillVisible`, `setRegionGroupUnpopulatedFillVisible`, `setRegionGroupPopulatedFillColor`, `setRegionGroupUnpopulatedFillColor`, `setRegionGroupPopulatedOpacity`, `setRegionGroupUnpopulatedOpacity`, `setRegionGroupBorderVisible`, `setRegionGroupBorderColor`, `setRegionGroupBorderOpacity`, `setRegionGroupBorderWidth`, `setAllRegionGroupsPopulatedOpacity`, `setAllRegionGroupsUnpopulatedOpacity`, `setAllRegionGroupsBorderVisible`, `setAllRegionGroupsBorderWidth`); adds `getOrCreateGroupOverride` helper; populates `populatedV10Codes`/`populated2026Codes` from facilities load |
| `src/lib/config/viewPresets.ts` | Rewrites `PresetRegionGroup` type (adds `color`, opacity fields, `borderColor`, `borderOpacity`, `borderWidth`, `hoverBorderColor`, `hoverBorderOpacity`, `selectBorderColor`, `selectBorderOpacity`; drops legacy `sourceRegions`); adds `wardSplitPath` and `codeGroupings` to `ScenarioPresetConfig`; drops `boundaryOverrides`; changes `isScenarioPreset` to return `true` for all presets; adds `getGroupNameForCode`, `getRegionGroup`, `getGroupOutlinePath` helpers; changes `presets` type to always be `ScenarioPresetConfig` |
| `src/lib/config/viewPresets.json` | Major rewrite: replaces `sourceRegions`/`boundaryOverrides` approach with `codeGroupings` maps; adds `boardLayer`, `wardSplitPath`, `outlineLayer`, `lookupBoundaryPath`; adds full region groups with `populatedOpacity: 0.35`, `unpopulatedOpacity: 0.25`, `borderWidth` for all 4 presets; changes `borderOpacity` from 0.35 back to 0.14 at shared config level |
| `src/lib/config/boundarySystems.ts` | Switches both boundary system paths from full-resolution to simplified GeoJSON filenames |
| `src/lib/config/scenarioWorkspaces.ts` | Adds `wardSplitFill`, `regionFill`, `englandIcb`, `devolvedHb` overlay families; marks legacy families; changes `sourceRegionNames` and `boundaryNameRegionOverrides` to empty/legacy |
| `src/features/map/boundaryLayerStyles.ts` | Major rewrite: adds `populatedCodes` and `groupOverrides` parameters throughout; adds `createWardSplitLayer`, `createWardSplitStyle`, `createEnglandIcbStyle`, `createDevolvedHbStyle`; replaces legacy `getJmcBoundaryColor`/`getFeatureBoundaryFillColor` dispatch with `getGroupNameForCode`/`getRegionGroup` lookup path; adds `omitStroke` pattern for `regionFill` family; adds `getOverlayLayerZIndex`; adds `getGroupFillColor` helper |
| `src/features/map/overlayBoundaryReconciliation.ts` | Threads `populatedCodes` and `groupOverrides` into `createBoundaryLayer` and `getBoundaryLayerStyle`; adds `createWardSplitLayer` export |
| `src/features/map/MapWorkspace.tsx` | Adds `populatedV10Codes`, `populated2026Codes`, `regionGroupOverrides` store selectors; removes `syncJmcOutlineHighlight`/`getSelectedJmcOutlineColor` in favour of `loadGroupOutlineFeature` async path; changes JMC board path from full-resolution to `UK_JMC_Board_simplified.geojson`; changes overlay family names from `careBoardBoundaries`/`pmcUnpopulatedCareBoardBoundaries` to `regionFill`/`scenarioOutline`; threads `populatedCodes`/`groupOverrides` into reconciliation; adds second `loadGroupOutlineFeature` call for selection highlight |
| `src/features/map/boundarySelection.ts` | Adds `getGroupNameForCode` lookup path for `boundary_code` → region resolution; adds `loadGroupOutlineFeature` export |
| `src/features/groups/overlaySelectors.ts` | Adds `wardSplitFill`, `regionFill`, `englandIcb`, `devolvedHb` overlay families; marks legacy families with comments |
| `src/lib/sidebar/contracts.ts` | Adds `onReset?: () => void` to `SidebarSliderFieldDefinition` |
| `src/components/sidebarExact/ExactFields.tsx` | Renders a reset icon button via `CopyFillToBorderButton` when `onReset` is provided on `ExactSliderControl` |
| `src/components/sidebarExact/types.ts` | Adds `onReset?: () => void` to `SidebarSliderFieldDefinition` |
| `src/components/layout/RightSidebar.tsx` | Adds `RegionsPanelExact` import; adds `'regions'` to `DEFAULT_PANE_ORDER`; adds `regions` dispatch case in pane map; adds `sidebar-scroll-frame` wrapper div |
| `src/lib/config/scenarioWorkspaces.ts` | See above |
| `src/lib/scenarioWorkspaceAssignments.ts` | Adds `boundary_code` lookup path; keeps legacy name-based path as fallback |
| `src/lib/schemas/savedViews.ts` | Minor — `wardSplitFill`/`regionFill`/`englandIcb`/`devolvedHb` family additions |
| `src/styles/global.css` | Adds `--canvas-block` token; changes sidebar scroll frame and workspace background; minor radius change |
| `src/styles/sidebarExact.css` | Adds `.prototype-section-list__subpane-label` rule; extends `.prototype-color-field__with-copy` to include `.slider-field` child |
| `public/data/facilities/facilities.geojson` | Enriched with additional metadata (from `scripts/enrich-facilities.mjs`) |
| `package.json` / `package-lock.json` | Minor dependency update |
| All test files in `tests/` | Updated to use new paths, family names, and `codeGroupings`-based lookup |

**GeoJSON files deleted from `public/data/regions/` (replaced by simplified versions):**

- `UK_Active_Components_Codex_v10_geojson.geojson`
- `UK_COA3A_Boundaries_Codex_v01_geojson.geojson`
- `UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson`
- `UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `UK_COA3B_Boundaries_Codex_v01_geojson.geojson`
- `UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson`
- `UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson`
- `UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`
- `UK_Inactive_Remainder_Codex_v10_geojson.geojson`
- `UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson`
- `UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`

---

## Main vs Worktree Diff Summary

### `RegionsPanelExact.tsx` and `regionsPanelFields.ts`

Neither file exists in main's source tree. Both exist only as untracked files in the worktree working directory. They have never been committed. The `.claire/worktrees/infallible-davinci/src/features/groups/regionsPanelFields.ts` path in the main git index (see below) contains only the single word `placeholder` — it is not the real implementation.

### `RightSidebar.tsx`

The worktree version adds `RegionsPanelExact` to the import list and pane dispatch, and adds `'regions'` to `DEFAULT_PANE_ORDER`. Main does not have these additions.

The worktree also wraps the pane stack in a `<div className="sidebar-scroll-frame">` that is absent from main — this is a layout change that may affect scroll behavior.

### Store actions absent from main

The entire `regionGroupOverrides` state and all 14 `setRegionGroup*` / `setAllRegionGroups*` actions are absent from main. Main also lacks `populatedV10Codes` and `populated2026Codes` state fields, which are needed for the map to distinguish populated from unpopulated ICBs/HBs.

### Types absent from main

`RegionGroupStyleOverride` (17 fields) is absent from main's `src/types/index.ts`. Main's `types/index.ts` is 121 lines; the worktree version is 147 lines.

### Config changes in viewPresets.json/ts

`viewPresets.ts` in main still uses the old `sourceRegions`/`boundaryOverrides` model for `PresetRegionGroup`. The worktree has completely replaced this with `codeGroupings` (a `Record<string, string>` from boundary code to group name) and added per-group opacity/color/border defaults directly on the group object. The `viewPresets.json` file is 812 diff lines — the largest single change in the set.

Main's `viewPresets.ts` still exports `isScenarioPreset` as a type guard that returns `false` for `'current'`. The worktree makes it return `true` for all presets (all presets now have full `ScenarioPresetConfig`).

---

## Architectural Assessment

### Does the Regions pane follow the exact-shell architecture?

Yes. `RegionsPanelExact.tsx` uses:
- `SidebarSortablePane` as the top-level pane shell (matching Basemap/Facilities/Labels/Overlays pattern)
- `ExactSectionCardShell` for the sub-pane section card
- `DndContext` + `SortableContext` + `SidebarSortableInlineRow` for draggable rows
- `ExactPillPopover` + `ExactFieldSections` for per-row and global popovers

This is faithful to the exact-shell contract. No legacy sidebar primitives are used.

### Are field definitions in `regionsPanelFields.ts` separate from the React component?

Yes. `RegionsPanelExact.tsx` calls `buildRegionsPanelRows`, `buildRegionsGlobalPillSections`, and `buildRegionsGlobalPillSummary` from `regionsPanelFields.ts`. The component is orchestration-only; all field logic and section construction is in the `.ts` file. This matches the established pattern (e.g. `pmcPanelFields.ts`, `overlayPanelFields.ts`).

### Are map style overrides passing through `createRegionBoundaryStyle` correctly?

Yes. The style function in `boundaryLayerStyles.ts` accepts `populatedCodes` and `groupOverrides` parameters and uses `getGroupNameForCode`/`getRegionGroup` to resolve per-group colors and opacity. The `omitStroke` pattern (omitting the `Stroke` object entirely rather than using zero-width) is applied for `regionFill` family when no border is active, which is the correct approach to avoid sub-pixel canvas artefacts.

The reconciliation in `overlayBoundaryReconciliation.ts` threads `populatedCodes` and `groupOverrides` through layer creation and style updates. `MapWorkspace.tsx` reads both from the store and passes them into reconciliation.

### Brittle, incomplete, or architecturally unsafe areas

1. **4 pre-existing test failures in the worktree.** `tests/pmcPanelFields.test.ts` (2 failures) and `tests/facilityLayerStyles.test.ts` (2 failures) are failing. The handover doc for `2026-03-25` notes these were present during the in-progress session. Main is green on all 156 tests. These failures must be investigated and fixed during the port — they cannot be carried over to main.

2. **`populatedV10Codes` and `populated2026Codes` seeded as empty sets.** These are initialized to `new Set<string>()` and populated asynchronously when facilities load. There is a window at startup where map styling will see all boundaries as unpopulated. This is the same pattern used for other async-populated state; it should be acceptable in practice.

3. **`getOrCreateGroupOverride` default values are hardcoded** (`populatedOpacity: 0.35`, `unpopulatedOpacity: 0.25`) rather than derived from `viewPresets.json` config. If the config defaults change, the store helper will drift silently. The handover doc notes this as TODO-item I.

4. **`regionGroupOverrides` not cleared on preset switch.** If two presets share a group name, an override from preset A can leak into preset B. Currently safe because all group names are unique across presets, but fragile. Noted as TODO-item E in the handover doc.

5. **`regionGroupOverrides` and `groupOrder` not in saved-view schema.** Changes made in the Regions pane will not survive a save/reload cycle. Noted as TODO-item D in the handover doc.

6. **`loadGroupOutlineFeature` uses `fetch()` async.** This is architecturally correct (matching the existing GeoJSON-load pattern) but the group outline files in `public/data/regions/outlines/` must be present. Currently all 26 per-group per-preset outlines are present in the worktree as untracked files; they must be copied to main alongside the source changes.

7. **`createWardSplitLayer()` in `overlayBoundaryReconciliation.ts` is deprecated.** The export is dead code but is retained by design. It is safe noise.

### The `.claire` artifact

The main git index contains one file at `.claire/worktrees/infallible-davinci/src/features/groups/regionsPanelFields.ts` with content `placeholder`. This is a placeholder artifact committed to main (commit `9722c184` or similar) when a previous session accidentally used `.claire` instead of `.claude` as the worktree path. It is **not the real implementation** and has no effect on the build. It is just noise in the git index. It should be removed at some point with `git rm .claire/worktrees/infallible-davinci/src/features/groups/regionsPanelFields.ts`, but it is not dangerous and does not need to be removed before the Regions pane lands.

---

## Recommended Landing Path

**Recommendation: Selective manual port onto main (Option 1)**

**Why not cherry-pick:** The Regions pane work was never committed — it is entirely in the worktree working directory as unstaged changes. There are no commits to cherry-pick. The two commits that exist on main above the worktree HEAD (`053acf7`, `4a078b5`) are already on main. Nothing can be cherry-picked from the worktree.

**Why not reimplementation from scratch:** The implementation is complete and build-clean. `RegionsPanelExact.tsx` and `regionsPanelFields.ts` are well-structured and follow the exact-shell pattern. Reimplementing would waste the work done and introduce new risk.

**Why selective manual port is correct:** The changes fall into two categories — source code changes and data asset changes. Both can be ported cleanly without carrying over the 4 failing tests. The port agent copies specific files from the worktree to main, fixes the failing tests, verifies the build is green, then commits.

---

## Validation Status

### In the worktree

| Check | Result |
|-------|--------|
| `npm run build` | PASSING |
| `npm run typecheck` | PASSING |
| `npm run test` | 4 FAILURES (157 passed, 4 failed) |

The 4 test failures are:
- `tests/pmcPanelFields.test.ts` — 2 failures: "zeros swatch opacity when points are hidden" and "keeps the PMC list on the fixed seven-region production order"
- `tests/facilityLayerStyles.test.ts` — 2 failures: "builds a styled point symbol when facility and region are visible" and "uses the remapped scenario region when a draft-aware assignment source is present"

These failures appear to be regressions introduced by the session work in the worktree (the `viewPresets.json` and `viewPresets.ts` changes affected the test fixture assumptions). The handover doc notes them as "pre-existing known failures" in the worktree session. They must be fixed during the port.

### In main (current state)

| Check | Result |
|-------|--------|
| `npm run build` | PASSING |
| `npm run typecheck` | PASSING |
| `npm run test` | PASSING (156 tests) |

Main is fully green.

---

## Ready-to-Implement Scope

The following is a concrete, ordered list of actions for a coding agent to land the Regions pane on main. Execute in this order. Verify `npm run build` and `npm run test` are green after completing all steps.

### Step 1 — Update types

In `/Users/andrew/Projects/dmsGIS/src/types/index.ts`, add the `RegionGroupStyleOverride` interface. Copy the interface definition (lines 130–147) from the worktree version.

### Step 2 — Update viewPresets.ts

Replace `src/lib/config/viewPresets.ts` with the worktree version. Key changes: `PresetRegionGroup` type (replaces `sourceRegions` with `codeGroupings` and full opacity/color/border fields); `ScenarioPresetConfig` additions (`wardSplitPath`, `codeGroupings`; drops `boundaryOverrides`); `isScenarioPreset` change; new helper functions `getGroupNameForCode`, `getRegionGroup`, `getGroupOutlinePath`. This is a substantial rewrite — copy the full file.

### Step 3 — Update viewPresets.json

Replace `src/lib/config/viewPresets.json` with the worktree version. This is the largest change (812 diff lines). The worktree version adds complete `codeGroupings`, `boardLayer`, `wardSplitPath`, `outlineLayer`, `lookupBoundaryPath`, and full `regionGroups` arrays for all 4 presets.

### Step 4 — Update boundarySystems.ts

In `src/lib/config/boundarySystems.ts`, change both `interactionBoundaryPath` and `displayBoundaryPath` for the v10 system to `UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`, and change the 2026 system path to `UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`.

### Step 5 — Update store (appStore.ts)

In `src/store/appStore.ts`, add:
- `populatedV10Codes: ReadonlySet<string>` and `populated2026Codes: ReadonlySet<string>` to the state type and initial state (both initialized to `new Set<string>()`)
- `regionGroupOverrides: Record<string, RegionGroupStyleOverride>` to state type and initial state (initialized to `{}`)
- The 14 `setRegionGroup*` / `setAllRegionGroups*` action implementations
- The `getOrCreateGroupOverride` private helper function
- The facilities-load logic that populates `populatedV10Codes` and `populated2026Codes` from the loaded features

Copy these sections directly from the worktree `src/store/appStore.ts`.

### Step 6 — Update sidebar contracts and exact-kit

- In `src/lib/sidebar/contracts.ts`, add `onReset?: () => void` to `SidebarSliderFieldDefinition`
- In `src/components/sidebarExact/types.ts`, add `onReset?: () => void` to `SidebarSliderFieldDefinition`
- In `src/components/sidebarExact/ExactFields.tsx`, update `ExactSliderControl` to render a reset button when `onReset` is provided. Copy the relevant section from the worktree.

### Step 7 — Update overlay family metadata

In `src/features/groups/overlaySelectors.ts`, add the `wardSplitFill`, `regionFill`, `englandIcb`, `devolvedHb` overlay family entries. Copy from worktree.

In `src/lib/config/scenarioWorkspaces.ts`, update to add new families and change `sourceRegionNames`/`boundaryNameRegionOverrides` to empty. Copy from worktree.

### Step 8 — Update boundary layer styles and map modules

These files have substantial changes and should be copied wholesale from the worktree:
- `src/features/map/boundaryLayerStyles.ts` — copy full file
- `src/features/map/overlayBoundaryReconciliation.ts` — copy full file
- `src/features/map/boundarySelection.ts` — copy full file
- `src/features/map/MapWorkspace.tsx` — copy full file
- `src/lib/scenarioWorkspaceAssignments.ts` — copy full file

### Step 9 — Add new production source files

Copy these two new files from the worktree to main:
- `src/features/groups/RegionsPanelExact.tsx`
- `src/features/groups/regionsPanelFields.ts`

### Step 10 — Update RightSidebar.tsx

In `src/components/layout/RightSidebar.tsx`:
- Add `import { RegionsPanelExact } from '../../features/groups/RegionsPanelExact';`
- Change `DEFAULT_PANE_ORDER` to include `'regions'` between `'facilities'` and `'labels'`
- Add the `if (paneId === 'regions') { return <RegionsPanelExact key={paneId} />; }` dispatch case
- Add the `sidebar-scroll-frame` wrapper div

Copy the full file from the worktree.

### Step 11 — Update CSS

- In `src/styles/global.css`: add `--canvas-block` token; update sidebar scroll frame and workspace background. Copy diffs from worktree.
- In `src/styles/sidebarExact.css`: add `.prototype-section-list__subpane-label` rule; extend `.prototype-color-field__with-copy` selector. Copy diffs from worktree.

### Step 12 — Copy data assets

Copy these directories/files from the worktree to main:

**New GeoJSON files for `public/data/regions/`:**
- `UK_COA3A_Outline_simplified.geojson`
- `UK_COA3B_Outline_simplified.geojson`
- `UK_Health_Board_2026_topology_edges.geojson`
- `UK_Health_Board_Boundaries_Codex_2026_simplified.geojson`
- `UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json`
- `UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson`
- `UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json`
- `UK_ICB_LHB_v10_topology_edges.geojson`
- `UK_JMC_Board_simplified.geojson`
- `UK_JMC_Outline_simplified.geojson`
- `UK_WardSplit_simplified.geojson`

**New `public/data/regions/outlines/` directory** (all 26 per-group outline files).

**Old files to delete from `public/data/regions/` in main** (they are replaced by the simplified versions and the paths in config/boundarySystems.ts no longer reference them):
- `UK_Active_Components_Codex_v10_geojson.geojson`
- `UK_COA3A_Boundaries_Codex_v01_geojson.geojson`
- `UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson`
- `UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `UK_COA3B_Boundaries_Codex_v01_geojson.geojson`
- `UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson`
- `UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson`
- `UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson`
- `UK_Inactive_Remainder_Codex_v10_geojson.geojson`
- `UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson`
- `UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`

**Note on facilities.geojson:** `public/data/facilities/facilities.geojson` is also modified in the worktree. Verify whether this needs to be copied (it depends on whether `scripts/enrich-facilities.mjs` was run and whether the enrichment is load-bearing for the Regions pane).

### Step 13 — Update all test files

Copy all modified test files from the worktree:
- `tests/appStore.test.ts`
- `tests/boundaryApplySelection.test.ts`
- `tests/boundaryLayerStyles.test.ts`
- `tests/boundarySelection.test.ts`
- `tests/boundarySystems.test.ts`
- `tests/nhsEnglandRegions.test.ts`
- `tests/overlaySelectors.test.ts`
- `tests/scenarioAssignments.test.ts`
- `tests/scenarioWorkspaceAssignments.test.ts`
- `tests/scenarioWorkspaces.test.ts`
- `tests/selectionHighlights.test.ts`
- `tests/singleClickSelection.test.ts`
- `tests/viewPresets.test.ts`

### Step 14 — Fix the 4 failing tests

After copying all files, run `npm run test`. If `tests/pmcPanelFields.test.ts` and `tests/facilityLayerStyles.test.ts` still fail, investigate and fix them. The failures in the worktree are caused by changes to `viewPresets.json`/`viewPresets.ts` that affected the fixture assumptions in those test files. Do not proceed to step 15 until `npm run test` is fully green.

### Step 15 — Final gate

Run `npm run build`. Must be green. Do not commit if it fails.

### Step 16 — Update docs

Update `docs/sidebar-pane-status.md` to record the Regions pane as live. Update `docs/agent-handover.md` if the strategic state changed. Record any deferred bugs in `docs/sidebar-parity-bugs.md`.

---

## Risks / Unknowns

### 1. Runtime correctness of map rendering

The build and typecheck pass, but runtime rendering correctness (whether region fill colors, opacity, borders, and populated/unpopulated distinction render correctly on the map for each of the 4 presets) cannot be verified from a build alone. A manual click-test of each preset is required after landing. In particular:

- Scottish (02–17), Welsh (W11...), and NI (BHSCT/NHSCT/...) `boundary_code` values in `codeGroupings` must resolve to the correct group names.
- The `wardSplitFill` family (Current preset only) must render ward sub-polygons correctly via `UK_WardSplit_simplified.geojson`.
- The `loadGroupOutlineFeature` async path must correctly load and display group outline highlights when a boundary is clicked.

### 2. GeoJSON files required by main are not present in main

All 12 simplified GeoJSON files listed in Step 12 above are untracked in the worktree and absent from main. The config in `boundarySystems.ts` and `viewPresets.json` will reference these paths at runtime. If these files are not copied, the map will fail to load layers and throw network/parse errors. **This is the highest-risk item for runtime correctness.**

The `public/data/regions/outlines/` directory containing 26 per-group outline GeoJSON files is also required. Without it, `loadGroupOutlineFeature` will silently fail (it catches network errors and returns null), meaning group outlines will not appear on boundary click but the app will not crash.

### 3. facilities.geojson change

`public/data/facilities/facilities.geojson` is modified in the worktree. Whether this change is required for the Regions pane is unclear. If the enrichment added `boundary_code` or other fields that the Regions pane depends on for populated/unpopulated classification, copying it is required. If it only added unrelated metadata, it can be deferred. The `scripts/enrich-facilities.mjs` script should be read to determine this.

### 4. The `.claire` artifact in main's git index

The file `.claire/worktrees/infallible-davinci/src/features/groups/regionsPanelFields.ts` exists in main's git index with content `placeholder`. It has no runtime effect (it is not in `src/`) and no build effect. It is pure noise. It does not need to be removed before or during the Regions pane port, but it should be cleaned up at some point with `git rm .claire/worktrees/infallible-davinci/src/features/groups/regionsPanelFields.ts`.

### 5. BUG-002 and BUG-003 from handover doc

The handover doc for 2026-03-25 notes two open bugs specific to the Regions pane work:

- **BUG-002:** Green polygon seam borders still visible in SJC JMC (coa3a) due to HTML Canvas fill anti-aliasing. The `omitStroke` fix in `boundaryLayerStyles.ts` reduces this but does not eliminate it. No fix has been executed.
- **BUG-003:** Global Regions pill Border section has a Thickness slider but no Opacity broadcaster. The fix is described in `docs/sidebar-parity-bugs.md` but has not been executed.

These are known defects in the worktree implementation. They should be recorded in `docs/sidebar-parity-bugs.md` on main after the port and addressed in a follow-up session.

### 6. Test failures in worktree require investigation before port

The 4 failing tests in `tests/pmcPanelFields.test.ts` and `tests/facilityLayerStyles.test.ts` must be fixed before the port is considered complete. The failures are caused by the in-progress state of the worktree (fixture assumptions in those tests were not updated to match the new `viewPresets.json`/`viewPresets.ts` model). The implementing agent must fix these rather than copying failing tests onto main.

### 7. `sidebar-scroll-frame` layout change

`RightSidebar.tsx` in the worktree adds a `<div className="sidebar-scroll-frame">` wrapper around the preset buttons and pane stack. This wrapper has CSS changes in `global.css`. The layout impact of this change should be visually verified after port — it may affect sidebar scroll behavior and pane height calculations.
