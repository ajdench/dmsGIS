# Geo Web App Technical Specification

## 1. Document purpose

This specification defines the target architecture, functional scope, data model, workflows, non-functional requirements, and development approach for a static-hosted geospatial web application intended to support configuration, visualisation, grouping, filtering, labelling, and export of UK-based facility maps and regional overlays.

The document is written for implementation with OpenAI Codex CLI as the primary AI-assisted development tool.

## 2. Product summary

The application is a browser-based mapping tool focused on:

- displaying UK geography and custom overlays
- loading facility point datasets with metadata
- toggling multiple administrative and internal regional layers
- grouping and filtering facilities through a simple GUI
- assigning facilities to custom logic sets and regional schemes
- controlling labels, placement offsets, and visibility rules
- saving named map configurations to a GitHub-backed store
- reopening saved configurations from a repository-backed list
- exporting static map images for documentation or reporting

## 3. Design principles

1. Static-first architecture
2. Configuration over authoring
3. Simple GUI for operational users
4. Portable geospatial formats
5. Deterministic saved state
6. Low operational cost
7. AI-friendly repo structure

## 4. Recommended stack

- React
- TypeScript
- Vite
- OpenLayers
- Zustand
- Zod
- Vitest
- Playwright

## 5. High-level architecture

- Frontend: static single-page application
- Hosting: GitHub Pages
- Map engine: OpenLayers
- Data delivery: static GeoJSON / TopoJSON / JSON manifests
- Configuration persistence: GitHub repository commits via a small serverless write service or GitHub API proxy
- Read path: direct fetch from repository contents or generated manifests
- Export: client-side raster export from current map canvas

## 6. Core functional requirements

- Interactive UK-centred map
- Layer visibility and opacity controls
- Facility search and selection
- Logical grouping panes
- Global and per-feature label controls
- Save/open configuration workflows
- PNG export of current map view

## 7. Persistence model

Saved configurations should be serializable JSON and include:

- map view
- active layers
- selected facilities
- group definitions
- filter definitions
- label overrides
- style overrides
- metadata such as name, author, version, timestamps

## 8. Security constraints

- Never embed GitHub tokens in frontend code
- Validate config payloads server-side before commit
- Treat password-gated access as convenience gating only unless a stronger service is introduced

## 9. Delivery phases

### Phase 1
- Bootstrap
- Map shell
- Layer loading
- Facility rendering and search

### Phase 2
- Grouping
- Labels
- Styles

### Phase 3
- Save/open integration
- Manifest browsing
- Serverless persistence

### Phase 4
- Export polish
- Testing
- Performance tuning
- Deployment hardening
