# Sidebar Production Reset Plan

This note is historical reset rationale.

The canonical current handover path is now:

1. `docs/agent-handover.md`
2. `docs/sidebar-pane-status.md`
3. `docs/prototype-to-production-playbook.md`
4. `docs/agent-continuation-protocol.md`
5. `docs/sidebar-parity-bugs.md`

Use this file when the reset reasoning itself is needed.

## Bottom line

The current incremental promotion approach is not the right implementation strategy for this repo.

The approved sidebar prototype should be treated as the target production UI:

- visually
- interaction-wise
- structurally

But the production app should remain the real application shell.

So the recommended direction is:

- keep the prototype as the approved UI reference
- keep the production app as the runtime/data/store source of truth
- rebuild the production sidebar as a production implementation of the prototype architecture

Do **not** continue trying to morph the old production sidebar into the prototype in small ad hoc steps.

Do **not** move production map/runtime logic into `src/prototypes/` and turn the prototype into the shipped app.

## Current conclusion after the failed parity passes

The repo has now proved the failure mode clearly:

- the incremental shared-shell work improved the sidebar
- but it did not achieve exact parity
- the remaining drift is still obvious in the smallest shared UI primitives
- confidence has been lost in the “keep tightening the existing production sidebar” path

So the next step should not be another parity pass.

It should be a controlled production-side replacement of the sidebar UI layer.

## Why the current approach is failing

### 1. The prototype is a different UI architecture, not just a new skin

The prototype changes all of these at once:

- pane shell structure
- collapse/expand behavior
- header rail structure
- row shell structure
- right-edge meta slot
- pill-triggered floating popover model
- spacing rhythm and control proportions

That means the work is not a styling pass. It is a sidebar architecture replacement.

### 2. The old production sidebar still leaks through

Even after several changes, the production sidebar still carries older assumptions:

- legacy panel/body wrappers
- pane-local expansion logic
- pane-local spacing decisions
- older popover assumptions
- mixed generations of layout classes

That leads directly to the “almost right but still wrong” problem:

- spacing bugs
- collapsed-state inconsistencies
- mismatched rail geometry
- popovers that look close but do not behave exactly like the prototype

### 3. Incremental pane-by-pane approximation is too lossy for this target

Incremental promotion works when the prototype is inspiration.

It does not work well when the prototype is the approved replacement.

In this repo, “promote one slice at a time” has been useful as a migration guardrail, but not as a justification for preserving the old sidebar architecture underneath.

The shared sidebar shell itself now needs a reset.

### 4. The prototype and production app solve different problems

The prototype is strong at:

- approved visual language
- approved interaction model
- approved component structure

The production app is strong at:

- real store contracts
- real map/runtime wiring
- real datasets
- saved-state schemas
- deployment/build path

The clean implementation strategy is to combine those strengths, not to force one codepath to become the other.

## Recommendation on direction

### Recommended

Rebuild the production sidebar as a production implementation of the prototype architecture.

This means:

- the prototype acts as the spec/reference
- production components are rewritten to match it more literally
- real production state stays in `src/store/appStore.ts`
- real map/runtime logic stays in production feature and map modules

### Not recommended

Move production map logic into the prototype and “graduate” the prototype into the app.

Why not:

- the prototype was built as a local-state-first exploration shell
- it is not the long-term production source of truth
- it should remain a safe reference space for future interaction iteration
- turning it into the real app would blur the repo’s production/prototype boundary in the wrong direction

So the answer is:

- **No**, it is not better to add the map logic to the prototype and ship that.
- **Yes**, it is better to rebuild the production sidebar directly from the prototype architecture.

## What the prototype is actually specifying

The prototype gives production a clear UI contract.

### A. Pane shell

Each pane has:

- a compact header rail
- title at left
- global toggle and disclosure at right
- body rendered only when open

### B. Row shell

Each row has:

- left-aligned label/title
- right-aligned control rail
- optional trailing slot
- consistent rail height and proportions

### C. Popover/callout system

Each row uses:

- pill-triggered editing
- floating callout
- sectioned field groups
- consistent pointer/placement behavior

### D. Feature-owned definitions

The prototype also shows that panes should be driven by structured field definitions, not copied JSX blocks.

That means:

- shared shells in shared production component space
- field definitions owned by each feature
- store/domain logic outside presentation files

## Production reset strategy

### 1. Stop incremental visual tweaking of the old shell

Do not continue trying to fix parity with padding-only or pane-local tweaks.

Those changes are too fragile because the underlying shell is still wrong.

### 2. Freeze the target

Treat the prototype as the exact target for:

- pane framing
- control rail layout
- popover behavior
- row proportions
- spacing rhythm

Production should aim for parity, not for “close enough”.

### 3. Replace the shared production sidebar architecture first

Before more pane-specific polishing, the production app needs a stable shared sidebar kit built as a direct production reimplementation of the prototype roles.

Recommended shared production primitives:

- `SidebarPane`
- `SidebarPaneHeader`
- `SidebarPaneBody`
- `SidebarRow`
- `SidebarMetaRail`
- `SidebarToggle`
- `SidebarMetricPill`
- `SidebarPopover`
- `SidebarFieldRenderer`
- `SidebarTrailingSlot`

The exact file names can vary, but the responsibilities should map closely to the prototype roles.

### 4. Treat the current production sidebar primitives as legacy candidates

Do not keep iterating on the current mixed sidebar path as if it were the final structure.

Treat these current production files as legacy candidates to be replaced or heavily rewritten:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarToggleButton.tsx`
- `src/components/sidebar/SidebarMetricPill.tsx`
- `src/components/sidebar/SidebarPillPopover.tsx`
- `src/components/sidebar/SidebarPopover.tsx`
- `src/components/sidebar/SidebarTrailingSlot.tsx`
- the current sidebar-specific parts of `src/styles/global.css`

This does not mean all code must be deleted first.

It means the next implementation should assume these files are provisional and may be replaced rather than preserved.

### 5. Centralize expansion/collapse behavior in the shared shell

Pane open/closed behavior should not be reimplemented independently inside each pane.

The pane shell should own:

- whether body is mounted
- header/body spacing contract
- disclosure behavior

### 6. Keep feature panes thin

Feature panes should mainly answer:

- which rows exist
- what fields each row exposes
- which production store actions/state they map to

They should not define their own layout system.

### 7. Rebuild panes in a cleaner order

Recommended implementation order for the reset:

1. Basemap
2. Labels
3. Overlays
4. Facilities / PMC

Why this order:

- Basemap is structurally simple and shows the shell clearly
- Labels is already partly promoted but should be rebuilt on the new shell, not patched further
- Overlays then follows the same shell
- Facilities / PMC is the highest-complexity pane and should come last

## Concrete replacement plan

This is the recommended production-side cutover sequence.

### Phase 1. Create a new production sidebar kit in parallel

Create a new production-owned sidebar layer instead of continuing to evolve the current one in place.

Suggested destination:

- `src/components/sidebar2/` or `src/components/sidebar/replacement/`

Suggested files:

- `SidebarPane.tsx`
- `SidebarPaneHeader.tsx`
- `SidebarPaneBody.tsx`
- `SidebarRow.tsx`
- `SidebarMetaRail.tsx`
- `SidebarToggle.tsx`
- `SidebarMetricPill.tsx`
- `SidebarCallout.tsx`
- `SidebarFieldRenderer.tsx`
- `SidebarTrailingSlot.tsx`

These should be implemented as production-owned equivalents of the prototype, not wrappers around the current production primitives.

### Phase 2. Build exact production equivalents of the prototype primitives first

Before wiring real pane content, get exact parity on the smallest shared pieces:

- toggle placement and typography
- pill width and swatch rendering
- disclosure chevron geometry
- trailing handle geometry
- popover/callout attachment and pointer overlap
- pane header rail height
- row rail height and spacing

Do this from the prototype outward:

- structure first
- token values second
- interaction/attachment behavior third

### Phase 3. Rebuild the production pane composition on the new shell

Replace the top-level production composition in:

- `src/components/layout/RightSidebar.tsx`

The new `RightSidebar` should:

- keep the current production pane order
- keep the current production preset buttons
- keep the current production store wiring
- but render only through the new replacement sidebar kit

No pane should continue using the older shell once cut over.

### Phase 4. Rebuild each pane against the new shell

Pane order:

1. Basemap
2. Labels
3. Overlays
4. Facilities / PMC

For each pane:

- copy the prototype structure exactly into production-owned files
- wire the row/field definitions to production store state
- keep pane-specific definitions feature-owned
- do not preserve old pane-local markup just because it already exists

### Phase 5. Remove the old sidebar path

Once all panes are cut over and parity is verified:

- delete or archive the old shared sidebar primitives
- remove legacy sidebar CSS that only existed for the old shell
- update docs to make the new sidebar the production baseline

## What should stay from the current production app

Do not rebuild these from the prototype.

These are still the production source of truth:

- `src/store/appStore.ts`
- `src/features/map/MapWorkspace.tsx`
- map helper modules under `src/features/map/`
- typed schemas under `src/lib/schemas/`
- production config under `src/lib/config/`
- `src/components/controls/SliderField.tsx`
- saved-view schemas/services
- scenario-workspace and runtime domain logic

In plain terms:

- prototype supplies the UI contract
- production supplies the real behavior

## What should not be preserved just because it already exists

Do not preserve these patterns during the replacement:

- old pane-local wrapper structure
- current approximate shared primitive geometry
- current approximate popover attachment behavior
- incremental spacing tweaks that only make the legacy shell slightly closer
- feature-specific layout logic living inside pane components
- mixed old/new sidebar CSS tokens without a direct prototype counterpart

## Concrete migration rules

1. Do not import from `src/prototypes/` into production.
2. Do not move prototype files wholesale into production.
3. Reimplement prototype structure deliberately in production paths.
4. Keep `SliderField.tsx` as the shared slider/numeric primitive.
5. Keep field definitions feature-owned.
6. Keep store/runtime wiring in production state and feature modules.
7. Treat visual parity as a requirement, not a nice-to-have.

## Acceptance gates for the replacement

The new production sidebar is acceptable only if all of these are true:

1. The shared primitives match the prototype before pane wiring is judged complete.
2. The production pane shell matches the prototype without relying on old wrapper geometry.
3. Row rails line up exactly enough that no visible drift remains in toggle, pill, chevron, or handle position.
4. Swatches and popovers look attached and proportioned like the prototype.
5. Production state still flows through `src/store/appStore.ts`.
6. `npm run typecheck` passes.
7. `npm run build` passes.
8. Shared non-trivial behavior has tests at the helper seam.

## Success criteria

The sidebar reset is working only if:

- the production sidebar visibly matches the approved prototype
- collapse/expand spacing is consistent
- the rail geometry matches across panes
- popovers behave like the prototype, not merely resemble it
- pane components mostly declare rows/fields instead of layout rules
- production build/typecheck stay green

## Stop conditions

Pause implementation if any of these occurs:

- pane-specific hacks start accumulating again
- shared sidebar components begin taking on feature-specific behavior
- parity depends on preserving old production wrappers

## Immediate next implementation step

Do not continue from the current mixed sidebar shell.

Next step:

1. Create the new replacement sidebar kit in parallel.
2. Rebuild the shared primitives there to exact prototype structure.
3. Cut `RightSidebar.tsx` over to that new kit only after the shared primitive parity check passes.
- the work drifts back toward “approximate prototype influence”

## Immediate next implementation move

Before more UI iteration:

1. treat this note as the working production strategy
2. reset the shared sidebar implementation around prototype-equivalent roles
3. rebuild Basemap first on that shell
4. then rebuild Labels again on that same shell

That is the cleanest path to prototype parity without making the prototype itself become the shipped application.
