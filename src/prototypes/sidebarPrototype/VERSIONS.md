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

`v2` begins immediately after the `v1` checkpoint.

Working rule:

- treat the new `@` working copy created after the `v1` checkpoint as the start of `v2` development
- only record another numbered version when the next coherent reviewable milestone is reached
