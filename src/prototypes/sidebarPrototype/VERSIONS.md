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
- popover field builders and rendering helpers are now separated into `popoverFields.ts`, keeping the app shell focused on state and layout composition
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
- keep compact control typography and swatch-pill geometry locked through the prototype-local token path in `prototype.css`
- keep popover section-title sizing on the shared global `--font-size-popover-title` token
- keep the rounded SVG diamond/triangle shape-button geometry as the locked prototype reference for future production point-shape promotion
- keep the pill-swatch debug-circle capability available in component code for future alignment checks, but disabled in normal prototype rendering
- keep pane-header and bordered-section-header alignment on the shared tokenized rule, using pane-edge offsets for top-level headers and `--prototype-subpane-border-compensation` for bordered internal headers
- keep top-level pane header rails locked to the same measured `48px` outer height as Land/Sea-style bordered rows via `--prototype-shared-header-outer-height`
- keep top-level drag handles locked to the measured row-handle column, and keep top-level chevrons in the visually approved measured position rather than forcing strict pill-right-edge alignment where that reads worse
- keep top-bar action-button sizing and preset-row button sizing on separate internal mode lanes so those two surfaces can be calibrated independently
- current split button-size mode state is:
  - top bar: `current`
  - preset row: `midLow`
- keep top-level pane `On/Off` controls as visibility-broadcast parents for the rows they own, while preserving local child toggles between parent changes
- keep internal parent rows such as `PMC` on the same visibility-broadcast pattern for their child rows
