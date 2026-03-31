# Prototype Promotion Boundary

This note defines the current promotion boundary for the sidebar prototype.

It is intentionally kept in prototype space so we can refine it without prematurely turning prototype assumptions into production contracts.

Important intent:

- the approved prototype is the target production design direction
- the promotion boundary exists to control how parity is achieved, not to imply that production should only cherry-pick isolated ideas

## Promoteable candidates

These are the prototype pieces that are currently strong candidates for later promotion into production code so the production app can reproduce the prototype’s design language, behavior, and structure.

### Shared UI primitives

- `PrototypeControls.tsx`
  - sortable row shell
  - inline row shell
  - pill-triggered popover shell
  - drag-handle slot
  - meta-control rail composition
  - toggle and metric-pill presentation

- `PrototypeAccordion.tsx`
  - top-level pane shell if the Radix accordion direction is retained

- `popoverFieldRenderer.tsx`
  - config-driven section renderer
  - config-driven field renderer

### Shared domain/helpers

- `prototypeStyleState.ts`
  - style-state types
  - initial style defaults
  - record update helpers
  - mixed-color summary helpers

- `sortableList.ts`
  - reorder helper

- `floatingCallout.ts`
  - only if the floating callout behavior itself is approved for production

## Prototype-only for now

These should stay prototype-only until there is an explicit production decision.

- `prototype.css`
  - prototype-local visual tuning
  - experimental spacing/color tweaks
  - prototype-only control tokens

- `SidebarPrototypeApp.tsx`
  - mock-data composition shell
  - prototype-only state orchestration
  - prototype-only top bar/layout placeholder

- `main.tsx`
  - prototype entry only

- `sidebar-prototype.html`
  - prototype page only

## Pane-specific field definitions

These are likely to be promoted conceptually, but not necessarily copied directly.

- `facilityPopoverFields.ts`
- `labelPopoverFields.ts`
- `overlayPopoverFields.ts`
- `regionPopoverFields.ts`

Expected production outcome:

- the same config-driven structure, but moved into feature-owned production modules
- not one shared catch-all file for every pane

## Current recommended production destinations

- shared sidebar primitives:
  - `src/components/sidebar/`

- feature-owned field definitions:
  - `src/features/basemap/`
  - `src/features/groups/`
  - `src/features/labels/`

- shared domain helpers:
  - `src/lib/sidebar/` or another non-presentational shared domain location

## Promotion rules

- Promote toward prototype parity, not toward a looser approximation.
- Promote primitives before promoting pane compositions.
- Promote contracts before promoting visual tuning.
- Promote one production pane at a time.
- Preserve `SliderField.tsx` as the shared slider base.
- Do not move prototype-only CSS wholesale into production styles.

## Current first production targets

Recommended order:

1. Labels
2. Overlays
3. Basemap
4. Facilities / PMC

Reason:

- Labels has the lowest current production complexity.
- Overlays already has repeated row/popover behavior.
- Basemap is structurally close but still has a different production shape today.
- PMC remains the highest-risk migration slice.
