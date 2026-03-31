#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

import geopandas as gpd
from shapely.geometry import GeometryCollection, MultiLineString, LineString, mapping, shape
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "src" / "lib" / "config" / "viewPresets.json"
REGIONS_DIR = Path(os.environ.get("REGIONS_DIR") or (ROOT / "public" / "data" / "regions"))
OUTLINES_DIR = REGIONS_DIR / "outlines"
CURRENT_WATER_EDGES = REGIONS_DIR / "UK_ICB_LHB_v10_water_edge_classes.geojson"
BOARDS_2026_WATER_EDGES = REGIONS_DIR / "UK_Health_Board_2026_water_edge_classes.geojson"


def slug(name: str) -> str:
    return "_".join(part for part in "".join(ch.lower() if ch.isalnum() else "_" for ch in name).split("_") if part)


def get_boundary_system_water_edges(board_path: str) -> Path:
    if "UK_ICB_LHB_Boundaries_Codex_v10" in board_path:
        return CURRENT_WATER_EDGES
    return BOARDS_2026_WATER_EDGES


def iter_line_parts(geometry):
    if geometry.is_empty:
        return []
    if isinstance(geometry, LineString):
        return [geometry]
    if isinstance(geometry, MultiLineString):
        return [part for part in geometry.geoms if not part.is_empty]
    if isinstance(geometry, GeometryCollection):
        parts = []
        for member in geometry.geoms:
            parts.extend(iter_line_parts(member))
        return parts
    return []


def write_feature_collection(path: Path, geometry, preset_id: str, group_name: str) -> None:
    feature_collection = {
        "type": "FeatureCollection",
        "features": [],
    }

    line_parts = iter_line_parts(geometry)
    if line_parts:
        feature_collection["features"].append(
            {
                "type": "Feature",
                "properties": {
                    "preset": preset_id,
                    "group": group_name,
                    "edge_class": "inlandWater",
                },
                "geometry": mapping(MultiLineString(line_parts)),
            }
        )

    path.write_text(json.dumps(feature_collection))


def main():
    config = json.loads(CONFIG_PATH.read_text())
    water_edge_cache: dict[Path, object] = {}

    for preset_id, preset in config["presets"].items():
        board_path = preset.get("boardLayer", {}).get("path", "")
        water_edge_path = get_boundary_system_water_edges(board_path)
        if water_edge_path not in water_edge_cache:
            water_edges = gpd.read_file(water_edge_path)
            water_edges = water_edges[water_edges["edge_class"] == "inlandWater"].copy()
            water_edge_cache[water_edge_path] = unary_union(list(water_edges.geometry))

        inland_union = water_edge_cache[water_edge_path]

        for group in preset.get("regionGroups", []):
            group_name = group["name"]
            outline_path = OUTLINES_DIR / f"{preset_id}_{slug(group_name)}.geojson"
            target_path = OUTLINES_DIR / f"{preset_id}_{slug(group_name)}_inland_water.geojson"

            if not outline_path.exists():
                write_feature_collection(target_path, GeometryCollection(), preset_id, group_name)
                continue

            outline = json.loads(outline_path.read_text())
            features = outline.get("features", [])
            if not features:
                write_feature_collection(target_path, GeometryCollection(), preset_id, group_name)
                continue

            outline_geometry = shape(features[0]["geometry"])
            inland_geometry = outline_geometry.intersection(inland_union)
            write_feature_collection(target_path, inland_geometry, preset_id, group_name)
            print(f"written {target_path.name}")


if __name__ == "__main__":
    main()
