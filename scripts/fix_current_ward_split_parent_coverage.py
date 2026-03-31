#!/usr/bin/env python3
"""
Add canonical-parent remainder slivers back into the Current split-ICB exact
product so the visible split fill fully reaches the canonical parent outer edge.
"""

from __future__ import annotations

import os
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import make_valid
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CURRENT_EXACT_GPKG = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg"
)
WARD_SPLIT_GPKG = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_WardSplit_Canonical_Current_exact.gpkg"
)
WARD_SPLIT_GEOJSON = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_WardSplit_Canonical_Current_exact.geojson"
)
TARGET_PARENT_CODES = ["E54000025", "E54000042", "E54000048"]
TARGET_CRS = "EPSG:27700"


def polygon_only(geom):
    fixed = make_valid(geom)
    if isinstance(fixed, Polygon):
        return MultiPolygon([fixed])
    if isinstance(fixed, MultiPolygon):
        return fixed
    if isinstance(fixed, GeometryCollection):
        polys = []
        for part in fixed.geoms:
            if isinstance(part, Polygon):
                polys.append(part)
            elif isinstance(part, MultiPolygon):
                polys.extend(list(part.geoms))
        if not polys:
            return None
        return MultiPolygon(polys)
    return None


def iter_polygon_parts(geom):
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    if isinstance(geom, GeometryCollection):
        parts = []
        for member in geom.geoms:
            parts.extend(iter_polygon_parts(member))
        return parts
    return []


def slugify_region(region_ref: str) -> str:
    return region_ref.lower().replace("&", "and").replace(" ", "_").replace("__", "_")


def load_data():
    parents = gpd.read_file(get_active_current_exact_gpkg(), layer="uk_current_board_boundaries").to_crs(TARGET_CRS)
    parents = parents[parents["boundary_code"].isin(TARGET_PARENT_CODES)].copy()
    parents["geometry"] = parents["geometry"].map(polygon_only)

    split = gpd.read_file(get_ward_split_gpkg(), layer="uk_current_ward_split").to_crs(TARGET_CRS)
    split["geometry"] = split["geometry"].map(polygon_only)
    return parents, split


def get_active_current_exact_gpkg() -> Path:
    override = str(os.environ.get("CURRENT_EXACT_GPKG_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return DEFAULT_CURRENT_EXACT_GPKG


def get_ward_split_gpkg() -> Path:
    override = str(os.environ.get("WARD_SPLIT_EXACT_GPKG_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return WARD_SPLIT_GPKG


def get_ward_split_geojson() -> Path:
    override = str(os.environ.get("WARD_SPLIT_EXACT_GEOJSON_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return WARD_SPLIT_GEOJSON


def pick_adjacent_row(piece, rows: gpd.GeoDataFrame) -> pd.Series:
    point = piece.representative_point()
    distances = rows.geometry.distance(point)
    return rows.loc[distances.idxmin()]


def main() -> None:
    parents, split = load_data()
    additions = []

    for parent in TARGET_PARENT_CODES:
        parent_row = parents.loc[parents["boundary_code"] == parent].iloc[0]
        parent_rows = split.loc[split["boundary_code"] == parent].copy()
        union_geom = parent_rows.geometry.union_all()
        remainder = polygon_only(parent_row.geometry.difference(union_geom))
        grouped_pieces: dict[tuple[str, str, str], list[object]] = {}
        for piece in iter_polygon_parts(remainder):
            if piece.is_empty or piece.area <= 0:
                continue
            adjacent = pick_adjacent_row(piece, parent_rows)
            key = (
                str(adjacent["region_ref"]),
                str(adjacent["lad_code"]),
                str(adjacent["lad_name"]),
            )
            grouped_pieces.setdefault(key, []).append(piece)

        for index, ((region_ref, lad_code, lad_name), pieces) in enumerate(sorted(grouped_pieces.items()), start=1):
            merged_piece = gpd.GeoSeries(pieces, crs=TARGET_CRS).union_all()
            merged_piece = polygon_only(merged_piece)
            if merged_piece is None or merged_piece.is_empty:
                continue
            additions.append(
                {
                    "component_id": f"icb_parent_remainder_{parent.lower()}_{index}_{slugify_region(region_ref)}",
                    "parent_code": parent,
                    "boundary_code": parent,
                    "parent_name": parent_row["boundary_name"],
                    "boundary_name": parent_row["boundary_name"],
                    "region_ref": region_ref,
                    "ward_code": "",
                    "ward_name": "",
                    "lad_code": lad_code,
                    "lad_name": lad_name,
                    "assignment_basis": "canonical_parent_remainder_by_adjacency",
                    "build_source": "canonical_parent_remainder_repair",
                    "geometry": merged_piece,
                }
            )

    if additions:
        split = gpd.GeoDataFrame(
            pd.concat([split, gpd.GeoDataFrame(additions, geometry="geometry", crs=TARGET_CRS)], ignore_index=True),
            geometry="geometry",
            crs=TARGET_CRS,
        )

    split = split.to_crs(4326)
    ward_split_gpkg = get_ward_split_gpkg()
    ward_split_geojson = get_ward_split_geojson()
    ward_split_gpkg.parent.mkdir(parents=True, exist_ok=True)
    ward_split_geojson.parent.mkdir(parents=True, exist_ok=True)
    if ward_split_gpkg.exists():
        ward_split_gpkg.unlink()
    split.to_file(ward_split_gpkg, layer="uk_current_ward_split", driver="GPKG")
    split.to_file(ward_split_geojson, driver="GeoJSON")

    print(f"Repaired exact ward split: {len(split)} features")


if __name__ == "__main__":
    main()
