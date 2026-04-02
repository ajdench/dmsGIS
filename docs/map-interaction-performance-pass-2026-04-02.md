# Map Interaction Performance Pass

Date:

- `2026-04-02`

Repo:

- `/Users/andrew/Projects/dmsGIS`

## Scope

This pass focused on interaction-time work after the earlier startup/bundle improvements.

The target seams were:

- point hit detection
- overlapping-point cluster expansion
- boundary lookup by coordinate
- scenario-assignment lookup by coordinate

## Findings

The main interaction-time cost was not one catastrophic hotspot. It was a cluster of repeated scan-based lookups and repeated per-feature recomputation in the click path.

### 1. Boundary and assignment coordinate lookups were still scan-based

Before this pass:

- `src/features/map/boundarySelection.ts`
- `src/features/map/scenarioAssignmentAuthority.ts`

were still using raw `source.getFeatures().find(...intersectsCoordinate(...))` in the coordinate lookup path.

Practical cost:

- each lookup walked the full feature array
- the same pattern could be hit multiple times in one user interaction:
  - point selection
  - boundary fallback selection
  - tooltip Region identity

### 2. Point selection rebuilt facility/filter/presentation state more than once per feature

Before this pass:

- `src/features/map/pointSelection.ts`

was repeating the same work inside one click flow:

- resolve effective facility record
- apply facility filters
- check default visibility and region visibility
- resolve point presentation
- compute rendered hit radius

That helper split was readable, but it meant the same feature could pass through the same calculation more than once in one selection cycle.

### 3. Overlap-cluster expansion scanned all point features in visible point layers

Before this pass:

- cluster expansion walked `source.getFeatures()` for each visible point layer

Practical cost:

- the overlap algorithm only needs nearby candidates on the current view
- scanning the whole source was broader than necessary

## Changes Landed

### 1. Spatial-index lookup seam

New helper:

- `src/features/map/featureSpatialLookup.ts`

What changed:

- coordinate-to-feature lookup now routes through `VectorSource.forEachFeatureIntersectingExtent(...)`
- the lookup still confirms `intersectsCoordinate(...)`, so behavior stays precise

Consumers updated:

- `src/features/map/scenarioAssignmentAuthority.ts`
- `src/features/map/boundarySelection.ts`

Practical effect:

- coordinate lookups no longer need to linearly scan every feature in the source array first
- future lookup optimization now has one clearer seam

### 2. Single-pass point candidate building

Updated:

- `src/features/map/pointSelection.ts`

What changed:

- point-hit evaluation now builds one candidate object per feature in the direct-hit path
- that one candidate now owns:
  - effective facility record / filter pass
  - default visibility / region visibility gating
  - rendered pixel position
  - rendered hit radius

Practical effect:

- less repeated per-feature work inside one click
- the direct-hit and overlap-cluster paths now lean on the same candidate contract

### 3. View-bounded overlap candidate sweep

Updated:

- `src/features/map/pointSelection.ts`

What changed:

- overlap-cluster candidate collection now iterates features in the current view extent first
- full-source fallback remains only if no map size is available

Practical effect:

- the overlap pass is now closer to the real user-visible problem space
- large off-screen point sets no longer inflate the normal cluster-expansion sweep

## Validation

Completed in this pass:

- `npm test -- --run tests/featureSpatialLookup.test.ts tests/pointSelection.test.ts tests/boundarySelection.test.ts tests/scenarioAssignmentAuthority.test.ts tests/ScenarioPlaygroundPane.test.ts`
- `npm run typecheck`
- `npm run build`

## Remaining Likely Hotspots

These are the next reasonable candidates if another interaction-speed pass is wanted.

### 1. Repeated tooltip identity lookups per entry

Current modules:

- `src/features/map/pointSelection.ts`
- `src/features/map/MapWorkspace.tsx`

Why it still matters:

- tooltip entries still resolve boundary/JMC identity per entry
- overlap clusters are usually small, so this is no longer the first target, but it is still repeated work

### 2. Boundary-layer ordering work inside coordinate lookup

Current module:

- `src/features/map/boundarySelection.ts`

Why it still matters:

- the overlay family order is still recomputed per call
- that is a small cost today because layer counts are low, but it is still not fully precomputed

### 3. Click-path setup churn

Current modules:

- `src/features/map/singleClickSelection.ts`
- `src/features/map/MapWorkspace.tsx`

Why it still matters:

- each click still rebuilds some small helper structures such as visible region maps and filter definitions
- these are much cheaper than the old full-source scans, so they should only be revisited if measurement says the interaction path still feels slow

## Recommendation

Treat this pass as the first interaction-speed cut, not the end of performance work.

The next sensible performance pass should:

1. measure the post-change click path in live use
2. only if still needed, target tooltip-entry identity lookups and light click-path setup churn
3. avoid introducing heavier indexing or cache invalidation complexity unless the current bounded seams still prove insufficient
