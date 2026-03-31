# Prototype Blockers

This prototype lane previously had TypeScript/build blockers that were separate from the production app work.

Current status:

- the previously recorded prototype-only build blockers are now resolved
- prototype field-builder callbacks are now aligned with the extracted style-state domain types
- `SidebarPrototypeApp.tsx` has the required prototype control imports back in scope
- full repo `npm run build` now passes again
- current sidebar-prototype work is in a visual calibration phase, not a blocker phase

What this means:

- recent production architecture work was not the cause of the earlier full-build failure
- the prototype lane can continue without leaving the shared release gate red
- future prototype blockers should still be handled in the prototype lane, not by weakening production typing
- current design-tuning items should be documented in neutral review language rather than tracked here as bugs unless they genuinely block validation, build, or promotion work

Recommended prototype follow-up:

1. Keep `npm run build` as the shared release gate after prototype refactors, not just `npm run typecheck`.
2. Keep extracted prototype modules (`PrototypeControls.tsx`, `popoverFields.ts`, `prototypeStyleState.ts`) aligned so callback contracts stay typed end-to-end.
3. Add or retain focused tests when shared row-shell or field-builder behavior changes.
4. Record current visual tuning areas in `README.md` / `VERSIONS.md` as calibration notes rather than adding them here unless they become true blockers.
