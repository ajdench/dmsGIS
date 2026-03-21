# Sidebar Prototype Notes

This prototype is intentionally separate from the production app runtime.

It is also the approved target direction for the production sidebar’s visual language, interaction model, and architectural structure. The separation exists to control migration safely, not to imply that production should only borrow isolated pieces.

## Purpose

Evaluate a revised right-sidebar interaction model in the production shell layout without loading the OpenLayers map pane.

## Current prototype rules

- Keep the live app shell proportions and panel order
- Keep the work isolated to `src/prototypes/sidebarPrototype/`
- Use Radix accordion primitives for expand and collapse behavior
- Only the chevron control should expand or collapse a section
- Header controls are ordered:
  - `On/Off`
  - colour and opacity pill
  - chevron disclosure
- Keep header control styling consistent across sub-pane rows
- Use the same compact control sizing for pane headers and row controls
- Keep the colour swatch and opacity/value inside a single pill
- Pill-driven popovers should use the same floating callout treatment across pane families, with a visually attached sliding edge pointer anchored back to the source pill
- The shared arrow clamp should be measured from the visible arrow edge, so small and large popovers stop at the same apparent top/bottom inset while scrolling
- Basemap popovers currently use a deliberately tighter visible-arrow clamp than the larger Facilities-style popovers
- In PMC-style region lists, clicking the pill should open that floating style callout while preserving row drag, toggle, and chevron responsibilities
- PMC global controls should seed region-row styles at reset and should override matching row properties again when a global PMC control changes
- Region-row edits should then remain local until another matching global PMC control is changed
- PMC row pills should preview the current row shape, fill colour, border styling, and opacity summary
- Shape-button silhouettes and pill swatches should use separate tuned renderers; when promoted to production map points, border thickness must project inward so symbol size stays fixed to the configured point size
- Pill swatches currently use:
  - a neutral hairline outline by default
  - a configured border when the relevant popover exposes border controls
  - fixed tokenized outer size, with internal shape/border projection only
- Basemap pill swatches currently use live local colour state from their own popovers rather than static seed-display values
- Current pill-value alignment work should be documented as ongoing visual calibration, not defect tracking
- PMC row editors are grouped into `Points` and `Border` sections
- Floating callout positioning is owned by `floatingCallout.ts`; component rendering should not re-embed placement math inline
- PMC child rows now use a dedicated right-edge drag handle for reordering; dragging should not start from the toggle, pill, or row background
- Basemap, Labels, Overlays, and PMC child rows now all use the same right-edge drag-handle slot for sortable rows; the drag glyph should stay optically centered against the adjacent pill rail
- Reorder math should stay in a dedicated helper (`sortableList.ts`) rather than being re-derived inside the drag-end event wiring
- Overlays should be treated as an overlay-family surface, not assumed to be permanently flat; an overlay can be either a sortable popover row or a collapsible popover section with visible child items beneath it
- Repeated simple sub-pane sections, such as Basemap and Labels colour/opacity blocks, should be defined from shared config data rather than duplicated JSX
- Shared row presentation should live in `PrototypeControls.tsx` as reusable shells and control-rail helpers; pane files should supply state and pane-specific field content rather than rebuilding row structure
- Repeated popover field groups should be declared through config/build helpers and rendered through a shared section renderer instead of duplicating field JSX per pane
- Pane popover field definitions should stay split by pane family, with a shared renderer/barrel, so `SidebarPrototypeApp.tsx` can stay focused on state wiring, pane layout, and composition
- Shared style-state types, defaults, and update helpers now live in `prototypeStyleState.ts`; pane files should consume those helpers rather than redefining style records locally
- Focused tests now cover row-shell interaction contracts, popover field builders, and prototype style-state helpers
- Use red-tinted `Off` state styling and green-tinted `On` state styling, including hover treatment
- Preset buttons (`Current` to `COA 3b` and `DPHC Estimate COA Playground`) should use the same background tone for hover and selected states, with a softer selected border tone than the default hover-border accent
- Top-level pane bodies currently use a shared extra `1px` bottom white inset through the common pane-content rule rather than pane-specific overrides
- Prevent large pane content, especially Facilities, from visually running beyond the available panel space
- Do not duplicate `Visible` controls inside section bodies when `On/Off` already exists in the header
- For PMC-style dynamic lists, do not add an inner scrollbar; let the sub-pane grow and let the outer sidebar handle scrolling
- Use the prototype-local top bar shell rather than importing the production `TopBar`
- Keep prototype-only visual tuning in `prototype.css` and prototype-local tokens unless the change is explicitly being promoted into shared production styling

## Current files

- `data.ts`
- `basemapPopoverFields.ts`
- `facilityPopoverFields.ts`
- `labelPopoverFields.ts`
- `main.tsx`
- `PrototypeControls.tsx`
- `floatingCallout.ts`
- `overlayPopoverFields.ts`
- `popoverFieldRenderer.tsx`
- `popoverFields.ts`
- `PROMOTION.md`
- `PROMOTION_BOUNDARY.md`
- `PRODUCTION_PREPARATION.md`
- `REACTIVATION.md`
- `regionPopoverFields.ts`
- `prototypeStyleState.ts`
- `sortableList.ts`
- `SidebarPrototypeApp.tsx`
- `PrototypeAccordion.tsx`
- `prototype.css`
- `VERSIONS.md`

Production-aware migration notes:

- `PRODUCTION_PREPARATION.md` maps the current prototype modules onto the inspected production sidebar files and suggests a promotion order without changing the production app yet
- `PROMOTION.md` communicates the current readiness state, promotion requirements, and the recommended production migration sequence
- `PROMOTION_BOUNDARY.md` defines what is currently a promotion candidate versus what should remain prototype-only

Current focused prototype tests:

- `tests/prototypeControls.test.ts`
- `tests/popoverFields.test.ts`
- `tests/prototypeStyleState.test.ts`
- `tests/sortableList.test.ts`

## Versioning

- use `VERSIONS.md` to record stable prototype milestones
- treat the `jj` commit labeled `Snapshot sidebar prototype v1` as the saved `v1` baseline
- treat the `jj` commit labeled `Snapshot sidebar prototype v2` as the saved `v2` baseline once created
- treat the new empty working copy created immediately after that checkpoint as the start of `v3`

## Promotion guidance

Do not move this into production paths until:

- the header-control pattern is approved
- pane overflow behavior feels right
- the visual treatment is agreed across Basemap, Facilities, Labels, and Overlays
- the sortable-row pattern is stable enough to become a shared production primitive rather than pane-specific JSX
- the floating row editor/callout contract is reduced to a reusable hook/component boundary
- production and prototype responsibilities remain cleanly separated

Likely promotion-ready primitives are:

- sortable row shell
- pill-triggered popover shell
- drag-handle slot
- config-driven field-section renderer
- shared style-state domain helpers

## Current calibration areas

These are active design-tuning areas inside the prototype and should be treated as reviewable calibration work rather than as bug-tracker items:

- pill swatch shape/outline balance
- pill value alignment and typography balance against swatch centre lines
- compact shape-button silhouette tuning
- Basemap default colour brightness and preview presentation

## Reactivation after restart

Use [REACTIVATION.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/src/prototypes/sidebarPrototype/REACTIVATION.md) as the restart note for this prototype thread.

Minimum restart path:

1. Read this file.
2. Read [REACTIVATION.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/src/prototypes/sidebarPrototype/REACTIVATION.md).
3. Run `jj status` and `npm run typecheck`.
4. Treat current swatch, pill, and shape work as calibration unless something genuinely blocks validation or promotion.
