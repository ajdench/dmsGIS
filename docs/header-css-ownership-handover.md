# Header CSS Ownership Handover

## Purpose

This note exists to support a small cross-thread architecture check while a separate thread continues other production work.

The immediate practical need is to keep a header-only UI tweak thread scoped safely. The broader question is whether the current CSS ownership in production is worth re-architecting later so header work, map work, and sidebar work are less likely to collide inside one large stylesheet.

## Current context

- Canonical local repo for this exchange: `/Users/andrew/Projects/dmsGIS`
- The production header component is `src/components/layout/TopBar.tsx`
- The main shared stylesheet is `src/styles/global.css`
- Sidebar styling is already partially split into:
  - `src/styles/sidebarExact.css`
  - `src/styles/sidebarReplacement.css`

## Why this came up

The header component itself is isolated enough for a targeted UI tweak, but its visual styling still lives in `src/styles/global.css`.

That means even a header-only styling pass is more likely to overlap with unrelated work, especially when sidebar or layout work is active in parallel.

## Observed repo state

At the time this note was created:

- `src/styles/global.css` is still very large and mixed-purpose
- `src/styles/global.css` contains:
  - tokens and resets
  - app-shell/workspace layout
  - topbar/header styles
  - shared button styles
  - map panel and tooltip styles
  - dialog styles
  - substantial sidebar/layout styles
- sidebar styling ownership is already partially externalized into sidebar-owned stylesheets, but not fully

This makes `global.css` act as both:

- the true global foundation
- a de facto feature stylesheet for multiple major surfaces

## Architecture question for consideration

Please consider whether the repo would benefit from a future CSS ownership refactor along these lines:

- `global.css` keeps:
  - tokens
  - resets
  - truly shared app-wide primitives
- header-specific styling moves to a header-owned stylesheet
- map/workspace-specific styling moves to a map-owned stylesheet
- sidebar styling ownership is clarified and consolidated in sidebar-owned stylesheets rather than continuing to accumulate in `global.css`

Important nuance:

This should not be treated as a request to immediately implement a big CSS split unless it is directly necessary for the active task and can be done safely.

## What to report

Please add your response to this file and keep the chat reply short.

In the file, please cover:

1. Whether this is worth considering in the future
2. Whether it should be deferred for now
3. The main benefits
4. The main risks
5. Your recommended target ownership split
6. Any constraints from your current thread that make this easier or harder later

## Suggested response format

Add a new section at the end of this file with a heading like:

`## Response - <date or agent/thread label>`

Keep the chat reply short and point back to this file for the detailed reasoning.

## Scope guardrails

- Do not treat this note as approval to do a broad CSS refactor right now
- Do not destabilize current production sidebar or map work for this question alone
- If the recommendation is "defer", say so explicitly
- If the recommendation is "worth doing later", prefer a staged ownership clarification over an all-at-once rewrite

## Response - 2026-03-27 Codex

### Short conclusion

Yes, this is worth considering in the future, but it should be deferred for now. The repo is already showing the right direction: sidebar ownership is partially split, while `global.css` still acts as both foundation and feature stylesheet. A staged ownership clarification would improve safety and parallel work, but a broad CSS move right now would create unnecessary collision risk with the active `v3.x` geometry/basemap work.

### Whether it is worth considering in the future

Yes.

The current production styling ownership is materially mixed:

- `src/styles/global.css` is very large (`1902` lines at the time of this check)
- it owns tokens/resets and also feature/surface styling for:
  - top bar
  - workspace shell
  - map panel
  - tooltip and assignment popover surfaces
  - dialog surfaces
  - substantial sidebar shell/control styling
- sidebar styling is already partly moved into:
  - `src/styles/sidebarExact.css`
  - `src/styles/sidebarReplacement.css`

So the architecture question is real, not theoretical. The repo would benefit from a clearer ownership split later.

### Whether it should be deferred for now

Yes, explicitly defer it for now.

Reason:

- the current active thread is still in the `v3.x` geometry/basemap/coastal data track
- that work is touching runtime behavior, preprocessing, facility placement rules, and visual coast alignment
- a CSS ownership refactor is not required to safely continue that work
- the production sidebar has only relatively recently been stabilized on the exact-shell path, and the map/runtime UI surfaces are still being adjusted in a careful, versioned way

So this should be treated as a future cleanup/ownership pass, not as part of the current production-critical geometry work.

### Main benefits

1. Lower collision risk between threads and features.
   Header-only tweaks would be less likely to overlap with sidebar or map work if the relevant styles lived closer to their owning surface.

2. Clearer maintenance boundaries.
   `global.css` would go back to being a real foundation file instead of also acting as a de facto feature stylesheet.

3. Safer production-side promotion work.
   The repo has already learned that large shared surfaces drift when too much responsibility is pooled into one place. CSS ownership is showing a similar pattern.

4. Easier code review and restart/handover reasoning.
   It becomes easier to answer “what owns this visual behavior?” and easier to make bounded edits without re-reading a massive mixed-purpose stylesheet.

5. Better long-term fit with the current architecture principles.
   The repo already prefers feature-owned behavior and progressive promotion over broad mixed-surface coupling. CSS ownership should eventually reflect that same principle.

### Main risks

1. Broad churn with low immediate product gain.
   A large CSS split could touch many selectors without delivering immediate user-visible value.

2. Hidden regressions in spacing/alignment.
   This repo’s layout depends on many shared tokens and tuned relationships between top bar, sidebar, map pane, and popovers. Moving ownership too aggressively could break those seams.

3. False “locality”.
   Some styles that look header-owned are actually app-shell-owned because they depend on shared width, height, or token contracts.

4. Interrupting the exact-sidebar stabilization path.
   Sidebar CSS is already partially split. A premature cleanup could create another round of mixed interim ownership instead of clarifying it.

5. Parallel drift if done piecemeal without a target contract.
   If people just move selectors ad hoc, the result could be more confusing than today.

### Recommended target ownership split

I would recommend a staged target split like this:

#### `src/styles/global.css`

Keep only:

- tokens
- resets/base element styling
- truly shared primitives
- very high-level app-shell/layout contracts that multiple surfaces rely on

Examples likely still belonging here:

- root variables
- button/input primitives that are genuinely reused everywhere
- fundamental app shell and viewport constraints
- cross-surface shared typography/rhythm tokens

#### Header-owned stylesheet

Create a header-owned stylesheet for `TopBar`, for example:

- `src/components/layout/topBar.css`

Move only clearly header-specific selectors there, such as:

- `.topbar`
- `.topbar__brand`
- `.topbar__title`
- `.topbar__subtitle`
- `.topbar__actions`
- header-button sizing rules that are truly specific to the top bar rather than generic button primitives

#### Map/workspace-owned stylesheet

Create a map/runtime-owned stylesheet, for example:

- `src/features/map/mapWorkspace.css`

Move clearly map-surface selectors there, such as:

- `.map-panel`
- `.map-panel__inner`
- `.map-tooltip*`
- `.map-assignment-popover*`

Potential caution:
The outer workspace-grid contract may still belong in `global.css` if it is genuinely app-shell level rather than map-owned.

#### Sidebar-owned stylesheets

Continue clarifying sidebar ownership in sidebar-owned files rather than letting more sidebar selectors accumulate in `global.css`.

Likely target:

- `src/styles/sidebarExact.css` owns the active production exact-shell sidebar contract
- `src/styles/sidebarReplacement.css` remains prototype/replacement-path specific only if still needed
- remove duplicated old sidebar shell/control selectors from `global.css` only once parity is confirmed

### Recommended migration shape

If this is done later, do it in stages:

1. Freeze the target ownership contract first.
2. Move header-only selectors first.
3. Move map/tooltip/assignment-popover selectors second.
4. Consolidate sidebar ownership last, because that surface is larger and more coupled.
5. Remove dead/duplicated selectors only after each stage is validated.

That is safer than a “split global.css” rewrite.

### Constraints from the current thread

The current thread makes this easier conceptually, but worse in timing.

Why it is easier conceptually:

- the recent `v3.x` work has clarified the operational seams between:
  - basemap surface
  - map runtime overlays
  - assignment popovers/tooltips
  - sidebar controls
- that makes future ownership boundaries easier to define

Why timing is worse right now:

- the active thread is still centered on geometry/basemap/coastline correctness
- map-facing styles are part of that visible verification loop
- facility placement, coastal conformance, and future `v3.4` / `v3.5` work still need stable UI/runtime surfaces

## Response - 2026-03-30 PAR Header Lock

### Locked PAR pane contract

- The `Population at Risk (PAR)` top-bar pane is now locked as a production-owned internal summary surface in `src/components/layout/TopBar.tsx` and `src/components/layout/topBar.css`.
- It is no longer a repeated three-column `label / PAR: / value` pattern.
- The live contract is now a six-row two-column summary:
  - left column: `Facility:`, `Practice:`, `Region:`, `Baseport:`, `Correction:`, `Total:`
  - right column: right-aligned values
- `Total` remains emphasized through `topbar__spacer-par-value--total`.
- `Correction` uses the display format `(n% of 8.5k) value`.

### Locked typography and spacing seam

- The PAR pane uses its own scoped tokens and should not borrow general middle-pane text tuning:
  - `--topbar-spacer-par-grid-font-size: 0.55rem`
  - `--topbar-spacer-par-fixed-height: 4rem`
  - `--topbar-spacer-par-grid-offset-y: calc(var(--topbar-cluster-label-offset-y) - 0.07em)`
- The pane now uses a fixed-height distributed row stack in `.topbar__spacer-par-summary`; keep the first and last rows visually anchored while interior rows stay evenly spaced.
- The only approved row-specific vertical adjustments are the tiny paint-only transforms on `Facility` and `Total`.
- If PAR spacing is tuned again later, preserve the fixed-height distributed layout contract and adjust row paint offsets deliberately rather than reintroducing row-specific margin hacks.

### Locked data contract

- `Facility PAR`, `Practice PAR`, `Region PAR`, `Baseport PAR`, `Correction PAR`, and `Total PAR` all flow from `pointTooltipDisplay`.
- `Baseport PAR` is Royal-Navy-only, but now follows the active board geography rather than the stored PMC region label:
  - Clyde -> Scotland / Highland basis
  - Devonport -> South West / Devon basis
  - Portsmouth -> London & South / Hampshire and Isle of Wight basis on `Current`
- `Total PAR = Region PAR + Baseport PAR`.
- `Correction PAR` is derived from proportional regional contribution to `Total PAR`, using the displayed `Region PAR / Total PAR` share against a fixed `8,500` base.

### Locked combined-practice pane contract

- The second middle header pane stays titled `Combined Practice` in the non-combined / empty state unless the selected facility belongs to a true shared combined practice.
- In the combined state, the title becomes `Combined Medical Practice`, the combined-practice name is printed without a trailing `Combined Medical Practice`, and member names are printed without a trailing `Medical Centre`.
- The combined-state title also keeps a locked `1px` downward offset through `.topbar__spacer-label--practice-combined` in `src/components/layout/topBar.css`; this is a visual alignment correction, not a new layout pattern to generalize.
- The combined-practice name stays anchored to the same summary line treatment as the PAR pane `Facility:` row.
- Default combined-practice member layout is a simple independent stacked list.
- Portsmouth is the only approved special case:
  - use the compact two-column member grid only for `Portsmouth Combined Medical Practice`
  - keep `Southwick Park` and `Thorney Island` as full-width bottom rows so they stay on one line
- Do not generalize that Portsmouth layout treatment to other combined practices unless explicitly approved.
- introducing a CSS ownership refactor now would increase change noise in exactly the surfaces that are still being visually checked

### Recommendation

Recommended decision:

- worth doing later: **yes**
- do it now: **no**
- preferred timing: **after the current `v3.x` coastline/border cleanup track is stable**

## Header Restart Note - 2026-03-29

This section records the current locked header-only `v3` state after the recent facility/region pane refinements.

### Current top central cluster

- The first two middle columns are still owned by the top-bar cluster.
- The top cluster pane is a merged pane with an internal `2 x 2` CSS grid.
- The lower cluster pane remains the separate ICB / Health Board pane.
- The remaining middle panes are now four flexible panes:
  - `Functions`
  - `Combined Practice`
  - `Local DPHC Services`
  - `Population at Risk (PAR)`
- The `Population at Risk (PAR)` pane now uses a true internal `3 x 3` grid:
  - col 1: `Facility`, `Practice`, `Region`
  - col 2: `PAR:`, `PAR:`, `PAR:`
  - col 3: facility, combined-practice, and region PAR values

### Internal `2 x 2` facility pane contract

- Top-left cell: `Facility:`
- Top-right cell: facility value
- Bottom-left cell: `Region:`
- Bottom-right cell: region value
- `Facility:` now uses title weight.
- `Region:` also uses title weight.
- Facility value uses title weight.
- Region value stays regular weight.

### Placement rules

- The top row remains pinned where it was previously.
- The bottom row is intentionally nudged downward so its baseline sits on the inner pane margin.
- Descenders in the bottom row are allowed to hang past the internal grid line rather than forcing the upper row to move.
- The pager in the merged top pane is also slightly lowered so the `<` / `>` row shares that lower margin treatment.

### Current tuning tokens

In `src/components/layout/topBar.css`:

- `--topbar-cluster-facility-grid-row-gap: 0`
- `--topbar-cluster-facility-grid-column-gap: 0.325ch`
- `--topbar-cluster-bottom-row-offset-y: 0.12em`
- `--topbar-cluster-pager-offset-y: 1px`
- `--topbar-cluster-bottom-pane-top-trim: 3.3px`
- `--topbar-spacer-par-grid-offset-y: calc(var(--topbar-cluster-label-offset-y) - 0.08em)`

These are intentionally header-local tuning tokens, not shared global spacing primitives.

### Lower merged board pane

- The lower merged `ICB / Health Board` pane is still content-driven by the board label contract, but now also trims additional height from the top edge only.
- The visible board-label baseline is intentionally preserved.
- This means the lower pane now shrinks from the top without moving the board label down or altering the default pane-to-pane gap above it.
- The PAR pane alignment is intentionally keyed to that same lower-row board-label treatment rather than to the taller top-row text contract.

### Working guidance

- Treat this as a locked header-only baseline unless a new header-specific request is made.
- Do not reopen map/runtime colour or split-ICB assignment issues from this note; those belong to the map/data thread.
- If the internal `2 x 2` facility pane needs further visual adjustment, prefer changing the tokenized column offset first before changing row geometry.

## Header prototype state - 2026-03-28

### Scope

This section records the current header-only prototype state in the local production repo so a restart can resume from the same assumptions.

Relevant files:

- `src/components/layout/TopBar.tsx`
- `src/components/layout/topBar.css`

### Current layout contract

- Header layout is:
  - brand pane
  - fixed-width `2 x 2` middle cluster spanning the first two middle columns
  - four flexible middle spacer panes
  - fixed-width action pane aligned to `--sidebar-width-right`
- The first two middle columns are intentionally content-driven from the merged lower cluster row.
- The remaining four middle panes are intentionally flexible leftover space.
- The action pane must stay anchored to the final grid track and match the right sidebar width.

### Gap rules

- Pane-to-pane gap inside the `2 x 2` cluster is the default rhythm:
  - `--topbar-cluster-pane-gap: var(--space-3)` (`12px`)
- The internal bottom-row gap between the board label and the pager is a separate token:
  - `--topbar-cluster-bottom-row-gap: 8px`

This split matters. The bottom-row gap is intentionally tighter than the pane-to-pane gap and should not be conflated with the cluster pane spacing.

### Board-row sizing contract

The merged lower cluster row is currently driven by measured rendered geometry rather than a generic `ch` estimate.

Current tokens:

- `--topbar-cluster-longest-label-width: 17.8125rem`
- `--topbar-cluster-pager-label-width: 2.5234375rem`
- `--topbar-cluster-nav-size: 1.0625rem`
- `--topbar-cluster-pager-edge-inset: calc((bottom-pane-height - nav-size) / 2)`

Intent:

- left side uses default left padding
- board label column is sized for the longest adjusted runtime label
- internal board-label-to-pager gap is the separate tighter token
- pager sits in a right-aligned content-width slot
- right inset for the pager is derived from the button-box vertical clearance so the `>` box reads evenly against the pane edge

### Current live measurements

Measured on the local running app at `http://127.0.0.1:4173/dmsGIS/` in a `1280px`-wide viewport:

- merged cluster width: `389.125px`
- each top cluster pane width: `188.5625px`
- each of the remaining three middle panes: `137.046875px`
- action pane width: `311.3125px`
- cluster pane gap: `12px`
- bottom-row internal label-to-pager gap: `8px`

### Label and pager details

- Longest adjusted runtime board label used for sizing:
  - `ICB: Bath and North East Somerset, Swindon and Wiltshire`
- The pager label and arrow boxes are now vertically center-aligned from the same geometry.
- The pager row uses a dedicated grid so the `n of y` text aligns with the `<` and `>` boxes rather than drifting optically.

### Cautions for future tweaks

- Do not change `--topbar-cluster-pane-gap` when the goal is only to tighten the board-label-to-pager spacing.
- Do not let the merged `2 x 2` cluster width drive the remaining three middle panes; those should stay flexible.
- When adjusting the lower merged row, prefer live rendered measurement over inferred CSS math.

## Header update - 2026-03-28 Codex

### Current locked header behavior

- Work for this thread is scoped to the local repo at `/Users/andrew/Projects/dmsGIS`
- The top-left `2 x 2` cluster now mirrors live point-tooltip selection state rather than keeping a header-local mock
- The cluster top-left pane shows:
  - facility name on line 1
  - selected region label on line 2
- The cluster top-right pane now shows header-local pager controls:
  - `<`
  - `n of y`
  - `>`
- The cluster bottom merged pane still shows the selected board label in the locked format:
  - English ICBs: `ICB: <trimmed name>`
  - devolved administrations: `Health Board: <name>`

### Wiring seam

- `src/store/appStore.ts` now owns a small transient `pointTooltipDisplay` state:
  - `facilityName`
  - `regionName`
  - `pageIndex`
  - `pageCount`
- The store also owns a lightweight header-to-map pager request seam:
  - `requestPointTooltipPage(direction)`
  - `clearPointTooltipPageRequest()`
- `src/features/map/MapWorkspace.tsx` remains the single owner of real point-tooltip paging state and publishes the current display snapshot into the store after each tooltip render
- `src/components/layout/TopBar.tsx` reads that snapshot and only dispatches page requests; it does not own paging math

### Styling contract

- The cluster top-left and top-right panes use the same middle-pane text sizing token as the brand descriptor:
  - `--topbar-middle-pane-text-font-size`
- The top-right pager is aligned to the pane’s internal margins, not visually floated
- Long facility and region names are kept to single lines with ellipsis inside the pane contract

### Validation

- `npm run build` passes after this wiring
- A quick live check against `http://127.0.0.1:4173/dmsGIS/` confirmed the new header structure is present
- Only console noise seen during that check was the existing `favicon.ico` 404 from the dev server

## Header tidy baseline - 2026-03-28 Codex

- This checkpoint is a tidy baseline only, not a claim that the merged board/pager layout is fully correct yet
- `TopBar.tsx` now uses clearer neutral names for the merged board cluster path:
  - `formatBoardClusterLabel`
  - `boardClusterLabel`
  - `MIDDLE_PANE_COUNT`
  - `MIDDLE_SPACER_PANE_COUNT`
- `topBar.css` now makes the five-middle-pane grid intent easier to read:
  - two fixed middle columns owned by the `2 x 2` cluster
  - three flexible middle panes
  - action pane explicitly pinned to the final sidebar-width track
- Keep this as the restart point for further header correction work rather than reusing older pre-grid width experiments

## Header Prototype State - 2026-03-27

### Scope

This thread stayed intentionally limited to the production top bar in:

- `src/components/layout/TopBar.tsx`
- `src/components/layout/topBar.css`

No map, sidebar, basemap, preprocessing, or board-product changes were made as part of this header pass.

### Current prototype shape

The current top bar is now a header-local pane layout with:

- one left brand pane for `dmsGIS`, a three-line descriptor block, and `Dench | Co`
- one two-column prototype cluster occupying the first two middle pane slots
- three remaining middle spacer panes
- one right action pane aligned to `var(--sidebar-width-right)`

The prototype cluster currently contains:

- two top cells
- one merged lower cell spanning both columns
- the lower merged cell shows the longest current ICB/HB board name on a single line

### Current brand-pane prototype

The brand pane currently contains:

- `dmsGIS` as the top line
- `Geographic`
- `Information`
- `Service`
- `Dench | Co` as the bottom line

The three-line descriptor block is intentionally sized by the widest word so it nearly fills the inner brand width, while the space above and below the descriptor block is distributed evenly by the brand pane flex layout.

### Current action-pane prototype

The right action pane is currently a two-row prototype stack:

- row 1: wired production actions `Open`, `Save`, `Export`, `Reset`
- row 2: visual-only preset buttons `Current`, `SJC JMC`, `COA 3a`, `COA 3b`

The second row is intentionally present only as a header prototype reference. It is not wired to preset switching.

### Locked geometry contract

The current header contract is now measured and should be treated as the restart baseline for this prototype:

- header/action-pane outer height: `104px`
- action-button row height: `34px`
- gap between the two action rows: `12px`
- top inset inside the action pane: `12px`
- bottom inset inside the action pane: `12px`
- action button width: `62.83px`
- pane gap: `12px`

These values were verified on the live app at:

- `http://127.0.0.1:4173/dmsGIS/`

### Locked brand-pane typography contract

The current brand-pane typography baseline is:

- `--topbar-brand-descriptor-font-size: 0.6875rem`
- `--topbar-brand-descriptor-line-height: 1.12`

Verified live outcomes:

- inner brand width: `60.41px`
- `Geographic` width: `59.89px`
- gap from `dmsGIS` to descriptor block: `8.86px`
- gap from descriptor block to `Dench | Co`: `8.86px`

This should be treated as the current locked prototype state unless the brand pane is intentionally redesigned again.

### Text-treatment baseline

The second-row preset buttons intentionally mimic the sidebar preset treatment while staying header-local:

- active preset button uses highlighted treatment:
  - darker text
  - stronger border
  - `font-weight: 500`
- inactive preset buttons use:
  - normal text colour
  - normal border
  - `font-weight: 400`

Important implementation note:

- do not re-add `.sidebar-action-row__button` to the top-bar preset row
- that earlier attempt caused the second row to inherit the sidebar preset height contract and broke the shared `34 / 12 / 12 / 12` action-pane geometry

### SJC JMC label note

`SJC JMC` is slightly narrower than the default preset font treatment would allow in the fixed-width prototype button. The current header-local adjustment is:

- `--topbar-action-button-label-sjc-font-size: 0.6875rem`

This keeps the label visually centered while preserving the fixed button width and shared row height.

### Follow-up recommendation

If this prototype direction is kept:

- keep the geometry contract in `topBar.css`
- keep the preset-row active/inactive styling header-local
- document any future change in terms of measured row height, gap, and insets rather than only selector changes

If this prototype direction is later discarded:

- remove the second visual-only preset row
- remove the two-column prototype cluster
- keep the underlying header ownership split and tokenization in place
- preferred approach: **staged ownership clarification, not a broad CSS rewrite**

## Implemented Header Lock-In - 2026-03-27

This thread now has a settled production header-only implementation in:

- `src/components/layout/TopBar.tsx`
- `src/components/layout/topBar.css`

### Locked-in production shape

- the header no longer uses the legacy `.topbar` shell as its root
- the live root is `topbar-strip`, which renders:
  - one brand pane
  - five middle spacer panes
  - one right action pane
- the right action pane width remains tied to `var(--sidebar-width-right)`, preserving the existing sidebar-width contract
- the parent header pane height remains contracted to the existing button-plus-padding height contract:
  - `calc(var(--compact-control-height) + (2 * var(--space-3)))`

### Locked-in brand behavior

- `dmsGIS` remains the primary brand line
- `Dench | Co` is the subtitle line
- the subtitle remains normal text, not stretched glyph-by-glyph across the line
- the gap between `dmsGIS` and `Dench | Co` is flexible inside the fixed-height brand pane
- the title row and subtitle row now share the same inner brand width, which gives the vertical gap a more intentional visual balance

### Tokenized header-owned styling

The settled header-owned tokens now live in `src/components/layout/topBar.css`, including:

- `--topbar-pane-gap`
- `--topbar-pane-height`
- `--topbar-pane-padding-x`
- `--topbar-pane-padding-y`
- `--topbar-pane-shadow`
- `--topbar-spacer-surface-top`
- `--topbar-spacer-surface-bottom`
- `--topbar-actions-gap`
- `--topbar-brand-font-scale`
- `--topbar-brand-letter-spacing`
- `--topbar-brand-subtitle-font-size`
- `--topbar-brand-subtitle-line-height`
- `--topbar-brand-subtitle-color`
- `--topbar-brand-color-d`
- `--topbar-brand-color-m`
- `--topbar-brand-color-s`
- `--topbar-brand-color-gis`

### Cleanup/tidy improvements completed here

- removed dependence on the legacy `.topbar` root shell for the live header
- moved settled header layout ownership into `src/components/layout/topBar.css`
- tokenized pane shadow and spacer-surface treatment so header pane presentation is easier to tune without re-editing raw gradient/shadow values
- replaced overlapping live class usage with more header-local names where it mattered for stability:
  - `topbar-brand__stack`
  - `topbar-strip__actions`
- normalized the action buttons through one `ACTION_LABELS` list and one click dispatcher in `TopBar.tsx`

### Live verification

The final tuning was verified against the live dev server using Playwright on:

- `http://127.0.0.1:4173/dmsGIS/`

Relevant verified outcomes from the settled state:

- brand pane height remains `58px`
- title/subtitle remain inside that fixed pane-height contract
- `dmsGIS` is slightly larger than the earlier locked version
- `dmsGIS` and `Dench | Co` share the same inner brand width
- all seven header panes intentionally share the same pane shadow treatment

### Recommended later cleanup once dual development is no longer ongoing

Do not do this during the current parallel work unless it becomes necessary.

Once dual development pressure is lower, the tidy follow-up should be:

1. Audit whether the old global header selectors are still needed at all:
   - `src/styles/global.css`
   - especially legacy `.topbar*` selectors
2. If no longer required by active production surfaces, remove or retire the legacy global header selectors.
3. Keep `TopBar` styling fully owned by `src/components/layout/topBar.css`.
4. Re-check whether any remaining header-related button sizing rules should stay global or move fully into header-owned styles.

The important cleanup rule is:

- do not reintroduce shared-name collisions between the settled live header and the old global header selectors once the current parallel work has finished

## Header versioning note - 2026-03-28

The current header has now been versioned conceptually as:

- `v2`: the settled baseline reached in this thread
- `v3`: the active continuation path for further header-only iteration

### Why this was done this way

This checkout currently has unrelated active work in the map/runtime area. To avoid unnecessary file churn or accidental overlap, the header was versioned by:

- freezing the current settled header contract as the documented `v2` baseline
- marking the active implementation in code as `v3`
- keeping the active header files unchanged in place:
  - `src/components/layout/TopBar.tsx`
  - `src/components/layout/topBar.css`

This keeps the current UI thread moving without duplicating or renaming production files in a dirty multi-thread worktree.

### Practical rule going forward

- treat the current documented header baseline as `v2`
- treat any further header-only iteration in the active files as `v3`
- if a future cutover needs a true file-level split, do that from a cleaner repo state rather than while unrelated production work is already in flight

## Locked v3 state - 2026-03-28

This is the active locked header state at the end of the current thread.

Active files:

- `src/components/layout/TopBar.tsx`
- `src/components/layout/topBar.css`

### Current v3 structure

- brand pane on the left
- a two-row central cluster spanning the first two middle columns
- three titled middle panes after the cluster:
  - `Services`
  - `Combined Practice`
  - `Population at Risk (PAR)`
- right action pane aligned to the sidebar width contract

### Current central-cluster shape

Top row:

- one merged top pane across both cluster columns
- internal `2 x 1` facility grid inside the default pane padding
- facility name at the top
- region name at the bottom
- pager moved into the merged top pane, bottom-right aligned against the default inner margins

Bottom row:

- one merged lower pane
- shows only the formatted board label:
  - `ICB: ...`
  - `Health Board: ...`
- lower pane width is now driven by the board-label max width plus default left/right margins, not by pager width

### Current token/geometry notes

- cluster pane-to-pane gap remains on the default rhythm:
  - `--topbar-cluster-pane-gap: var(--space-3)`
- internal facility-grid gap is intentionally `0`
- lower board-row internal gap is intentionally `0`
- header pane shadow is reduced from the shared control shadow via a header-local token

### Current typography notes

- `Dench | Co` baseline is intentionally lowered slightly so the text body sits on the lower margin and the `|` can overrun it
- the lower `ICB/Health Board:` line is also intentionally lowered slightly and allowed to overflow visibly so descenders can hang below the margin instead of clipping
- pager label and arrow glyphs have small separate optical offsets

### Restart rule

If a later thread resumes header work, treat this `Locked v3 state` section as the current truth before making more changes.

## Restart note - 2026-03-29

Current preset ownership has now moved into the header action pane:

- the second row of header action buttons (`Current`, `SJC JMC`, `COA 3a`, `COA 3b`) is no longer placeholder-only
- those buttons now call `activateViewPreset(...)` directly from `TopBar.tsx`
- the duplicate four-button preset row has been removed from the right sidebar
- the separate `DPHC Estimate COA Playground` control remains in the sidebar and still activates `coa3c` plus the playground workspace

Practical restart rule:

- treat the header action-pane preset row as the source of truth for standard preset switching
- do not reintroduce a duplicate Current-to-COA-3b preset row in the sidebar unless header ownership is intentionally reversed
- keep playground entry divorced from the header preset row:
  - the header row reflects `activeStandardViewPreset`
  - playground buttons may change runtime `activeViewPreset` / `activeScenarioWorkspaceId`
  - but they should not repaint the header preset-button active state
