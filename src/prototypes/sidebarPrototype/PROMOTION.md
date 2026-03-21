# Sidebar Prototype Promotion

This document defines the explicit promotion path from the approved sidebar prototype to the production app.

This is no longer a "borrow selected ideas" plan.

This is a controlled replacement plan for the current production sidebar so production reproduces the prototype:

- visually
- interaction-wise
- structurally

The current production sidebar already contains a partial promotion, but the production review now shows that this partial state is itself a source of drift. The correct next move is therefore not more local approximation. It is a production-side replacement of the current sidebar shell and pane surfaces around the approved prototype contract.

## Promotion Decision

Promotion target:

- the prototype in `src/prototypes/sidebarPrototype/`

Promotion intent:

- replace the current production sidebar shell and pane implementations with production-owned equivalents that reproduce the prototype exactly, while wiring them to real production state and runtime behavior

Promotion rule:

- rebuild on production state and production-owned files
- do not import prototype code into production
- do not copy `SidebarPrototypeApp.tsx`, `main.tsx`, `sidebar-prototype.html`, or `prototype.css` wholesale

## Current Readiness

The prototype is ready for production promotion as the exact replacement target.

Current evidence:

- `npm run typecheck` passes
- `npm run build` passes
- focused prototype tests pass:
  - `tests/prototypeControls.test.ts`
  - `tests/popoverFields.test.ts`
  - `tests/prototypeStyleState.test.ts`
  - `tests/sortableList.test.ts`

The relevant conclusion is not just that the prototype is stable enough.

It is that the prototype now contains:

- the approved visual language
- the approved parent/child toggle logic
- the approved pill/popover contract
- the approved row-end control alignment model
- the approved pane-height and spacing contract
- the approved shape/swatch rendering direction

## Production Review Summary

Production review covered:

- `src/components/layout/RightSidebar.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`
- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`
- `src/store/appStore.ts`
- `src/styles/global.css`

What the production review shows:

1. Production already has a partial promoted sidebar primitive layer in `src/components/sidebar/`, but it is not yet the full prototype contract.
2. Top-level panes and row-level controls are still implemented through different patterns.
3. Pane-level `On/Off` behavior is still mostly binary and pane-local, not the approved tri-state immediate-child model.
4. `SelectionPanel.tsx` + `PmcPanel.tsx` still use an older embedded structure (`section`, `details`, `summary`, bespoke popover markup) and are now the clearest production drift surface.
5. `BasemapPanel.tsx`, `LabelPanel.tsx`, and `OverlayPanel.tsx` already resemble the promoted direction, but they still stop short of full prototype parity in shell behavior, toggle state modeling, disclosure/handle alignment, and pane-to-row hierarchy.

The consequence:

- promotion should now be treated as a production sidebar replacement program, not as a series of unrelated pane-local tweaks

## Exact Production Replacement Target

The following current production files should be treated as the replacement surface:

### Top-level production composition

- `src/components/layout/RightSidebar.tsx`

### Shared production sidebar primitives

- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`

### Production pane surfaces

- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

### Production state seam

- `src/store/appStore.ts`

### Production visual token seam

- `src/styles/global.css`

## Wholesale Replacement Path

The successful promotion path is:

1. Replace the shared production sidebar primitive layer first.
2. Replace the top-level production sidebar composition shell second.
3. Replace each production pane surface against the new shared shell.
4. Replace old pane-local toggle/disclosure/popover markup rather than trying to wrap it.
5. Replace old parent-child visibility logic with the prototype’s immediate-child tri-state model.
6. Replace old swatch/pill/toggle visual behavior with the prototype contract through production-owned CSS/tokens and components.

This is a controlled wholesale replacement of the current production sidebar elements, not a selective extension of the old shell.

## Explicit File-by-File Promotion Path

### Phase 1. Reset the shared production sidebar primitives

Treat the following production files as replacement targets, not preservation targets:

- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`

Production outcome required:

- top-level pane shell must match prototype pane shell behavior
- row shell must match prototype section-card / inline-row behavior
- toggle button must support `on`, `off`, and `mixed`
- pill trigger must match prototype swatch/value behavior
- drag handle slot must match prototype right-edge lane behavior
- disclosure slot must match prototype disclosure behavior
- parent/child control rails must align from shared measured geometry rules

Expected new or replacement production-owned primitives:

- `src/components/sidebar/SidebarToggleButton.tsx`
- `src/components/sidebar/SidebarMetricPill.tsx`
- `src/components/sidebar/SidebarMetaControls.tsx`
- `src/components/sidebar/SidebarSectionCard.tsx`
- `src/components/sidebar/SidebarInlineRow.tsx`
- `src/components/sidebar/SidebarPillPopover.tsx`
- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`

If naming differs, the responsibility split should still match this structure.

### Phase 2. Reset the top-level production sidebar composition

Replace the current composition in:

- `src/components/layout/RightSidebar.tsx`

Required production result:

- same pane order as prototype
- same preset-button placement and spacing logic
- same full-width Playground button placement
- same relationship between top-level pane shells and preset rows
- same shared pane-header alignment model

### Phase 3. Replace Facilities as the reference hierarchy

This is the most important replacement phase because it carries the prototype’s nested hierarchy rules.

Replace:

- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`

Required production result:

- `Facilities` becomes the top-level pane parent
- `PMC` becomes an internal parent section using the same production sidebar shell contract
- PMC children become row-shell items using the same production row contract
- Facilities parent visibility derives from immediate children only
- PMC parent visibility derives from its immediate row children only
- tri-state `Ox` must propagate upward through immediate-child aggregation
- local child toggles remain possible until the next parent change
- old `details` / `summary` / bespoke popover markup is removed

This phase is the decisive replacement of the current older production Facilities structure.

### Phase 4. Replace Basemap, Labels, and Overlays onto the same shell

Replace:

- `src/features/basemap/BasemapPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

Required production result:

- same pane shell
- same top-level `On/Off`
- same disclosure and drag-handle slot rules
- same control-rail alignment rules
- same pill-triggered popover behavior
- same row shell behavior
- same popover section-title model
- same production-owned tri-state toggle behavior wherever parent-child hierarchy exists

These panes should not preserve old parallel markup patterns once Facilities/PMC has established the new shell.

### Phase 5. Replace old visibility and hierarchy logic in the store-facing layer

Production store work should remain in:

- `src/store/appStore.ts`

Required production logic:

- parent visibility helpers should aggregate from immediate children only
- tri-state should be explicit, not inferred ad hoc in JSX
- pane-level and section-level broadcast behavior should be intentional and reusable
- future pane families should be able to plug into the same immediate-child visibility model

If needed, add shared non-presentational helpers under:

- `src/lib/sidebar/`

Examples:

- visibility aggregation helpers
- tri-state toggle derivation helpers
- sidebar row state helpers
- swatch/pill presentation helpers that are not purely visual

## Production Elements To Retire

The following current production patterns should be explicitly retired during promotion:

- pane-local `details` / `summary` disclosure structures in `PmcPanel.tsx`
- pane-local direct `sidebar-toggle-button` markup duplicated inside feature files
- pane-local direct `sidebar-disclosure-button` markup duplicated inside feature files
- feature-local color-popover summary/panel structures that bypass the shared pill-popover shell
- feature-local parent/child visibility logic embedded directly in JSX callbacks
- old Facilities container structure in `SelectionPanel.tsx`

Do not preserve these in parallel once the replacement path is complete.

## Production CSS / Token Promotion Rules

Promotion must not copy `prototype.css` wholesale.

Instead:

1. identify the approved shared values and rules from prototype
2. re-express them in production-owned tokens and selectors in `src/styles/global.css`
3. keep feature-local exceptions only where they are genuinely feature-owned

Must be promoted intentionally:

- pane header height parity rules
- measured handle/disclosure/toggle alignment rules
- compact control typography
- mixed-state toggle colour treatment
- pill/swatch geometry
- popover title sizing
- drag-handle lane sizing

## Store / Logic Promotion Rules

Promotion must not rebuild the prototype’s local state model in production.

Instead:

- keep production truth in `src/store/appStore.ts`
- rebuild the approved prototype behavior on top of production actions/selectors
- add shared helpers where behavior becomes cross-pane

Especially important:

- immediate-child visibility aggregation
- tri-state parent logic
- pane-level broadcast logic
- PMC/global-to-child behavior

## Success Criteria For Complete Promotion

Promotion is successful only when:

1. production sidebar top-level panes visually match the prototype
2. production pane headers and row-end controls follow the same alignment and spacing model as the prototype
3. production toggles support `On`, `Off`, and `Ox` where hierarchy requires it
4. parent visibility derives from immediate children only
5. Facilities/PMC reproduces the prototype nested behavior exactly
6. old production-only pane-local disclosure/popover/toggle patterns have been removed
7. production uses production-owned shared sidebar primitives, not prototype imports
8. production still passes:
   - `npm run typecheck`
   - `npm run build`
   - any pane-specific tests added during promotion

## Recommended Execution Order

The recommended execution order is now:

1. reset shared production sidebar primitives in `src/components/sidebar/`
2. reset `src/components/layout/RightSidebar.tsx`
3. replace `src/features/facilities/SelectionPanel.tsx` and `src/features/groups/PmcPanel.tsx`
4. replace `src/features/basemap/BasemapPanel.tsx`
5. replace `src/features/labels/LabelPanel.tsx`
6. replace `src/features/groups/OverlayPanel.tsx`
7. clean out any remaining obsolete sidebar markup patterns

This order is preferred because Facilities/PMC now carries the core hierarchy logic that the other panes need to follow.

## Final Rule

Do not treat this promotion as incremental styling polish on top of the current production sidebar.

Treat it as a controlled production-side replacement of the current sidebar shell and pane structures using the approved prototype as the exact contract.
