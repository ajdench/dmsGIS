# Working-App Legacy Cleanup Plan

Date: `2026-04-02`

This plan records the next staged cleanup pass for old pane shells, dormant replacement scaffolding, and other non-current app structures that still sit inside the working `src/` tree.

The goal is to keep only code that the current working app really uses, while avoiding accidental removal of still-live helper modules that happen to sit near legacy files.

## Current Live App Path

The current sidebar/runtime path is:

- `src/components/layout/RightSidebar.tsx`
- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/groups/RegionsPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`
- `src/components/sidebarExact/`
- `src/styles/sidebarExact.css`
- `src/styles/global.css`

That is the path to protect.

## Confirmed Legacy Candidates

These files were not on the live app path and were the clearest first removal candidates:

- `src/features/facilities/SelectionPanel.tsx`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/layers/LayerPanel.tsx`
- `src/features/basemap/BasemapPanelReplacement.tsx`

Current evidence:

- `SelectionPanel.tsx`, `BasemapPanel.tsx`, `LabelPanel.tsx`, and `LayerPanel.tsx` are not imported by the live app path
- `BasemapPanelReplacement.tsx` is also not on the live app path
- these files are still referenced mostly by tests, prototype notes, or historical sidebar docs

Status:

- removed on `2026-04-02` during the first working-app legacy cleanup pass

## Shared Structure Candidates

These folders need a second-pass dependency audit before removal:

- `src/components/sidebar/`
- `src/components/sidebarReplacement/`
- `src/styles/sidebarReplacement.css`

Why they are not first-pass deletes:

- `src/components/sidebar/` still supports older pane files and some shared production-owned primitives
- `src/components/sidebarReplacement/` and `src/styles/sidebarReplacement.css` were kept until their lack of live app dependencies was measured rather than assumed

Status:

- `src/components/sidebarReplacement/` and `src/styles/sidebarReplacement.css` were removed on `2026-04-02`
- `src/components/sidebar/` was removed on `2026-04-02` after `ScenarioPlaygroundPane` was detached from `SidebarPanelShell` and the orphaned `PmcPanel.tsx` / `OverlayPanel.tsx` files were removed
- the dead old-sidebar CSS and tokens in `src/styles/global.css` were removed on `2026-04-02`, and `ScenarioPlaygroundPane.tsx` now uses local `scenario-playground-*` shell/button class names instead of the retired sidebar shell naming

## Files That Must Stay Until Their Dependents Move

These are not legacy-removal targets yet:

- `src/features/groups/pmcPanelFields.ts`
- `src/features/groups/overlayPanelFields.ts`
- `src/components/sidebarExact/`

Reason:

- they still participate in the current sidebar behavior through the `Exact` path, direct field definitions, or live styling helpers

## Proposed Execution Order

### Phase 1. Remove orphaned pane files

- completed on `2026-04-02`
- removed:
  - `SelectionPanel.tsx`
  - `BasemapPanel.tsx`
  - `LabelPanel.tsx`
  - `LayerPanel.tsx`
  - `BasemapPanelReplacement.tsx`
- removed their narrow tests
- updated current-truth docs to stop treating them as extant active-adjacent pane surfaces

### Phase 2. Prune dormant shell primitives

- completed on `2026-04-02`
- detached `ScenarioPlaygroundPane.tsx` from `SidebarPanelShell`
- removed the orphaned `PmcPanel.tsx` and `OverlayPanel.tsx` files
- removed `src/components/sidebar/`

### Phase 3. Untangle replacement-only styling

- completed on `2026-04-02`
- removed `src/styles/sidebarReplacement.css`
- removed `src/components/sidebarReplacement/`
- removed the narrow replacement-only tests

### Phase 4. Tighten docs and tests

- completed on `2026-04-02`
- updated the current-truth docs to stop presenting the retired shared-shell family as live app structure
- kept prototype and historical promotion docs in place where they still document migration history
- re-ran focused sidebar tests plus `npm run build`

### Phase 5. Remove dead old-sidebar CSS and tokens

- completed on `2026-04-02`
- measured which `.sidebar-*` class families in `src/styles/global.css` were unused after removing `src/components/sidebar/`
- deleted the dead shell/button/popover/control/toggle/metric/sidebar-left rules and unused related tokens
- renamed the surviving `ScenarioPlaygroundPane` shell and button classes locally so the old sidebar naming no longer remains on the live app path

## Validation Gate For Each Phase

- `npm test -- --run` for the touched sidebar/pane tests
- `npm run typecheck`
- `npm run build`

## Working Rule

- if a file is not on the live app path, not used by a still-live helper, and only survives because of historical tests/docs, prefer removing or archiving it rather than letting it keep shaping the working app tree
