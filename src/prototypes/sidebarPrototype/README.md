# Sidebar Prototype Notes

This prototype is intentionally separate from the production app runtime.

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
- In PMC-style region lists, clicking the pill should open a floating style callout that remains visually attached to the source pill with a sliding edge pointer
- PMC global controls should seed region-row styles at reset and should override matching row properties again when a global PMC control changes
- Region-row edits should then remain local until another matching global PMC control is changed
- PMC row pills should preview the current row shape, fill colour, border styling, and opacity summary
- PMC row editors are grouped into `Points` and `Border` sections
- Floating callout positioning is owned by `floatingCallout.ts`; component rendering should not re-embed placement math inline
- Use red-tinted `Off` state styling and green-tinted `On` state styling, including hover treatment
- Prevent large pane content, especially Facilities, from visually running beyond the available panel space
- Do not duplicate `Visible` controls inside section bodies when `On/Off` already exists in the header
- For PMC-style dynamic lists, do not add an inner scrollbar; let the sub-pane grow and let the outer sidebar handle scrolling
- Use the prototype-local top bar shell rather than importing the production `TopBar`

## Current files

- `data.ts`
- `main.tsx`
- `PrototypeControls.tsx`
- `floatingCallout.ts`
- `SidebarPrototypeApp.tsx`
- `PrototypeAccordion.tsx`
- `prototype.css`

## Promotion guidance

Do not move this into production paths until:

- the header-control pattern is approved
- pane overflow behavior feels right
- the visual treatment is agreed across Basemap, Facilities, Labels, and Overlays
- production and prototype responsibilities remain cleanly separated
