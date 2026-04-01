# Recovery State — 2026-04-01

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

## Verification

Verified in the main repo:

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

The only remaining console noise in headless checks was:

- OpenLayers warning during initial zero-size mount before the map container settles

This did not block the recovered runtime.

## iCloud checkout status

The iCloud repo is not the authoritative runtime repo.

It currently appears to contain:

- detached `HEAD`
- a docs-only unique commit line around Datawrapper provenance
- `.vite` cache/deps noise in working copy

Do not continue production work there unless intentionally recovering that docs-only line.

## Practical rule

From this point:

- continue production work only in `/Users/andrew/Projects/dmsGIS`
- treat the iCloud repo as secondary / archival unless explicitly being mined for docs
- if the app looks catastrophically wrong again, check runtime asset URL resolution before assuming repo corruption
