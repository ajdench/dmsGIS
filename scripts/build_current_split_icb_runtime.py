#!/usr/bin/env python3
"""
Build the clean runtime split-ICB product for Current mode from the repaired
exact split source.

This dissolves the ward-level internals to one feature per parent ICB / region
assignment so the shipped map product stays visually clean while still being
derived from ward internals and the canonical parent coast.
"""

from __future__ import annotations

import os
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import make_valid
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_EXACT_GPKG = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_WardSplit_Canonical_Current_exact.gpkg"
)
DEFAULT_CURRENT_RUNTIME_GEOJSON_CANDIDATES = [
    ROOT
    / "public"
    / "data"
    / "compare"
    / "shared-foundation-review"
    / "regions"
    / "UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson",
    ROOT
    / "public"
    / "data"
    / "regions"
    / "UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson",
]
OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "full_uk_current_boards"
DEFAULT_OUTPUT_GPKG = OUTPUT_DIR / "UK_SplitICB_Current_Canonical_Dissolved.gpkg"
DEFAULT_OUTPUT_GEOJSON = OUTPUT_DIR / "UK_SplitICB_Current_Canonical_Dissolved.geojson"
DEFAULT_RUNTIME_GEOJSON = ROOT / "public" / "data" / "regions" / "UK_WardSplit_simplified.geojson"
TARGET_CRS = "EPSG:27700"
RUNTIME_CRS = "EPSG:4326"
ANCHOR_MIN_AREA_M2 = 2_000_000
FRAGMENT_REASSIGN_MAX_AREA_M2 = 1_000_000
MIN_RUNTIME_PART_AREA = 1e-8
TARGET_PARENT_CODES = {"E54000025", "E54000042", "E54000048"}


def resolve_path(env_name: str, default_path: Path) -> Path:
    override = str(os.environ.get(env_name) or "").strip()
    if override:
        candidate = Path(override)
        return candidate if candidate.is_absolute() else ROOT / candidate
    return default_path


def get_exact_gpkg() -> Path:
    return resolve_path("WARD_SPLIT_EXACT_GPKG_PATH", DEFAULT_EXACT_GPKG)


def get_current_runtime_geojson() -> Path:
    override = str(os.environ.get("CURRENT_RUNTIME_GEOJSON_PATH") or "").strip()
    if override:
        candidate = Path(override)
        resolved = candidate if candidate.is_absolute() else ROOT / candidate
        if not resolved.exists():
            raise RuntimeError(f"Current runtime board source not found: {resolved}")
        return resolved

    for candidate in DEFAULT_CURRENT_RUNTIME_GEOJSON_CANDIDATES:
        if candidate.exists():
            return candidate

    searched = ", ".join(str(path) for path in DEFAULT_CURRENT_RUNTIME_GEOJSON_CANDIDATES)
    raise RuntimeError(f"Current runtime board source not found; checked: {searched}")


def get_output_gpkg() -> Path:
    return resolve_path("WARD_SPLIT_RUNTIME_GPKG_PATH", DEFAULT_OUTPUT_GPKG)


def get_output_geojson() -> Path:
    return resolve_path("WARD_SPLIT_RUNTIME_GEOJSON_PATH", DEFAULT_OUTPUT_GEOJSON)


def get_runtime_geojson() -> Path:
    return resolve_path("WARD_SPLIT_RUNTIME_PUBLIC_GEOJSON_PATH", DEFAULT_RUNTIME_GEOJSON)


def slugify_region(region_ref: str) -> str:
    return region_ref.lower().replace("&", "and").replace(" ", "_").replace("__", "_")


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


def strip_polygon_holes(geom):
    if geom is None or geom.is_empty:
        return geom
    if isinstance(geom, Polygon):
        return Polygon(geom.exterior)
    if isinstance(geom, MultiPolygon):
        return MultiPolygon([Polygon(part.exterior) for part in geom.geoms if not part.is_empty])
    return geom


def normalize_polygonal(geom, min_part_area: float = 0.0):
    fixed = make_valid(geom)
    seed_parts = iter_polygon_parts(fixed)
    cleaned_parts = []
    for part in seed_parts:
        candidate = make_valid(part).buffer(0)
        for candidate_part in iter_polygon_parts(candidate):
            if candidate_part.is_empty or candidate_part.area <= min_part_area:
                continue
            candidate_part = strip_polygon_holes(candidate_part)
            coords = list(candidate_part.exterior.coords)
            if len(coords) < 4 or len(set(coords)) < 4:
                continue
            cleaned_parts.append(candidate_part)

    if not cleaned_parts:
        return None

    merged = unary_union(cleaned_parts)
    merged = make_valid(merged).buffer(0)
    parts = [
        part
        for part in iter_polygon_parts(merged)
        if not part.is_empty and part.area > min_part_area
    ]
    filtered_parts = []
    for part in parts:
        part = strip_polygon_holes(part)
        coords = list(part.exterior.coords)
        if len(coords) < 4 or len(set(coords)) < 4:
            continue
        filtered_parts.append(part)
    parts = filtered_parts
    if not parts:
        return None
    if len(parts) == 1:
        return parts[0]
    return MultiPolygon(parts)


def postprocess_hole_free_vector(path: Path, layer: str | None = None) -> None:
    gdf = gpd.read_file(path, layer=layer)
    gdf["geometry"] = gdf.geometry.apply(strip_polygon_holes)
    gdf["geometry"] = gdf.geometry.apply(
        lambda geom: normalize_polygonal(geom, min_part_area=MIN_RUNTIME_PART_AREA)
    )
    gdf = gdf.loc[gdf["geometry"].notna()].copy()

    if path.suffix.lower() == ".gpkg":
        if path.exists():
            path.unlink()
        gdf.to_file(path, layer=layer or "layer", driver="GPKG")
        return

    if path.exists():
        path.unlink()
    gdf.to_file(path, driver="GeoJSON", COORDINATE_PRECISION=7)


def clean_split_fragments(grouped: list[dict[str, object]]) -> list[dict[str, object]]:
    gdf = gpd.GeoDataFrame(pd.DataFrame(grouped), geometry="geometry", crs=4326).to_crs(TARGET_CRS)
    cleaned_rows: list[dict[str, object]] = []

    for parent_code, parent_rows in gdf.groupby("parent_code", sort=True, dropna=False):
        anchor_unions: dict[str, object] = {}
        kept_parts: dict[str, list[object]] = {}
        metadata_by_region: dict[str, pd.Series] = {}
        reassignments: dict[tuple[str, str], int] = {}

        deferred_parts: list[tuple[str, object]] = []

        for row in parent_rows.itertuples():
            region_ref = str(row.region_ref)
            metadata_by_region[region_ref] = parent_rows.loc[row.Index]
            parts = iter_polygon_parts(make_valid(row.geometry))
            if not parts:
                continue

            indexed_parts = [(index, part, part.area) for index, part in enumerate(parts)]
            largest_index, _, _ = max(indexed_parts, key=lambda item: item[2])
            anchor_parts = [
                part
                for index, part, area in indexed_parts
                if area >= ANCHOR_MIN_AREA_M2 or index == largest_index
            ]
            anchor_unions[region_ref] = unary_union(anchor_parts)
            kept_parts.setdefault(region_ref, []).extend(anchor_parts)

            for index, part, area in indexed_parts:
                if index == largest_index or area >= ANCHOR_MIN_AREA_M2:
                    continue
                if area > FRAGMENT_REASSIGN_MAX_AREA_M2:
                    kept_parts.setdefault(region_ref, []).append(part)
                    continue
                deferred_parts.append((region_ref, part))

        for source_region_ref, part in deferred_parts:
            nearest_region_ref = source_region_ref
            nearest_distance = None
            for candidate_region_ref, anchor_geom in anchor_unions.items():
                distance = part.distance(anchor_geom)
                if nearest_distance is None or distance < nearest_distance:
                    nearest_distance = distance
                    nearest_region_ref = candidate_region_ref
            kept_parts.setdefault(nearest_region_ref, []).append(part)
            if nearest_region_ref != source_region_ref:
                key = (source_region_ref, nearest_region_ref)
                reassignments[key] = reassignments.get(key, 0) + 1

        if reassignments:
            summary = ", ".join(
                f"{source}->{target}: {count}"
                for (source, target), count in sorted(reassignments.items())
            )
            print(f"Fragment cleanup {parent_code}: {summary}")

        for region_ref, parts in kept_parts.items():
            row = metadata_by_region[region_ref]
            merged = normalize_polygonal(unary_union(parts))
            if merged is None or merged.is_empty:
                continue
            cleaned_rows.append(
                {
                    "component_id": row["component_id"],
                    "parent_code": row["parent_code"],
                    "boundary_code": row["boundary_code"],
                    "parent_name": row["parent_name"],
                    "boundary_name": row["boundary_name"],
                    "region_ref": row["region_ref"],
                    "assignment_basis": row["assignment_basis"],
                    "build_source": row["build_source"],
                    "geometry": merged,
                }
            )

    return cleaned_rows


def load_runtime_parent_geometries() -> dict[str, object]:
    parents = gpd.read_file(get_current_runtime_geojson())
    if parents.crs is None:
        raise RuntimeError("Missing CRS in current runtime board product")
    if str(parents.crs) != TARGET_CRS:
        parents = parents.to_crs(TARGET_CRS)

    selected = parents.loc[parents["boundary_code"].isin(TARGET_PARENT_CODES)].copy()
    parent_geometries: dict[str, object] = {}
    for row in selected.itertuples():
        normalized = normalize_polygonal(row.geometry, min_part_area=MIN_RUNTIME_PART_AREA)
        if normalized is None or normalized.is_empty:
            continue
        parent_geometries[str(row.boundary_code)] = normalized

    missing = TARGET_PARENT_CODES - set(parent_geometries)
    if missing:
        raise RuntimeError(
            f"Missing live runtime parent geometries for split export: {sorted(missing)}"
        )
    return parent_geometries


def main() -> None:
    gdf = gpd.read_file(get_exact_gpkg(), layer="uk_current_ward_split")
    if gdf.crs is None:
        raise RuntimeError("Missing CRS in repaired exact split source")

    group_fields = [
        "parent_code",
        "boundary_code",
        "parent_name",
        "boundary_name",
        "region_ref",
    ]
    grouped = []
    for keys, subset in gdf.groupby(group_fields, sort=True, dropna=False):
        parent_code, boundary_code, parent_name, boundary_name, region_ref = keys
        build_sources = {str(value) for value in subset["build_source"].dropna().tolist()}
        source_prefix = "ward_bfc"
        if any(source.startswith("ward_bsc_") for source in build_sources):
            source_prefix = "ward_bsc"
        assignment_basis = (
            f"{source_prefix}_with_parent_remainder"
            if (subset["assignment_basis"] == "canonical_parent_remainder_by_adjacency").any()
            else f"{source_prefix}_dissolved"
        )
        geom = gpd.GeoSeries(subset.geometry, crs=gdf.crs).union_all()
        grouped.append(
            {
                "component_id": f"icb_split_{str(parent_code).lower()}_{slugify_region(str(region_ref))}",
                "parent_code": parent_code,
                "boundary_code": boundary_code,
                "parent_name": parent_name,
                "boundary_name": boundary_name,
                "region_ref": region_ref,
                "assignment_basis": assignment_basis,
                "build_source": f"{source_prefix}_dissolved_with_canonical_parent_outer",
                "geometry": geom,
            }
        )

    cleaned = clean_split_fragments(grouped)
    out = gpd.GeoDataFrame(pd.DataFrame(cleaned), geometry="geometry", crs=TARGET_CRS)
    out["geometry"] = out.geometry.apply(normalize_polygonal)
    out = out.loc[out["geometry"].notna()].copy()
    runtime_parents = load_runtime_parent_geometries()
    out["geometry"] = out.apply(
        lambda row: normalize_polygonal(
            row.geometry.intersection(runtime_parents[str(row.boundary_code)]),
            min_part_area=MIN_RUNTIME_PART_AREA,
        ),
        axis=1,
    )
    out["geometry"] = out.geometry.apply(
        lambda geom: normalize_polygonal(geom, min_part_area=MIN_RUNTIME_PART_AREA)
    )
    out["geometry"] = out.geometry.apply(strip_polygon_holes)
    out = out.loc[out["geometry"].notna()].copy()
    out = out.to_crs(RUNTIME_CRS)
    out["geometry"] = out.geometry.apply(
        lambda geom: normalize_polygonal(geom, min_part_area=MIN_RUNTIME_PART_AREA)
    )
    out["geometry"] = out.geometry.apply(strip_polygon_holes)
    out = out.loc[out["geometry"].notna()].copy()

    if out.crs is None:
        raise RuntimeError("Missing CRS after split cleanup")

    output_gpkg = get_output_gpkg()
    output_geojson = get_output_geojson()
    runtime_geojson = get_runtime_geojson()
    output_gpkg.parent.mkdir(parents=True, exist_ok=True)
    output_geojson.parent.mkdir(parents=True, exist_ok=True)
    runtime_geojson.parent.mkdir(parents=True, exist_ok=True)

    if output_gpkg.exists():
        output_gpkg.unlink()
    out.to_file(output_gpkg, layer="uk_current_split_icb_dissolved", driver="GPKG")
    postprocess_hole_free_vector(output_gpkg, layer="uk_current_split_icb_dissolved")

    if output_geojson.exists():
        output_geojson.unlink()
    out.to_file(output_geojson, driver="GeoJSON", COORDINATE_PRECISION=7)
    postprocess_hole_free_vector(output_geojson)

    if runtime_geojson.exists():
        runtime_geojson.unlink()
    out.to_file(runtime_geojson, driver="GeoJSON", COORDINATE_PRECISION=7)
    postprocess_hole_free_vector(runtime_geojson)

    print(f"Written dissolved split exact: {output_gpkg}")
    print(f"Written dissolved split exact: {output_geojson}")
    print(f"Written runtime split: {runtime_geojson}")
    print(f"Feature count: {len(out)}")
    for row in out.itertuples():
        print(f"  {row.boundary_code} :: {row.region_ref}")


if __name__ == "__main__":
    main()
