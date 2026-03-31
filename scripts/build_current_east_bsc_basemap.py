#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box, mapping
from shapely.ops import unary_union


ROOT = Path(__file__).resolve().parents[1]
REGIONS_DIR = Path(os.environ.get("REGIONS_DIR") or (ROOT / "public" / "data" / "regions")).resolve()
BASEMAPS_DIR = Path(os.environ.get("BASEMAPS_DIR") or (ROOT / "public" / "data" / "basemaps")).resolve()
CURRENT_BOARDS = REGIONS_DIR / "UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson"
CURRENT_SPLIT = REGIONS_DIR / "UK_WardSplit_simplified.geojson"
CURRENT_LAND_OUTPUT = BASEMAPS_DIR / "uk_landmask_current_v01.geojson"
CURRENT_SEA_OUTPUT = BASEMAPS_DIR / "uk_seapatch_current_v01.geojson"
TARGET_CRS = "EPSG:27700"
OUTPUT_CRS = "EPSG:4326"
SEA_BUFFER_M = 40000
CURRENT_SPLIT_PARENT_CODES = {"E54000025", "E54000042", "E54000048"}


def write_feature_collection(path: Path, geometry, name: str) -> None:
    fc = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": name},
                "geometry": mapping(geometry),
            }
        ],
    }
    path.write_text(json.dumps(fc) + "\n")


def main() -> None:
    boards = gpd.read_file(CURRENT_BOARDS).to_crs(TARGET_CRS)
    split = gpd.read_file(CURRENT_SPLIT).to_crs(TARGET_CRS)
    visible_boards = boards.loc[
        ~boards["boundary_code"].astype(str).isin(CURRENT_SPLIT_PARENT_CODES)
    ].copy()
    union_geom = unary_union(list(visible_boards.geometry) + list(split.geometry))
    bounds = union_geom.bounds
    sea_geom = box(
        bounds[0] - SEA_BUFFER_M,
        bounds[1] - SEA_BUFFER_M,
        bounds[2] + SEA_BUFFER_M,
        bounds[3] + SEA_BUFFER_M,
    )

    CURRENT_LAND_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    land = gpd.GeoSeries([union_geom], crs=TARGET_CRS).to_crs(OUTPUT_CRS).iloc[0]
    sea = gpd.GeoSeries([sea_geom], crs=TARGET_CRS).to_crs(OUTPUT_CRS).iloc[0]
    write_feature_collection(CURRENT_LAND_OUTPUT, land, "Current East BSC land")
    write_feature_collection(CURRENT_SEA_OUTPUT, sea, "Current East BSC sea patch")
    print(f"wrote {CURRENT_LAND_OUTPUT}")
    print(f"wrote {CURRENT_SEA_OUTPUT}")


if __name__ == "__main__":
    main()
