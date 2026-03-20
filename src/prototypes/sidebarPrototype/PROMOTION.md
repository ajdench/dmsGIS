# Sidebar Prototype Promotion

This document communicates the current promotion requirements, recommended steps, and target production seams for moving the sidebar prototype into the main app.

It is intentionally kept in prototype space so the migration plan can stay close to the prototype contract until promotion begins.

## Current readiness

The prototype is ready for controlled production promotion.

Current evidence:

- `npm run typecheck` passes
- `npm run build` passes
- focused prototype tests pass:
  - `tests/prototypeControls.test.ts`
  - `tests/popoverFields.test.ts`
  - `tests/prototypeStyleState.test.ts`
  - `tests/sortableList.test.ts`

Current prototype state is saved as:

- `jj` commit `877fef85`
- commit message: `Snapshot sidebar prototype v2`

This means the prototype is stable enough to promote in slices, but not yet something to drop wholesale into production paths.

## Promotion requirements

Promotion should only proceed if these requirements are kept intact:

1. Promote one pane at a time.
2. Preserve the current production sidebar order owned by `src/components/layout/RightSidebar.tsx`.
3. Keep `SliderField.tsx` as the shared numeric/slider control base.
4. Promote shared interaction shells before promoting pane-specific field definitions.
5. Keep pane-specific field definitions in feature-owned production modules.
6. Keep style-state/domain helpers outside presentation components.
7. Do not move prototype-only CSS wholesale into production styles.
8. Keep prototype-only layout shell code out of the production app.

## Current production seams

The current production sidebar composition seam is:

- `src/components/layout/RightSidebar.tsx`

Current production pane seams are:

- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

The current production shared control worth preserving is:

- `src/components/controls/SliderField.tsx`

The current production state seam is:

- `src/store/appStore.ts`

## What is ready to promote

Strong promotion candidates:

- shared row shell behavior from `PrototypeControls.tsx`
- shared pill-triggered popover behavior from `PrototypeControls.tsx`
- drag-handle slot behavior from `PrototypeControls.tsx`
- config-driven field rendering from `popoverFieldRenderer.tsx`
- style-state helper patterns from `prototypeStyleState.ts`
- reorder helper from `sortableList.ts`

Not ready to promote directly:

- `SidebarPrototypeApp.tsx`
- `main.tsx`
- `sidebar-prototype.html`
- prototype-specific CSS tuning in `prototype.css`
- prototype-only placeholder map shell

## Recommended promotion order

1. Labels
2. Overlays
3. Basemap
4. Facilities / PMC

Why this order:

- `LabelPanel.tsx` is still placeholder-only, so it is the lowest-risk first slice.
- `OverlayPanel.tsx` already uses repeated row/popover patterns, so it is the next best match.
- `BasemapPanel.tsx` is structurally close, but its current production organization is still different enough that it should follow the first two.
- `PmcPanel.tsx` is the most complex and should be migrated last.

## Recommended production destinations

Shared promoted primitives:

- `src/components/sidebar/`

Likely examples:

- `SortableControlRow.tsx`
- `PillPopoverTrigger.tsx`
- `SidebarMetaRail.tsx`
- `SidebarSectionCard.tsx`

Feature-owned field definitions:

- `src/features/labels/`
- `src/features/groups/`
- `src/features/basemap/`

Shared non-presentational helpers:

- `src/lib/sidebar/`
  - or another equivalent shared domain location

## First production slice

Recommended first slice: `Labels`

Suggested steps:

1. Create shared sidebar primitives in `src/components/sidebar/`.
2. Create a small feature-owned label field-definition module in `src/features/labels/`.
3. Replace the placeholder `LabelPanel.tsx` with the promoted row-shell + field-renderer path.
4. Wire it to real store-backed state.
5. Verify no regressions in `RightSidebar.tsx`.

Success criteria for the first slice:

- production Labels uses the promoted row shell
- production Labels uses the shared pill-triggered popover pattern
- production Labels reuses `SliderField.tsx`
- production Labels does not import prototype files
- production build/test signals stay green

## Promotion checklist

Before each production slice:

- confirm prototype contract is still the desired one
- identify the exact shared primitive to promote
- identify the feature-owned field-definition module
- verify store shape/state needs
- keep migration local to one pane

After each production slice:

- run `npm run typecheck`
- run `npm run build`
- run any targeted tests for the touched pane
- update docs if the production architecture direction becomes more explicit

## Stop conditions

Pause promotion if any of these becomes true:

- the pane interaction model is still changing materially
- the production store contract needs redesign before the pane can fit cleanly
- the shared primitive starts accreting pane-specific behavior
- CSS promotion would require copying large parts of `prototype.css` without clear token decisions

## Summary

The prototype is ready for promotion in controlled slices.

The correct next production move is not “merge the prototype.”

The correct next move is:

- promote shared sidebar primitives
- start with Labels
- keep pane-specific field definitions feature-owned
- preserve the current production sidebar composition seam
