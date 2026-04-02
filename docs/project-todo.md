# Project Todo

User-derived task list for dmsGIS. Items reflect product decisions and feature intentions — not implementation-level bugs (see `sidebar-parity-bugs.md` for those).

---

## Open

Active confirmed runtime baseline:

- `docs/current-app-baseline-v3.8.md`

Treat older `v3.7` items below as historical/deferred unless they are explicitly revived against the confirmed `v3.8` state.

### 30. Lock cross-browser compact toggle rendering across Safari and Edge

**Area:** Sidebar controls / cross-browser UI consistency
**Priority:** Medium
**What:** Finish the active compact-toggle rendering contract so `On` / `Ox` / `Off` stay visually centered in Safari and Windows Edge without relying on one browser's optical correction to fix another's font metrics.
**Why:** The recent Edge fix proved that the old deliberate label offset was wrong on Windows, but the replacement full-button centering path broke Safari styling. The control now needs a stable browser-aware contract rather than one layout assumption applied everywhere.
**Notes:** Keep production controls in sync across `src/styles/global.css`, `src/styles/sidebarExact.css`, and `src/styles/sidebarReplacement.css`. Prefer browser-aware rendering or a more robust shared geometry contract over more ad hoc per-browser nudges.
**Files likely touched:** `src/styles/global.css`, `src/styles/sidebarExact.css`, `src/styles/sidebarReplacement.css`, related visual verification notes.

### 31. Review publication scope for inactive compare families and raw source artifacts

**Area:** Repo hygiene / GitHub publication scope / large-file governance
**Priority:** High
**What:** Decide which large repo artifacts should remain in GitHub versus stay local-only or move into an archive path.
**Why:** The active runtime only needs the accepted compare family, but the repo still carries inactive compare trees and large raw source artifacts that increase clone size and make publication scope harder to reason about.
**Notes:** Audit note now exists at `docs/publication-scope-audit-2026-04-02.md`. Current measured outcome: `shared-foundation-review` stays committed/published as the accepted live runtime, `bfe` and `current-east-bsc` are historical compare families that still matter for recovery but should not be treated as active runtime, and `facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg` now reads as provenance-only input. Do not remove or relocate any of them casually; the remaining work is the explicit physical move/untrack decision.
**Files likely touched:** `public/data/compare/`, `facilities/`, `.gitignore`, `src/lib/config/runtimeMapProducts.json`, docs describing runtime-family governance and source provenance.

### 32. Reduce map interaction full-scan work after startup optimizations

**Area:** Runtime performance / map interaction
**Priority:** Medium
**What:** Follow the startup improvements with a focused pass on interaction-time lookup work, especially repeated feature scans during point selection, tooltip rendering, and boundary lookup.
**Why:** Startup is leaner now, but the next most likely source of “sometimes a little slow” behavior is the repeated scan-based interaction logic in the map runtime, especially on lower-powered or Windows browsers.
**Notes:** Start with the point/boundary selection paths and only introduce heavier indexing if measurement shows it is worth the added complexity.
**Files likely touched:** `src/features/map/MapWorkspace.tsx`, `src/features/map/pointSelection.ts`, `src/features/map/boundarySelection.ts`, related seam tests.

### 24. Stabilize the `0%` map zoom-floor world framing

**Area:** Map runtime / initial viewport / zoom controls
**Priority:** Medium
**What:** Revisit the `0%` zoom-floor contract so repeated zoom-out steps hold a centered cropped world view in the map pane with no wrap and no white canvas showing beyond the sea background.
**Why:** The current `v3.8` world-floor path can still drift vertically on later zoom-out steps, clipping part of the southern hemisphere and pushing the visible world upward even when the horizontal center remains correct. A later diagnostics-heavy tweak also proved not stable enough to keep.
**Notes:** Keep the better interim state that at least shows the whole intended world crop in the pane. When this is revived, measure the actual rendered world floor against the live map pane and solve it at the OpenLayers `View` constraint seam (`center` / `resolution` / floor extent), not by stacking more zoom-pane diagnostics. No wrap remains the intended behavior. Extra map diagnostics can stay available programmatically through `window.__dmsGISMapDiagnostics`, but the zoom pane itself should stay visually minimal.
**Files likely touched:** `src/features/map/mapWorkspaceLifecycle.ts`, `src/features/map/MapWorkspace.tsx`, any future world-floor helper or fit-contract note.

### 29. Tune the new correction-adjusted PAR stack in the below-map cards

**Area:** Workspace bottom cards / PAR presentation / product semantics
**Priority:** High
**What:** Refine spacing, readability, and wording for the shipped three-line PAR stack in the below-map cards without changing the underlying correction math unless product rules explicitly change again.
**Why:** The below-map cards now show `actual Region PAR`, then `correction value (n%)`, then the corrected sum on the final line across all cards, including `Total`. The core presentation contract is now live, but the stack will likely need follow-up fit and typography tuning once it is reviewed visually across all presets and Royal Navy regionalisation states.
**Notes:** Keep one canonical correction rule across header and bottom cards: card correction is each card's active raw PAR as a share of the overall visible total, applied to the fixed `8500` base, and the final bottom line is `actual + correction`. Prefer future tweaks to stay visual and explanatory first; do not silently fork the math between header, cards, and exports.
**Files likely touched:** `src/lib/workspaceBottomCards.ts`, `src/components/layout/WorkspaceBottomLeftPane.tsx`, related tests in `tests/workspaceBottomCards.test.ts` and `tests/WorkspaceBottomLeftPane.test.ts`, plus any handover/baseline docs that lock the chosen presentation.

### 26. Measure and optimize the authoritative Playground assignment seam

**Area:** Scenario runtime / Playground / map selection and styling
**Priority:** High
**What:** Now that Playground board fills, selected Region borders, popover defaults, facility remapping, tooltip identity, and visible-facility PAR summaries are routed through one authoritative runtime assignment source, measure and harden that seam for correctness and performance.
**Why:** The authority collapse has landed, but the new shared lookup seam is now the right place to catch remaining grey-fill regressions and future slowness. Repeated coordinate-to-assignment lookups are also the clearest next optimisation hotspot.
**Notes:** Start from `docs/main-repo-review-2026-03-31.md`, `docs/playground-grey-runtime-bug.md`, and `docs/map-runtime-architecture-map-2026-04-02.md`. Keep future lookup/indexing work inside `src/features/map/scenarioAssignmentAuthority.ts` rather than reintroducing separate lookup logic in point selection, facility remapping, or PAR helpers. Non-map store summaries can remain draft-lookup-based unless a user-visible drift proves that they also need runtime-source unification.
**Files likely touched:** `src/features/map/scenarioAssignmentAuthority.ts`, `src/features/map/MapWorkspace.tsx`, `src/features/map/playgroundRuntimeSession.ts`, `src/features/map/pointSelection.ts`, `src/features/map/scenarioFacilityMapping.ts`, `src/features/map/facilityPar.ts`, related tests/e2e coverage.

### 27. Fully sandbox compare/review-family rebuilds from shared preprocess outputs

**Area:** Geometry preprocessing / review-family tooling / release discipline
**Priority:** High
**What:** Tighten the compare/review-family builders so they no longer touch shared preprocess outputs when rebuilding an inspection family.
**Why:** The current review-family path is only non-destructive at the runtime token level. The execution log already records shared-output side effects, which means compare/review builds can still contaminate later debugging and recovery work.
**Notes:** Start from `docs/shared-foundation-review-execution-log.md` and `docs/main-repo-review-2026-03-31.md`. Every called script in the review build flow should accept explicit staged dirs for all outputs it writes. “Inspection family” and “shared preprocess mutation” should not coexist.
**Files likely touched:** `scripts/build-shared-foundation-review-family.mjs`, `scripts/create-ward-split.mjs`, `scripts/buildLegacyRegionOutlines.mjs`, any geometry preprocess scripts that still write to shared default output locations, plus related docs/tests.

### 28. Clean up stale Git/GitHub publish branches after successful `main` promotion

**Area:** Repo hygiene / publish workflow
**Priority:** Medium
**What:** Review and prune stale local and remote publish branches once their work is either merged or intentionally superseded.
**Why:** The repo now has several older publish/staging branches from the review-family and recovery process. They are useful history, but keeping all of them indefinitely makes future GitHub promotion work harder to read and increases the chance of pushing from the wrong branch.
**Notes:** Keep branches that still serve as meaningful recovery anchors. Safe review candidates after the latest `main` merge include older codex publish branches already superseded by merged `main` work. Treat this as a hygiene pass, not an emergency cleanup, and do not remove any branch until its value as a recovery anchor is understood.
**Files likely touched:** none in app runtime; this is a Git/JJ/GitHub branch-management task plus any short handover note that records what was kept or deleted.

### 25. Revisit Exact sidebar helper-button low-opacity visual treatment

**Area:** Sidebar / Exact popovers / helper controls
**Priority:** Low
**What:** Revisit the shared low-opacity visual treatment for Exact-sidebar copy/reset helper controls after the current accepted normalization pass.
**Why:** The current live treatment is acceptable and documented, but it still relies on subjective tuning around the low-opacity transition and may need another visual pass once other popover refinements settle.
**Notes:** Current accepted seam is in `src/components/sidebarExact/ExactFields.tsx`. Helper glyphs now stay visually white down to `45%`, then transition toward the low-opacity state with a glyph-shaped support underlay. The inner swatch border stays off above about `10%` and fades in below that. PMC Border copy helpers must remain decoupled from PMC Points opacity, and the Facilities / PMC global `Points > Colour` reset must continue restoring per-region preset defaults. Treat this as refinement work, not a reason to reopen the broader Exact-sidebar structure.
**Files likely touched:** `src/components/sidebarExact/ExactFields.tsx`, `src/features/groups/pmcPanelFields.ts`, related Exact-sidebar tests/docs.

### 22. Topology-safe boundary arc smoothing pass

**Area:** Geospatial preprocessing — shipped board/runtime products
**Priority:** Medium
**What:** Explore a preprocessing step that softens angular boundary arcs across both external/coastal and internal shared board boundaries, while keeping internal borders contiguous and preserving downstream board, facility, and mask contracts.
**Why:** The current shipped products can look visually angular in places. A future smoothing pass may improve both external coastlines and internal borders, but it must happen at the shared-arc preprocessing seam rather than as a runtime or per-feature polygon tweak.
**Notes:** If pursued, smoothing should happen after exact board assembly and any exact `Current` split rebuild, but before shipped runtime boards, topology edges, outlines, masks, and facility alignment. Shared arcs must be smoothed once and reused on both sides. See `docs/arc-smoothing-future-plan.md`.
**Files likely touched:** future preprocessing scripts; likely `scripts/` geometry-build pipeline, plus downstream derived products.

### 23. Review and optionally split the main production client bundle

**Area:** Runtime performance / GitHub Pages delivery
**Priority:** Medium
**What:** Review the current production Vite bundle composition and decide whether the main client bundle should be split further.
**Why:** The confirmed `v3.8` baseline is clean and release-ready, but the current production build still emits a Vite warning because the main app chunk is just over the default `500 kB` threshold.
**Notes:** Current measured warning target from the validated build is `dist/assets/main-*.js` at about `502 kB` minified (`~142 kB` gzip). This is not a deployment blocker for GitHub Pages and should not hold up correctness-focused commits, but it is worth a later performance pass. Prefer targeted lazy-loading or manual chunking over broad architectural churn.
**Files likely touched:** `vite.config.ts`, runtime entry/module boundaries under `src/`, and any future code-splitting/performance notes.

### 21. Tighten the shipped `v3.8` `BSC-first` runtime family where source fidelity is still mixed

**Area:** Core geometry products / full-UK runtime rebuild / masks / facilities
**Priority:** High
**What:** The full-UK `v3.8` runtime family is now shipped, but some source composition remains intentionally mixed. The remaining follow-up is to decide whether the `4` merge-only England `2026` boards and the `3` Frimley-driven England `2026` boards should later receive more explicit official-grade replacements than the current exact / `BSC-like` seed path.
**Why:** The main cutover is complete and validated, and both `Current` and `2026` now share the same runtime simplify treatment plus symmetric facility snapping. The remaining mixed-source question is now mostly the changed England merge/replacement cases, not the old scenario-border seam or the rejected `2026 clip-only` experiment.
**Notes:** See `docs/current-app-baseline-v3.8.md` and `docs/v3.8-bsc-runtime-family-spec.md`. Preserve the shipped app contract. Do not reopen the rejected `v3.7` compare workflow. The narrower scenario Region-border fix is already live. The later process correction established the current guardrails: keep `Current` and `2026` on the same runtime treatment philosophy unless a future rebuild replaces both sides together, and keep the `4` merge-only England `2026` boards constrained to predecessor official ICB `BSC` shells unless a better canonical replacement path supersedes that.
**Files likely touched:** `scripts/build_v38_bsc_source_family.py`, `scripts/build_v38_full_bsc_runtime_family.mjs`, `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py`, related docs/tests.

### 19. Execute the staged water-edge classification pass for `v3.7`

**Area:** Core geometry products / hydro treatment / Devolved Region-border cleanup
**Priority:** High
**What:** Introduce formal water-edge classification and tolerance handling so inlets, estuaries, rivers, inland-water projections, and Devolved Administrations internal-HB Region-border artifacts can be rebuilt from one classified product family instead of treated as generic external arcs.
**Why:** The app now has a locked `v3.6` rebuild baseline, but the current preprocessing chain still lacks explicit hydro classification. That leaves too much ambiguity between true sea coast, estuary/inlet edges, and inland-water artifacts.
**Notes:** Start from `docs/current-app-baseline-v3.6.md`, `docs/v3.7-next-phase.md`, and `docs/v3.7-water-edge-staged-approach.md`. Stage 1 token/config formalization is now in place, the `standard` hydro-normalized landmask profile is now active on the rebuild path for review, and the active clipping mask is now class-aware: only `inlandWater` deltas currently fold into shipped clipping. Review-time classified arc helper products also exist under `geopackages/outputs/water_edges/`, with first visible runtime treatment now live from published classified files. The next execution slice is to review/tighten those classes and decide how estuary and other inland-water subclasses should feed shipped-family rebuild rather than helper styling alone.
**Files likely touched:** `scripts/preprocess-boundaries.mjs`, `scripts/extract-topology-edges.mjs`, `scripts/extract-group-outlines.mjs`, `scripts/build-uk-basemap-alignment.mjs`, `scripts/build_water_edge_landmask_profiles.py`, `src/lib/config/waterEdgeTreatment.*`, related tests/docs.

### 20. Build the `v3.7` coastal-envelope compare products

**Area:** Core geometry products / coastline truth / compare builds
**Priority:** High
**What:** Maintain and compare the two side-by-side preprocessing-driven external-envelope families:
- `bfe`
- `bsc`
Both should preserve canonical internal board borders while rebuilding masks/outlines/edges/facility checks from the selected outer envelope.
**Why:** The recent water-edge runtime-masking work was useful as diagnosis, but it cannot truly redefine the visible border endpoints. The cleaner path is now an official-source coastal-envelope rebuild.
**Notes:** Start from `docs/v3.7-coastal-envelope-compare-plan.md`. England ICBs remain the main priority because they show the strongest inland-water projection problem. The isolated `bfe` compare family now exists under `public/data/compare/bfe/`, and runtime swapping is handled through `src/lib/config/runtimeMapProducts.json`. Review outcome so far: `bfe` is not accepted because visible coastal inaccuracies and artefacts remain, so the runtime token has been returned to `baseline`. Do not treat the `bfe` family as a shipped winner. The compare-source bundle is local under `geopackages/compare_sources/`.
**Files likely touched:** new compare-build scripts under `scripts/`, `scripts/fetch_v37_coastal_compare_sources.py`, `scripts/build_v37_coastal_envelope_landmasks.py`, `src/lib/config/coastalEnvelopeTreatment.*`, `geopackages/compare_sources/`, compare output folders, downstream outline/mask/validation scripts, and related docs/tests.

### 18. Start the next geometry/runtime version from the locked `v3.6` baseline

**Area:** Core geometry products / masks / facilities / runtime replication
**Priority:** High
**What:** Begin the next version only from the locked `v3.6` baseline and keep the formal geometry-family validation gate intact while addressing any genuinely remaining defects or approved next-scope work.
**Why:** `v3.6` closes the rebuild-formalization pass. The next version should not re-open the old rebuild seam informally or regress the newly enforced `Current`/`2026` product-family contract.
**Notes:** Start from `docs/current-app-baseline-v3.6.md`, `docs/v3.7-next-phase.md`, and the staged hydro note `docs/v3.7-water-edge-staged-approach.md`. Preserve all current sidebar/config/store/runtime behavior unless the next version explicitly changes it.
**Files likely touched:** to be determined by the next approved `v3.7` scope.

### 12. Review remaining internal border continuity and visible conformance on the `v3.5` geometry family

**Area:** Core boundary products / preprocessing / visible basemap conformance
**Priority:** High
**What:** Review the live `v3.5` geometry family for any remaining internal ICB/HB border discontinuity or visible land/sea conformance issues now that shipped polygon holes have been removed and the coherent rebuild path is live.
**Why:** `v3.5` resolved the confirmed interior-ring regression and rebuilt the live family coherently, but the motivating user-visible continuity/conformance concerns still need operator verification on the rebuilt products.
**Notes:** Start from `docs/current-app-baseline-v3.6.md`, then use `docs/current-app-baseline-v3.5.md`, `docs/current-app-baseline-v3.4.md`, and `docs/v3.4-internal-gap-regression.md` only as historical context. Prefer reviewing the live `v3.6` products before reopening deeper geometry changes. Update from `2026-04-01`: the confirmed split-runtime interior-ring regression has now been repaired. The accepted review-family `Current` base board runtime remains hole-free, and the accepted review-family split-runtime product is now also back to `0` interior rings after the rebuild. Treat future white-gap reports as:
- first a check that the live split-runtime artifact has not regressed from `0` interior rings
- then, if geometry is still clean, a render-path seam-masking or separate border-contiguity investigation
- and keep split runtime included in geometry-family hole validation, not only the base board products
- note also that the broader compare-family rebuild still has unrelated stale-path follow-up work in its water-edge modifier step, so targeted artifact refresh may be safer than assuming the full review-family wrapper is clean end to end
**Files likely touched:** regenerated runtime boundary products, shared-edge products, visible basemap alignment assets, and related docs/tests if a further follow-up is confirmed.

### 11. Restore lint parity in the main repo

**Area:** Tooling / repo health
**Priority:** Medium
**What:** Bring `npm run lint` in the main repo back to a clean, intentional baseline. The flat ESLint config has now been restored, but the main checkout still needs its ignore scope and real-source findings reconciled so lint reflects the active app code rather than clone/worktree noise or leftover hygiene drift.
**Why:** The mapping/runtime `v3.2` cutover is healthy on tests and build, but lint parity in the main repo drifted behind the iCloud clone and was only surfaced again during full validation.
**Notes:** Keep this separate from the `v3.2` geometry work. Ignore generated data and cloned worktrees intentionally; then either fix or explicitly scope out remaining true source findings in the main app. Do not let lint quietly imply the wrong repo state again.
**Files likely touched:** `eslint.config.js`, `package.json`, `package-lock.json`, and whichever main-repo source files remain as genuine lint findings after ignore cleanup.

### 10. Refine external/coastal arc treatment after the `v3.2` landmask cutover

**Area:** Core boundary products / preprocessing / scenario foundations
**Priority:** High
**What:** Improve the new `v3.2` OSM-landmask preprocessing path so coastal/external arcs are treated more deliberately than the current first-pass clip-then-topological-simplify flow. The target is cleaner coast suppression and quieter estuary/inlet handling without disturbing exact internal ICB/HB relationships.
**Why:** The major provenance and first coastline-truth changes are now landed in `v3.2`, but the external arc treatment is still iterative rather than final. `v3.4` has now removed inland-water holes from the preprocessing clip mask so rivers and lakes stop imprinting pseudo-coastal seams into the runtime products, but broader outer-coast refinement may still follow later if needed.
**Notes:** Keep the three `Current` ward-split exceptions as separate runtime overlays, not baked into the base canonical board product. Keep runtime fills as `GeoJSON` unless file size becomes a proven blocker for GitHub Pages delivery. This now sits behind the shipped `v3.3` visible-basemap alignment step and the completed `v3.4` river/inland-water cleanup. Protomaps remains only a future visible-basemap candidate, not part of the current preprocessing seam. See `docs/current-app-baseline-v3.4.md`, `docs/current-app-baseline-v3.3.md`, `docs/current-app-baseline-v3.2.md`, and `docs/canonical-board-rebuild-workflow.md`.
**Files likely touched:** `scripts/preprocess-boundaries.mjs`, coastline-source preparation files under `geopackages/coastline_sources/` and `geopackages/outputs/uk_landmask/`, `scripts/extract-topology-edges.mjs`, regenerated runtime boundary products.

---

### 9. Rebuild the authoritative ICB/HB shared-border edge product

**Area:** Regions / Overlays / preprocessing
**Priority:** High
**What:** Replace the current repaired topology-edge extraction with a cleaner authoritative shared-edge dataset for ICB/HB boundaries. The target product should preserve left/right boundary ids and types, explicitly classify internal vs coastal edges, and remain suitable for non-coastal hiding, overlay border controls, and future Playground region reassignment / visual identification flows.
**Why:** The current Wales fix is clean and shippable, but it is still a repair layer over clipped/simplified polygon artifacts. Future dynamic border and region-assignment work will be safer on a first-class shared-edge product than on repeated extraction patches.
**Notes:** Prefer a preprocessing-side solution, not runtime geometry inference. Keep coastal/external arcs available in the dataset even when hidden by default at render time.
**Files likely touched:** `scripts/extract-topology-edges.mjs`, boundary preprocessing scripts, `public/data/regions/*topology_edges.geojson`, `src/features/map/boundaryLayerStyles.ts`, `src/features/map/overlayBoundaryReconciliation.ts`.

---

### 3. Zoom-relative map point scaling

**Area:** Facilities — map rendering
**What:** At high zoom levels map points look appropriately sized, but as the map zooms out the points remain the same screen size and become disproportionately large relative to the geography. Points (and their borders, if present) should scale down as the map zooms out, maintaining a consistent relationship to the geographic scale.
**Why:** Raised during the SVG icon refactor — the Icon scale is currently fixed per `size` setting and does not vary with zoom. This should be factored into any further size/scale work on map symbols.
**Notes:** The current `Icon.scale` is set once at style creation time. Zoom-aware scaling will require either a style function that recomputes scale on each render (keyed by zoom level) or use of OL resolution-based rendering. The per-region style cache in `facilityLayerStyles.ts` will also need to include zoom level as a cache key.
**Files likely touched:** `src/features/map/mapStyleUtils.ts`, `src/features/map/facilityLayerStyles.ts`.

---

### 2. Shape border rendering audit across all shapes and swatches

**Area:** Facilities — map rendering + sidebar swatch previews
**What:** Border rendering needs a full audit across shapes (circle, square, diamond, triangle) in both map icons and sidebar swatches. The map side now uses SVG `Icon` with clip-path inward borders, but swatches still use a separate inner-scale approach. Both paths need to agree on what "border off" and "border at 0 thickness" mean visually, and swatch previews should accurately reflect the rendered map state.
**Why:** The SVG icon refactor resolved map-side issues (inward borders, rounded corners, size normalisation). Remaining work is swatch alignment and verifying all border controls (visible, width, opacity) interact correctly end-to-end.
**Files likely touched:** `src/components/sidebarExact/ExactSwatch.tsx`, `src/features/map/facilityLayerStyles.ts`.

---

### 4. Land transparency dissolves into sea/background colour

**Area:** Basemap — land fill rendering
**What:** As land fill opacity is reduced, the background (generally the configured sea colour) should show through so that land masses visually dissolve into the sea/background. Currently land simply becomes transparent revealing whatever is behind it.
**Why:** User expectation — reducing land opacity should blend land into the surrounding sea colour rather than exposing the raw canvas/tile background.
**Notes:** The map viewport background is now set to white (`#fff`), so when both land and sea are at 0% the canvas is clean white (useful for future export). Country borders also auto-hide when land opacity reaches 0%.
**Files likely touched:** `src/features/map/MapWorkspace.tsx` (land fill style), possibly basemap store if new settings are needed.

---

### 1. Wire Point controls to Cities popover

**Area:** Labels pane — Cities row
**What:** The Cities label row shows accompanying point markers alongside city name text. The Cities popover currently exposes Text and Border controls only. Add a Point section to control the accompanying point (colour, size, opacity) independently of the label text.
**Why:** Cities points are visible map elements; without controls they are unmanageable from the sidebar.
**Files likely touched:** `src/features/labels/labelPanelFields.ts`, `src/store/appStore.ts` (if new basemap keys needed), map runtime layer config.

---

### 5. Basemap reset icon colour tuning

**Area:** Basemap — sidebar popover styling
**Priority:** Low
**What:** The reset-to-default-colour button icon uses a luminance-based grey that scales proportionally with the swatch background brightness. Land and Sea currently have subtly different icon greys. This may need further fine-tuning as default colours or design preferences evolve.
**Files likely touched:** `src/components/sidebarExact/ExactFields.tsx` (`computeSwatchIconColor` function).

---

## Done

### 16. Harden London & South facility selection against `Current` outline-union failures

**Area:** Facilities / live map interaction / point selection
**What:** The reported London & South facility click-selection regression was traced to the `Current` Region-highlight seam, not to bad facility data. Some clicks could hit the point correctly, but the synchronous `Current` outline derivation path could throw during Turf union and interrupt the rest of the selection/highlight flow.
**Why:** The facilities dataset itself was structurally healthy, and broad validation stayed green, so a live-browser investigation was needed. A fresh Playwright check on `Southwick Park Medical Centre` in the Portsmouth cluster reproduced the live click path and confirmed the failure mode.
**Notes:** `src/features/map/boundarySelection.ts` now makes `deriveCurrentGroupOutlineFeature(...)` fail safe and return `null` instead of throwing, which lets the existing precomputed outline fallback complete selection normally. A focused regression test now uses the live runtime geometry files to lock that behavior.
**Files touched:** `src/features/map/boundarySelection.ts`, `tests/boundarySelection.test.ts`, `docs/current-app-baseline-v3.5.md`, `docs/agent-handover.md`.

### 15. Execute `v3.5` as a full coherent geometry redress

**Area:** Core boundary products / internal borders / basemap masks / facilities
**What:** The live app geometry family is now rebuilt coherently: shipped runtime polygons, shared-edge products, visible `Land` / `Sea` alignment assets, scenario derivatives, and facility assignments are regenerated together from one coordinated build path.
**Why:** The incremental `v3.1` to `v3.4` repairs improved provenance and preprocessing, but they left too many seams between fills, internal borders, masks, and coastal facility treatment. `v3.5` replaces that patch model with one coordinated family build.
**Notes:** The orchestrating rebuild entry is now `node scripts/build-runtime-geometry-family.mjs`. The live recoverable baseline is `docs/current-app-baseline-v3.5.md`, with `v3.4` retained as the prior rollback point.
**Files touched:** `scripts/build-runtime-geometry-family.mjs`, `scripts/preprocess-boundaries.mjs`, regenerated runtime boundary products, regenerated topology-edge products, regenerated scenario/outline derivatives, regenerated visible basemap alignment assets, `scripts/enrich-facilities.mjs`, and related docs/tests.

### 14. Formalize Codex guidance for the basemap/product conformance workflow before the next geometry pass

**Area:** Workflow / handover / geometry-version sequencing
**What:** The Codex-facing docs now explicitly distinguish the preserved `v3.4` rollback/history state from the live `v3.5` coherent rebuild baseline, with the read order and restart guidance updated accordingly.
**Why:** The previous version labels drifted away from the actual user goal and left too much room for agents to resume from stale repair seams instead of the agreed rebuild path.
**Files touched:** `AGENTS.md`, `README.md`, `docs/agent-handover.md`, `docs/agent-continuation-protocol.md`, `docs/current-app-baseline-v3.4.md`, `docs/current-app-baseline-v3.5.md`, `docs/v3.5-full-geometry-redress.md`, `docs/canonical-board-rebuild-workflow.md`, `docs/project-todo.md`.

### 15. Codify coastal facility placement against assigned current and 2026 board products

**Area:** Facilities / preprocessing / coastal geometry
**What:** `scripts/enrich-facilities.mjs` now treats the shipped board products as the authoritative coastal placement truth for facilities in both systems. The script restores original source coordinates where present, preserves reviewed coastal assignments when existing snap metadata already exists, then snaps inward against the assigned `Current` board first and the assigned `2026` board second when needed.
**Why:** The app products, not an external generic landmask, define the operational coast. This was needed so coastal and port-adjacent facilities can be regenerated safely when the facilities dataset is replaced in future without drifting between `Current` and `2026`.
**Notes:** The regenerated `public/data/facilities/facilities.geojson` now keeps `118/118` domestic facilities intersecting both shipped board families. `snap_basis` can now legitimately be `assigned_current_boundary`, `assigned_2026_boundary`, or `assigned_current_boundary_then_assigned_2026_boundary`.
**Files touched:** `scripts/enrich-facilities.mjs`, `tests/enrichFacilities.test.ts`, `public/data/facilities/facilities.geojson`, `docs/agent-handover.md`, `docs/current-app-baseline-v3.3.md`.

### 13. Align the visible UK basemap coast to the `v3.2` board coastline truth

**Area:** Basemap / geometry alignment
**What:** The visible UK basemap coast is now aligned to the improved `v3.2` board coastline truth through a filtered UK/Ireland OSM-derived land overlay plus a matching UK-local sea patch inside the existing single-map runtime.
**Why:** After the `v3.2` OSM-landmask cutover, the remaining mismatch was slight enough that moving the visible basemap to the improved coastline truth became the cleaner next step.
**Notes:** The visible UK alignment is tied to the existing global `Land` and `Sea` controls, so it behaves as one unified basemap feature rather than a standalone row. A first `v3.3` attempt exposed a visible box artifact from a stray continental polygon in the visible land asset, and the shipped baseline filtered that fragment out before runtime use. A later tightening step replaced the remaining source-family drift by deriving visible UK land from the shipped simplified board union, with Republic of Ireland context added explicitly from `ne_10m_admin_0_countries.geojson`. The current `v3.3` truth is now boundary-system-specific rather than one-size-fits-both: `Current` uses `uk_landmask_current_v01.geojson` / `uk_seapatch_current_v01.geojson`, while `2026`-basis modes use `uk_landmask_2026_v01.geojson` / `uk_seapatch_2026_v01.geojson`.

### 12. Cut the runtime boundary products over to official/BFC foundations plus an OSM-derived UK landmask

**Area:** Core boundary products / preprocessing / scenario foundations
**What:** The live app now runs on exact canonical `Current` and `2026` board products rebuilt from official / official-equivalent sources, clipped to an OSM-derived UK landmask before topological simplification, with downstream scenario, outline, edge, and facility-assignment products regenerated from that result.
**Why:** This was the agreed `v3.1` to `v3.2` path: improve the hidden geometry truth first while keeping the visible basemap and single-map runtime architecture unchanged.
**Files touched:** `scripts/build_current_canonical_board_boundaries.py`, `geopackages/ICB 2026/scripts/build_full_2026_england_icb_boundaries.py`, `scripts/preprocess-boundaries.mjs`, `scripts/derive-boundary-presets.mjs`, `scripts/extract-topology-edges.mjs`, `scripts/extract-group-outlines.mjs`, `scripts/enrich-facilities.mjs`, `public/data/regions/*`, `public/data/facilities/facilities.geojson`, `geopackages/coastline_sources/simplified-land-polygons-complete-3857.zip`, `geopackages/outputs/uk_landmask/*`.

### 8. Remove internal green seams between adjacent `SJC JMC` region fills

**Area:** Regions / scenario rendering
**What:** `SJC JMC` no longer ships with a default-on green scenario-outline layer. Internal board-edge borders remain on the normal Overlays controls path, while selected and outer scenario highlighting still resolves from the lookup/selection outline path.
**Why:** User confirmed the issue was only the extra green seams between adjacent region fills, not the selected or outer highlight behavior.
**Files touched:** `src/lib/config/viewPresets.json`, `src/store/appStore.ts`, `tests/appStore.test.ts`.

---

### 7. Make the three novel `Current` ICB splits inherit parent Region styling as populated members

**Area:** Regions / Current preset rendering
**What:** The split areas for `NHS Lancashire and South Cumbria Integrated Care Board`, `NHS Hampshire and Isle of Wight Integrated Care Board`, and `NHS Hertfordshire and West Essex Integrated Care Board` now route through `UK_WardSplit_simplified.geojson`, inherit parent Region styling via `region_ref`, suppress the underlying full-parent ICB fill to avoid darker double-tinting, highlight the shared parent ICB boundary on facility click, and derive the selected Region outline live from `regionFill + wardSplitFill` so the full parent Region border includes the split wards.
**Why:** The first pass landed the split layer, but the parent ICB fill was still visible underneath, split-area selection still favored the full parent polygon in the wrong places, and selected Region borders treated split wards like a bolt-on. All three behaviors are now corrected on the production path.
**Files touched:** `src/lib/config/viewPresets.ts`, `src/lib/config/viewPresets.json`, `src/features/map/boundaryLayerStyles.ts`, `src/features/map/boundarySelection.ts`, `src/features/map/selectionHighlights.ts`, `src/features/map/MapWorkspace.tsx`, `scripts/create-ward-split.mjs`, `public/data/regions/UK_WardSplit_simplified.geojson`.

---

### 6. Collapse all panes during drag reorder

**Area:** Sidebar — pane reorder UX
**What:** All major panes collapse when any pane is dragged for reorder, making targets compact and easy to place. Full open-pane state is restored on drop/cancel.
**Files touched:** `src/components/layout/RightSidebar.tsx`.

---

### 5. Evaluate a BFE-source path for future canonical coast work

**Area:** Boundary sources / coastline strategy
**What:** Keep a deferred evaluation path for whether future canonical geometry work should ever switch selected preprocessing sources from `BFC` to `BFE`, especially if a later coast/full-extent architecture needs it.
**Why:** The current coherent rebuild path intentionally stays on `BFC` to match the existing canonical source family and clipped operational coast. `BFE` may still matter later for a different full-extent/coastline strategy, but it should not be mixed into the current split-ward rebuild.
**Files to inspect later:** official ONS ward/board `BFE` releases, `scripts/preprocess-boundaries.mjs`, `scripts/build-uk-basemap-alignment.mjs`, `docs/current-app-baseline-v3.6.md`.

---

### 4. Optimise the three-step `Current` split-ICB rebuild runtime

**Area:** Current split-ICB preprocessing
**What:** Keep the new split rebuild contract, but reduce execution time: base ward build from official `WD_DEC_2025_UK_BSC`, canonical-parent remainder repair by adjacency, then dissolve to the app-facing split-ICB runtime product.

**Note:** The ward `BSC` switch is now complete. The remaining follow-up is performance and maintainability, not source adoption.
**Why:** The new selective rebuild now fixes the parent-edge underfill problem for the three split ICB cases and produces a clean visible runtime split product without forcing a `Land` / `Sea` refresh, but the exact-build path is still slower than ideal.
**Files to inspect later:** `scripts/build_current_ward_split_exact.py`, `scripts/fix_current_ward_split_parent_coverage.py`, `scripts/build_current_split_icb_runtime.py`, `scripts/create-ward-split.mjs`.

---

### 3. Make `Current` split-ICB preprocessing atomic and contiguous

**Area:** `Current` split-ICB geometry family
**What:** Replace the remaining multi-seam split workflow with one atomic family: exact canonical parent coast, ward-level internal assignment, explicit ward-component contiguity cleanup, dissolved shipped split runtime, then outlines and `Land` / `Sea` masks from that same shipped family.
**Why:** Repeated regressions are still coming from drift between split assignment, repaired parent remainders, dissolved runtime output, selected-outline files, and the `Current` landmask. Hampshire/Winchester-style orphaning shows this is not fully locked yet.
**Files to inspect later:** `scripts/build_current_ward_split_exact.py`, `scripts/fix_current_ward_split_parent_coverage.py`, `scripts/build_current_split_icb_runtime.py`, `scripts/extract-group-outlines.mjs`, `scripts/build-uk-basemap-alignment.mjs`, `docs/v3.5-geometry-architecture-redlines.md`.
