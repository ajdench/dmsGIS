# Recovery State — 2026-04-01

This note records the recovery state for the canonical repo at:

- `/Users/andrew/Projects/dmsGIS`

It exists to prevent further confusion between:

- the canonical production repo
- the separate iCloud checkout at `/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS`

## Canonical repo

The canonical working repo is:

- `/Users/andrew/Projects/dmsGIS`

The iCloud checkout is separate and should not be treated as the production source of truth:

- `/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS`

## What happened

Two separate clones of the same repo were temporarily swapped at the filesystem path level.

The important result after restore is:

- `/Users/andrew/Projects/dmsGIS` is back as the local main repo
- `/Users/andrew/Library/Mobile Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS` still exists as a separate checkout

No evidence was found that the main repo history itself was destroyed.

## Main repo recovery findings

The broken app state in `/Users/andrew/Projects/dmsGIS` was caused by multiple real runtime/layout faults, not by permanent repo loss.

### 1. Dev asset URL resolution was wrong

Several runtime loaders were constructing URLs under `/dmsGIS/data/...` in dev by using `import.meta.env.BASE_URL`.

In Vite dev, public assets are served from `/data/...`, not `/dmsGIS/data/...`.

That caused multiple GeoJSON fetches to receive the HTML app shell instead of JSON, which produced:

- `Unexpected token '<'`
- failed interaction-boundary loads
- failed scenario outline lookup loads
- partial startup / visually broken app state

Recovered by centralizing runtime asset URL resolution in:

- `src/lib/runtimeAssetUrls.ts`

and routing the affected loaders through it.

### 2. Boundary-system lookup bypassed runtime product rewriting

`MapWorkspace.tsx` was iterating the raw `BOUNDARY_SYSTEMS` constant, which kept some interaction-boundary requests on raw `data/regions/...` paths instead of the active accepted runtime family.

Recovered by switching that path to the resolved boundary-system helper instead of the raw constant entries.

### 3. Scenario workspace lookup paths were not runtime-rewritten

Scenario workspace baselines stored raw `lookupBoundaryPath` values instead of the active runtime-family paths.

Recovered by rewriting those baseline lookup paths through `resolveRuntimeMapProductPath(...)`.

### 4. Shell layout depended on missing `@apply` display transforms

The live page showed:

- `.app-shell` rendered as `display: block`
- `.workspace-grid` rendered as `display: block`

That made the map take full width and pushed the right sidebar below it.

Recovered by replacing layout-critical `@apply` usage with explicit CSS declarations for:

- `html, body, #root`
- `.app-shell`
- `.workspace-grid`
- `.sidebar`
- `.map-panel`
- `.panel`

### 5. Map canvas height inheritance was still broken after shell recovery

After the shell grid was restored, the map pane and sidebar matched again, but the OpenLayers viewport still rendered at `0px` height.

Observed live:

- `.map-panel` had the correct full pane height
- `.map-panel__inner` had collapsed to its fallback `min-height`
- `.ol-viewport` and `.ol-overlaycontainer-stopevent` were both `0px` high
- zoom controls existed, but the map content itself was not visible

Recovered by hardening explicit map container sizing for:

- `.map-panel__inner`
- `.map-canvas`
- `.map-canvas .ol-viewport`
- `.map-canvas .ol-overlaycontainer`
- `.map-canvas .ol-overlaycontainer-stopevent`

## Saved local line since the last GitHub commit

The last merged GitHub `main` commit is:

- `47c58fbb`

The preserved local feature/styling line that had existed above it was:

1. `75699754` `Keep combined and non-combined point diameters aligned`
2. `e3080e96` `Update split parent highlight test to current contract`
3. `65f14429` `Preserve PMC point presentation across preset switches`
4. `483453c8` `Set plain point size to combined-ring midpoint`
5. `5e3907ea` `Show PAR region summary for boundary selections`
6. `8aa36c2b` `Separate Aldershot Winchester and Bovington defaults`
7. `3e6aa1a9` `Style Royal Navy regionalize control with info blue`
8. `a89affaa` `Fix PMC point border defaults and outer border geometry`
9. `423ff0dc` `Move PMC point border and ring geometry outside fill`
10. `ca96a1ce` `Correct PMC outer border geometry to wrap outward`
11. `f51e69c2` `Make PMC point borders grow outward from outer edge`

The later main-repo recovery commits were:

12. `09c01391` `Recover main repo runtime asset loading and shell layout`
13. `48058e75` `Finish main repo recovery with map viewport height fix`

## Change summary by area

### PMC point rendering and sizing

The largest local change area is PMC point rendering.

Relevant commits:

- `75699754`
- `483453c8`
- `a89affaa`
- `423ff0dc`
- `ca96a1ce`
- `f51e69c2`

Main touched files:

- `src/features/map/mapStyleUtils.ts`
- `src/features/map/facilityLayerStyles.ts`
- `src/features/map/pointSelection.ts`
- `tests/mapStyleUtils.test.ts`
- `tests/facilityLayerStyles.test.ts`

Intent of those changes:

- keep non-combined point size aligned with the combined-practice ring contract
- move point border/ring geometry outside the fill
- refine default border behavior
- keep point hit-radius logic aligned with rendered point geometry

### Preset switching / facility presentation persistence

Relevant commit:

- `65f14429`

Main touched files:

- `src/store/appStore.ts`
- `tests/appStore.test.ts`
- `docs/agent-handover.md`

Intent:

- preset/workspace switching should clear transient selection state
- PMC point presentation state should persist across `Current`, `SJC JMC`, `COA 3a`, `COA 3b`, and Playground

### PAR header behavior for boundary selection

Relevant commit:

- `5e3907ea`

Main touched files:

- `src/features/map/facilityPar.ts`
- `src/features/map/MapWorkspace.tsx`
- `tests/facilityPar.test.ts`
- `tests/TopBar.test.ts`
- `docs/agent-handover.md`

Intent:

- when an `ICB / Health Board` is selected without an active facility point selection, show `Region`, `Baseport`, and `Total` in the PAR header pane

### Combined-practice defaults

Relevant commit:

- `8aa36c2b`

Main touched files:

- `src/lib/combinedPractices.ts`
- `tests/combinedPractices.test.ts`

Intent:

- separate the Aldershot, Winchester, and Bovington default combined-practice handling

### Royal Navy control color

Relevant commit:

- `3e6aa1a9`

Main touched files:

- `src/components/layout/WorkspaceBottomLeftPane.tsx`
- `src/styles/global.css`

Intent:

- apply the blue info/toast color treatment to the `Regionalise / Unregionalise` control without changing its shape

### Split-parent highlight test adjustment

Relevant commit:

- `e3080e96`

Main touched file:

- `tests/selectionHighlights.test.ts`

Intent:

- update the split-parent highlight test to match the current approved selection contract

## Verification

Verified in the canonical main repo:

- `npm run test -- --run tests/runtimeAssetUrls.test.ts tests/layersService.test.ts tests/overlayLookupBootstrap.test.ts tests/overlayBoundaryReconciliation.test.ts tests/runtimeMapProducts.test.ts tests/boundarySystems.test.ts tests/scenarioWorkspaces.test.ts`
- `npm run build`

Live browser verification against `http://127.0.0.1:5174/dmsGIS/` confirmed:

- no remaining JSON parse errors from startup lookup loads
- no `Loading layers...` banner after settle
- no `Error:` banner after settle
- no `No regions loaded.` banner after settle
- shell grid restored with map left / sidebar right / bottom row aligned correctly
- OpenLayers viewport and zoom controls now render at full map height
- settled live screenshot showed normal map rendering with facility points and sidebar controls present

## Has JJ been affected?

No evidence suggests that `jj` history itself was damaged.

What was observed in the canonical repo:

- `jj` history remained present and usable
- the working copy was clean
- the actual failure was repo-path confusion plus real runtime/layout regressions

The practical problem was:

- work later in the thread was accidentally continued in the separate iCloud checkout
- the canonical repo then needed runtime/layout recovery after the swap was undone

## Practical rule

From this point:

- continue production work only in `/Users/andrew/Projects/dmsGIS`
- treat the iCloud repo as secondary / archival unless explicitly being mined for docs
- if the app looks catastrophically wrong again, check runtime asset URL resolution before assuming repo corruption
