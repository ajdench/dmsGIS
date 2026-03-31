# Prototype To Production Playbook

This is the canonical execution playbook for promoting approved prototype UI into the production app.

It is written as an operational rulebook, not a history note.

## Core Rule

When an approved prototype is the explicit replacement target:

- production must replace the old UI with production-owned equivalents of the prototype
- production must not merely “borrow ideas”
- production must not import prototype code into production
- production and prototype must remain separate codepaths

This repo has already proved that incremental approximation is too lossy when exact parity is the requirement.

## The Correct Replacement Pattern

### Do this

1. Keep the prototype as the approved UI reference.
2. Keep production as the real application shell.
3. Build production-owned exact equivalents of the approved prototype primitives.
4. Wire those production-owned exact equivalents to real production state and runtime logic.
5. Cut over the live production surfaces in a controlled way.

### Do not do this

1. Do not import from `src/prototypes/` into production code.
2. Do not copy prototype entry files or prototype shell scaffolding wholesale.
3. Do not try to “get close” by gradually reshaping an older production shell forever.
4. Do not patch pane-local spacing repeatedly when the shared shell is the real problem.
5. Do not move production map/runtime logic into the prototype and ship that.

## Promotion Boundary

Prototype files are reference/spec surfaces.

Production files are implementation surfaces.

Typical prototype reference files:

- `src/prototypes/sidebarPrototype/SidebarPrototypeApp.tsx`
- `src/prototypes/sidebarPrototype/PrototypeControls.tsx`
- `src/prototypes/sidebarPrototype/PrototypeAccordion.tsx`
- `src/prototypes/sidebarPrototype/prototype.css`
- prototype-local field/state helpers under `src/prototypes/sidebarPrototype/`

Typical production replacement surfaces:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebarExact/`
- exact pane implementations under `src/features/.../*Exact.tsx`
- production field-definition builders
- `src/store/appStore.ts`
- production map/runtime seams

## Replacement Phases

### Phase 1. Confirm the target and the failure mode

Before coding, confirm:

- the prototype is the explicit replacement target
- the current production UI is drifting
- the drift is shared-shell or primitive-level, not only pane-local

Do a short findings-and-approach pass first.

### Phase 2. Build the production-owned exact primitive layer

Create or update the shared exact kit in production paths.

In this repo, that currently means:

- `src/components/sidebarExact/`
- `src/styles/sidebarExact.css`

The exact kit should own:

- pane shell
- row shell
- drag handle
- disclosure/chevron
- toggle button
- metric pill
- swatch rendering
- popover/callout
- field rendering
- sortable/drag helpers

### Phase 3. Wire real production state and runtime

Prototype parity is not enough by itself.

Any control promoted into production must be backed by real production seams where applicable:

- `src/store/appStore.ts`
- `src/lib/schemas/`
- `src/lib/savedViews.ts`
- `src/features/map/`

If a prototype control requires a deeper state/runtime model, extend the model instead of faking the UI.

Example already proven in this repo:

- PMC child shape and border thickness required real `RegionStyle` and runtime changes, not just a popover field

### Phase 4. Cut over live production surfaces

Replace the live pane surfaces onto the exact shell:

- `RightSidebar`
- Basemap
- Facilities / PMC
- Labels
- Overlays

Do not keep reworking both old and new UI paths in parallel longer than necessary.

### Phase 5. Retire provisional paths

Once the exact path is stable:

- retire or clearly de-emphasize legacy sidebar paths
- remove duplicate shared behavior if the exact kit fully owns it

## Shared Rules For Exact Replacement

### 1. Shared shell first

If the issue appears in multiple panes, fix the shared shell/primitives first.

### 2. Measure geometry when alignment is non-trivial

Use live rendered geometry and not just CSS reasoning when dealing with:

- nested rails
- pill/popover alignment
- chevron/handle/toggle placement
- compact text alignment

### 3. Prefer positive replacement over local patching

If the current implementation path is brittle or repeatedly drifting:

- replace the pattern
- do not stack more local tweaks

### 4. Keep feature-owned definitions feature-owned

Pane-specific field definitions stay near the feature.

Shared shells should not contain feature meaning.

### 5. Extend real contracts when prototype behavior demands it

If the prototype assumes independent child state, then production needs a real state contract for it.

Do not leave child controls pretending to be local if they still broadcast globally.

### 6. Leave breadcrumbs when optimization is deferred

When a production replacement is correct but not fully optimized:

- leave an explicit breadcrumb in code or docs
- do not silently rely on memory

## Current Sidebar Replacement Pattern In This Repo

The current accepted pattern is:

- live production sidebar uses exact-shell production-owned primitives
- exact panes use `*Exact.tsx` surfaces
- old sidebar path remains provisional

Current exact live surfaces:

- `src/components/layout/RightSidebar.tsx`
- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`

## Remaining Contracts And Surfaces To Watch

These are the important surfaces where future exact-sidebar work may still need changes:

### Store/state

- `src/store/appStore.ts`
- `src/types/index.ts`
- `src/lib/schemas/savedViews.ts`

### Exact-shell UI

- `src/components/sidebarExact/`
- `src/styles/sidebarExact.css`
- `src/styles/global.css`

### Pane field builders

- `src/features/basemap/basemapPanelFields.ts`
- `src/features/groups/pmcPanelFields.ts`
- `src/features/labels/labelPanelFields.ts`
- `src/features/groups/overlayPanelFields.ts`

### Map/runtime

- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `src/features/map/selectionHighlights.ts`
- `src/features/map/tooltipController.ts`

## Architecture Optimization Still Required

The replacement is live, but some architectural cleanup still remains desirable.

1. Retire legacy sidebar paths once confidence is high enough.
2. Reduce dual-generation class/token bridging where it is no longer needed.
3. Keep new style/runtime fields reflected in saved-view schemas.
4. Continue moving brittle shared behavior into the exact kit rather than pane-local code.
5. Keep `docs/sidebar-pane-status.md` and `docs/sidebar-parity-bugs.md` in sync with live production truth.

## Acceptance Gates

For meaningful sidebar replacement work:

1. The UI should match the prototype or improve on it deliberately and explicitly.
2. The behavior should be backed by real production state/runtime where needed.
3. `npm run typecheck` should pass.
4. `npm run build` should pass.
5. Non-trivial new behavior should have focused tests at the seam where it was introduced.

## Documentation Rule

When sidebar behavior changes:

- update `docs/sidebar-pane-status.md`
- update `docs/sidebar-parity-bugs.md` if something is deferred
- update `docs/agent-handover.md` if the handover picture changed
- update `docs/agent-continuation-protocol.md` if the working method changed

That is part of the replacement process, not optional cleanup.
