# Arc Smoothing Future Plan

This note records a future preprocessing task to soften angular boundary geometry across the shipped map products without breaking shared-border contiguity.

It is intentionally a planning/specification note, not an approved implementation yet.

## Goal

Introduce a preprocessing step that smooths angular arcs in both:

- external/coastal boundaries
- internal shared board boundaries

while preserving:

- contiguous shared borders
- stable app contracts
- downstream facility alignment
- downstream land-sea mask correctness

## What This Is Not

- not a runtime styling tweak
- not per-feature polygon smoothing in the browser
- not a post-mask or post-facility cleanup pass

If polygons are smoothed independently, shared internal borders will drift apart and create gaps or overlaps.

## Correct Workflow Position

If approved, smoothing should happen after exact board assembly and after any `Current` split-ICB exact rebuild, but before shipped runtime products and downstream derivatives.

Recommended future sequence:

1. Build exact board family.
2. Build exact `Current` split products.
3. Extract a unique shared-arc network.
4. Smooth that shared-arc network once.
5. Polygonize/rebuild board polygons from the smoothed arc network.
6. Validate no gaps, overlaps, or dropped boards.
7. Derive shipped runtime board products from that rebuilt family.
8. Derive topology edges, outlines, land-sea masks, and facility alignment after smoothing.

This preserves one authoritative smoothed geometry family for all downstream products.

## Key Constraint

Internal boundaries must remain contiguous.

That means:

- shared arcs must be smoothed once, not separately per adjacent polygon
- both neighboring boards must reuse the same smoothed boundary segment

## Likely Validation Requirements

Any future implementation should validate at least:

- board count unchanged
- no polygon loss
- no board-to-board overlap beyond accepted tolerance
- no gaps in contiguous coverage
- split-ICB products still clip to their parents correctly
- facility containment still passes after downstream refresh
- land-sea mask rebuild still matches the new board family

## Tooling Options

The likely tooling candidates for a future pass are:

- `GDAL/ogr2ogr`
  - geometry cleanup, reprojection, export, validity repair
- `Shapely` + `GeoPandas`
  - custom shared-arc extraction, smoothing, polygonization
- `PostGIS`
  - especially if `ST_ChaikinSmoothing` or similar topology-aware smoothing is adopted
- `mapshaper` / `topojson-simplify`
  - useful as supporting simplification/cleanup tools, but probably not the core contiguous-arc smoothing seam by themselves

No extra dependency is approved yet. The future implementation should choose the smallest stack that can preserve topology safely.

## Staged Recommendation

If this work is picked up later:

1. Prototype on one bounded geography first.
2. Decide whether externals and internals use the same smoothing strength.
3. Confirm whether split-ICB internals should be exempt or treated differently.
4. Only then attempt a full-UK rebuild.

## Current Status

- documented for future work
- not scheduled for immediate implementation
- not yet part of the approved production build pipeline
