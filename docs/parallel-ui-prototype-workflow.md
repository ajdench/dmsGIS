# Parallel UI Prototype Workflow

This note describes how to prototype sidebar and UI changes in parallel with the main app without destabilizing the production map workflow.

## Goal

Allow fast UI exploration in a separate surface while preserving:

- the current main app entry
- the OpenLayers map implementation
- current store behavior and map interaction state
- the ability to continue Codex CLI work on the main app in parallel

## Recommended approach

Use a separate prototype entry page and keep prototype code isolated from feature/runtime code until the design is approved.

Current example:

- prototype HTML entry: `sidebar-prototype.html`
- prototype React entry: `src/prototypes/sidebarPrototype/main.tsx`
- prototype UI app: `src/prototypes/sidebarPrototype/SidebarPrototypeApp.tsx`
- prototype seed data: `src/prototypes/sidebarPrototype/data.ts`
- prototype shared controls: `src/prototypes/sidebarPrototype/PrototypeControls.tsx`
- prototype accordion wrapper: `src/prototypes/sidebarPrototype/PrototypeAccordion.tsx`
- prototype styles: `src/prototypes/sidebarPrototype/prototype.css`
- prototype-local notes: `src/prototypes/sidebarPrototype/README.md`

Current sidebar-prototype interaction notes:

- pane and sub-pane expand/collapse behavior uses Radix accordion primitives
- PMC row style editing currently uses a custom floating callout tied to the row pill rather than a production-integrated store path
- floating callout placement math is extracted into a dedicated helper so geometry can be tested separately from rendering
- the floating PMC callout is prototype-only and is intentionally tuned for interaction review, not yet treated as a production component API

The main app entry remains:

- `index.html`
- `src/main.tsx`
- `src/app/App.tsx`

## Rules for safe parallel development

1. Do not wire prototypes into `src/app/App.tsx`.
2. Do not import prototype components into runtime feature components.
3. Do not connect prototypes to `useAppStore` unless the explicit goal is state-integration testing.
4. Use mock data inside `src/prototypes/` by default.
5. Keep prototype CSS scoped to the prototype folder unless a shared token truly belongs in `src/styles/global.css`.
6. Treat prototypes as disposable exploration code until a design is chosen.
7. Migrate approved patterns into reusable app components only after the prototype is signed off.

Strict development loop for this repo:

1. prove the interaction quickly
2. if the same area is touched again, extract surviving logic from JSX/CSS glue into helpers or hooks
3. name constants before adding more behavior on top
4. add focused tests for any non-trivial pure logic before describing the area as stable
5. update prototype-local docs and then checkpoint with `jj`

## Folder strategy

Keep prototype work under:

- `src/prototypes/<prototypeName>/`

Suggested contents:

- `main.tsx`
- `data.ts`
- `<PrototypeName>App.tsx`
- `PrototypeControls.tsx`
- `floatingCallout.ts` or equivalent extracted behavior helper when geometry/motion becomes non-trivial
- `PrototypeAccordion.tsx`
- `prototype.css`
- `README.md`

This makes it obvious which files are safe to iterate on aggressively and which files remain part of the production path.

## Build and dev strategy

Use Vite multi-page inputs so the prototype can be opened independently.

Current Vite config includes:

- `index.html` for the main app
- `sidebar-prototype.html` for the sidebar prototype

This allows:

- main app development without prototype coupling
- prototype development without loading OpenLayers
- production-style builds for both pages

Current caveat:

- this prototype workflow does not by itself guarantee a shippable tree
- use `npm run build`, not only `npm run test` or `npm run typecheck`, when validating that prototype-adjacent changes have not broken deployment

## How to work in parallel with Codex CLI

When asking Codex CLI to work on a prototype, give these instructions:

- make changes only under `src/prototypes/` and the dedicated prototype HTML entry unless explicitly told otherwise
- do not modify `src/app/App.tsx`, `src/main.tsx`, or map runtime code
- do not connect prototype controls to the production Zustand store
- prefer mock data and local component state
- keep visual language aligned with `src/styles/global.css`
- if the prototype has a local `README.md`, treat that as the operating note for the prototype
- if a shared primitive is needed, propose it first before moving code into production paths

Good Codex CLI request example:

> Build a nested accordion prototype for the right sidebar. Keep all changes isolated to `src/prototypes/sidebarPrototype/`, `sidebar-prototype.html`, and any required Vite multi-page config. Do not modify the production app entry or map code.

## Promotion path from prototype to production

Once the prototype is approved:

1. identify the stable UI primitives
2. extract those primitives into `src/components/`
3. keep feature logic in existing feature modules
4. migrate one panel at a time
5. verify no behavior regressions before removing prototype-only code

For this repo, likely candidates for promotion are:

- sidebar accordion primitives
- pane header/content wrappers
- sub-pane wrappers
- shared control row patterns
- shared toggle and metric-pill controls
- PMC row style-editor trigger and floating callout behavior, if approved
- fixed alignment/grid helpers for right-edge pane controls

## JJ and branch hygiene

Because this repo uses colocated Git and JJ:

- create a JJ checkpoint after each logical prototype milestone
- keep prototype commits separate from production refactors where possible
- if the working copy already contains unrelated user changes, avoid creating a checkpoint that would capture those changes without approval

If you need stronger isolation than folder-level separation, create a dedicated branch/bookmark for prototype work before promoting anything into the main app path.

## Decision boundary

Use the isolated prototype path when:

- interaction patterns are still being evaluated
- layout and information architecture are changing
- mock controls are sufficient
- map behavior is not required

Move into production code when:

- the pane model is agreed
- accessibility and keyboard behavior are understood
- the component API is stable enough to reuse
- integration with real app state is the next step

## Current limitation

`npm run test`, `npm run typecheck`, and `npm run build` are currently all passing.

Recent issue to remember:

- `src/features/map/tooltipController.ts`
  - a helper call path previously passed `VectorSource | null | undefined` into parameters typed as `VectorSource | undefined`
- `src/lib/savedViews.ts`
  - previously imported `FacilityFilterState` from `src/lib/facilityFilters.ts`, even though that module did not export the type

Implication:

- this repo recently had a documentation and validation gap where the fast signals were green but the release path was red
- the immediate blockers are fixed, but `npm run build` should still be treated as the authoritative health check before describing the tree as deployable
