from __future__ import annotations

import json
from pathlib import Path

from shapely.geometry import MultiPolygon, Polygon, mapping, shape
from shapely.ops import transform, unary_union
from pyproj import Transformer


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "src" / "lib" / "config" / "waterEdgeTreatment.json"
SOURCE_PATH = ROOT / "geopackages" / "outputs" / "uk_landmask" / "UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson"
OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "uk_landmask"
METADATA_PATH = OUTPUT_DIR / "UK_Landmask_OSM_simplified_v01_hydronormalized_profiles.json"

TO_27700 = Transformer.from_crs(4326, 27700, always_xy=True).transform
TO_4326 = Transformer.from_crs(27700, 4326, always_xy=True).transform


def flatten_polygons(geometry):
    if geometry.is_empty:
        return []
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, MultiPolygon):
        return list(geometry.geoms)
    if hasattr(geometry, "geoms"):
        polygons = []
        for member in geometry.geoms:
            polygons.extend(flatten_polygons(member))
        return polygons
    return []


def to_feature_collection(geometry):
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "UK hydro-normalized landmask",
                },
                "geometry": mapping(geometry),
            }
        ],
    }


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


def normalize_profile(base_geometry_27700, profile):
    closing_width = float(profile["maxInlandWaterProjectionWidthM"])
    min_island_area = float(profile["minIslandAreaM2"])

    normalized_candidate = base_geometry_27700.buffer(closing_width / 2.0).buffer(-(closing_width / 2.0))
    polygons = [
        polygon
        for polygon in flatten_polygons(normalized_candidate)
        if polygon.area >= min_island_area
    ]
    merged_candidate = unary_union(polygons) if polygons else normalized_candidate
    delta_polygons = flatten_polygons(merged_candidate.difference(base_geometry_27700))

    class_counts = {}
    subclass_counts = {}
    selected_polygons = []
    landfill_classes = set(profile.get("landfillClasses", []))

    for polygon in delta_polygons:
      attrs = classify_delta_polygon(polygon, profile)
      edge_class = attrs["edge_class"]
      class_counts[edge_class] = class_counts.get(edge_class, 0) + 1
      if attrs["edge_subclass"]:
          subclass_counts[attrs["edge_subclass"]] = subclass_counts.get(attrs["edge_subclass"], 0) + 1
      if edge_class in landfill_classes:
          selected_polygons.append(polygon)

    normalized_operational = unary_union([base_geometry_27700, *selected_polygons]) if selected_polygons else base_geometry_27700
    return {
        "geometry": normalized_operational,
        "candidate_geometry": merged_candidate,
        "delta_polygon_count": len(delta_polygons),
        "selected_delta_polygon_count": len(selected_polygons),
        "class_counts": class_counts,
        "subclass_counts": subclass_counts,
        "landfill_classes": sorted(landfill_classes),
    }


def main():
    config = json.loads(CONFIG_PATH.read_text())
    source = json.loads(SOURCE_PATH.read_text())
    source_geometry = shape(source["features"][0]["geometry"])
    source_27700 = transform(TO_27700, source_geometry)

    metadata = {
        "version": config["version"],
        "status": config["status"],
        "source": str(SOURCE_PATH.relative_to(ROOT)),
        "profiles": {},
    }

    for profile_id, profile in config["preprocessing"]["profiles"].items():
        normalized = normalize_profile(source_27700, profile)
        normalized_27700 = normalized["geometry"]
        normalized_4326 = transform(TO_4326, normalized_27700)
        output_path = OUTPUT_DIR / f"UK_Landmask_OSM_simplified_v01_hydronormalized_{profile_id}.geojson"
        output_path.write_text(json.dumps(to_feature_collection(normalized_4326)))

        polygons = flatten_polygons(normalized_27700)
        metadata["profiles"][profile_id] = {
            "output": str(output_path.relative_to(ROOT)),
            "maxInlandWaterProjectionWidthM": profile["maxInlandWaterProjectionWidthM"],
            "minIslandAreaM2": profile["minIslandAreaM2"],
            "landfillClasses": normalized["landfill_classes"],
            "candidateAreaDeltaM2": round(float(normalized["candidate_geometry"].area - source_27700.area), 2),
            "areaDeltaM2": round(float(normalized_27700.area - source_27700.area), 2),
            "partCount": len(polygons),
            "deltaPolygonCount": normalized["delta_polygon_count"],
            "selectedDeltaPolygonCount": normalized["selected_delta_polygon_count"],
            "classCounts": normalized["class_counts"],
            "subclassCounts": normalized["subclass_counts"],
        }

        print(
            f"{profile_id}: wrote {output_path.name} "
            f"(parts={len(polygons)}, areaDeltaM2={metadata['profiles'][profile_id]['areaDeltaM2']})"
        )

    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"metadata: wrote {METADATA_PATH.name}")


if __name__ == "__main__":
    main()
