# CLAUDE.md

Claude Code operating instructions for this repository.

This file complements the existing Codex handover bundle. It does not duplicate that content; it references it and adds Claude Code-specific working rules.

## Read Order

Before doing any work, read these in order:

1. `AGENTS.md` — project rules, scope split, current state
2. `README.md` — stack, commands, document index, production focus

Optional extended reading:

- `docs/specification.md` — feature and behavior specification
- `docs/internal-architecture-principles.md` — working rules that guide development
- `docs/production-versions.md` — version tracking and release history

## App Focus

This repo is primarily the React + TypeScript + Vite frontend application with OpenLayers for geospatial visualization. All source code is in `src/`.

## Commands

```bash
npm install
npm run dev          # local dev server
npm run build        # RELEASE GATE — must be green before describing the app as deployable
npm run typecheck    # useful fast signal, not a substitute for build
npm run test         # vitest unit tests
npm run test:e2e     # playwright end-to-end tests
npm run lint         # eslint
```

`npm run build` is the authoritative health check. The repo has a historical lesson where test and typecheck were green while build was red. Always run build as the final gate.

## Version Control

This repo is a colocated Git/JJ (Jujutsu) repository. Both `git` and `jj` commands work.

- Use `jj` for local checkpointing after each logical change.
- The local JJ bookmark `main` tracks `main@origin`.
- Only use `git` for user-requested commit/push flows.
- Do not amend existing commits unless explicitly asked.
- Update canonical docs before any Git-facing commit flow.

## Working Pattern

- For non-trivial changes, do a short findings-and-approach pass before implementation: confirm the problem, likely cause, and intended corrective pattern.
- Prefer replacing a weak pattern with a clearer one over layering local tweaks onto brittle code.
- Keep clarification questions minimal. If more than three are needed, ask them one at a time in dependency order.

## Architecture Quick Reference

### Production spine

- Zustand app store: `src/store/appStore.ts`
- Typed schemas: `src/lib/schemas/`
- Shared config: `src/lib/config/`
- Map/runtime seams: `src/features/map/`
- Global CSS tokens: `src/styles/global.css`

### Active sidebar path (exact-shell)

The production sidebar uses the exact-shell replacement path, not the older provisional sidebar:

- Shell: `src/components/layout/RightSidebar.tsx`
- Shared exact kit: `src/components/sidebarExact/`
- Sidebar domain logic: `src/lib/sidebar/` (contracts, reorder, visibility tree)
- Exact CSS: `src/styles/sidebarExact.css`
- Exact panes:
  - `src/features/basemap/BasemapPanelExact.tsx`
  - `src/features/facilities/SelectionPanelExact.tsx`
  - `src/features/labels/LabelPanelExact.tsx`
  - `src/features/groups/OverlayPanelExact.tsx`
- Field definitions:
  - `src/features/basemap/basemapPanelFields.ts`
  - `src/features/groups/pmcPanelFields.ts`
  - `src/features/labels/labelPanelFields.ts`
  - `src/features/groups/overlayPanelFields.ts`

### Legacy sidebar (do not use for new work)

These exist in the repo but are provisional/legacy:

- `src/components/sidebar/`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`

### Prototype (reference only, not importable)

The approved prototype lives under `src/prototypes/sidebarPrototype/`. It is the visual and interaction target for the production sidebar, but prototype code must never be imported into production. Production must own its own equivalent implementations.

### Map runtime modules

The map modularization is substantially complete. Key seams:

- `src/features/map/MapWorkspace.tsx` — map shell
- `src/features/map/facilityLayerStyles.ts` — point styling
- `src/features/map/pointSelection.ts` — point click handling
- `src/features/map/boundarySelection.ts` — boundary click handling
- `src/features/map/singleClickSelection.ts` — unified click orchestration
- `src/features/map/selectionHighlights.ts` — highlight sync
- `src/features/map/tooltipController.ts` — docked tooltip
- `src/features/map/scenarioWorkspaceRuntime.ts` — draft-aware scenario source
- `src/features/map/derivedScenarioOutlineSource.ts` — Turf dissolve outlines
- `src/features/map/runtimeLayerReconciliation.ts` — layer reconciliation
- `src/features/map/overlayBoundaryReconciliation.ts` — overlay reconciliation
- `src/features/map/boundaryLayerStyles.ts` — boundary-layer styling
- `src/features/map/lookupSources.ts` — lookup-source selection
- `src/features/map/mapStyleUtils.ts` — shared point-symbol/color helpers
- `src/features/map/mapWorkspaceLifecycle.ts` — map shell setup/teardown
- `src/features/map/overlayLookupBootstrap.ts` — overlay lookup bootstrapping
- `src/features/map/viewportSync.ts` — viewport apply/read sync

### Scenario/workspace foundations

Editable scenario infrastructure is in place but the Playground UI is future work:

- `src/lib/config/boundarySystems.ts`
- `src/lib/config/scenarioWorkspaces.ts`
- `src/lib/scenarioWorkspaceAssignments.ts`
- `src/lib/scenarioWorkspaceDerived.ts`
- `src/lib/scenarioWorkspaceSummaries.ts`

### Saved views

- Domain contracts: `src/lib/schemas/savedViews.ts` and `src/lib/savedViews.ts`
- Local browser store: `src/lib/services/savedViewStore.ts`
- Action helpers: `src/lib/browser/savedViewActions.ts`
- Dialog: `src/components/layout/SavedViewsDialog.tsx`
- Currently local-only and unauthenticated; remote storage is future work.

## Rules

1. Use React + TypeScript + Vite.
2. Use OpenLayers as the primary mapping engine.
3. Keep the frontend GitHub Pages compatible.
4. Use TypeScript everywhere in app code.
5. Prefer small files and focused functions.
6. Do not put business logic inside presentation components.
7. Centralize schemas in `src/lib/schemas/`.
8. Add or update tests for non-trivial logic.
9. Keep geospatial preprocessing out of runtime where possible.
10. Do not embed secrets in frontend code.
11. Do not collapse typed models into `any`.
12. Do not bypass schemas when reading or writing persisted configs.
13. Do not import from `src/prototypes/` into production code.
14. Keep production and prototype as separate codepaths.

## Sidebar Replacement Strategy

The repo learned the hard way that incremental approximation of the old production sidebar was too lossy. The current strategy is controlled production-side replacement using exact equivalents of the approved prototype.

Key rules:

- If an issue appears across multiple panes, fix the shared exact-shell first, not individual panes.
- Use measured rendered geometry for alignment, not inferred CSS reasoning.
- Extend real production state contracts when prototype behavior demands it; do not fake local behavior while broadcasting globally.
- Keep feature-owned field definitions near the feature, not in the shared shell.
- Record deferred parity bugs in `docs/sidebar-parity-bugs.md` rather than leaving them in thread history.

See `docs/prototype-to-production-playbook.md` for the full execution playbook.

## Known Deferred Issues

One explicitly deferred parity bug: parent-control alignment drift in Basemap, Labels, and Overlays panes relative to the Facilities baseline. Do not patch this opportunistically; it should be a dedicated fix. See `docs/sidebar-parity-bugs.md`.

## End-Of-Session Protocol

Before stopping after non-trivial work:

1. Checkpoint with `jj`.
2. Update `docs/sidebar-pane-status.md` if live pane truth changed.
3. Update `docs/sidebar-parity-bugs.md` if a bug is deferred.
4. Update `docs/agent-handover.md` if the strategic picture changed.
5. Update `docs/agent-continuation-protocol.md` if the working method changed.
6. Update `README.md` or `AGENTS.md` if their routing/index information needs alignment.

If stopping mid-task, leave a restart note with: objective, current state, files changed, what is validated, remaining blockers, immediate next step.

## Documentation Categories

Do not mix these into a single document:

- **Stable principles**: `AGENTS.md`, `docs/prototype-to-production-playbook.md`, `docs/agent-continuation-protocol.md`
- **Current truth**: `docs/agent-handover.md`, `docs/sidebar-pane-status.md`
- **Deferred defects**: `docs/sidebar-parity-bugs.md`
- **Historical rationale**: `docs/sidebar-production-reset-plan.md`, `docs/sidebar-thread-reactivation.md`

## Quick Start Prompt

For a new Claude Code session, this prompt should re-establish the correct working frame:

> Read `CLAUDE.md`, `AGENTS.md`, `README.md`, and `docs/agent-handover.md` first. Continue from the live production exact-sidebar path, not the older provisional sidebar path. Update canonical docs and checkpoint with `jj` after each logical change.

## Deployment

- Target: GitHub Pages at `https://ajdench.github.io/dmsGIS/`
- Vite `base` defaults to `/dmsGIS/`, overridable via `VITE_BASE_PATH`.
- Direction is static-first and container-friendly: compiled static assets servable from a minimal Docker image.
