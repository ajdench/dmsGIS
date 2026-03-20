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

Current production work should emphasize improving the shipped production app before expanding product breadth.

Current priority areas:

- improve existing production workflows and usability before taking on more future-facing scope
- keep `MapWorkspace` focused on orchestration, and only extract further if a remaining block is still a clear bounded responsibility
- keep overlay lookup/bootstrap behavior generic so future overlay families are added as data/config, not by deepening JMC-specific runtime branches
- keep treating facility filters as a shared typed domain contract; the active production surface is search-only, and any future metadata facets should reuse the same contract rather than rebuild parallel state
- treat current scenario presets as baseline workspaces for future editing rather than the final editable architecture
- make the boundary-system split explicit:
  - `Current` uses the legacy ICB/HB basis
  - scenario work should use the 2026 ICB/HB basis
- keep runtime lookup sources split by responsibility:
  - authoritative boundary-system lookup
  - scenario outline lookup
  - future editable assignment lookup
- keep editable scenario work grounded in stable ids:
  - boundary-unit ids should be the authoritative reassignment target
  - scenario-region ids should be the authoritative grouping target
  - display labels should stay presentation-level, not become the only linkage
- keep a dedicated production draft/editor state for future Playground work instead of mutating preset config objects in place
- future Playground work should reassign authoritative boundary units, then derive scenario outlines and downstream metrics from those assignments
- let runtime selection/highlight paths consume draft-aware assignment sources before attempting full region redraw, so the editing architecture can be validated incrementally
- let visible scenario layers consume the same draft-aware runtime sources before attempting true dissolved outline generation, so edited assignments affect on-map rendering incrementally
- use a real dissolve/union step for derived scenario outlines once draft-aware rendering is proven, so bespoke Regions become clean merged shapes rather than grouped board polygons
- let facility styling, facility selection, and future scenario calculations consume the same draft-aware assignment source, so edited boundary reassignment changes both geometry and facility-derived metrics
- prefer broader production workflow and interaction coverage before adding remote persistence or export polish
- keep prototype-sidebar work isolated until it is explicitly promoted

## 11. Future functionality areas

### Functional areas

These are future user-facing capability areas. They should stay documented and visible, but they should not displace current production improvement work unless explicitly prioritized.

- facility-filter usability and saved-filter behavior
  improve clarity, reset flows, active-filter visibility, and eventually save/reuse filter combinations
- richer saved-view management and remote storage backends
  extend beyond local browser storage into repository-backed or service-backed implementations behind the same contract
- future overlay families such as NHS/custom regions
  add new overlay products through the same metadata/bootstrap path rather than separate runtime forks
- editable scenario workspace / Playground behavior
  support boundary reassignment, derived region redraw, and future facility-metadata-driven calculations on top of authoritative boundary-unit systems
- export completion and polish
  finish the exposed export workflow and make it reliable enough for operational use
- authenticated/shareable saved-view behavior
  add identity, ownership, and sharing without changing the underlying saved-view contract
- deliberate promotion of approved prototype interaction patterns
  move only approved interaction ideas into production, one pattern at a time

### Non-functional areas

These are future quality, maintainability, and delivery areas. They are not end-user features, but they strongly affect product reliability and development speed.

- release-gate discipline around `build`
  keep the real deployable build green and treat it as the authoritative health signal
- broader workflow and interaction testing
  add more protection around real end-user flows, not only isolated helpers
- runtime/map performance
  reduce heavy payloads, avoid unnecessary layer churn, and keep interaction smooth on larger datasets
- deployment and containerization
  preserve the static-first path while making the app easy to build and serve in a minimal container
- architecture consistency between production and prototype paths
  keep both paths healthy without letting one leak assumptions into the other
- clearer prototype-to-production promotion rules
  make it explicit when a prototype idea is experimental, approved, or promoted

## 12. Architectural working rules

Future implementation should follow the internal architecture principles documented in [docs/internal-architecture-principles.md](/Users/andrew/Library/Mobile%20Documents/com~apple~CloudDocs/Documents/Projects/dmsGIS/docs/internal-architecture-principles.md).
