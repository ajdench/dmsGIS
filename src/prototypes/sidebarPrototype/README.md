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
- Popover shape-button silhouettes now use rounded SVG geometry, including a rotated rounded-rect diamond and a subtly curved triangle, and these shapes are the intended reference for future production map-point symbols
- When promoted to production map points, shape size and corner rounding should scale together from the configured point-size control rather than being held as fixed icon geometry
- Triangle border rendering should not rely on generic scale-down math or ad hoc offsets. The approved direction is geometry-first: one symmetric outer/inner shape family, with inward border projection and mathematically derived centroid scaling so the same principle can later inform production map points
- Pill swatches currently use:
  - a neutral hairline outline by default
  - a configured border when the relevant popover exposes border controls
  - fixed tokenized outer size, with internal shape/border projection only
  - a reusable optional debug circle overlay remains available in the swatch component for future alignment checks, but it is not part of the live UI
- Compact `On/Off`, pill `%`, and swatch-circle sizing is now locked through one prototype-local token family in `prototype.css`:
  - `--prototype-compact-text-size`
  - `--prototype-compact-text-offset-y`
  - `--prototype-compact-swatch-size`
- Current locked compact-control values in the prototype are:
  - `--prototype-compact-text-size: 0.775rem`
  - `--prototype-compact-text-offset-y: 1.5px`
  - `--prototype-toggle-padding-x: 0.58rem`
- Popover section titles such as `Layer`, `Text`, `Points`, and `Border` should all use the shared global `--font-size-popover-title` token so they can be tuned once across popover types
- Current locked popover section-title value is:
  - `--font-size-popover-title: 0.825rem`
- Swatch-pill width and `%` placement are now controlled through explicit pill-geometry tokens rather than ad hoc text nudges:
  - `--prototype-pill-left-padding`
  - `--prototype-pill-value-width`
  - `--prototype-pill-right-padding`
- Current locked swatch-pill geometry is:
  - `--prototype-pill-value-width: 4ch`
  - `--prototype-pill-right-padding: calc(var(--prototype-pill-left-padding) - 1.5px)`
- Basemap pill swatches currently use live local colour state from their own popovers rather than static seed-display values
- Header alignment is now governed by a shared rule:
  - top-level pane headers align from pane-edge math
  - bordered internal section headers align from the same control geometry plus `--prototype-subpane-border-compensation`
  - this keeps top-level pane controls and bordered sub-pane/section controls on the same right-edge and chevron-slot basis across pane families
- Top-level pane `On/Off` buttons now act as visibility-broadcast controls for the rows beneath them:
  - `Basemap` broadcasts to `Land` and `Sea`
  - `Facilities` broadcasts to its immediate child sections, currently `PMC`
  - `Labels` broadcasts to all label rows
  - `Overlays` broadcasts to all overlay rows
  - child rows can still be toggled locally afterward until the parent pane is changed again
- Internal parent rows with children should follow the same rule:
  - `PMC` broadcasts to all PMC region rows
  - region rows can still be toggled locally afterward until `PMC` is changed again
- When a parent row or pane has a mixed child-visibility state, its `On/Off` control should show the shared mixed state instead of pretending to be binary:
  - label: `Ox`
  - colour treatment: orange, parallel to the green `On` and red `Off` patterns
  - intended for `PMC` now and for future parent rows/panes using the same child-visibility model
- Parent visibility state should aggregate from immediate children only, not grandchildren:
  - `Facilities` currently derives from `PMC`
  - `PMC` derives from its region rows
  - future pane families should follow that same one-level-at-a-time visibility model
- Immediate-child aggregation should be tri-state aware:
  - a parent is `On` only when all immediate children are fully `On`
  - a parent is `Off` only when all immediate children are fully `Off`
  - if any immediate child is mixed, or immediate children disagree, the parent should read `Ox`
- When header/control alignment becomes non-trivial, use measured rendered geometry to calibrate the live result.
  - Prefer DOM/browser measurements of actual right edges, center points, and rendered heights over continuing to infer layout from CSS alone
  - Use CSS inference to form the hypothesis, then confirm and lock the final rule from measured output
- Current measured right-edge alignment outcome:
  - top-level pane drag handles are locked to the same rendered handle column as row handles below
  - top-level pane toggles are locked to the same rendered toggle right-edge as the matching controls below
  - top-level chevrons are kept in the visually approved position after measurement, even where that differs from a stricter pill-right-edge alignment rule
- Top-level pane header rails are now locked to the same rendered outer height as Land/Sea-style bordered rows:
  - shared token: `--prototype-shared-header-outer-height`
  - locked value: `3rem` (`48px` at the current root font size)
  - this applies in both collapsed and expanded top-level pane states
- Top-bar action buttons (`Open`, `Save`, `Export`, `Reset`) and preset buttons (`Current` to `COA 3b`, plus the full-width Playground button) now use separate internal size-mode lanes:
  - top bar lane: `PROTOTYPE_TOPBAR_BUTTON_SIZE_MODE`
  - preset row lane: `PROTOTYPE_PRESET_BUTTON_SIZE_MODE`
  - this keeps header-row sizing independent from preset-row sizing during calibration
- Current locked button-size mode state is:
  - top bar: `current`
  - preset row: `midLow`
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
- The full-width `DPHC Estimate COA Playground` button should inherit the same selected text-weight behavior as the `Current` to `COA` buttons while preserving its production text structure
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
- `types.ts`
- `mockData.tsx`
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
- compact shape-button silhouette tuning
- Basemap default colour brightness and preview presentation

## Reactivation after restart

Use [REACTIVATION.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/src/prototypes/sidebarPrototype/REACTIVATION.md) as the restart note for this prototype thread.

Minimum restart path:

1. Read this file.
2. Read [REACTIVATION.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/src/prototypes/sidebarPrototype/REACTIVATION.md).
3. Run `jj status` and `npm run typecheck`.
4. Treat current swatch, pill, and shape work as calibration unless something genuinely blocks validation or promotion.
