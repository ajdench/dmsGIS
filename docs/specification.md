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
- saving named map configurations locally first, with a clean upgrade path to a GitHub-backed store
- reopening saved configurations from a local browser-backed list first, then from future repository-backed lists
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
- Configuration persistence:
  - current: browser-local saved views via a schema-backed local storage boundary
  - future: GitHub repository commits via a small serverless write service or GitHub API proxy
- Read path:
  - current: local browser storage through the same saved-view contract
  - future: direct fetch from repository contents or generated manifests
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

Current implementation direction:

- Save payloads should be separated into explicit layers rather than one untyped blob:
  - `MapSessionState`: transient runtime snapshot of the map/session
  - `NamedSavedView`: a named saved configuration with repository-facing metadata
  - `UserSavedView`: a named saved view plus ownership metadata
  - `ShareableSavedView`: a user-owned saved view plus share policy
- The saved-state contract should be schema-versioned from the start.
- Storage and authentication should remain separate concerns from the saved-state schema:
  - local/static persistence can use the same contract first
  - authenticated profile storage can adopt the same contract later
- Current production path:
  - top-bar `Open` and `Save` actions open an in-app saved-views dialog
  - the dialog uses a schema-backed local `SavedViewStore`
  - save/open/delete flows are intentionally local-only at this stage
- Persisted session content should cover:
  - active scenario/preset
  - viewport
  - basemap settings
  - runtime layer and overlay state
  - facility presentation and filter state
  - region style state
  - current selection context where appropriate

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
- Local saved-view dialog and browser-backed persistence
- Manifest browsing
- Serverless/repository persistence

### Phase 4
- Export polish
- Testing
- Performance tuning
- Deployment hardening

## 10. Current implementation emphasis

Current production work is emphasizing map-core hardening and modularization over new feature breadth.

Current priority areas:

- keep shrinking `src/features/map/MapWorkspace.tsx` by extracting runtime responsibilities into small testable modules
- keep `MapWorkspace` focused on orchestration, and only extract further if a remaining block is still a clear bounded responsibility
- keep overlay lookup/bootstrap behavior generic so future overlay families are added as data/config, not by deepening JMC-specific runtime branches
- prefer broader production interaction coverage around selection/highlight flows before adding remote persistence or export polish
- treat the current map-core modularization pass as complete enough to stop unless a new hotspot or regression appears
- treat facility filters as a shared typed domain contract first, and only then choose which facets to surface in the production UI
- the first promoted production facet is now `region`; additional facets should layer onto the same contract rather than reintroducing search-only assumptions
- keep prototype-sidebar work isolated until it is explicitly promoted
