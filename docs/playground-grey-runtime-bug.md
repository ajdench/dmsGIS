# Playground Grey Runtime Bug

## Status

- unresolved, but partially stabilized
- reproducible intermittently after Playground reassignment and later reload / re-entry
- observed both:
  - locally
  - on GitHub Pages

This is a runtime assignment/rendering bug, not a canonical geometry-source bug.

Related but separate note:

- a later Playground border bug was also found
- that border bug was caused by deriving live Region borders from dissolved polygons instead of shared topology arcs
- that border path has now been corrected separately and should not be confused with the grey-fill bug

## Short Summary

After editing ICB-to-Region relationships in Playground, some boards later render in the default grey fallback instead of their assigned Region colours.

The polygons still load.

The facility points can still keep their Region colours.

What fails is the board-fill Region mapping used by Playground runtime rendering.

## Main Symptom

Observed behaviour:

- user edits Region assignment in Playground
- on a later load, reload, or re-entry into Playground, some boards lose their assigned Region colour
- those boards render in fallback grey
- the failure is not always global; it can affect a subset of boards
- the same failure appears both:
  - on local dev servers
  - on GitHub Pages

The screenshot evidence is important:

- facility points still show Region colours
- the board polygons are present
- but the affected board-fill layer has dropped to neutral grey

That means the polygons themselves are not missing.

## What This Is Not

This bug should not currently be treated as:

- a BSC / canonical board-source failure
- a `Current` or `2026` polygon build failure
- a GitHub Pages deployment-only issue
- a browser-private-window-only issue
- a facility-point styling issue
- a duplicate board-id issue in the shipped scenario datasets

Why:

- the same problem appears locally and online
- the polygons still render
- the points can still keep Region identity when the fills fail
- static scenario geometry and static scenario fills are otherwise intact

## Why Grey Appears

The grey fill is the fallback style in:

- `src/features/map/boundaryLayerStyles.ts`

For board-fill layers, colour comes from a resolved Region group name. If that Region mapping is missing or not resolved in time, the style path falls back to:

- per-feature fill colour if present
- otherwise `layer.swatchColor`

In the failure state, Playground board fills are reaching that fallback path instead of a valid Region-group colour.

## Static Scenario Path Versus Playground Path

The important contrast is:

### Static scenario presets

Static scenario presets are comparatively simple.

They use shipped prebuilt products:

- a shipped board-assignment layer
- a shipped visible outline product
- a stable lookup source selected through the normal preset path

They do not need to rebuild assignment geometry from a live draft before colouring the board fills.

### Interactive Playground

Playground is more complex.

It uses:

- a workspace baseline from `src/lib/config/scenarioWorkspaces.ts`
- a live draft from the store
- a baseline assignment source
- runtime draft overrides
- a derived merged Region-outline source

Relevant files:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/lookupSources.ts`
- `src/features/map/derivedScenarioOutlineSource.ts`

So static scenarios mainly consume a prepared assignment product.

Playground rebuilds a draft-aware assignment source at runtime.

That extra runtime seam is where this bug lives.

## Confirmed Runtime Architecture

### Baseline catalog

Interactive Playground workspaces are declared in:

- `src/lib/config/scenarioWorkspaces.ts`

They use:

- `assignmentSource.kind = "interactive-runtime"`

That is the key distinction from static presets.

### Active live assignment source selection

The general live assignment source helper is:

- `src/features/map/lookupSources.ts`

`getActiveAssignmentLookupSource(...)` currently returns:

1. `regionFill` layer source if present
2. otherwise `careBoardBoundaries` source if present
3. otherwise the passed fallback source

That helper is reasonable for ordinary scenario rendering, but risky for Playground if the live visible source is not the exact baseline source that Playground should seed from.

### Playground runtime state builder

The runtime assignment builder is:

- `src/features/map/scenarioWorkspaceRuntime.ts`

`buildScenarioWorkspaceRuntimeState(...)`:

- clones the baseline assignment features
- applies draft overrides
- resolves a `scenario_region_id`
- rewrites `region_name` / `jmc_name`
- returns a runtime `assignmentSource`

If that function is fed the wrong baseline source, the output still looks structurally valid, but it can carry the wrong Region identity or no usable Region mapping for board-fill styling.

## Earlier Fix That Was Real But Incomplete

An earlier bug was already found and partially fixed:

- interactive workspaces were capturing whichever visible `regionFill` source happened to be live on initial render
- that produced a first-load grey fallback in parts of South East / London and East

That earlier fix is already reflected in:

- `docs/agent-handover.md`

The important clarification is:

- that fix was real
- but it was not the whole bug

The current intermittent grey-fill problem is a later / broader version of the same class of runtime-seeding problem.

## Most Likely Current Failure Seam

The most important live comparison point is in:

- `src/features/map/MapWorkspace.tsx`

This part of the runtime builds the Playground assignment baseline:

1. find preloaded workspace dataset source
2. find live assignment source from visible layers
3. resolve a baseline source
4. build draft-aware runtime assignment source from that baseline
5. derive outline source from the same runtime/baseline path

The risk here is:

- Playground should prefer its own preloaded baseline assignment dataset
- but the broader map runtime also has access to a live visible assignment source
- if the wrong source wins, the runtime board-fill layer can lose valid Region mapping

That is the class of seam most strongly implicated by the symptoms.

## Local Follow-up Patch Attempt

Local follow-up work was added to try to lock Playground onto the correct baseline path:

- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/MapWorkspace.tsx`
- `tests/scenarioWorkspaceRuntime.test.ts`

### What that follow-up changed

1. `resolveScenarioWorkspaceBaselineAssignmentSource(...)`

Added in:

- `src/features/map/scenarioWorkspaceRuntime.ts`

Intent:

- if the workspace baseline kind is `interactive-runtime`, wait for the dedicated preloaded baseline source
- do not seed from whichever visible live layer appears first

2. stale-region fallback protection

Also in:

- `src/features/map/scenarioWorkspaceRuntime.ts`

Intent:

- if a draft assignment contains an unknown or stale `scenario_region_id`, fall back to baseline Region resolution instead of letting the feature drift into unmapped state

3. `MapWorkspace.tsx` runtime source tightening

Added local follow-up in:

- `src/features/map/MapWorkspace.tsx`

Intent:

- for interactive Playground workspaces, use the resolved baseline assignment source directly
- do not reintroduce `liveAssignmentSource` as a nullish fallback in the later runtime build step

### Why that still appears incomplete

Even after those guards were added locally, the user still reported the bug.

So the current reading is:

- the earlier and local fixes addressed real seams
- but at least one more runtime seam still exists

## Later Dynamic Border Fix

A separate later fix corrected Playground Region-border derivation:

- `src/features/map/derivedScenarioOutlineSource.ts`
- `src/features/map/MapWorkspace.tsx`
- `tests/derivedScenarioOutlineSource.test.ts`

What changed:

- dynamic Playground Region borders now prefer the shipped `2026` topology-edge source
- same-Region internal arcs are filtered out before border features are emitted
- inter-Region arcs are duplicated per owning Region so selection/highlight can still resolve one Region at a time
- polygon dissolve remains only as a fallback when no topology-edge source is available

Why that matters:

- the previous polygon-dissolve shortcut could leave internal borders visible or broken
- the seam-first arc path is the architecturally intended model and should be treated as the preferred one going forward

## Strongest Current Hypothesis

The strongest current explanation is:

Playground board-fill rendering is still sometimes being built from a stale, wrong, or not-yet-ready assignment source during initialization or re-entry, even though other parts of the UI still carry enough Region context to colour facility points.

In plain terms:

- the map knows how to draw the polygons
- the app can still know Region identity elsewhere
- but the board-fill styling path loses the correct assignment source at some point in the runtime cycle

That would exactly produce:

- intact polygons
- intact facility-point colours
- grey board fills

## Secondary Suspects

If the main source-selection theory is not the whole answer, the next most likely suspects are:

1. stale ref persistence

- `scenarioWorkspaceBaselineAssignmentSourceRef.current`
- or related refs may persist across preset/workspace transitions longer than intended

2. layer-refresh timing

- the runtime source may be corrected
- but the rendered layer may not fully rebuild against the corrected source every time

3. partial state mismatch

- facility-point Region mapping and board-fill Region mapping do not currently use exactly the same runtime path
- that can leave one coloured correctly while the other falls back

4. derived-outline / assignment divergence

- outline generation and fill generation both depend on runtime assignment state
- if one rebuilds from the corrected source and the other from a stale source, visual mismatch is possible

## Why This Bug Matters

This is not a cosmetic edge case.

It affects trust in Playground.

The user can make a Region reassignment, reload, and see apparently random grey areas. That makes it impossible to know whether:

- the edit persisted
- the assignment is still valid
- the map is reading the right source

So this should be treated as a high-priority runtime correctness issue.

## Validation Already Performed

The following local checks have passed around this bug work:

- `npm run test -- --run tests/scenarioWorkspaceRuntime.test.ts tests/facilityPar.test.ts`
- `npm run build`

Important caution:

- passing tests and build are not enough here
- this bug is visual/runtime-state-sensitive
- the map can still look wrong while the suite is green

## Current Open State

At the time of writing:

- the bug remains unresolved
- local guard code exists
- that guard reduced plausible failure paths
- but it has not yet been proven sufficient in live use

This note should therefore be read as:

- confirmed symptom report
- confirmed architecture comparison
- narrowed root-cause theory
- not a closure note

## Recommended Next Debug Pass

The next pass should be instrument-first, not guess-first.

Specifically:

1. log the actual assignment source chosen when Playground enters or reloads

Need to capture:

- workspace id
- source kind
- source path identity if known
- feature count
- whether the chosen source is preloaded baseline, live `regionFill`, `careBoardBoundaries`, or fallback

2. log whether runtime assignment features carry valid:

- `scenario_region_id`
- `region_name`
- `jmc_name`

for a few boards that later turn grey

3. compare the same board at the moment of failure across:

- board-fill feature props
- facility-point Region mapping
- selected-region / derived-outline source

4. clear any stale baseline/source refs explicitly on preset/workspace switch if they are found to persist beyond the intended lifecycle

5. do not push another “fix” to GitHub Pages until one live reproduction has been explained with instrumentation

Current local instrumentation path:

- `window.__dmsGISPlaygroundDiagnostics`
- `window.__dmsGISPlaygroundDiagnosticsHistory`

Those programmatic snapshots now capture:

- which source role Playground actually chose
- feature counts on each candidate source
- mapped versus unmapped feature counts
- invalid explicit `scenario_region_id` counts
- a small sample of unmapped boundary names

## Recovery Rule

Do not treat this as solved because:

- tests pass
- build passes
- one grey case disappears temporarily

Acceptance should require:

- repeated Playground edit/reload cycles
- no grey fallback boards
- same behaviour:
  - locally
  - on GitHub Pages
