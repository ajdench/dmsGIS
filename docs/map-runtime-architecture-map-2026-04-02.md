# Map Runtime Architecture Map

Date:

- `2026-04-02`

Repo:

- `/Users/andrew/Projects/dmsGIS`

Purpose:

- document the active map-runtime authority boundaries
- record the new authoritative Playground assignment seam
- give future optimisation work one clear dependency map instead of repeated source rediscovery

This is a current-state architecture note, not a historical review log.

## Executive Summary

The active map runtime now has one explicit scenario-assignment authority seam per render cycle:

- `src/features/map/playgroundRuntimeSession.ts`
  - composes the Playground baseline assignment source
  - builds the draft-aware runtime assignment source
  - builds the derived outline source
  - exposes runtime source overrides for `regionFill` and `scenarioOutline`
- `src/features/map/scenarioAssignmentAuthority.ts`
  - resolves the single authoritative assignment source for downstream consumers
  - resolves boundary-name and boundary-unit assignment maps from that same source
  - owns the shared feature-at-coordinate lookup seam for future indexing/caching work

That authority is now what downstream map consumers should read for:

- board-fill colouring
- selected Region-border redraw
- Playground popover defaults
- facility remapping in the map runtime
- tooltip Region identity
- PAR summaries derived from visible facility features

The important remaining split is intentional:

- store-only derived workspace summaries and bottom-card non-map totals still use draft assignment lookup objects, not OpenLayers sources
- that keeps non-map UI independent of OL geometry objects
- if future user-visible drift appears there, that seam should be revisited deliberately rather than by leaking map-source objects upward

## Primary Runtime Flow

### 1. Dataset bootstrap

Map shell initialization in:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/overlayLookupBootstrap.ts`

loads and retains:

- boundary-system interaction datasets
- JMC assignment lookup dataset
- scenario lookup/outlines datasets
- Playground/source-preset assignment datasets
- topology-edge dataset used for live derived Region outlines

### 2. Playground render-cycle runtime composition

Per relevant render pass, `MapWorkspace.tsx` calls:

- `buildPlaygroundRuntimeSession(...)`

That helper owns:

- baseline assignment source resolution
- draft-aware runtime assignment source creation
- derived outline source creation
- diagnostics snapshot creation
- runtime override map creation

### 3. Authoritative assignment resolution

Immediately after the runtime session is built, `MapWorkspace.tsx` now resolves:

- `buildScenarioAssignmentAuthority(...)`

That authority session returns:

- one authoritative assignment `VectorSource`
- one boundary-name assignment map
- one boundary-unit assignment map

The map runtime should treat that as the only assignment source for downstream consumers during that render cycle.

### 4. Downstream consumers

The authoritative assignment source now feeds:

- `reconcileOverlayBoundaryLayers(...)`
  - visible board fills / Region colouring
- `applyBoundarySelection(...)`
  - boundary selection and selected Region identity
- `resolveSingleClickSelection(...)`
  - point-first selection and tooltip-entry assembly
- `getStyleForLayer(...)`
  - facility styling/remapping
- `buildSelectedFacilityParSummary(...)`
  - visible-facility PAR summaries
- `renderDockedTooltip(...)` inputs from `MapWorkspace.tsx`
  - selected Region / facility detail display

## Active Module Boundaries

### Orchestration

- `src/features/map/MapWorkspace.tsx`
  - still the main runtime orchestrator
  - current size: `2283` lines
  - should remain orchestration-focused rather than regaining geometry/assignment logic

### Assignment-source composition

- `src/features/map/playgroundRuntimeSession.ts`
  - current size: `123` lines
  - owns render-cycle Playground source composition

- `src/features/map/scenarioWorkspaceRuntime.ts`
  - current size: `419` lines
  - owns draft-aware assignment-feature cloning and baseline-to-runtime assignment rewriting

- `src/features/map/scenarioAssignmentAuthority.ts`
  - new optimisation seam
  - owns:
    - authoritative source selection
    - assignment map derivation
    - coordinate-to-assignment feature lookup

### Selection and highlighting

- `src/features/map/boundarySelection.ts`
  - boundary selection, boundary-name resolution, selected Region identity

- `src/features/map/pointSelection.ts`
  - hit detection, overlap clustering, tooltip-entry assembly

- `src/features/map/selectionHighlights.ts`
  - selected boundary / selected Region overlay synchronization

### Facility remapping and summaries

- `src/features/map/scenarioFacilityMapping.ts`
  - effective facility Region remapping from the authoritative assignment source

- `src/features/map/facilityLayerStyles.ts`
  - point symbol styling using effective remapped facility state

- `src/features/map/facilityPar.ts`
  - selected visible-facility PAR summaries using the same assignment authority

## Intended Optimisation Boundaries

Future optimisation work should prefer these seams:

### First boundary: `scenarioAssignmentAuthority.ts`

If repeated `intersectsCoordinate(...)` lookups become a measurable hotspot, optimise there first.

Possible future work:

- source-local caching keyed by feature revision
- assignment lookup indexing
- extent prefiltering before geometry intersection
- shared memoized coordinate lookup helpers

Do not duplicate that logic separately inside:

- `pointSelection.ts`
- `scenarioFacilityMapping.ts`
- `facilityPar.ts`

### Second boundary: `playgroundRuntimeSession.ts`

If render-cycle source composition becomes hard to reason about or expensive:

- optimize or extract there
- keep baseline-source choice and runtime override composition together

Do not move that logic back into ad hoc `MapWorkspace.tsx` branches.

### Third boundary: point interaction seams

After assignment lookup is measured:

- `pointSelection.ts`
- `singleClickSelection.ts`
- `facilityLayerStyles.ts`

are the next best targets for interaction-time optimisation, especially on slower Windows browsers.

## Current Risks And Constraints

### Still concentrated orchestration

The biggest live concentration points remain:

- `src/features/map/MapWorkspace.tsx`
- `src/store/appStore.ts`

This note does not change that; it only reduces one brittle authority seam inside that orchestration.

### Store/runtime duality remains deliberate

There are still two valid assignment representations:

- map-runtime assignment source and maps
- store-side draft assignment lookup objects

That is acceptable as long as:

- map rendering/selection/styling reads the authoritative runtime seam
- non-map store/UI summaries only use the draft lookup path intentionally

### Acceptance coverage is still more important than more helpers

The new seam reduces drift, but live correctness still depends on:

- reload/re-entry checks
- multi-step Playground reassignment checks
- overlap-selection checks
- future browser/performance measurement

## Suggested Next Optimisation Order

1. Measure the authoritative assignment lookup seam under repeated point-selection and tooltip usage.
2. If needed, optimise `findScenarioAssignmentFeatureAtCoordinate(...)` before changing point-selection algorithms.
3. Add a live acceptance check for Playground re-entry/reload colouring before broadening runtime refactors again.
4. Continue extracting bounded orchestration helpers from `MapWorkspace.tsx` only where a real hotspot or authority seam remains.
