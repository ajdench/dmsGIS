# Prototype Blockers

This prototype lane currently has TypeScript/build blockers that are separate from the production app work.

Current known blockers:

- `SidebarPrototypeApp.tsx` has callback type mismatches where strongly typed handlers are being passed to props that currently expect plain `string` / `string | number` signatures.
- `SidebarPrototypeApp.tsx` references `PrototypeColorField` and `PrototypeSliderControl`, but those names are not currently in scope at build time.

What this means:

- full repo `npm run build` is currently blocked by prototype-only typing issues
- recent production architecture work is not the cause of the full-build failure
- prototype fixes should be handled in the prototype lane, not by weakening production typing

Recommended prototype follow-up:

1. Tighten the relevant prop signatures so they accept the typed callback contracts already used by the prototype state helpers.
2. Restore or replace the missing `PrototypeColorField` and `PrototypeSliderControl` references.
3. Re-run full repo `npm run build` after the prototype fix, because that is the shared release gate.
