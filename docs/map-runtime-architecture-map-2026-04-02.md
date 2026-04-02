# Map Runtime Architecture Map

Date:

- `2026-04-02`

Repo:

- `/Users/andrew/Projects/dmsGIS`

Scope:

- active Playground Region-assignment authority
- runtime dependency flow
- optimization boundaries for future map-performance work

This note is a runtime architecture map, not a product baseline or a closure note.

## Purpose

The immediate goal of the latest Playground pass was to stop Region identity drifting across:

- board fills
- selected Region borders
- assignment popover defaults
- facility remapping
- tooltip Region identity
- visible-facility PAR summaries

The repo now has one active assignment-authority seam for those concerns.

This document records where that seam lives and where future optimization work should happen.

## Authoritative Playground Assignment Flow

### 1. Baseline/workspace config

Source:

- `src/lib/config/scenarioWorkspaces.ts`

Responsibilities:

- declares the interactive Playground workspaces
- defines the source preset for each Playground
- resolves the baseline assignment dataset path used to preload the workspace board-assignment source

### 2. Runtime session composition

Source:

- `src/features/map/playgroundRuntimeSession.ts`

Responsibilities:

- resolves the baseline assignment source for the active render cycle
- builds the draft-aware runtime assignment source
- builds the derived Region-outline source from the same assignment source
- exposes runtime source overrides for:
  - `regionFill`
  - `scenarioOutline`

This is the top-level Playground runtime composition seam.

### 3. Runtime assignment-source construction

Source:

- `src/features/map/scenarioWorkspaceRuntime.ts`

Responsibilities:

- clones the baseline assignment features
- applies draft overrides by `boundaryUnitId`
- rewrites `scenario_region_id`
- rewrites `region_name` / `jmc_name`
- returns:
  - runtime assignment source
  - assignment lookup by boundary name
  - assignment lookup by boundary unit id

This is the source of truth for draft-aware board-to-Region identity.

### 4. Active authority selection

Source:

- `src/features/map/scenarioAssignmentAuthority.ts`

Responsibilities:

- chooses one active assignment source per render cycle:
  - runtime assignment source first
  - live fallback assignment source second
- exposes shared lookup helpers:
  - assignment by boundary name
  - assignment by boundary unit id
  - coordinate-to-assignment lookup
- routes coordinate lookup through a dedicated spatial-index seam in `featureSpatialLookup.ts`

This is now the intended optimization seam for assignment lookup work.

### 5. Map orchestration

Source:

- `src/features/map/MapWorkspace.tsx`

Responsibilities:

- stores the active assignment authority in refs for the current map cycle
- passes the authoritative assignment source to downstream consumers
- uses the authoritative boundary-unit map for Playground popover defaults
- keeps board selection, tooltip identity, and selected Region highlighting aligned to the same active assignment authority

`MapWorkspace.tsx` is still orchestration-heavy, but it should no longer recreate separate Region-identity rules for Playground callers.

## Current Consumer Map

### Board fills

Consumer:

- `src/features/map/overlayBoundaryReconciliation.ts`

Authority path:

- `playgroundRuntimeSession -> runtimeSourceOverrides.regionFill`

### Selected Region borders

Consumers:

- `src/features/map/selectionHighlights.ts`
- `src/features/map/MapWorkspace.tsx`

Authority path:

- `playgroundRuntimeSession -> derivedOutlineSource`

### Assignment popover defaults

Consumers:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/ScenarioAssignmentPopover.tsx`

Authority path:

- `scenarioAssignmentAuthority.assignmentByBoundaryUnitId`

### Boundary selection identity

Consumer:

- `src/features/map/boundarySelection.ts`

Authority path:

- active assignment lookup by boundary name / boundary unit id
- coordinate lookup fallback from the same active assignment source

### Facility remapping and point styling

Consumers:

- `src/features/map/scenarioFacilityMapping.ts`
- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointPresentation.ts`

Authority path:

- active assignment source by coordinate intersection

### Tooltip Region identity and point selection

Consumers:

- `src/features/map/pointSelection.ts`
- `src/features/map/tooltipController.ts`
- `src/features/map/MapWorkspace.tsx`

Authority path:

- active assignment source by coordinate intersection
- active assignment lookup by boundary name for boundary-first selection paths

### Visible-facility PAR summaries

Consumers:

- `src/features/map/facilityPar.ts`
- `src/features/map/MapWorkspace.tsx`

Authority path:

- active assignment source by coordinate intersection

## What Is Still Separate On Purpose

The following state is still allowed to be separate from assignment-source authority:

- `scenarioWorkspaceEditor.selectedBoundaryUnitId`
- `scenarioWorkspaceEditor.selectedScenarioRegionId`
- `scenarioWorkspaceEditor.pendingScenarioRegionId`
- `selection.scenarioRegionId`
- `scenarioAssignmentPopover.selectedRegionId`

Reason:

- those fields are interaction state
- they determine what the user is editing or highlighting
- they should not redefine the authoritative board-to-Region assignment source

The rule is:

- interaction state may choose which Region is highlighted
- it must not choose a different underlying board assignment than the active assignment source

## Optimization Boundaries

Future optimization work should prefer these boundaries.

### Boundary 1. Assignment lookup

Primary module:

- `src/features/map/scenarioAssignmentAuthority.ts`

Why:

- repeated coordinate-to-assignment scans are now concentrated behind one seam
- the first scan-reduction pass now uses the vector source spatial index rather than raw full-array scans
- this is still the best place to add caching or a faster lookup structure later if live measurement says it is needed

### Boundary 2. Runtime session composition

Primary module:

- `src/features/map/playgroundRuntimeSession.ts`

Why:

- it already composes baseline source selection, runtime assignment source creation, derived outline creation, and override wiring
- it should stay the one place where Playground runtime source authority is assembled

### Boundary 3. Runtime assignment-source construction

Primary module:

- `src/features/map/scenarioWorkspaceRuntime.ts`

Why:

- this is where draft overrides are applied
- it is the right seam for further boundary-unit indexing or metadata precomputation

### Boundary 4. Point hit clustering

Primary module:

- `src/features/map/pointSelection.ts`

Why:

- direct-hit and overlap-cluster selection now share one candidate-building seam
- overlap candidate collection is now bounded to the current view extent
- if interaction still feels slow, this is the best next place to target tooltip-entry identity lookup reduction or light candidate caching

### Boundary 4. Facility remapping consumers

Primary modules:

- `src/features/map/scenarioFacilityMapping.ts`
- `src/features/map/facilityPar.ts`
- `src/features/map/pointSelection.ts`

Why:

- these modules are still the main callers doing repeated coordinate-to-assignment lookups
- they should be optimized by improving the shared authority seam, not by reintroducing local lookup logic

## Current Hotspots

The most likely next runtime hotspots are:

1. repeated `assignmentSource.getFeatures().find(...)` scans by coordinate intersection
2. repeated boundary-feature scans during point selection and tooltip refresh
3. repeated visible-point aggregation for tooltip/PAR recomputation

If a later performance pass is approved, start by measuring those three areas before adding more indexing complexity.

## Practical Working Rule

When a future change needs Playground Region identity:

- do not read raw feature props first
- do not add another ad hoc boundary-name map
- do not add a second coordinate-scan helper in a leaf consumer

Instead:

- route the change through `scenarioAssignmentAuthority.ts`
- keep `playgroundRuntimeSession.ts` as the runtime composition seam
- treat `scenarioWorkspaceRuntime.ts` as the only place that mutates baseline assignments into runtime assignments
