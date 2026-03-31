# Sidebar Prototype Production Preparation

This note stays in prototype space, but it is based on the current production codebase and is intended to reduce ambiguity when the sidebar pattern is promoted.

This analysis assumes that the approved prototype is the intended target state for the production sidebar:

- visually
- interaction-wise
- structurally

The migration guidance below is therefore about how to achieve that target safely in the current production codebase, not about whether production should reproduce the prototype.

## Current production inspection

The current production sidebar is assembled in:

- `src/components/layout/RightSidebar.tsx`

The current production pane surfaces are:

- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

The current shared production control already worth preserving is:

- `src/components/controls/SliderField.tsx`

The current production state boundary is:

- `src/store/appStore.ts`

## What the production inspection shows

- `RightSidebar.tsx` is currently the correct composition seam for top-level pane order and preset buttons.
- `BasemapPanel.tsx` already has a section-config pattern, but it still renders through `details` and pane-local popover structure.
- `SelectionPanel.tsx` is a thin container and is a good seam for eventually adopting a promoted Facilities pane shell.
- `PmcPanel.tsx` currently contains the heaviest interaction logic and the highest duplication risk.
- `LabelPanel.tsx` is still placeholder-only, which makes Labels the safest first promotion target if we want a low-risk migration slice.
- `OverlayPanel.tsx` already uses a repeated row/popover model, but it is still built with pane-local markup and `details`.
- `SliderField.tsx` is already a good shared primitive and should remain the slider/numeric control base during promotion.

## Prototype module to likely production destination

These are recommendations, not committed production decisions.

Prototype module:
- `src/prototypes/sidebarPrototype/PrototypeControls.tsx`

Likely production destination:
- `src/components/sidebar/`

Likely promoted pieces:
- sortable row shell
- pill-triggered popover shell
- drag-handle slot
- row-end meta layout
- shared toggle/pill presentation
- rounded SVG point-shape geometry definitions for future production map symbols, provided they are wired so size and rounding scale from the same production point-size value
- geometry-first border rendering for non-circular symbols, especially triangles: use one symmetric outer/inner shape family with inward border projection and size-driven centroid-based scaling rather than centered strokes or ad hoc swatch offsets

Prototype module:
- `src/prototypes/sidebarPrototype/popoverFields.ts`

Likely production destination:
- pane-local config modules under the owning feature

Examples:
- `src/features/basemap/basemapPanelFields.tsx`
- `src/features/groups/pmcPanelFields.tsx`
- `src/features/groups/overlayPanelFields.tsx`
- `src/features/labels/labelPanelFields.tsx`

Prototype module:
- `src/prototypes/sidebarPrototype/prototypeStyleState.ts`

Likely production destination:
- shared domain helpers in a non-presentational layer

Examples:
- `src/lib/sidebar/`
- or a feature-domain module if the state model remains feature-specific

Prototype module:
- `src/prototypes/sidebarPrototype/floatingCallout.ts`

Likely production destination:
- a shared floating-editor helper only if the floating callout behavior is approved for production

## Recommended promotion order

1. Labels

Why:
- production Labels is currently placeholder-only
- lowest migration risk
- easiest way to validate the promoted row shell and field renderer against real store state

2. Overlays

Why:
- already row/popover-oriented in production
- strong fit for the promoted sortable popover row shell

3. Basemap

Why:
- production Basemap already uses config-like section data
- some current production section structure differs from the prototype, so it is a better third step than the first

4. Facilities / PMC

Why:
- highest interaction complexity
- most state fanout
- most bespoke row behavior

## Promotion principles to preserve

- Treat the approved prototype as the target experience, not as optional inspiration.
- Keep shared interaction shells in shared component space.
- Keep pane-specific field definitions outside shared component files.
- Keep style-state helpers outside presentation components.
- Reuse `SliderField.tsx` rather than creating a second slider primitive.
- Promote one pane at a time, not the whole sidebar in one rewrite.
- Keep production state integration separate from visual migration work when possible.

## Immediate prototype-side guardrails before production work

- Keep prototype-only CSS tokens in `prototype.css` until an explicit promotion choice is made.
- Do not move prototype modules into production paths wholesale.
- Promote only the pieces that already have a clear production destination and responsibility.
- Preserve the current production sidebar order owned by `RightSidebar.tsx`.
