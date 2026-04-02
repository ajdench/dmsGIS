# Agent Continuation Protocol

This document defines how work should be transferred cleanly between coding agents such as Codex and Claude Code.

The goal is seamless continuation with as little rediscovery as possible.

This protocol is intentionally explicit so a human operator can issue mission-command style instructions while preserving consistency.

## Mission-Command Principle

Agents should be given:

- the current objective
- the relevant boundaries
- the current source of truth
- the current constraints

Then they should be allowed to execute autonomously within those bounds.

Mission-command works well in this repo if the following are maintained:

- current architecture docs are up to date
- pane truth is documented
- deferred bugs are documented
- the active replacement strategy is documented
- checkpoints exist in `jj`

## Read Order For Any New Agent

Every new agent session should begin by reading:

1. `AGENTS.md`
2. `README.md`
3. `docs/agent-handover.md`
4. `docs/main-repo-review-2026-03-31.md`
5. `docs/map-runtime-architecture-map-2026-04-02.md`
6. `docs/sidebar-pane-status.md`
7. `docs/prototype-to-production-playbook.md`
8. `docs/agent-continuation-protocol.md`
9. `docs/current-app-baseline-v3.8.md`
10. `docs/current-app-baseline-v3.7.md`
11. `docs/current-app-baseline-v3.6.md`
12. `docs/current-app-baseline-v3.5.md`
13. `docs/current-app-baseline-v3.4.md`
14. `docs/v3.4-internal-gap-regression.md`
15. `docs/v3.5-full-geometry-redress.md`
16. `docs/v3.8-bsc-runtime-family-spec.md`
17. `docs/v3.7-next-phase.md`
18. `docs/canonical-board-rebuild-workflow.md`
19. `docs/sidebar-parity-bugs.md`

If the task touches historical sidebar context or reset rationale, also read:

11. `docs/sidebar-production-reset-plan.md`
12. `docs/sidebar-thread-reactivation.md`

If the task touches the prototype contract directly, also read:

13. `src/prototypes/sidebarPrototype/PROMOTION.md`
14. `src/prototypes/sidebarPrototype/PROMOTION_BOUNDARY.md`
15. `src/prototypes/sidebarPrototype/PRODUCTION_PREPARATION.md`

If the task touches geometry, basemap alignment, preprocessing, or coastal/product conformance, `docs/current-app-baseline-v3.8.md` is required reading.

If the task touches Playground runtime authority, map interaction performance, or future map-runtime optimization work, also read:

- `docs/map-runtime-architecture-map-2026-04-02.md`

If the task is continuing the `v3.8` geometry path or needs the rebuild rationale, also read:

- `docs/current-app-baseline-v3.7.md`
- `docs/current-app-baseline-v3.6.md`
- `docs/current-app-baseline-v3.5.md`
- `docs/current-app-baseline-v3.4.md`
- `docs/v3.4-internal-gap-regression.md`
- `docs/v3.5-full-geometry-redress.md`
- `docs/v3.8-bsc-runtime-family-spec.md`

## Codex And Claude Code: Shared Operating Rules

These rules are tool-agnostic and apply to both.

### 1. Checkpoint discipline

After every logical completed change:

- checkpoint with `jj`

Do not leave meaningful work only in the working copy if it can be described and checkpointed.

### 2. Findings-and-approach pass

Before substantial UI, interaction, architecture, or shared-pattern changes:

- summarize what is wrong
- summarize the likely cause
- summarize the intended corrective pattern

Then implement.

### 3. Shared-shell before pane-local tweaks

If the issue appears across multiple panes:

- inspect shared exact-shell components first
- do not immediately patch one pane in isolation

### 4. Real state/runtime over fake UI locality

If a control is supposed to be local to one child row:

- the underlying production state must actually support that locality
- do not leave the UI pretending to be local while still broadcasting globally

### 5. Documentation is part of the change

If architecture, pane truth, process, or deferred bugs changed:

- update the canonical docs in the same working session

### 6. Build is the release gate

Always treat:

- `npm run build`

as the final release gate.

`typecheck` and focused tests are useful, but not the final gate.

## When To Ask Questions

Questions should be minimal and dependency-aware.

Ask questions when:

- there is a meaningful strategic choice
- the requested behavior could plausibly mean two different implementations
- the user’s answer materially changes architecture, parity rules, or workflow

Do not ask questions when:

- the answer can be derived from current repo state
- the issue is clearly local and low-risk
- the user has already given the working rule in prior repo guidance

## Required End-Of-Session Handover Actions

Before stopping after non-trivial work:

1. checkpoint with `jj`
2. update docs if needed
3. record any deferred issues in `docs/sidebar-parity-bugs.md`
4. update `docs/sidebar-pane-status.md` if the live pane truth changed
5. update `docs/agent-handover.md` if the strategic picture changed
6. update `docs/agent-continuation-protocol.md` if the working method changed

## Required Documentation Surfaces

These are the canonical docs that should stay current for seamless transfer:

- `docs/agent-handover.md`
- `docs/sidebar-pane-status.md`
- `docs/prototype-to-production-playbook.md`
- `docs/agent-continuation-protocol.md`
- `docs/current-app-baseline-v3.8.md`
- `docs/current-app-baseline-v3.7.md`
- `docs/current-app-baseline-v3.6.md`
- `docs/current-app-baseline-v3.5.md`
- `docs/current-app-baseline-v3.4.md`
- `docs/v3.4-internal-gap-regression.md`
- `docs/v3.5-full-geometry-redress.md`
- `docs/v3.8-bsc-runtime-family-spec.md`
- `docs/v3.7-next-phase.md`
- `docs/canonical-board-rebuild-workflow.md`
- `docs/sidebar-parity-bugs.md`

These are index/routing docs and should stay aligned:

- `README.md`
- `AGENTS.md`

## Restart Note Format

If a session stops in the middle of meaningful work, leave a restart note using this structure inside the most relevant canonical doc or a dedicated restart note:

1. objective
2. current state
3. exact files changed
4. what is already validated
5. remaining blockers
6. immediate next step

Keep it factual and short.

## How To Document For Seamless Transfer

When documenting active development:

### Stable principles go here

- `AGENTS.md`
- `docs/prototype-to-production-playbook.md`
- `docs/agent-continuation-protocol.md`

### Current truth goes here

- `docs/agent-handover.md`
- `docs/sidebar-pane-status.md`

### Deferred defects go here

- `docs/sidebar-parity-bugs.md`

### Historical rationale goes here

- `docs/sidebar-production-reset-plan.md`
- `docs/sidebar-thread-reactivation.md`

Do not mix all four categories into one document.

That is the main protection against documentation rot.

## Codex-Specific Notes

- use `jj` for local checkpointing in this repo
- keep production and prototype separate unless promotion is explicit
- update docs before any user-requested Git-facing commit flow

## Claude Code-Specific Notes

Claude Code should follow the same repo rules:

- use the canonical docs above as the source of truth
- respect the prototype/production boundary
- checkpoint equivalent logical milestones
- leave explicit restart notes and deferred-bug notes rather than relying on thread memory
- treat `npm run build` as the release gate

If Claude Code uses a different local checkpointing style, the operator should still require the equivalent of:

- logical milestone checkpointing
- explicit handover notes
- current-truth doc updates

## Operator Guidance

If the human operator is handing off between agents, a good short prompt is:

> Read `AGENTS.md`, `README.md`, `docs/agent-handover.md`, `docs/sidebar-pane-status.md`, `docs/prototype-to-production-playbook.md`, and `docs/current-app-baseline-v3.8.md` first. If the task touches geometry or basemap conformance, also read `docs/current-app-baseline-v3.7.md`, `docs/current-app-baseline-v3.6.md`, `docs/current-app-baseline-v3.5.md`, `docs/current-app-baseline-v3.4.md`, `docs/v3.4-internal-gap-regression.md`, `docs/v3.5-full-geometry-redress.md`, and `docs/v3.8-bsc-runtime-family-spec.md` before doing work. Continue from the live production exact-sidebar path, not the older provisional sidebar path. Update canonical docs and checkpoint with `jj` after each logical change.

That prompt should usually be enough to re-establish the correct working frame.
