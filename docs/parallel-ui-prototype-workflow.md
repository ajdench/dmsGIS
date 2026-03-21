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
- prototype popover field definitions: `src/prototypes/sidebarPrototype/popoverFields.tsx`
- prototype production-preparation note: `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`
- prototype promotion boundary note: `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
- prototype promotion plan: `src/prototypes/sidebarPrototype/PROMOTION.md`
- prototype restart note: `src/prototypes/sidebarPrototype/REACTIVATION.md`
- prototype style-state domain: `src/prototypes/sidebarPrototype/prototypeStyleState.ts`
- prototype sortable helper: `src/prototypes/sidebarPrototype/sortableList.ts`
- prototype styles: `src/prototypes/sidebarPrototype/prototype.css`
- prototype-local notes: `src/prototypes/sidebarPrototype/README.md`

Current sidebar-prototype interaction notes:

- pane and sub-pane expand/collapse behavior uses Radix accordion primitives
- repeated simple pane sections are config-driven from prototype seed data instead of hand-duplicated JSX
- PMC row style editing currently uses a custom floating callout tied to the row pill rather than a production-integrated store path
- PMC row reordering now uses a dedicated drag handle and `dnd-kit`, with reorder math extracted away from component event wiring
- sortable pane rows now share a common right-edge drag-handle slot; row-end affordances should stay aligned with the pill rail rather than being tuned per pane
- pane-level files should prefer shared row-shell components over hand-built row markup whenever the interaction contract is the same
- repeated field groups inside popovers should prefer config-driven section/field definitions over copied JSX once the control pattern stabilizes
- once shared row-shell behavior stabilizes, add focused interaction tests for toggle, pill, and drag-handle separation instead of relying only on visual review
- overlay rows are now modeled as a family surface that can later grow into grouped/collapsible sections instead of being treated as permanently flat
- floating callout placement math is extracted into a dedicated helper so geometry can be tested separately from rendering
- the floating PMC callout is prototype-only and is intentionally tuned for interaction review, not yet treated as a production component API
- preset button state tuning should remain prototype-local and tokenized in `prototype.css` until there is an explicit decision to promote it into shared production styling
- common pane-body spacing adjustments should prefer the shared top-level pane-content rule over one-off pane variants when the intent applies across Basemap, Facilities, Labels, and Overlays

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
6. Keep prototype-only typography and control tuning out of shared production CSS unless that promotion is explicitly intended.
7. Treat prototypes as disposable exploration code until a design is chosen.
8. Migrate approved patterns into reusable app components only after the prototype is signed off.

Strict development loop for this repo:

1. prove the interaction quickly
2. if the same area is touched again, extract surviving logic from JSX/CSS glue into helpers or hooks
3. name constants before adding more behavior on top
4. add focused tests for any non-trivial pure logic before describing the area as stable
5. update prototype-local docs and then checkpoint with `jj`

Before implementation on non-trivial prototype changes:

1. summarize the finding
2. summarize the likely cause
3. propose the corrective pattern
4. only then start coding

Clarification rule:

- ask only the questions needed to de-risk the change
- if more than three questions are needed, ask them one at a time in dependency order rather than as a large bundle
- prefer questions whose answers materially change the implementation path

Restart rule:

- each active prototype should keep a short restart/reactivation note in prototype space
- for the current sidebar prototype, use `src/prototypes/sidebarPrototype/REACTIVATION.md`
- the restart note should state read order, validation steps, current operating frame, and a suggested resume prompt

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
- shared sortable row shell plus drag-handle slot
- shared pill-triggered popover shell for compact style editors
- shared toggle and metric-pill controls
- shared prototype-to-production style-state domain helpers
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

Implication:

- this repo previously had a documentation and validation gap where the fast signals were green but the release path was red
- that immediate blocker is fixed, but `npm run build` should still be treated as the authoritative health check before describing the tree as deployable
