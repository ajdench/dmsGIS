# Geo Web App

A static-first geospatial web application for viewing UK facility datasets, toggling prepared overlays, grouping facilities, adjusting labels, saving named map configurations, and exporting map images.

## Purpose

This project provides a browser-based operational map workspace that sits between full GIS tooling and simple map viewers.

Heavy geospatial preparation happens outside the app in QGIS or equivalent. The web app focuses on configuration, presentation, selection, grouping, label control, saving, and export.

## Recommended stack

- React
- TypeScript
- Vite
- OpenLayers
- Zustand
- Zod
- Vitest
- Playwright

## Quick start

```bash
npm install
npm run dev
```

## Useful commands

```bash
npm run build
npm run typecheck
npm run lint
npm run test
npm run test:e2e
jj status
```

## Deployment target

- GitHub Pages: https://ajdench.github.io/dmsGIS/

## Documents

- `docs/specification.md`
- `AGENTS.md`
- `.codex/config.toml`
- `docs/prompts/`

## Notes

- Runtime layer load/error status is surfaced in the active right sidebar.
- Boundary overlay ordering is explicit so populated, unpopulated, and care-board layers render consistently.
- Store coverage now includes PMC/global region styling behavior in `tests/appStore.test.ts`.
- Visible preset labels are `Current`, `SJC JMC`, `COA 3a`, and `COA 3b`.
- Right sidebar width is derived from the top-bar action-button span plus `0.75rem` side gutters so the internal white panes align cleanly inside the grey container.
- The right sidebar pane is named `Overlays`; in `SJC JMC`, `COA 3a`, and `COA 3b` it is intentionally empty for now while PMC points remain active on the map.
- The workspace keeps the right sidebar fixed-width and uses horizontal overflow at narrow widths instead of stacking the sidebar below the map.
- Point tooltip paging is based on visible screen-space overlap at the current zoom and current symbol size/shape, with the nearest clicked facility shown first.
- Current scenario architecture is moving toward distinct overlay families and data-driven scenario assignment:
  - ICB / HB boundaries
  - JMC / scenario regions
  - future NHS regions
  - future custom/manual regions
- Deployment direction is static-first and container-friendly: the app should build to compiled static assets that can be served from a minimal Docker image.
- Future authenticated features should sit behind a storage/auth abstraction so profile-backed saved states and cross-user sharing can be added without changing the core map architecture.
- Current scenario datasets include:
  - `UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson`
  - `UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson`
  - `UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson`
- `jj` (Jujutsu) is installed and this repo is initialized as a colocated Git/JJ repo, so both `git` and `jj` commands can be used in the same working directory.
- The local JJ bookmark `main` is tracking `main@origin`.
