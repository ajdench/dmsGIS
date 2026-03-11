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
- Right sidebar width is derived from the top-bar action-button span plus `0.75rem` side gutters so the internal white panes align cleanly inside the grey container.
