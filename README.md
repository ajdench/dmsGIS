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

## Documents

- `docs/specification.md`
- `AGENTS.md`
- `.codex/config.toml`
- `docs/prompts/`

## Notes

This starter repo includes placeholder modules, fixture data, and manifests so Codex CLI can inspect and extend a coherent project structure from the first run.
