#!/usr/bin/env python3
"""
Build review-time classified water-edge arc helper products.

This is intentionally heuristic and review-oriented. It does not yet change
runtime styling or replace the shipped topology-edge products. It emits a
classified companion artifact so the next hydro/coast pass can inspect and
style inland/estuary arcs from preprocessing output rather than runtime guesswork.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import geopandas as gpd
from shapely.geometry import MultiPolygon, Polygon
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "src" / "lib" / "config" / "waterEdgeTreatment.json"
LANDMASK_DIR = ROOT / "geopackages" / "outputs" / "uk_landmask"
WATER_EDGE_DIR = Path(os.environ.get("WATER_EDGE_DIR") or (ROOT / "geopackages" / "outputs" / "water_edges"))
PUBLIC_REGIONS_DIR = Path(
    os.environ.get("REGIONS_DIR") or str(ROOT / "public" / "data" / "regions")
).resolve()
SOURCE_LANDMASK = LANDMASK_DIR / "UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson"
TARGET_CRS = "EPSG:27700"

EDGE_PRODUCTS = [
    {
        "boundary_system": "current",
        "input": PUBLIC_REGIONS_DIR / "UK_ICB_LHB_v10_topology_edges.geojson",
        "output": WATER_EDGE_DIR / "UK_ICB_LHB_v10_water_edge_classes.geojson",
        "public_output": PUBLIC_REGIONS_DIR / "UK_ICB_LHB_v10_water_edge_classes.geojson",
    },
    {
        "boundary_system": "2026",
        "input": PUBLIC_REGIONS_DIR / "UK_Health_Board_2026_topology_edges.geojson",
        "output": WATER_EDGE_DIR / "UK_Health_Board_2026_water_edge_classes.geojson",
        "public_output": PUBLIC_REGIONS_DIR / "UK_Health_Board_2026_water_edge_classes.geojson",
    },
]
SUMMARY_OUTPUT = WATER_EDGE_DIR / "water_edge_classification_summary.json"


def load_config():
    return json.loads(CONFIG_PATH.read_text())


def get_active_profile(config):
    profile_id = config["preprocessing"]["activeProfileId"]
    return profile_id, config["preprocessing"]["profiles"][profile_id]


def load_polygon_union(path: Path):
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        raise RuntimeError(f"Missing CRS in {path}")
    projected = gdf.to_crs(TARGET_CRS)
    return unary_union(projected.geometry)


def polygon_parts(geometry):
    if geometry.is_empty:
        return []
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, MultiPolygon):
        return [part for part in geometry.geoms if not part.is_empty]
    if hasattr(geometry, "geoms"):
        parts = []
        for member in geometry.geoms:
            parts.extend(polygon_parts(member))
        return parts
    return []


def min_rotated_rect_dimensions(geometry):
    rect = geometry.minimum_rotated_rectangle
    coords = list(rect.exterior.coords)
    if len(coords) < 5:
        return 0.0, 0.0
    lengths = []
    for index in range(4):
        x1, y1 = coords[index]
        x2, y2 = coords[index + 1]
        lengths.append(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5)
    width = min(lengths)
    depth = max(lengths)
    return width, depth


def classify_delta_polygon(geometry, profile):
    width, depth = min_rotated_rect_dimensions(geometry)

    edge_class = "sea"
    edge_subclass = None

    if width >= profile["minTrueCoastOpeningWidthM"]:
        edge_class = "estuary"
        if width >= profile["minTrueCoastOpeningWidthM"] * 1.6 and depth >= profile["maxInlandProjectionDepthM"] * 0.75:
            edge_subclass = "intertidal"
    else:
        edge_class = "inlandWater"
        if width <= 45:
            edge_subclass = "canalCut"
        elif width <= 120 and depth <= 1500:
            edge_subclass = "harbourDock"

    return {
        "edge_class": edge_class,
        "edge_subclass": edge_subclass,
        "opening_width_m": round(width, 2),
        "projection_depth_m": round(depth, 2),
        "area_m2": round(float(geometry.area), 2),
    }


def main():
    WATER_EDGE_DIR.mkdir(parents=True, exist_ok=True)
    PUBLIC_REGIONS_DIR.mkdir(parents=True, exist_ok=True)

    config = load_config()
    profile_id, profile = get_active_profile(config)
    active_landmask = LANDMASK_DIR / f"UK_Landmask_OSM_simplified_v01_hydronormalized_{profile_id}.geojson"
    if not active_landmask.exists():
        raise RuntimeError(f"Active hydro-normalized landmask not found: {active_landmask}")

    source_union = load_polygon_union(SOURCE_LANDMASK)
    active_union = load_polygon_union(active_landmask)
    added_land = active_union.difference(source_union)
    added_polygons = polygon_parts(added_land)

    classified_delta = []
    for index, polygon in enumerate(added_polygons):
        if polygon.is_empty:
            continue
        delta_id = f"{profile_id}_delta_{index + 1:04d}"
        attrs = classify_delta_polygon(polygon, profile)
        attrs["delta_id"] = delta_id
        attrs["geometry"] = polygon
        classified_delta.append(attrs)

    delta_gdf = gpd.GeoDataFrame(classified_delta, geometry="geometry", crs=TARGET_CRS)
    delta_index = delta_gdf.sindex if not delta_gdf.empty else None

    summary = {
        "version": config["version"],
        "status": config["status"],
        "profileId": profile_id,
        "supportedClasses": config["classes"],
        "deltaPolygonCount": len(classified_delta),
        "boundarySystems": {},
    }

    for product in EDGE_PRODUCTS:
        gdf = gpd.read_file(product["input"])
        if gdf.crs is None:
            raise RuntimeError(f"Missing CRS in {product['input']}")

        projected = gdf.to_crs(TARGET_CRS).copy()
        class_counts = {}
        subclass_counts = {}
        buffer_width = max(60.0, profile["maxInlandWaterProjectionWidthM"] / 2.0)

        edge_classes = []
        edge_subclasses = []
        class_sources = []
        match_delta_ids = []
        match_widths = []
        match_depths = []
        match_areas = []

        for row in projected.itertuples():
            if bool(row.internal):
                edge_class = "internal"
                edge_subclass = None
                class_source = "topology_internal_arc"
                matched = None
            else:
                best = None
                query_geom = row.geometry.buffer(buffer_width)
                candidate_indices = (
                    list(delta_index.intersection(query_geom.bounds)) if delta_index is not None else []
                )

                for candidate_index in candidate_indices:
                    item = delta_gdf.iloc[candidate_index]
                    buffered = item.geometry.buffer(buffer_width)
                    if not row.geometry.intersects(buffered):
                        continue
                    overlap_length = row.geometry.intersection(buffered).length
                    if overlap_length <= 0:
                        continue
                    if best is None or overlap_length > best["overlap_length"]:
                        best = {
                            "item": item,
                            "overlap_length": overlap_length,
                        }

                if best is None:
                    edge_class = "sea"
                    edge_subclass = None
                    class_source = "hydro_normalized_external_arc_default"
                    matched = None
                else:
                    matched = best["item"]
                    edge_class = matched["edge_class"]
                    edge_subclass = matched["edge_subclass"]
                    class_source = "hydro_normalized_delta_match"

            edge_classes.append(edge_class)
            edge_subclasses.append(edge_subclass)
            class_sources.append(class_source)
            match_delta_ids.append(matched["delta_id"] if matched is not None else None)
            match_widths.append(matched["opening_width_m"] if matched is not None else None)
            match_depths.append(matched["projection_depth_m"] if matched is not None else None)
            match_areas.append(matched["area_m2"] if matched is not None else None)
            class_counts[edge_class] = class_counts.get(edge_class, 0) + 1
            if edge_subclass:
                subclass_counts[edge_subclass] = subclass_counts.get(edge_subclass, 0) + 1

        gdf["edge_class"] = edge_classes
        gdf["edge_subclass"] = edge_subclasses
        gdf["classification_source"] = class_sources
        gdf["classification_profile"] = profile_id
        gdf["matched_delta_id"] = match_delta_ids
        gdf["matched_opening_width_m"] = match_widths
        gdf["matched_projection_depth_m"] = match_depths
        gdf["matched_delta_area_m2"] = match_areas
        gdf["boundary_system"] = product["boundary_system"]
        gdf["classification_status"] = config["status"]
        gdf["classification_version"] = config["version"]

        if product["output"].exists():
            product["output"].unlink()
        gdf.to_file(product["output"], driver="GeoJSON", COORDINATE_PRECISION=6)
        if product["public_output"].exists():
            product["public_output"].unlink()
        gdf.to_file(product["public_output"], driver="GeoJSON", COORDINATE_PRECISION=6)

        summary["boundarySystems"][product["boundary_system"]] = {
            "output": str(product["output"].relative_to(ROOT)),
            "publicOutput": str(product["public_output"].relative_to(ROOT)),
            "featureCount": int(len(gdf)),
            "classCounts": class_counts,
            "subclassCounts": subclass_counts,
        }

        print(f"Written water-edge classes: {product['output']}")
        print(f"Published water-edge classes: {product['public_output']}")
        print(f"  {product['boundary_system']}: {len(gdf)} features")
        for key, value in sorted(class_counts.items()):
            print(f"    {key}: {value}")

    SUMMARY_OUTPUT.write_text(json.dumps(summary, indent=2))
    print(f"Written water-edge summary: {SUMMARY_OUTPUT}")


if __name__ == "__main__":
    main()
