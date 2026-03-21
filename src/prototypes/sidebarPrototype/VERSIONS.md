# Sidebar Prototype Versions

This file records stable prototype milestones for the isolated sidebar workflow.

## v1

`v1` is the first complete sidebar prototype baseline intended to be treated as a reviewable saved state rather than an ad hoc working snapshot.

Characteristics captured in `v1`:

- production-shell layout without the OpenLayers map pane
- Radix accordion pane and sub-pane expansion
- explicit header control order:
  - `On/Off`
  - colour / opacity pill
  - chevron
- PMC global controls with local row overrides
- PMC row floating style editor with scroll-aware callout positioning
- grouped row editor controls:
  - `Points`
  - `Border`
- label sections promoted from simple colour/opacity rows into fuller style groups:
  - `Text`
  - `Border`
- mixed-state colour previews for divergent PMC colour values
- prototype-local styling and interaction tuning only

Saved-state rule:

- the `jj` commit labeled `Snapshot sidebar prototype v1` is the canonical saved `v1` baseline

## v2

`v2` is the second stable sidebar prototype milestone and is intended to capture the prototype in a production-preparation state rather than only an interaction-exploration state.

Characteristics captured in `v2`:

- pill-driven popovers for section-level controls inside panes
- non-collapsible section rows now standardized onto the sortable drag-handle slot
- PMC restored as a collapsible section because it still owns a visible child list
- PMC child-row reordering via a dedicated drag handle using `dnd-kit`
- Overlays treated as a family surface that can host either flat sortable rows or collapsible grouped sections with child items
- prototype-local preset-button styling where selected state intentionally matches hover background tone while reducing border emphasis
- common top-level pane-body bottom spacing applied through the shared pane-content rule
- shared row shells and pill-popover wiring extracted into `PrototypeControls.tsx` to reduce pane-specific markup duplication
- repeated popover field groups now route through config/build helpers plus a shared section renderer instead of duplicated field JSX
- popover field builders and rendering helpers are now separated into `popoverFields.tsx`, keeping the app shell focused on state and layout composition
- shared style-state types/defaults/update helpers are now separated into `prototypeStyleState.ts`, reducing pane-local state duplication
- focused prototype tests now cover shared row-shell interactions plus extracted field/state helpers
- pane-specific field builders are now split by pane instead of living in one catch-all module, and the prototype has an explicit promotion-boundary note

Saved-state rule:

- the `jj` commit labeled `Snapshot sidebar prototype v2` is the canonical saved `v2` baseline

## v3

`v3` begins immediately after the `v2` checkpoint.

Working rule:

- treat the new `@` working copy created after the `v2` checkpoint as the start of `v3` development
- only record another numbered version when the next coherent reviewable milestone is reached

Current `v3` emphasis:

- continue toward production-ready sidebar parity
- document current visual tuning neutrally as calibration work
- avoid treating active swatch/pill/shape polish work as blocker bugs unless it genuinely blocks build, validation, or promotion decisions
- use `REACTIVATION.md` as the restart handoff note for this active calibration phase
