# Main Repo Review And Optimisation Assessment

Date:

- `2026-03-31`

Repo reviewed:

- `/Users/andrew/Projects/dmsGIS`

Scope:

- current runtime geometry and product routing
- Playground runtime behavior
- geometry/contracts build path
- runtime token / compare-family governance
- UI/runtime integration risk
- publish/readiness and repo-state risk

This is a review note, not a closure note.

## Executive Summary

The repo is functional, but it currently has one structural problem that amplifies several others:

- review-family runtime data is effectively acting as production

That matters because the app, tests, and GitHub Pages deployment can all be green while the actual runtime behavior is still unstable or ambiguous.

The most important current risks are:

1. runtime product governance drift
2. Playground assignment authority drift
3. oversized orchestration seams
4. review-build sandbox leakage
5. validation that proves builds, but not live correctness

## Findings

### 1. Review Family Has Become The Effective Live Runtime

Severity:

- high

Evidence:

- `src/lib/config/runtimeMapProducts.json`
  - `activeProductId: "sharedFoundationReview"`
- `tests/runtimeMapProducts.test.ts`
  - explicitly expects `sharedFoundationReview` to be active

But multiple docs still say the opposite:

- `docs/current-app-baseline-v3.8.md`
  - says active runtime token is `baseline`
- `docs/agent-handover.md`
  - older sections still refer to `baseline` as active

Why this matters:

- “review” data is being treated as live runtime
- future debugging gets confused about whether a bug belongs to:
  - accepted production baseline
  - temporary compare family
  - in-progress review build

Practical effect:

- a user can experience a regression and reasonably think it “came from nowhere”
- the repo currently makes that confusion likely

Recommendation:

- decide one truth and make it explicit:
  - either `sharedFoundationReview` is now the accepted live baseline and should be renamed/promoted accordingly
  - or the active token should go back to `baseline`
- stop using a `review`-named product as the long-lived default runtime unless that is a conscious permanent decision

### 2. Playground Still Has Too Many Competing Authorities For Region Identity

Severity:

- high

Key files:

- `src/features/map/MapWorkspace.tsx`
- `src/features/map/scenarioWorkspaceRuntime.ts`
- `src/features/map/playgroundSelection.ts`
- `src/features/map/lookupSources.ts`
- `src/features/map/derivedScenarioOutlineSource.ts`
- `src/store/appStore.ts`

Observed authorities include:

- feature properties on live board features
- runtime assignment source
- baseline assignment source
- draft overrides
- `scenarioWorkspaceEditor.selectedScenarioRegionId`
- `scenarioWorkspaceEditor.pendingScenarioRegionId`
- `scenarioAssignmentPopover.selectedRegionId`
- store `selection.scenarioRegionId`
- derived outline source built from runtime assignment

Why this matters:

- grey-fill regressions become possible when board fills lose the correct Region mapping
- reassignment can look like it has not stuck even if the draft changed
- facility points can appear correct while fills are wrong because they are not using exactly the same authority path

This is the clearest runtime architecture weakness in the repo today.

Recommendation:

- define one authoritative Region-assignment source per Playground render cycle
- make everything else derive from that:
  - board fill
  - selected Region border
  - popover default selection
  - facility remapping
  - metrics

### 3. The Two Biggest Runtime Orchestrators Are Still Too Large

Severity:

- medium-high

Measured file sizes:

- `src/features/map/MapWorkspace.tsx`
  - `2222` lines
- `src/store/appStore.ts`
  - `2057` lines

By contrast:

- `src/features/map/overlayBoundaryReconciliation.ts`
  - `186` lines
- `src/features/map/runtimeLayerReconciliation.ts`
  - `72` lines

Interpretation:

- many good seams have already been extracted
- but the remaining central orchestration files are still carrying too many cross-cutting responsibilities

In `MapWorkspace.tsx`, the most brittle combined seam is:

- Playground assignment source selection
- boundary click handling
- selection/highlight synchronization
- derived outline refresh
- diagnostics exposure

In `appStore.ts`, the store still mixes:

- base preset state
- scenario workspace drafts
- editor interaction state
- selection state
- saved view state
- notices and UI mode

Recommendation:

- do not broad-rewrite them in one pass
- but continue extracting the highest-risk authority seams:
  - Playground runtime authority
  - boundary selection authority
  - scenario draft/editor selection authority

### 4. The Review-Family Builder Is Not Fully Sandbox-Safe

Severity:

- medium-high

Key file:

- `scripts/build-shared-foundation-review-family.mjs`

The builder does the right high-level thing:

- copies runtime trees into `public/data/compare/shared-foundation-review/`
- rebuilds review products there

But the repo already documents a real caveat:

- `docs/shared-foundation-review-execution-log.md`

That log states that some subprocesses still touch shared preprocessing outputs, especially around split/current legacy paths.

Why this matters:

- a “non-destructive review build” is only non-destructive at the runtime token level
- it is not fully sandboxed from shared preprocessing side effects

Recommendation:

- tighten every called build script so it can run entirely from explicit staged dirs
- treat “copies files into compare family” and “mutates shared preprocess outputs” as incompatible states

### 5. Validation Is Strong On Build Health But Weak On Live Runtime Correctness

Severity:

- medium-high

The repo has strong unit coverage.

Examples:

- `tests/runtimeMapProducts.test.ts`
- `tests/scenarioWorkspaceRuntime.test.ts`
- `tests/playgroundSelection.test.ts`
- `tests/runtimeGeometryValidation.test.ts`
- many focused map/runtime unit tests

But the validation still has a major gap:

- the suite can go green while live map behavior is wrong

Examples already seen in this repo:

- selected Region behavior drifting while tests/build pass
- grey-fill Playground runtime bug despite green build
- reassignment-not-sticking behavior despite green store/runtime tests

Why:

- many tests assert local contracts, not end-to-end rendered truth
- there is little browser-level coverage of:
  - reassign board
  - reload/re-enter Playground
  - verify fill colour persists
  - verify selected Region border matches new assignment

Recommendation:

- add a very small number of high-value browser/runtime assertions
- especially:
  1. board reassignment sticks after immediate reselect
  2. board reassignment survives reload/re-entry
  3. no grey fallback boards after a known edit/reload path

### 6. Documentation Truth Has Drifted

Severity:

- medium

The repo has excellent documentation volume.

But several docs disagree with live code/config on important current-truth points:

- active runtime token
- whether baseline or review family is live
- which fixes are fully closed versus partially closed

Why this matters:

- new agents can follow the wrong “current truth”
- regressions can be misattributed to geometry or deployment when the real issue is runtime token choice

Recommendation:

- keep historical rationale
- but make one file authoritative for:
  - active runtime family
  - active dev server expectation
  - currently unresolved top-priority bugs

### 7. Local Git/JJ State Is Recoverable But Operationally Messy

Severity:

- medium

Current local Git read:

- working from detached `HEAD`
- multiple publish/review branches remain in the repo
- `main` is behind the current detached state

That is recoverable, but it increases operator confusion.

Recommendation:

- once the current review pass settles, create one stable working branch for ongoing local work
- avoid long-running detached-HEAD development for the main working copy

### 8. The Project Has A Healthy Direction, But Runtime Promotion Discipline Is Weaker Than Build Discipline

Severity:

- medium

The good news:

- the project now has a coherent typed configuration model
- reusable runtime seams exist
- geometry work is much better documented than before
- compare/review families were introduced instead of mutating everything in place

The weakness:

- runtime product promotion is still too informal
- review-family activation and documentation promotion have drifted apart

Recommendation:

- add an explicit promotion rule:
  - compare family
  - accepted review family
  - live baseline
- those should be named and documented as distinct states

## Optimisation Assessment

### Architecture optimisations

1. Reduce Playground assignment authorities to one source of truth.
2. Keep static scenario products preprocess-owned and simple.
3. Continue shrinking `MapWorkspace.tsx` at the authority seams, not randomly.
4. Separate “accepted runtime product” from “inspection family” more strictly.

### Validation optimisations

1. Keep `npm run build` as release gate.
2. Add two or three browser/runtime regression tests for Playground.
3. Add one assertion that active runtime token matches documented accepted runtime state.

### Operational optimisations

1. Stop leaving the main working repo on detached `HEAD` for long periods.
2. Use a named working branch for current local review/debug work.
3. Treat GitHub Pages deploy as a deliberate release act, not just proof that build succeeded.

## Suggested Success Path

Recommended order:

1. Decide whether `sharedFoundationReview` is:
   - temporary review
   - or the new accepted runtime baseline
2. Make code, tests, and docs agree on that one decision.
3. Keep the new Playground diagnostics in place until the grey-fill bug is fully explained.
4. Add one true integration test for Playground reassignment persistence.
5. Only after that, continue larger geometry/runtime promotion work.

## Immediate Recommended Focus

If the goal is stability, the next best focus is:

1. fix the remaining Playground runtime bug
2. clarify live runtime product governance
3. stop further broad geometry/runtime promotion until those two are settled

That is the highest-value stabilization path for the repo as it stands today.

