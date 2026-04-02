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

These files are not on the live app path and are the clearest first removal/archive candidates:

- `src/features/facilities/SelectionPanel.tsx`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/layers/LayerPanel.tsx`
- `src/features/basemap/BasemapPanelReplacement.tsx`

Current evidence:

- `SelectionPanel.tsx`, `BasemapPanel.tsx`, `LabelPanel.tsx`, and `LayerPanel.tsx` are not imported by the live app path
- `BasemapPanelReplacement.tsx` is also not on the live app path
- these files are still referenced mostly by tests, prototype notes, or historical sidebar docs

## Shared Structure Candidates

These folders need a second-pass dependency audit before removal:

- `src/components/sidebar/`
- `src/components/sidebarReplacement/`
- `src/styles/sidebarReplacement.css`

Why they are not first-pass deletes:

- `src/components/sidebar/` still supports older pane files and some shared production-owned primitives
- `src/components/sidebarReplacement/` still has direct test coverage
- `src/styles/sidebarReplacement.css` is still imported by `src/main.tsx`, so style ownership must be measured before pruning

## Files That Must Stay Until Their Dependents Move

These are not legacy-removal targets yet:

- `src/features/groups/PmcPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`
- `src/features/groups/pmcPanelFields.ts`
- `src/features/groups/overlayPanelFields.ts`
- `src/components/sidebarExact/`

Reason:

- they still participate in the current sidebar behavior through the `Exact` path, direct field definitions, or live styling helpers

## Proposed Execution Order

### Phase 1. Remove orphaned pane files

- confirm no live imports remain for:
  - `SelectionPanel.tsx`
  - `BasemapPanel.tsx`
  - `LabelPanel.tsx`
  - `LayerPanel.tsx`
  - `BasemapPanelReplacement.tsx`
- delete their tests if the files are removed only as dormant scaffolding
- update any handover/docs that still describe them as part of the active app

### Phase 2. Prune dormant shell primitives

- map which files under `src/components/sidebar/` are still needed by any current production path
- remove primitives only used by the orphaned pane files
- keep anything still needed by `PmcPanel.tsx`, `OverlayPanel.tsx`, or shared tests until replacements are complete

### Phase 3. Untangle replacement-only styling

- measure whether `src/styles/sidebarReplacement.css` still contributes to current live rendering
- if it only supports retired replacement scaffolding, stop importing it from `src/main.tsx`
- then archive or remove the unused `src/components/sidebarReplacement/` pieces and their narrow tests

### Phase 4. Tighten docs and tests

- move historical sidebar notes out of current-truth docs where they obscure the live path
- keep prototype and historical promotion docs only where they still help active migration work
- re-run focused sidebar tests plus `npm run build`

## Validation Gate For Each Phase

- `npm test -- --run` for the touched sidebar/pane tests
- `npm run typecheck`
- `npm run build`

## Working Rule

- if a file is not on the live app path, not used by a still-live helper, and only survives because of historical tests/docs, prefer removing or archiving it rather than letting it keep shaping the working app tree
