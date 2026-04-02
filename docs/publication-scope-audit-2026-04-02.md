# Publication Scope Audit

Date: `2026-04-02`

This note records the current publication-scope review for large compare families, raw source artifacts, and local-only rebuild material.

The goal is to keep the shipped runtime and recovery-critical assets clear, while avoiding accidental publication of diagnostic or staging-only material.

## Executive Summary

- keep the accepted live runtime family committed and published:
  - `public/data/compare/shared-foundation-review/`
- keep the stable public-root runtime contracts committed and published:
  - `public/data/manifests/`
  - `public/data/facilities/`
  - `public/data/regions/`
  - `public/data/basemaps/`
- treat these as historical compare families, not active shipped runtime:
  - `public/data/compare/bfe/`
  - `public/data/compare/current-east-bsc/`
- treat raw source and staged rebuild outputs as local-only by default:
  - `geopackages/`
  - `local-archive/`
- do not physically move or untrack the historical compare families or the tracked facilities geopackage without an explicit user decision

## Measured Inventory

Current measured on-disk size of the main candidates:

| Path | Size | Files | Current role |
| --- | ---: | ---: | --- |
| `public/data/compare/shared-foundation-review/` | `282.8 MB` | `112` | accepted live runtime family |
| `public/data/compare/bfe/` | `285.4 MB` | `97` | historical compare family |
| `public/data/compare/current-east-bsc/` | `255.8 MB` | `94` | historical inspection family |
| `facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg` | `116 KB` | `1` | provenance-only source artifact |

Other large tracked public-runtime roots are still live, so they are not current slimming candidates:

- `public/data/regions/` at roughly `193 MB`
- `public/data/basemaps/` at roughly `34 MB`

Size split inside each runtime family is dominated by `regions/`, not by manifests or facilities:

- `shared-foundation-review`: `regions 240.7 MB`, `basemaps 41.9 MB`
- `bfe`: `regions 241.9 MB`, `basemaps 43.5 MB`
- `current-east-bsc`: `regions 212.0 MB`, `basemaps 43.8 MB`

## Dependency Findings

### 1. The accepted live runtime is unambiguous

- `src/lib/config/runtimeMapProducts.json` currently keeps `acceptedV38` active
- that token resolves to `data/compare/shared-foundation-review`
- `tests/runtimeMapProducts.test.ts` and `tests/layersService.test.ts` enforce the stable manifest-root plus runtime-rewritten data-path contract

Practical meaning:

- `shared-foundation-review` is not a disposable inspection tree anymore
- it is the active shipped runtime root and should remain committed and published

### 2. The inactive compare families still matter, but not as live runtime

The repo still contains:

- `public/data/compare/bfe/`
- `public/data/compare/current-east-bsc/`

They are still referenced by:

- `src/lib/config/runtimeMapProducts.json`
- compare/build scripts such as `scripts/build-runtime-compare-family.mjs` and `scripts/build-current-east-bsc-family.mjs`
- handover and baseline docs that explain why they were built and why they were not accepted

One useful distinction between them now:

- `current-east-bsc` still carries `facilities/` and `manifests/`, matching its older inspection-family role
- `bfe` does not carry that fuller runtime-family shape under the current contract, which makes it the clearer future archive candidate of the two

Practical meaning:

- these families still matter for recovery, diagnostics, and rebuild provenance
- but they should not be treated as active public runtime products
- their continued presence under `public/data/compare/` is a governance convenience, not proof that they belong in the long-term published tree

### 3. The tracked facilities geopackage is not a runtime dependency

`facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg` appears in docs as source provenance, but the active runtime and refresh flow now center on:

- `public/data/facilities/facilities.geojson`
- `public/data/compare/shared-foundation-review/facilities/facilities.geojson`
- `npm run refresh:facilities`

Practical meaning:

- the tracked geopackage is now best understood as provenance-only input
- it is a candidate for later demotion into a local-only archive/source area

## Governance Recommendation

### Keep committed and published

- `public/data/compare/shared-foundation-review/`
- `public/data/manifests/`
- `public/data/facilities/`
- `public/data/regions/`
- `public/data/basemaps/`

Rule:

- if the current app ships it or the stable public runtime contract points at it, it stays committed and published

### Keep committed for now, but treat as historical compare/archive candidates

- `public/data/compare/bfe/`
- `public/data/compare/current-east-bsc/`

Rule:

- if the asset is historically useful for rebuild provenance, diagnostics, or recovery, keep it committed until an explicit archive/move decision is made
- but do not describe it as current runtime and do not let future docs imply it is part of the accepted public app surface

Preferred future path:

- move these trees into a non-published archive location after explicit approval
- leave short archive notes describing:
  - why the family was built
  - which script built it
  - why it was not accepted
  - which later family superseded it

### Keep local-only by default

- `geopackages/`
- `local-archive/`
- future raw source, staged rebuild, or one-off research inputs unless explicitly promoted into the shipped runtime tree

Rule:

- if the app does not ship it directly and recovery does not require it to remain in GitHub, prefer local-only storage

## Safe Changes Landed In This Pass

- added `local-archive/` to `.gitignore` as the reserved root for future local-only archive/source material
- clarified runtime-family labels in `src/lib/config/runtimeMapProducts.json` so the inactive families are visibly historical/diagnostic rather than just alternative live products
- updated README and handover docs so future cleanup can follow a written keep/archive/local-only policy instead of thread memory

## Decisions Still Requiring Explicit Approval

1. Whether to physically move `public/data/compare/bfe/` out of the published `public/` tree.
2. Whether to physically move `public/data/compare/current-east-bsc/` out of the published `public/` tree.
3. Whether to untrack `facilities/UK_SVOT_PMC_Codex_v6_gpkg.gpkg` and relocate it into local-only provenance storage.
4. Whether older non-canonical docs should later move into `docs/archive/`.

## Working Rule Until Those Decisions Are Made

- do not remove or relocate the inactive compare families casually
- do not treat them as accepted runtime
- do not publish new source/staging artifacts unless they are intentionally part of the shipped runtime contract
