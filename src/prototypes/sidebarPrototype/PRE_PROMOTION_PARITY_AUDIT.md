# Sidebar Pre-Promotion Parity Audit

This note records the current production-versus-prototype parity review.

It is not the promotion plan itself. It is the parity gate that says whether production is aligned enough for the approved prototype to become the production sidebar without carrying obvious visual or interaction drift.

Use this file together with:

- `src/prototypes/sidebarPrototype/PROMOTION.md`

Division of responsibility:

- `PROMOTION.md` defines the replacement path
- `PRE_PROMOTION_PARITY_AUDIT.md` records the current parity state and the remaining blockers

## Scope Reviewed

Prototype:

- `src/prototypes/sidebarPrototype/`

Production:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`
- `src/components/sidebar/SidebarMetricPill.tsx`
- `src/components/sidebar/SidebarToggleButton.tsx`
- `src/components/sidebar/SidebarTrailingSlot.tsx`
- `src/components/sidebar/SidebarPopover.tsx`
- `src/features/basemap/BasemapPanel.tsx`
- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`
- `src/features/labels/LabelPanel.tsx`
- `src/features/groups/OverlayPanel.tsx`
- `src/lib/sidebar/floatingCallout.ts`
- `src/styles/global.css`
- `src/store/appStore.ts`

## Review Method

This audit used:

- code review of current prototype and production sidebar seams
- live DOM inspection of the prototype page and production app through the local Vite server
- direct rendered-geometry checks for header rails, pills, toggles, chevrons, handles, and popover placement

This follows the repo rule to prefer measured rendered geometry over continued CSS inference when alignment and interaction drift become non-trivial.

## Completed Hardening Since The Earlier Audit

The following older blockers are no longer true and should not be treated as current production state:

1. Facilities / PMC is no longer on the old bespoke shell path.
   Production now routes Facilities and PMC through the shared sidebar shell and row model rather than `details` / `summary` and pane-local popover markup.

2. Production already completed a real shared-shell hardening pass.
   The repo now has shared production-owned primitives for the pane shell, toggle, pill, trailing slot, and shared control sections. The question is no longer whether shared-shell hardening should begin. It has begun and is already in use.

3. Production is no longer pre-hardening.
   The current state is mid-replacement: some shared primitives and pane surfaces are now much closer to the prototype, but exact parity is still incomplete.

## Current Findings

### 1. Shared primitive parity is improved, but still not fully locked

Production now has prototype-like shared primitives for:

- pane header rail
- toggle pill
- metric pill
- disclosure chevron
- drag-handle lane

But exact parity still remains incomplete in the smallest shared details:

- final toggle text sizing and optical centering
- exact pill width / swatch / value spacing
- exact pane header lane alignment across all pane states
- exact chevron / handle optical weight and spacing in every pane context

Conclusion:

- the shared primitive layer is no longer the old blocker it was
- but it is still an active parity surface and must be treated as part of the replacement work, not as solved infrastructure

### 2. Parent toggle behavior must be re-evaluated live, not inferred from the older audit snapshot

An earlier audit captured a specific runtime mismatch such as:

- prototype `Facilities`: `On`
- prototype `PMC`: `On`
- production `Facilities`: `Ox`
- production `PMC`: `Ox`

That historical observation should not be treated as the current truth without re-measurement.

Production now explicitly derives parent visibility from immediate children in the shared/sidebar-owned path, especially in:

- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`

Conclusion:

- parent-toggle behavior remains a parity gate
- but the current judgment must come from fresh live comparison, not from the earlier captured state alone

### 3. Popover attachment remains a live parity concern

Production now has the promoted floating callout helper and shared popover shell.

That is progress, but the parity question is still visual and behavioral:

- is the popover visibly attached to the pill?
- does the triangle stay aligned through scroll?
- does the gap and offset match the prototype closely enough?

Conclusion:

- popover attachment is still a real gate
- but the blocker is now “final attachment parity”, not “the shared popover path does not exist”

### 4. Facilities / PMC is no longer structurally blocked, but still needs exact parity review

Facilities / PMC used to be the clearest structural production drift source.

That is no longer the right description.

Current reality:

- the old bespoke shell path has been replaced
- Facilities and PMC now participate in the shared production sidebar model
- they still need exact parity review for layout, hierarchy feel, and control geometry

Conclusion:

- Facilities / PMC remains a parity review surface
- but it is no longer a pre-promotion architecture blocker in the old sense

### 5. The remaining blocker is now exactness, not architecture enablement

The repo is no longer in the phase of asking:

- “should production start a shared-shell hardening pass?”

It is now in the phase of asking:

- “is production visually and interaction-wise identical enough to the prototype?”

That means the remaining gaps are mostly:

- primitive exactness
- pane exactness
- final whole-sidebar geometry alignment

## Current Promotion Decision

Do not treat parity as complete yet.

But also do not treat production as still being in the old pre-hardening blocked state.

Updated decision:

- the prototype remains the approved replacement target
- production replacement work is already underway
- wholesale parity is not yet complete enough to declare success
- the remaining work is now exact replacement work, not preliminary shell enablement

## Current Required Parity Pass

Before declaring the prototype effectively promoted, production still needs:

1. exact shared primitive parity
   - toggle text sizing/placement
   - pill geometry
   - chevron / handle lane geometry
   - header rail height and spacing

2. exact pane-surface parity
   - Basemap
   - Labels
   - Overlays
   - Facilities / PMC final audit

3. final whole-sidebar parity sweep
   - side-by-side live comparison
   - final spacing/alignment corrections
   - no remaining visible “production approximation” surfaces

This is no longer a pre-promotion hardening pass in the old sense.
It is the last parity pass before the replacement can honestly be called complete.

## Gate To Proceed

Treat the sidebar as ready only when all of the following are true:

1. production sidebar primitives visually match the prototype closely enough that no obvious drift remains in toggles, pills, chevrons, handles, or header rails
2. popovers are visibly and structurally attached to the parent pills in production
3. parent toggle behavior matches the prototype in live use, based on fresh comparison rather than historic snapshots
4. Basemap, Labels, Overlays, and Facilities / PMC all read as the same UI system rather than a hybrid of prototype and older production patterns

Until then, promotion should remain blocked by parity risk, not by build/type failure.
