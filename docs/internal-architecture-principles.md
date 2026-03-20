# Internal Architecture Principles

This note records the internal architecture principles that should guide future development in this repository.

These principles are derived from reviewing both:

- the production app path under `src/`
- the isolated sidebar prototype path under `src/prototypes/sidebarPrototype/`

They are intended to be practical working rules for day-to-day development.

## Why this exists

The codebase now has two healthy but different ways of working:

- production work is strongest when domain contracts, map seams, store state, config, and validation are stabilized first
- prototype work is strongest when layout and interaction ideas can move quickly using local state and focused helper logic

This document turns those observations into explicit guidance so future work stays consistent.

## Current delivery stance

For the near term, improve the production app before expanding product breadth.

In plain terms:

- keep improving the app that actually ships
- treat future capability areas as planned directions, not immediate commitments
- keep prototype exploration alive, but do not let it displace production hardening unless promotion is explicit

## What we learned from each code path

### From the production app

The strongest recent production changes have shared a pattern:

- define or strengthen a typed contract first
- move behavior into a focused helper or domain module
- keep `MapWorkspace.tsx` and UI components more orchestration-focused
- add direct tests around the changed seam
- validate with `npm run build`

### From the prototype

The strongest prototype changes have shared a different pattern:

- use local-only state
- isolate visual and interaction experiments from production runtime concerns
- extract tricky interaction math into dedicated helpers
- define repeated UI structures from shared config instead of duplicated JSX
- keep prototype-only styling and assumptions out of production paths

## Core principles

### 1. Keep a stable production spine

Treat the following as the production spine:

- typed domain models
- schema validation
- persisted-state contracts
- production store state
- runtime map orchestration boundaries
- shared config tables and manifests

In plain terms:

- the app should have one trusted version of what the data means
- UI and map code should sit on top of that, not invent parallel meanings

### 2. Put meaning in domain modules, not in UI components

Presentation components should render and dispatch actions.

They should not be the place where we decide:

- what a filter means
- how scenario grouping works
- how saved-state payloads are structured
- how map selection resolves boundary or scenario identity

That logic should live in focused modules such as:

- `src/lib/`
- `src/lib/schemas/`
- extracted helpers under `src/features/`

### 3. Keep large components orchestration-focused

Large components should coordinate smaller modules rather than contain the full implementation themselves.

`MapWorkspace.tsx` is the model here:

- it should orchestrate
- helper modules should implement

A good extraction target is a block that has:

- one clear responsibility
- stable inputs and outputs
- behavior that can be tested without rendering the whole app

Do not keep extracting forever just because extraction is possible.
Stop when the parent component mostly reads as orchestration.

### 4. Prefer config and prepared data over runtime special cases

If behavior can be expressed as shared config or prepared data, prefer that over runtime branching.

Examples in this repo:

- view presets
- scenario assignments
- overlay family metadata
- layer manifests

In plain terms:

- if a future scenario, overlay family, or filter option can be added by updating config/data, that is better than adding another special-case runtime branch

### 5. Keep production and prototype intentionally separate

Prototype code is not failed production code.

Prototype code exists to answer questions like:

- does this interaction pattern feel right?
- is this layout clearer?
- should this control be a popover, pill, row editor, or accordion?

Production code exists to answer different questions:

- is the runtime state correct?
- is the build stable?
- does persistence behave consistently?
- can the feature be maintained safely?

Rules that follow from this:

- prototype files stay isolated until explicitly promoted
- production code should not depend on prototype-only components or styles
- prototype-local assumptions should not leak into the production store or OpenLayers runtime

### 6. Promote from prototype by pattern, not by copy

When a prototype idea is approved, do not copy the prototype wholesale into production.

Instead:

1. identify the approved pattern
2. restate it as a production requirement
3. rebuild it on top of production state, contracts, and styles
4. promote only the pieces that are truly shared and stable

This prevents prototype-local shortcuts from becoming production architecture.

### 7. Put persistence behind explicit versioned boundaries

Anything persisted or restored should go through:

- schemas
- versioned contracts
- a storage or service boundary

Never let UI code read or write ad hoc saved payloads directly.

In plain terms:

- if we save it, share it, restore it, or migrate it later, it needs a typed contract now

### 8. Prefer typed state objects over scattered scalar fields

When a feature grows beyond one trivial field, represent it as a typed object rather than a loose collection of scalars.

The facility filter model is the example:

- start with text search
- extend to region, type, and default visibility
- keep one shared filter state object
- let UI controls progressively expose that object

This avoids rewiring the app every time a new facet is added.

### 9. Extract non-trivial interaction math early

Both production and prototype code benefit when non-trivial interaction math is pulled out of components.

Use a dedicated helper or hook when behavior involves:

- viewport or coordinate math
- popover/callout placement
- overlap grouping
- selection/highlight synchronization
- multiple related condition branches

In plain terms:

- if the hard part is the behavior, not the JSX, that logic should not stay inline in a component

### 10. Promote shared primitives and tokens only when they are truly shared

Not every repeated-looking thing is a shared primitive yet.

Promote to shared code only when:

- the behavior is stable
- the naming is clear
- the production and prototype use the same concept for the same reason

This applies to:

- UI controls
- CSS tokens
- map helpers
- selector utilities

### 11. Optimize validation around actual release risk

The repo’s release gate is `npm run build`.

`test` and `typecheck` are important, but they are not substitutes for build validation.

Future development should assume:

- direct unit tests protect extracted logic
- targeted tests protect new state paths
- `build` protects the real deployable tree

### 12. Add tests at the seam where change is introduced

When a new responsibility is extracted or a contract is expanded, add tests close to that seam.

Examples:

- map helper extracted -> direct helper tests
- store contract extended -> store/session tests
- config behavior generalized -> selector/config tests
- prototype interaction math extracted -> direct helper tests

This keeps tests aligned with architecture rather than forcing everything through broad UI tests.

### 13. Prefer progressive promotion over broad rewrites

Future work should usually move in small steps:

- stabilize domain model
- wire store/runtime
- expose one production UI facet
- validate
- checkpoint

This has worked well in the repo and should remain the default approach.

## Decision rules for future work

Use these quick checks before building something:

### If the work is production-facing

- start from the domain or runtime contract first
- keep UI thin where possible
- avoid adding one-off branches when config/data can carry the behavior
- add focused tests where the behavior lives
- validate with `npm run build`

### If the work is prototype-facing

- keep it under `src/prototypes/`
- use local state unless explicit production coupling is part of the experiment
- keep prototype-only styles and controls local
- extract tricky interaction logic before the component becomes opaque
- document what is being tested so later promotion is intentional

### If a prototype idea is being promoted

- rewrite it against production seams
- do not import the prototype directly into production
- promote one approved pattern at a time
- update docs so the decision is visible

## Future functionality areas

These are areas of future functionality, not immediate commitments.

### Functional future areas

These are future user-facing capabilities:

- facility-filter usability and saved-filter behavior
- richer saved-view management and storage backends
- future overlay families such as NHS/custom regions
- export completion and polish
- authenticated identity/share behavior for saved views
- deliberate promotion of approved prototype interaction patterns

### Non-functional future areas

These are future quality, platform, and maintainability capabilities:

- build and release validation discipline
- broader workflow and interaction testing
- performance of map layers and large datasets
- deployment and containerization
- architecture consistency between production and prototype paths
- clearer prototype-to-production promotion rules

## Working rule going forward

For future development in this repository:

- improve the production app first
- keep future capability areas documented but separate from immediate delivery
- start from the domain contract first
- keep production and prototype separate unless promotion is explicit
- extract bounded responsibilities, not everything
- validate with `build`
- checkpoint each logical step
