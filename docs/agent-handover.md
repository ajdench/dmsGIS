# Agent Handover

This is the canonical handover document for continuing development in this repository.

Use this document as the first read for any new Codex, Claude Code, or similar coding-agent session.

## Purpose

This handover exists to let a new coding agent resume work without re-deriving:

- project purpose
- current architecture
- current sidebar replacement state
- accepted working patterns
- next-step priorities
- validation and checkpoint discipline

This document is a stable operator-facing summary.

For detailed implementation status and execution rules, also read:

1. `docs/sidebar-pane-status.md`
2. `docs/prototype-to-production-playbook.md`
3. `docs/agent-continuation-protocol.md`

## Project Summary

This repository contains a static-first geospatial web app for UK facility mapping and saved map configurations.

The app is not a general-purpose GIS editor. It consumes prepared geospatial datasets and provides an operational UI for:

- map viewing
- facility grouping
- layer control
- label control
- scenario viewing and future scenario editing foundations
- saved map configurations
- export

## Stable Production Spine

The production source of truth remains:

- React + TypeScript + Vite
- OpenLayers map runtime
- Zustand app store in `src/store/appStore.ts`
- typed schemas in `src/lib/schemas/`
- shared config in `src/lib/config/`
- production map/runtime seams in `src/features/map/`

These should continue to be treated as the stable architectural spine.

## Sidebar Replacement Summary

The approved sidebar prototype under `src/prototypes/sidebarPrototype/` is the production sidebar target:

- visually
- interaction-wise
- structurally

The important conclusion from the earlier failed promotion work is:

- incremental approximation of the old production sidebar was the wrong strategy
- the correct strategy is controlled production-side replacement
- production and prototype must remain separate codepaths
- production-owned exact equivalents should replace the old sidebar shell and pane surfaces

The repo is now on that replacement path.

Current live production sidebar composition uses the exact-shell path:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebarExact/`
- `src/features/basemap/BasemapPanelExact.tsx`
- `src/features/facilities/SelectionPanelExact.tsx`
- `src/features/labels/LabelPanelExact.tsx`
- `src/features/groups/OverlayPanelExact.tsx`

The older shared sidebar path under `src/components/sidebar/` and the older pane surfaces still exist in the repo, but they should be treated as provisional or legacy unless explicitly reactivated.

## Current Architecture State

### Production map/runtime

The map/runtime modularization pass is substantially complete.

Important current production seams include:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `src/features/map/selectionHighlights.ts`
- `src/features/map/tooltipController.ts`
- `src/features/map/singleClickSelection.ts`
- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/derivedScenarioOutlineSource.ts`
- `src/features/map/scenarioFacilityMapping.ts`
- `src/features/map/scenarioFacilityMetrics.ts`

### Scenario/draft foundations

Editable scenario foundations are in place:

- boundary-system catalog: `src/lib/config/boundarySystems.ts`
- scenario-workspace catalog: `src/lib/config/scenarioWorkspaces.ts`
- boundary assignment helpers: `src/lib/scenarioWorkspaceAssignments.ts`
- derived workspace summaries: `src/lib/scenarioWorkspaceDerived.ts`
- combined scenario summaries: `src/lib/scenarioWorkspaceSummaries.ts`
- production draft/editor state: `src/store/appStore.ts`

### Sidebar exact kit

The current production-owned exact sidebar primitives live in:

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

Shared exact-shell CSS currently lives in:

- `src/styles/sidebarExact.css`

Global tokens and shared app tokens remain in:

- `src/styles/global.css`

## Current Validation State

At the time of this handover:

- `npm run typecheck` is passing
- `npm run build` is passing
- targeted tests for sidebar/runtime work are passing

Release gate:

- `npm run build`

Do not describe the app as healthy or releasable unless `npm run build` is green.

## What A New Agent Should Read First

Read in this order:

1. `AGENTS.md`
2. `README.md`
3. `docs/agent-handover.md`
4. `docs/sidebar-pane-status.md`
5. `docs/prototype-to-production-playbook.md`
6. `docs/agent-continuation-protocol.md`
7. `docs/sidebar-parity-bugs.md`

For outstanding product-level tasks (user-derived, not parity bugs):

8. `docs/project-todo.md`

Read these after that if the task touches sidebar history or prototype boundaries:

8. `docs/sidebar-production-reset-plan.md`
9. `docs/sidebar-thread-reactivation.md`
10. `src/prototypes/sidebarPrototype/PROMOTION.md`
11. `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
12. `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`

## Immediate Development Priorities

Use mission-command judgment within these priorities.

1. Keep the shipped production app stable.
2. Continue exact prototype-to-production sidebar replacement only through production-owned codepaths.
3. Prefer shared exact-shell improvements over pane-local hacks when the issue is structural.
4. Record deferred parity bugs explicitly instead of leaving them in thread history.
5. Keep future scenario/editable-workspace work behind the typed production domain/store seams.

## Known Remaining Sidebar Work Areas

See `docs/sidebar-pane-status.md` for the exact pane-by-pane inventory.

High-level remaining areas:

- deferred parent-rail alignment drift in Basemap, Labels, and Overlays
- remaining exact-parity polish where identified during live review
- continued cleanup/retirement of older sidebar paths once the exact path is fully settled
- any remaining map/runtime wiring needed for newer exact-sidebar controls

## Architecture Optimization Still Worth Doing

These are not all immediate tasks, but they are valid future cleanup/improvement targets.

1. Retire legacy sidebar paths once exact-shell parity is stable.
2. Reduce duplicated token/class bridging between exact-shell and earlier sidebar generations.
3. Keep store-facing UI contracts focused and typed so future sidebar work stays config-driven.
4. Keep saved-view snapshots aligned with any added style/runtime fields.
5. Continue to prefer measured rendered geometry over inferred CSS reasoning when alignment gets non-trivial.

## Handover Rule

When ending a non-trivial thread:

- checkpoint with `jj`
- update the relevant canonical docs
- update `docs/sidebar-pane-status.md` if pane truth changed
- update `docs/sidebar-parity-bugs.md` if a bug is deferred
- update `docs/agent-handover.md` and `docs/agent-continuation-protocol.md` if the strategy or handoff rules changed

This is the rule that should preserve seamless transfer between coding agents.
