#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
from shapely import GeometryCollection, MultiPolygon, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "uk_landmask"
BASE_LANDMASK_PATH = OUTPUT_DIR / "UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson"
CURRENT_EXACT_PATH = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson"
)
ENGLAND_REGIONS_BFE_PATH = (
    ROOT / "geopackages" / "compare_sources" / "NHS_England_Regions_January_2024_EN_BFE.gpkg"
)
ENGLAND_REGIONS_BSC_PATH = (
    ROOT / "geopackages" / "compare_sources" / "NHS_England_Regions_January_2024_EN_BSC.gpkg"
)
WALES_LHB_BFE_PATH = (
    ROOT / "geopackages" / "compare_sources" / "Local_Health_Boards_December_2023_WA_BFE.gpkg"
)
UK_COUNTRIES_BFE_PATH = (
    ROOT / "geopackages" / "compare_sources" / "Countries_December_2023_UK_BFE.gpkg"
)
UK_COUNTRIES_BSC_PATH = (
    ROOT / "geopackages" / "compare_sources" / "Countries_December_2023_UK_BSC.gpkg"
)
BFE_OUTPUT_PATH = OUTPUT_DIR / "UK_Landmask_v37_bfe_coastal_envelope.geojson"
BSC_OUTPUT_PATH = OUTPUT_DIR / "UK_Landmask_v37_bsc_coastal_envelope.geojson"
METADATA_PATH = OUTPUT_DIR / "UK_Landmask_v37_coastal_envelope_products.json"
TARGET_CRS = "EPSG:27700"
OUTPUT_CRS = "EPSG:4326"


def load_as_target_crs(path: Path) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        raise RuntimeError(f"Missing CRS on source: {path}")
    return gdf.to_crs(TARGET_CRS)


def strip_interior_rings(geometry):
    if geometry is None or geometry.is_empty:
        return geometry
    if isinstance(geometry, Polygon):
        return Polygon(geometry.exterior)
    if isinstance(geometry, MultiPolygon):
        return MultiPolygon([Polygon(polygon.exterior) for polygon in geometry.geoms if not polygon.is_empty])
    if isinstance(geometry, GeometryCollection):
        members = [strip_interior_rings(member) for member in geometry.geoms]
        polygons = [
            member
            for member in members
            if member is not None and not member.is_empty and isinstance(member, (Polygon, MultiPolygon))
        ]
        if not polygons:
            return Polygon()
        return unary_union(polygons)
    return geometry


def make_single_feature_gdf(geometry, crs: str, label: str) -> gpd.GeoDataFrame:
    return gpd.GeoDataFrame(
        [{"name": label, "geometry": geometry}],
        geometry="geometry",
        crs=crs,
    )


def union_geometry(gdf: gpd.GeoDataFrame):
    return unary_union(gdf.geometry)


def filter_union(gdf: gpd.GeoDataFrame, field: str, values: list[str]):
    subset = gdf[gdf[field].isin(values)]
    if subset.empty:
        raise RuntimeError(f"No features found in {field} for {values}")
    return union_geometry(subset)


def build_product_geometry(
    base_union,
    replacement_window,
    england_geometry,
    wales_geometry,
    scotland_geometry,
    northern_ireland_geometry,
):
    geometry = unary_union(
        [
            base_union.difference(replacement_window),
            england_geometry,
            wales_geometry,
            scotland_geometry,
            northern_ireland_geometry,
        ]
    )
    return strip_interior_rings(geometry)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    base_landmask = load_as_target_crs(BASE_LANDMASK_PATH)
    current_exact = load_as_target_crs(CURRENT_EXACT_PATH)
    england_regions_bfe = load_as_target_crs(ENGLAND_REGIONS_BFE_PATH)
    england_regions_bsc = load_as_target_crs(ENGLAND_REGIONS_BSC_PATH)
    wales_lhb_bfe = load_as_target_crs(WALES_LHB_BFE_PATH)
    uk_countries_bfe = load_as_target_crs(UK_COUNTRIES_BFE_PATH)
    uk_countries_bsc = load_as_target_crs(UK_COUNTRIES_BSC_PATH)

    base_union = union_geometry(base_landmask)
    england_window = union_geometry(current_exact[current_exact["boundary_type"] == "ICB"])
    wales_window = union_geometry(current_exact[current_exact["boundary_type"] == "LHB"])
    scotland_window = union_geometry(current_exact[current_exact["boundary_type"] == "SHB"])
    northern_ireland_window = union_geometry(current_exact[current_exact["boundary_type"] == "NIHB"])
    replacement_window = unary_union(
        [england_window, wales_window, scotland_window, northern_ireland_window]
    )

    england_bfe_geometry = union_geometry(england_regions_bfe)
    england_bsc_geometry = union_geometry(england_regions_bsc)
    wales_bfe_geometry = union_geometry(wales_lhb_bfe)
    uk_bfe_scotland_geometry = filter_union(uk_countries_bfe, "CTRY23NM", ["Scotland"])
    uk_bfe_northern_ireland_geometry = filter_union(
        uk_countries_bfe, "CTRY23NM", ["Northern Ireland"]
    )
    uk_bsc_wales_geometry = filter_union(uk_countries_bsc, "CTRY23NM", ["Wales"])
    uk_bsc_scotland_geometry = filter_union(uk_countries_bsc, "CTRY23NM", ["Scotland"])
    uk_bsc_northern_ireland_geometry = filter_union(
        uk_countries_bsc, "CTRY23NM", ["Northern Ireland"]
    )

    bfe_geometry = build_product_geometry(
        base_union,
        replacement_window,
        england_bfe_geometry,
        wales_bfe_geometry,
        uk_bfe_scotland_geometry,
        uk_bfe_northern_ireland_geometry,
    )
    bsc_geometry = build_product_geometry(
        base_union,
        replacement_window,
        england_bsc_geometry,
        uk_bsc_wales_geometry,
        uk_bsc_scotland_geometry,
        uk_bsc_northern_ireland_geometry,
    )

    make_single_feature_gdf(
        bfe_geometry, TARGET_CRS, "v3.7 coastal envelope landmask bfe"
    ).to_crs(OUTPUT_CRS).to_file(BFE_OUTPUT_PATH, driver="GeoJSON")
    make_single_feature_gdf(
        bsc_geometry, TARGET_CRS, "v3.7 coastal envelope landmask bsc"
    ).to_crs(OUTPUT_CRS).to_file(BSC_OUTPUT_PATH, driver="GeoJSON")

    metadata = {
        "version": "v3.7-envelope-2",
        "products": [
            {
                "id": "bfe",
                "label": "Official BFE external envelope compare",
                "output_path": str(BFE_OUTPUT_PATH.relative_to(ROOT)),
                "sources": {
                    "base_landmask": str(BASE_LANDMASK_PATH.relative_to(ROOT)),
                    "england_window_exact": "boundary_type=ICB",
                    "wales_window_exact": "boundary_type=LHB",
                    "scotland_window_exact": "boundary_type=SHB",
                    "northern_ireland_window_exact": "boundary_type=NIHB",
                    "england_regions_bfe": str(ENGLAND_REGIONS_BFE_PATH.relative_to(ROOT)),
                    "wales_lhb_bfe": str(WALES_LHB_BFE_PATH.relative_to(ROOT)),
                    "uk_countries_bfe": str(UK_COUNTRIES_BFE_PATH.relative_to(ROOT)),
                },
                "stats_m2": {
                    "base_landmask_area": float(base_union.area),
                    "replacement_window_area": float(replacement_window.area),
                    "england_bfe_area": float(england_bfe_geometry.area),
                    "wales_bfe_area": float(wales_bfe_geometry.area),
                    "scotland_bfe_area": float(uk_bfe_scotland_geometry.area),
                    "northern_ireland_bfe_area": float(uk_bfe_northern_ireland_geometry.area),
                    "bfe_area": float(bfe_geometry.area),
                },
            },
            {
                "id": "bsc",
                "label": "Official BSC external envelope compare",
                "output_path": str(BSC_OUTPUT_PATH.relative_to(ROOT)),
                "sources": {
                    "base_landmask": str(BASE_LANDMASK_PATH.relative_to(ROOT)),
                    "england_window_exact": "boundary_type=ICB",
                    "wales_window_exact": "boundary_type=LHB",
                    "scotland_window_exact": "boundary_type=SHB",
                    "northern_ireland_window_exact": "boundary_type=NIHB",
                    "england_regions_bsc": str(ENGLAND_REGIONS_BSC_PATH.relative_to(ROOT)),
                    "uk_countries_bsc": str(UK_COUNTRIES_BSC_PATH.relative_to(ROOT)),
                },
                "stats_m2": {
                    "base_landmask_area": float(base_union.area),
                    "replacement_window_area": float(replacement_window.area),
                    "england_bsc_area": float(england_bsc_geometry.area),
                    "wales_bsc_area": float(uk_bsc_wales_geometry.area),
                    "scotland_bsc_area": float(uk_bsc_scotland_geometry.area),
                    "northern_ireland_bsc_area": float(uk_bsc_northern_ireland_geometry.area),
                    "bsc_area": float(bsc_geometry.area),
                },
            },
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n")

    print(f"wrote {BFE_OUTPUT_PATH.relative_to(ROOT)}")
    print(f"wrote {BSC_OUTPUT_PATH.relative_to(ROOT)}")
    print(f"wrote {METADATA_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
