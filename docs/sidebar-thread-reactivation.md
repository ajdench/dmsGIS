# Sidebar Thread Reactivation

Use this note to restart the current sidebar work without re-deriving the context.

## What this thread concluded

The approved sidebar prototype under `src/prototypes/sidebarPrototype/` is the target direction for the production sidebar:

- visually
- interaction-wise
- structurally

The previous implementation approach of incrementally reshaping the old production sidebar was judged insufficient for parity.

The recommended direction is:

- keep the prototype as the approved UI reference
- keep the production app as the real app/runtime/store shell
- rebuild the production sidebar architecture in production paths so it matches the prototype more literally

Do **not** treat the current incremental sidebar changes as the final direction.

Do **not** move production map logic into the prototype and ship that.

## Core reset document

Read this first:

- `docs/sidebar-production-reset-plan.md`

That document is the current source of truth for the recommended approach.

## Documents to read on restart

Read these in order:

1. `AGENTS.md`
2. `README.md`
3. `docs/sidebar-production-reset-plan.md`
4. `src/prototypes/sidebarPrototype/PROMOTION.md`
5. `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
6. `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`

## Important working assumptions

Assume all of the following:

- the prototype is the approved sidebar target
- prototype and production must remain separate codepaths unless explicitly promoted
- production state continues to flow through `src/store/appStore.ts`
- `src/components/layout/RightSidebar.tsx` remains the production composition seam
- `src/components/controls/SliderField.tsx` remains the shared slider/numeric primitive

## What not to trust

Do not assume the current production sidebar work-in-progress already reflects the correct architecture.

In particular:

- partial spacing fixes may be misleading
- pane-local tweaks may be misleading
- intermediate sidebar shell changes may be discarded or replaced

Treat current unresolved sidebar WIP as exploratory unless it has been explicitly folded into the reset plan.

## What to inspect first on restart

Inspect these production seams first:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebar/`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`

Inspect these prototype references second:

- `src/prototypes/sidebarPrototype/SidebarPrototypeApp.tsx`
- `src/prototypes/sidebarPrototype/PrototypeControls.tsx`
- `src/prototypes/sidebarPrototype/prototype.css`
- `src/prototypes/sidebarPrototype/floatingCallout.ts`
- pane field-definition helpers under `src/prototypes/sidebarPrototype/`

## Restart implementation strategy

On restart, do this:

1. Confirm the problem by comparing the prototype structure against the current production shell.
2. Do not start with spacing tweaks.
3. Reset the shared production sidebar shell around prototype-equivalent roles.
4. Centralize pane collapse/open behavior in the shared shell.
5. Keep pane-specific row/field definitions in feature-owned production modules.
6. Rebuild panes in this order:
   1. Basemap
   2. Labels
   3. Overlays
   4. Facilities / PMC

## Validation requirements

After each meaningful production slice:

- run `npm run typecheck`
- run `npm run build`
- add or update tests for non-trivial shared logic

`npm run build` remains the release gate.

## Restart prompt

If a future assistant/thread needs a concise activation brief, use this:

> Resume the production sidebar reset. The approved prototype under `src/prototypes/sidebarPrototype/` is the exact target direction, but prototype and production must remain separate. Read `AGENTS.md`, `README.md`, and `docs/sidebar-production-reset-plan.md` first. Do not continue incremental spacing tweaks on the old production shell. Rebuild the production sidebar architecture in production paths to match the prototype more literally, keeping production state in `src/store/appStore.ts` and `SliderField.tsx` as the shared numeric primitive.
