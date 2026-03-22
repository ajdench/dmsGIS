# Sidebar Pane Status

This document is the current pane-by-pane truth ledger for the production sidebar.

It exists to answer:

- what is live in production now
- what matches the prototype
- what still does not
- which contracts and surfaces are already wired
- which remaining issues are deferred or still open

This is not the strategy document.
Use `docs/prototype-to-production-playbook.md` for the replacement rules.

## Canonical Sidebar Surfaces

Current live production sidebar composition:

- `src/components/layout/RightSidebar.tsx`

Current live exact-shell production primitives:

- `src/components/sidebarExact/`
- `src/styles/sidebarExact.css`

Current live exact pane surfaces:

- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`

## Global Sidebar Status

### Current state

- production is now running on the exact-shell sidebar path
- pane drag is wired
- row drag is wired where relevant
- pill popovers are anchored from the parent pill
- exact toggle labels, chevrons, handles, and pill geometry have been brought much closer to the prototype
- exact swatch rendering is shared and production-owned

### Still important

- some parity polish remains
- a few alignment issues are intentionally deferred rather than being repeatedly re-patched
- the old sidebar path still exists in the repo and should be treated as legacy/provisional

## Basemap

### Live surface

- `src/features/basemap/BasemapPanelExact.tsx`
- field definitions: `src/features/basemap/basemapPanelFields.ts`

### What is in place

- exact-shell pane
- prototype-style top-level pane behavior
- draggable `Land` and `Sea` section cards
- pill popovers using the exact-shell popover path
- pane-level visibility derived from immediate child rows

### What is wired

- real production basemap state through `src/store/appStore.ts`
- land/sea color and opacity controls
- land/sea visibility controls

### Known status

- usable and structurally on the exact path
- not the baseline pane for parent-rail alignment
- has a deferred parent-control alignment drift against the Facilities baseline
- `Land` / `Sea` control alignment drift has also been noted for later dedicated review

### Reference bug status

See:

- `docs/sidebar-parity-bugs.md`

## Facilities

### Live surface

- `src/features/facilities/SelectionPanelExact.tsx`
- PMC field definitions: `src/features/groups/pmcPanelFields.ts`

### What is in place

- exact-shell top-level `Facilities` pane
- internal `PMC` parent section
- draggable PMC child rows
- exact-shell child row popovers
- exact search input placement

### What is wired

- real production facility filter state
- real PMC region state through `src/store/appStore.ts`
- local child-row visibility
- local child-row color
- local child-row opacity
- local child-row size
- local child-row shape
- local child-row border color
- local child-row border opacity
- local child-row border thickness
- global PMC broadcasts for visibility, color, opacity, shape, size, border visibility, border color, border opacity, border thickness

### Runtime status

PMC styling is not only UI-wired. It is also wired through runtime seams:

- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `src/features/map/selectionHighlights.ts`
- `src/features/map/tooltipController.ts`
- saved-view snapshot schemas in `src/lib/schemas/savedViews.ts`

### Current status

- Facilities is currently the visual/alignment baseline for other parent rails
- PMC child controls now behave locally where the prototype requires them to
- this is currently the strongest pane in terms of prototype-faithful hierarchy

### Remaining watchpoints

- continue to verify popover family parity when new fields are added
- preserve local-vs-global semantics if future PMC styling fields are introduced

## Labels

### Live surface

- `src/features/labels/LabelPanelExact.tsx`
- field definitions: `src/features/labels/labelPanelFields.ts`

### What is in place

- exact-shell top-level pane
- draggable label section cards
- current row inventory matches the prototype surface:
  - Countries
  - Cities
  - Regions
  - Networks
  - Facilities

### What is wired

- production basemap label state through `src/store/appStore.ts`
- colour, opacity, size, border colour, border opacity, and border width where supported by production basemap state
- saved-view-safe through existing basemap snapshot structures

### Important note

The exact pane inventory is now present, but runtime label rendering coverage depends on the existing production map-layer support. Future label rows must continue to be judged on both:

- sidebar parity
- real map/runtime support

### Known status

- structurally on the exact path
- parent-control rail has a deferred alignment drift relative to Facilities

## Overlays

### Live surface

- `src/features/groups/OverlayPanelExact.tsx`
- field definitions: `src/features/groups/overlayPanelFields.ts`
- family/section selectors: `src/features/groups/overlaySelectors.ts`

### What is in place

- exact-shell top-level pane
- draggable overlay section cards
- row ordering now sticks correctly
- empty-state behavior remains preset-aware

### What is wired

- overlay visibility
- overlay opacity
- overlay border visibility
- overlay border colour
- overlay border opacity
- production overlay-family metadata

### Known status

- drag snap-back bug was fixed by seeding and synchronizing order state
- parent-control rail has a deferred alignment drift relative to Facilities

## Shared Exact Kit

### Current live exact-shell files

- `src/components/sidebarExact/ExactAccordion.tsx`
- `src/components/sidebarExact/ExactDragHandle.tsx`
- `src/components/sidebarExact/ExactFields.tsx`
- `src/components/sidebarExact/ExactMetaControls.tsx`
- `src/components/sidebarExact/ExactMetricPill.tsx`
- `src/components/sidebarExact/ExactPopover.tsx`
- `src/components/sidebarExact/ExactRowShells.tsx`
- `src/components/sidebarExact/ExactSwatch.tsx`
- `src/components/sidebarExact/ExactToggleButton.tsx`
- `src/components/sidebarExact/SidebarAccordion.tsx`
- `src/components/sidebarExact/SidebarControls.tsx`
- `src/components/sidebarExact/SidebarSortable.tsx`
- `src/components/sidebarExact/floatingCallout.ts`
- `src/components/sidebarExact/useSidebarDndSensors.ts`

### Current exact-shell status

- exact toggle positioning is in a good state
- exact popover anchoring is in place
- exact shape-button icon sizing now matches the prototype token path
- shape buttons have also been centered in their grid cells as a deliberate production improvement
- trailing-control column is now normalised to `--prototype-drag-handle-width` across all drag handles and disclosure buttons
- chevron SVG is absolutely centred within the trailing-control slot with a confirmed 1px optical correction (`left: calc(50% + 1px)`)
- pane-level toggle column now aligns correctly with child row toggles (`--prototype-pane-toggle-alignment-compensation: 4px`)
- section-card bar handle over-compensation removed; handles flush at the shared right margin

### Improvement already accepted beyond prototype

The prototype shape buttons were not perfectly visually centered either.
Production has intentionally improved this while keeping the rest of the contract aligned.

## Deferred Parity Bugs

No parity bugs currently deferred.

Previous items (resolved):

1. Pane-level toggle column drift — fixed via `--prototype-pane-toggle-alignment-compensation` token
2. Chevron SVG centering in trailing-control slot — fixed via absolute positioning
3. Section-card bar handle over-compensation — compensation rule removed

See:

- `docs/sidebar-parity-bugs.md`

## Legacy / Provisional Sidebar Surfaces

These still exist in the repo and should not be treated as the current truth unless a task explicitly targets them:

- `src/components/sidebar/`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

They are retained for repo continuity, but the live production truth is the exact-shell path.

## Update Rule

Whenever a user-visible pane behavior changes, update this document.

At minimum, update:

- live surface
- what is wired
- known status
- deferred or resolved bugs
