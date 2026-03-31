#!/usr/bin/env python3
"""
Build dashed internal split-join arcs for the shipped Current split ICB product.

The output contains only shared internal boundaries between the dissolved split
regions inside the three special Current parents. It is intended as a small
render-time helper layer, not a new user-facing overlay family.
"""

from __future__ import annotations

import os
from pathlib import Path

import geopandas as gpd
from shapely.geometry import GeometryCollection, LineString, MultiLineString
from shapely.ops import linemerge, unary_union


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RUNTIME_SPLIT_GEOJSON = ROOT / "public" / "data" / "regions" / "UK_WardSplit_simplified.geojson"
DEFAULT_OUTPUT_GEOJSON = ROOT / "public" / "data" / "regions" / "UK_WardSplit_internal_arcs.geojson"


def resolve_path(env_name: str, default_path: Path) -> Path:
    override = str(os.environ.get(env_name) or "").strip()
    if override:
        candidate = Path(override)
        return candidate if candidate.is_absolute() else ROOT / candidate
    return default_path


def get_runtime_split_geojson() -> Path:
    return resolve_path("WARD_SPLIT_RUNTIME_PUBLIC_GEOJSON_PATH", DEFAULT_RUNTIME_SPLIT_GEOJSON)


def get_output_geojson() -> Path:
    return resolve_path("WARD_SPLIT_INTERNAL_ARCS_GEOJSON_PATH", DEFAULT_OUTPUT_GEOJSON)


def iter_line_parts(geom):
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    if isinstance(geom, MultiLineString):
        return list(geom.geoms)
    if isinstance(geom, GeometryCollection):
        parts = []
        for member in geom.geoms:
            parts.extend(iter_line_parts(member))
        return parts
    return []


def normalize_lineal(geom):
    parts = [part for part in iter_line_parts(geom) if not part.is_empty and len(part.coords) >= 2]
    if not parts:
        return None
    merged = linemerge(unary_union(parts))
    merged_parts = [part for part in iter_line_parts(merged) if not part.is_empty and len(part.coords) >= 2]
    if not merged_parts:
        return None
    if len(merged_parts) == 1:
        return merged_parts[0]
    return MultiLineString(merged_parts)


def main() -> None:
    runtime_split_geojson = get_runtime_split_geojson()
    output_geojson = get_output_geojson()

    gdf = gpd.read_file(runtime_split_geojson)
    if gdf.crs is None:
        raise RuntimeError("Missing CRS in shipped Current split runtime product")

    rows = []
    for parent_code, subset in gdf.groupby("parent_code", sort=True, dropna=False):
        split_rows = list(subset.itertuples())
        for index, left in enumerate(split_rows):
            for right in split_rows[index + 1:]:
                shared = left.geometry.boundary.intersection(right.geometry.boundary)
                line = normalize_lineal(shared)
                if line is None or line.is_empty:
                    continue
                left_region = str(left.region_ref)
                right_region = str(right.region_ref)
                ordered_regions = sorted([left_region, right_region])
                rows.append(
                    {
                        "component_id": f"split_join_{str(parent_code).lower()}_{ordered_regions[0].lower().replace(' ', '_').replace('&', 'and')}_{ordered_regions[1].lower().replace(' ', '_').replace('&', 'and')}",
                        "parent_code": str(parent_code),
                        "boundary_code": str(left.boundary_code),
                        "boundary_name": str(left.boundary_name),
                        "left_region_ref": ordered_regions[0],
                        "right_region_ref": ordered_regions[1],
                        "build_source": "current_split_runtime_internal_shared_arcs",
                        "geometry": line,
                    }
                )

    out = gpd.GeoDataFrame(rows, geometry="geometry", crs=gdf.crs)
    output_geojson.parent.mkdir(parents=True, exist_ok=True)
    if output_geojson.exists():
        output_geojson.unlink()
    out.to_file(output_geojson, driver="GeoJSON", COORDINATE_PRECISION=6)

    print(f"Written split internal arcs: {output_geojson}")
    print(f"Feature count: {len(out)}")
    for row in out.itertuples():
        print(f"  {row.parent_code} :: {row.left_region_ref} <> {row.right_region_ref}")


if __name__ == "__main__":
    main()
