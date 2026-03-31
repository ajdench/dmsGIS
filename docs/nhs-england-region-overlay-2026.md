# NHS England Region Overlay on the 2026 ICB/HB Basis

## Research summary

Primary-source check on 20 March 2026:

- NHS England confirms there are still seven regional teams: East of England, London, Midlands, North East and Yorkshire, North West, South East, and South West.
  - Source: [Regional teams](https://www.england.nhs.uk/about/regional-area-teams/)
- NHS England's `More about each integrated care system` page was updated on 19 March 2026 and lists the new ICB footprints taking effect on 1 April 2026.
  - Source: [More about each integrated care system](https://www.england.nhs.uk/integratedcare/integrated-care-in-your-area/more-about-each-integrated-care-system/)

The 1 April 2026 changes affecting English ICBs are:

- East of England:
  - `NHS Norfolk and Suffolk ICB`
  - `NHS Essex ICB`
  - `NHS Central East ICB`
- London:
  - `NHS West and North London ICB`
- South East:
  - `NHS Thames Valley ICB`
  - `NHS Surrey and Sussex ICB`
  - `NHS Hampshire and Isle of Wight ICB` boundary update

The repo's 2026 boundary dataset at `public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson` contains 36 English `ICB` features. Those 36 features now align cleanly to the same seven NHS England regions with no cross-region footprint spanning in the published 2026 changes.

## Alignment against the 2026 ICBs

Counts by NHS England region on the 2026 basis:

- East of England: 3
- London: 4
- Midlands: 11
- North East and Yorkshire: 4
- North West: 3
- South East: 4
- South West: 7

Region membership for the 2026 English ICB layer:

- East of England
  - `NHS Central East Integrated Care Board`
  - `NHS Essex Integrated Care Board`
  - `NHS Norfolk and Suffolk Integrated Care Board`
- London
  - `NHS North East London Integrated Care Board`
  - `NHS South East London Integrated Care Board`
  - `NHS South West London Integrated Care Board`
  - `NHS West and North London Integrated Care Board`
- Midlands
  - `NHS Birmingham and Solihull Integrated Care Board`
  - `NHS Black Country Integrated Care Board`
  - `NHS Coventry and Warwickshire Integrated Care Board`
  - `NHS Derby and Derbyshire Integrated Care Board`
  - `NHS Herefordshire and Worcestershire Integrated Care Board`
  - `NHS Leicester, Leicestershire and Rutland Integrated Care Board`
  - `NHS Lincolnshire Integrated Care Board`
  - `NHS Northamptonshire Integrated Care Board`
  - `NHS Nottingham and Nottinghamshire Integrated Care Board`
  - `NHS Shropshire, Telford and Wrekin Integrated Care Board`
  - `NHS Staffordshire and Stoke-on-Trent Integrated Care Board`
- North East and Yorkshire
  - `NHS Humber and North Yorkshire Integrated Care Board`
  - `NHS North East and North Cumbria Integrated Care Board`
  - `NHS South Yorkshire Integrated Care Board`
  - `NHS West Yorkshire Integrated Care Board`
- North West
  - `NHS Cheshire and Merseyside Integrated Care Board`
  - `NHS Greater Manchester Integrated Care Board`
  - `NHS Lancashire and South Cumbria Integrated Care Board`
- South East
  - `NHS Hampshire and Isle of Wight Integrated Care Board`
  - `NHS Kent and Medway Integrated Care Board`
  - `NHS Surrey and Sussex Integrated Care Board`
  - `NHS Thames Valley Integrated Care Board`
- South West
  - `NHS Bath and North East Somerset, Swindon and Wiltshire Integrated Care Board`
  - `NHS Bristol, North Somerset and South Gloucestershire Integrated Care Board`
  - `NHS Cornwall and the Isles of Scilly Integrated Care Board`
  - `NHS Devon Integrated Care Board`
  - `NHS Dorset Integrated Care Board`
  - `NHS Gloucestershire Integrated Care Board`
  - `NHS Somerset Integrated Care Board`

## Confirmed production design direction

Using the current map/runtime seams, the NHS England region overlay should be treated as a distinct overlay product on the `icbHb2026` boundary system:

- Overlay family: `nhsRegions`
- Boundary basis: `icbHb2026`
- Assignment source: static board-assignment dataset keyed by `boundary_code`
- Geometry strategy:
  - selection/highlighting should continue to resolve against the authoritative 2026 board boundary source
  - visible region fill can come from a board-assignment source first
  - dissolved seven-region outlines can be derived or precomputed as a separate outline dataset later
- Non-England features:
  - Scotland, Wales, and Northern Ireland health boards should not be forced into NHS England regions
  - keep them out of the `nhsRegions` assignment catalogue rather than inventing pseudo-regions

This follows the repo's existing production pattern:

- board-level assignment dataset for color and lookup behavior
- optional outline layer for region-only boundary emphasis
- metadata and assignment rules held in shared config, not inside presentation components

## Preparation notes

Preparation work now in repo:

- `src/lib/config/nhsEnglandRegions.ts`
  - typed seven-region catalogue
  - 2026 board-to-region assignment catalogue
  - helpers keyed primarily by `boundary_code`
- `tests/nhsEnglandRegions.test.ts`
  - validates that every English `ICB` feature in the 2026 GeoJSON resolves to exactly one NHS England region

Recommended next geodata step when the overlay is promoted:

1. Build `UK_NHS_England_Regions_Source_Board_Assignments_Codex_v01_geojson.geojson` from the 2026 board layer, preserving `boundary_code` and `boundary_name`.
2. Add per-feature region fields such as `nhse_region_code`, `nhse_region_name`, and optional style fields if we want the standard boundary renderer to color by feature property.
3. Optionally precompute a dissolved seven-region outline layer for cleaner low-opacity region-boundary display.
