# Sidebar Prototype Reactivation

Use this note when restarting the sidebar prototype thread after Codex, terminal, or machine restart.

This is a continuity document, not a bug list.

## Read order

1. `src/prototypes/sidebarPrototype/README.md`
2. `src/prototypes/sidebarPrototype/VERSIONS.md`
3. `src/prototypes/sidebarPrototype/BLOCKERS.md`
4. `src/prototypes/sidebarPrototype/PROMOTION.md`
5. `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
6. `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`

## First checks

Run:

```bash
jj status
npm run typecheck
```

If the work is prototype-facing or promotion-facing, also run:

```bash
npm run build
```

## Current operating frame

- Treat current swatch, pill, and shape work as visual calibration unless something is actually blocking build, validation, or promotion.
- Keep prototype work inside `src/prototypes/sidebarPrototype/` unless the task is explicit production promotion.
- Before coding non-trivial changes, summarize:
  - the current finding
  - the likely cause
  - the corrective pattern
- If clarification is needed, keep it minimal.
- If more than three questions are needed, ask them one at a time in dependency order.

## Current prototype emphasis

- preserve the approved sidebar visual language
- preserve the pill-driven popover interaction model
- preserve the shared row-shell and right-edge-slot layout contract
- keep shape-button silhouettes and pill swatches as separately tuned renderers
- keep the locked compact-control token values and swatch-pill geometry in `prototype.css` unless there is a deliberate recalibration pass
- keep top-bar action-button sizing and preset-row button sizing on separate internal mode lanes unless there is a deliberate decision to reunify them
- current split button-size mode state is top bar `current`, preset row `midLow`
- keep popover section titles on the shared `--font-size-popover-title` token
- keep documentation neutral about calibration areas rather than phrasing them as defects by default

## Suggested restart prompt

Use this when reactivating the thread:

> Resume the sidebar prototype thread. Read `src/prototypes/sidebarPrototype/README.md`, `VERSIONS.md`, `BLOCKERS.md`, `PROMOTION.md`, `PROMOTION_BOUNDARY.md`, and `PRODUCTION_PREPARATION.md` first, then run `jj status` and `npm run typecheck`. Treat current swatch, pill, and shape work as design calibration unless it blocks validation or promotion. Before coding, summarize the current finding, likely cause, and corrective pattern.

## Promotion reminder

The prototype is the approved target direction for the production sidebar:

- visually
- interaction-wise
- structurally

Promotion should still happen in controlled slices through production-owned components and state seams rather than by copying prototype files wholesale.
