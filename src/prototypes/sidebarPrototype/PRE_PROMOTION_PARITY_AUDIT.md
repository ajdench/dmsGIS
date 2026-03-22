# Sidebar Pre-Promotion Parity Audit

This note records the latest production-versus-prototype parity review.

It exists because the findings below do not belong in the main promotion plan itself. They are a pre-promotion audit gate.

Use this file when deciding whether the approved prototype is ready to be promoted wholesale into the production sidebar.

## Scope Reviewed

Prototype:

- `src/prototypes/sidebarPrototype/`

Production:

- `src/components/layout/RightSidebar.tsx`
- `src/components/sidebar/SidebarPanelShell.tsx`
- `src/components/sidebar/SidebarControlRow.tsx`
- `src/components/sidebar/SidebarControlSections.tsx`
- `src/components/sidebar/SidebarDragHandle.tsx`
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
- live DOM inspection against:
  - `http://127.0.0.1:5174/dmsGIS/sidebar-prototype.html`
  - `http://127.0.0.1:5174/dmsGIS/`
- direct geometry measurement of pills, swatches, toggles, and popover placement

This follows the repo rule to prefer measured rendered geometry over continued CSS inference when alignment and interaction drift become non-trivial.

## Findings

### 1. Pill swatch geometry is still not at parity

Measured `Land` pill geometry:

- prototype pill width: about `63.55px`
- production pill width: about `68.19px`
- prototype swatch size: about `12.39px`
- production swatch size: about `12.39px`

Conclusion:

- the swatch itself is effectively the same size
- the drift is in pill geometry, value width, or padding
- production and prototype are still not rendering the same pill contract

### 2. Parent toggle state is already drifting between prototype and production

Observed live state during review:

- prototype `Facilities`: `On`
- prototype `PMC`: `On`
- production `Facilities`: `Ox`
- production `PMC`: `Ox`

Conclusion:

- production is not merely visually different
- it is already expressing a different parent/child state model at runtime
- promotion should not proceed while this mismatch still exists

### 3. Popover attachment is still not trustworthy enough

Prototype live measurement:

- pill-to-popover gap: `12px`
- floating callout triangle stays attached to the pill through the shared callout shell and placement math

Production review:

- production uses `src/lib/sidebar/floatingCallout.ts`
- production popovers still sit inside a different shared shell and different pane/row composition path than the prototype
- the current production shell is therefore not yet guaranteed to preserve the prototype’s attached-callout behavior, even when the helper exists

Conclusion:

- the helper has been promoted
- the full attachment contract has not

### 4. Facilities / PMC remains the main production drift source

Current production Facilities path:

- `src/features/facilities/SelectionPanel.tsx`
- `src/features/groups/PmcPanel.tsx`

Current production pattern there still includes:

- older embedded container structure
- `details` / `summary`
- bespoke popover panel markup
- pane-local hierarchy behavior

Conclusion:

- this is still the clearest remaining source of production drift
- production is currently a hybrid of:
  - partially promoted shared sidebar primitives
  - older pane-local Facilities/PMC shell behavior

### 5. Shared-shell parity is not fully locked yet

Production already contains promoted pieces in:

- `src/components/sidebar/`

But the current review shows they are still not the full prototype contract.

Remaining drift still exists in:

- top-level pane shell behavior
- pill geometry
- parent-child toggle logic
- popover attachment behavior
- Facilities/PMC hierarchy structure

## Current Promotion Decision

Do not begin wholesale production replacement yet.

Reason:

- the prototype is ready
- the production app is not yet aligned enough at the shared-shell level

The correct next step is a bounded production parity pass before the full promotion sequence begins.

## Required Pre-Promotion Hardening Pass

Before wholesale promotion starts, production should first complete one explicit shared-shell parity pass.

That pass should lock:

1. production pill geometry to prototype pill geometry
2. production popover shell and attachment behavior to the prototype callout contract
3. production parent toggle logic and default hierarchy behavior to the prototype contract
4. production Facilities/PMC shell behavior to the same sidebar shell model already intended for the other panes

This is a pre-promotion hardening pass, not the full promotion itself.

## Gate To Proceed

Wholesale promotion should only begin after the following is true:

1. pill swatches and pill geometry visually match between prototype and production
2. popovers are visibly and structurally attached to the parent pills in production
3. parent toggle state behavior matches between prototype and production
4. Facilities/PMC no longer runs through an older bespoke shell path

Until then, promotion should remain blocked by parity risk rather than by type/build failure.

## Relationship To PROMOTION.md

Use this file together with:

- `src/prototypes/sidebarPrototype/PROMOTION.md`

Division of responsibility:

- `PROMOTION.md` defines the production replacement path
- `PRE_PROMOTION_PARITY_AUDIT.md` defines whether production is aligned enough to start that replacement safely
