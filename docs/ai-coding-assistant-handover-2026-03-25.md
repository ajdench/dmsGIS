# AI Coding Assistant Handover — 2026-03-25

This document is the primary handover for an AI coding assistant resuming work on this repository.

Read this first, then follow the "Further Reading" pointers for the areas you are about to work on.

---

## Quick Start

```
Read in this order:
1. CLAUDE.md (working rules and architecture quick reference)
2. AGENTS.md (project rules and scope split)
3. README.md (stack, commands, document index)
4. docs/agent-handover.md (strategic picture)
5. docs/sidebar-pane-status.md (pane-by-pane truth)
6. docs/sidebar-parity-bugs.md (open deferred bugs)
7. docs/project-todo.md (open product tasks)
```

---

## What This Repo Is

A static-first geospatial web app for UK health facility mapping.

- **Stack:** React + TypeScript + Vite + OpenLayers (map rendering) + Zustand (state)
- **Deploy:** GitHub Pages (`https://ajdench.github.io/dmsGIS/`)
- **Gate:** `npm run build` must be green. This is the only reliable health check.
- **Version control:** Colocated Git/JJ (Jujutsu). Use `jj` for local checkpoints, `git` for user-directed pushes only.

---

## Current State Summary (as of 2026-03-25)

### Main-checkout cross-check

The Regions pane has now been recovered from the validated worktree and landed on the main production path.

Current main-checkout truth:

- the exact-shell production path is still the correct path
- `src/components/layout/RightSidebar.tsx` now renders five live panes: Basemap, Facilities, Regions, Labels, and Overlays
- `src/features/groups/RegionsPanelExact.tsx` and `src/features/groups/regionsPanelFields.ts` are now part of the main production tree
- the earlier `.claire/worktrees/...` placeholder artifact was not the implementation and should still be treated as noise, not source of truth

### What is shipped

The production sidebar uses the **exact-shell** replacement path:

- Shell: `src/components/layout/RightSidebar.tsx`
- Shared primitives: `src/components/sidebarExact/`
- CSS: `src/styles/sidebarExact.css`
- Active panes:
  - `src/features/basemap/BasemapPanelExact.tsx`
  - `src/features/facilities/SelectionPanelExact.tsx` (strongest pane — use as alignment baseline)
  - `src/features/groups/RegionsPanelExact.tsx`
  - `src/features/labels/LabelPanelExact.tsx`
  - `src/features/groups/OverlayPanelExact.tsx`

The current main checkout has five active exact-shell panes on this path.

### Regions pane (most recently worked on)

The Regions pane was substantially completed in the session ending 2026-03-25. Key changes made:

**Swatch rendering:**
- Global Regions pill: multi-colour gradient (one stop per group populated colour at 30% opacity)
- Per-row pill: two-stop mixed gradient (populated 30% + unpopulated 20%); degrades to single-colour when colours match
- `buildMixedSwatches` deduplication helper added to `regionsPanelFields.ts`

**Fill opacity defaults:**
- All 26 region groups across all 4 presets: `populatedOpacity: 0.35`, `unpopulatedOpacity: 0.25`
- Was previously 0.70/0.35 for Current preset and 0.40/0.22 for scenario presets

**Border Thickness control:**
- `borderWidth` field wired through full stack: `viewPresets.json` → `PresetRegionGroup` type → `RegionGroupStyleOverride` type → store actions → field definitions → map style
- Thickness slider (min 0.5, max 4, step 0.5) appears before Opacity in every Border section (per-group popover and global pill)
- `setRegionGroupBorderWidth` and `setAllRegionGroupsBorderWidth` actions in appStore

**Reset buttons:**
- All opacity and thickness sliders in Regions pane have reset buttons (`onReset` callback on `SidebarSliderFieldDefinition`)
- `ExactSliderControl` in `ExactFields.tsx` renders `CopyFillToBorderButton` with `icon="reset"` when `onReset` is provided

**`omitStroke` pattern in `boundaryLayerStyles.ts`:**
- For `regionFill` family with no border active: `Stroke` object is omitted entirely (not zero-width) to avoid sub-pixel canvas artefacts at shared polygon edges

**Previously open bugs now resolved on main:**
- BUG-002 Fix A: `boardBoundaryStyle.borderOpacity` is now `0.35` on the landed config, masking the green seam borders more effectively
- BUG-003: the global Regions pill Border section now includes an Opacity broadcaster wired through the store and `regionsPanelFields.ts`

---

## Build & Test Health

```
npm run build       ✅ passing
npm run typecheck   ✅ passing
npm run test        ✅ passing
npm run test:e2e    not routinely run during recent development
```

---

## Code Review Findings (2026-03-25)

The following issues were identified in a full code review at end-of-session. **None have been executed.** All are logged in `docs/project-todo.md`.

### A. Duplication

**`buildMixedSwatches` duplicated** in `pmcPanelFields.ts` and `regionsPanelFields.ts`. Both copies are identical. Extract to `src/lib/sidebar/swatchUtils.ts` and import in both.
- **Priority:** Low
- **Risk if deferred:** Must keep two copies in sync manually.

### B. Missing tests

**No tests for `regionsPanelFields.ts`**. The three exported functions (`buildRegionsPanelRows`, `buildRegionsGlobalPillSections`, `buildRegionsGlobalPillSummary`) are pure logic over config inputs — fully testable without DOM or OL. `pmcPanelFields.ts` has comparable tests at `tests/pmcPanelFields.*`.
- **Priority:** Medium
- **Risk if deferred:** Regions pane logic is untested as complexity grows.

### C. Previously failing tests

The 4 earlier failures in `tests/pmcPanelFields.*` (×2) and `tests/facilityLayerStyles.*` (×2) have now been fixed on the main checkout.
- **Result:** `npm run test` is green again.

### D. Saved views not updated

`regionGroupOverrides` (per-group style) and `groupOrder` (row order) are runtime-only. Neither is saved in the saved-view snapshot schema. Logged as TODO-11.
- **Priority:** Medium

### E. Override leak on preset switch

`regionGroupOverrides` is not cleared when `activateViewPreset` is called. If two presets share a group name, the override leaks. Currently safe because all preset group names are unique, but fragile. Logged as TODO-12.
- **Priority:** Low

### F. Dead export

`createWardSplitLayer()` in `src/features/map/boundaryLayerStyles.ts` is exported and marked `@deprecated`. All ward splits are now routed through `createRegionBoundaryLayer` → `createWardSplitStyle` dispatch. The standalone function is dead code but retained for documented continuity. Safe to remove in a future cleanup pass.

### G. Topology edge data for scenario presets

Scenario presets (coa3a/coa3b/coa3c) use `UK_Health_Board_Boundaries_Codex_2026_simplified.geojson` for `regionFill`. Whether Scottish (02–17), Welsh (22–29), and NI boards have correct `boundary_code` values matching their `codeGroupings` keys has not been runtime-verified by clicking those regions.
- **Action:** Manual click-test of Scottish/Welsh/NI regions in coa3a/coa3b/coa3c preset to confirm group assignment.

### H. `onReset` in contracts.ts

`SidebarSliderFieldDefinition.onReset?: () => void` was added to `src/lib/sidebar/contracts.ts`. The `ExactSliderControl` in `ExactFields.tsx` now renders a reset icon button when this is provided. Other panes (Basemap, Labels, Overlays, Facilities) do not yet use `onReset` on their sliders — they could adopt it for consistency.

### I. `getOrCreateGroupOverride` default values

The helper in `appStore.ts` creates a default `RegionGroupStyleOverride` with hardcoded `populatedOpacity: 0.35`, `unpopulatedOpacity: 0.25`. These mirror the new `viewPresets.json` defaults. If those defaults ever change in config, this function must also be updated — they are not derived from the config at runtime.
- **Risk:** Config drift. The store defaults and config defaults can diverge silently.

---

## Key File Map

| Purpose | File |
|---------|------|
| Zustand app store | `src/store/appStore.ts` |
| Region group config (all presets) | `src/lib/config/viewPresets.json` |
| Region group TypeScript types | `src/lib/config/viewPresets.ts` |
| Runtime style overrides type | `src/types/index.ts` (`RegionGroupStyleOverride`) |
| Regions panel (React) | `src/features/groups/RegionsPanelExact.tsx` |
| Regions panel field definitions | `src/features/groups/regionsPanelFields.ts` |
| Boundary layer OL styles | `src/features/map/boundaryLayerStyles.ts` |
| Overlay boundary reconciliation | `src/features/map/overlayBoundaryReconciliation.ts` |
| Sidebar field contracts | `src/lib/sidebar/contracts.ts` |
| Shared exact-kit fields | `src/components/sidebarExact/ExactFields.tsx` |
| Shared exact-kit types | `src/components/sidebarExact/types.ts` |
| Parity bug tracker | `docs/sidebar-parity-bugs.md` |
| Open product tasks | `docs/project-todo.md` |
| Pane-by-pane truth | `docs/sidebar-pane-status.md` |

---

## Immediate Next Priorities (Suggested)

In priority order based on user-directed bugs and the code review above:

1. **Shared exact-shell alignment pass:** fix the deferred parent-control rail drift in Basemap, Labels, and Overlays relative to the Facilities baseline.

2. **Manual runtime verification:** click-test Scottish, Welsh, and NI boards in the scenario presets to confirm the new `codeGroupings` path classifies devolved boards correctly.

3. **`buildMixedSwatches` extraction** (TODO-8): Low-risk refactor.
4. **`regionsPanelFields.ts` tests** (TODO-9): Medium confidence improvement now that the Regions pane files are on the active production path.

---

## Documents That Can Now Be Retired or Deprioritised

These documents contain mostly historical content that is no longer load-bearing for daily development. An AI coding assistant can skip them unless working on something that specifically overlaps with their scope.

| Document | Why it can be deprioritised |
|----------|-----------------------------|
| `docs/sidebar-production-reset-plan.md` | Documents the decision to abandon the old incremental approach. That decision is settled — the exact-shell path is the production path. Useful only as historical context for why the repo looks the way it does. |
| `docs/sidebar-thread-reactivation.md` | Restart notes from the thread that initiated the exact-shell replacement. The replacement is now substantially complete. |
| `src/prototypes/sidebarPrototype/PROMOTION.md` | Promotion constraints from when the prototype was being lifted to production. The exact-shell is now the production codepath; prototype promotion is no longer the active work mode. |
| `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md` | Same as above — detailed promotion-boundary rules for a transition that has now happened. |
| `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md` | Pre-promotion audit notes. No longer the relevant guide. |

**Do not delete these.** They are useful for understanding architectural decisions if something unexpected surfaces. But they should not be in the default read set for a new session focused on current work.

**Still active and required:**
- `CLAUDE.md`
- `AGENTS.md`
- `README.md`
- `docs/agent-handover.md`
- `docs/sidebar-pane-status.md`
- `docs/sidebar-parity-bugs.md`
- `docs/project-todo.md`
- `docs/prototype-to-production-playbook.md`
- `docs/agent-continuation-protocol.md`

---

## End-of-Session Checklist (Reminder)

Per `CLAUDE.md`:

1. `jj` checkpoint
2. Update `docs/sidebar-pane-status.md` if pane truth changed
3. Update `docs/sidebar-parity-bugs.md` if a bug is deferred
4. Update `docs/agent-handover.md` if strategy changed
5. Update `docs/agent-continuation-protocol.md` if working method changed
6. Update `README.md` / `AGENTS.md` if their routing info needs alignment
