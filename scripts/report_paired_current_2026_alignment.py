#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

import geopandas as gpd
from shapely import GeometryCollection, MultiPolygon, Polygon, make_valid


ROOT = Path(__file__).resolve().parents[1]
TARGET_CRS = "EPSG:27700"
DEFAULT_OUT_DIR = ROOT / "geopackages" / "outputs" / "v38_bsc_runtime_family"
CHANGED_CONFIG = ROOT / "src" / "lib" / "config" / "england2026ChangedBoards.json"


def resolve_path(env_name: str, default_path: Path) -> Path:
    override = str(os.environ.get(env_name) or "").strip()
    if override:
        candidate = Path(override)
        return candidate if candidate.is_absolute() else ROOT / candidate
    return default_path


def get_out_dir() -> Path:
    out_dir = resolve_path("BSC_SOURCE_OUT_DIR", DEFAULT_OUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)
    return out_dir


def get_current_source() -> Path:
    return resolve_path(
        "CURRENT_SOURCE_OUTPUT_PATH",
        get_out_dir() / "UK_ICB_LHB_Boundaries_Current_BSC_source.geojson",
    )


def get_y2026_source() -> Path:
    return resolve_path(
        "Y2026_SOURCE_OUTPUT_PATH",
        get_out_dir() / "UK_Health_Board_Boundaries_2026_BSC_source.geojson",
    )


def get_current_runtime() -> Path:
    default_path = ROOT / "public" / "data" / "regions" / "UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson"
    return resolve_path("CURRENT_RUNTIME_GEOJSON_PATH", default_path)


def get_y2026_runtime() -> Path:
    default_path = (
        ROOT / "public" / "data" / "regions" / "UK_Health_Board_Boundaries_Codex_2026_simplified.geojson"
    )
    return resolve_path("Y2026_RUNTIME_GEOJSON_PATH", default_path)


def get_report_path() -> Path:
    return resolve_path(
        "PAIRED_ALIGNMENT_REPORT_PATH",
        get_out_dir() / "paired_current_2026_alignment_report.json",
    )


def polygon_only(geom):
    fixed = make_valid(geom)
    if isinstance(fixed, (Polygon, MultiPolygon)):
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
        if len(polys) == 1:
            return polys[0]
        return MultiPolygon(polys)
    return None


def load_geojson(path: Path) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(path)
    if gdf.crs is None:
        raise RuntimeError(f"Missing CRS: {path}")
    if str(gdf.crs) != TARGET_CRS:
        gdf = gdf.to_crs(TARGET_CRS)
    gdf["geometry"] = gdf["geometry"].map(polygon_only)
    return gdf


def load_changed_config() -> list[dict[str, object]]:
    return json.loads(CHANGED_CONFIG.read_text(encoding="utf-8"))


def get_single_geometry(gdf: gpd.GeoDataFrame, boundary_code: str):
    row = gdf.loc[gdf["boundary_code"] == boundary_code]
    if len(row) != 1:
        raise RuntimeError(f"Expected exactly one feature for {boundary_code}, found {len(row)}")
    geom = polygon_only(row.iloc[0].geometry)
    if geom is None or geom.is_empty:
        raise RuntimeError(f"Missing polygon geometry for {boundary_code}")
    return geom


def get_union_geometry(gdf: gpd.GeoDataFrame, predecessor_codes: list[str]):
    subset = gdf.loc[gdf["boundary_code"].isin(predecessor_codes)]
    if len(subset) != len(predecessor_codes):
        actual_codes = {str(code) for code in subset["boundary_code"].tolist()}
        missing = [code for code in predecessor_codes if code not in actual_codes]
        raise RuntimeError(f"Missing predecessor codes: {missing}")
    geom = polygon_only(subset.geometry.union_all())
    if geom is None or geom.is_empty:
        raise RuntimeError(f"Missing predecessor union geometry: {predecessor_codes}")
    return geom


def build_overlap_components(entries: list[dict[str, object]]) -> list[list[dict[str, object]]]:
    pending = [
        {
            **entry,
            "targetCode": str(entry["targetCode"]),
            "predecessorCurrentIcbCodes": [str(code) for code in entry["predecessorCurrentIcbCodes"]],
        }
        for entry in entries
    ]
    components: list[list[dict[str, object]]] = []

    while pending:
        component = [pending.pop(0)]
        changed = True
        while changed:
            changed = False
            component_predecessors = set().union(
                *(set(entry["predecessorCurrentIcbCodes"]) for entry in component)
            )
            remaining = []
            for entry in pending:
                if component_predecessors.intersection(entry["predecessorCurrentIcbCodes"]):
                    component.append(entry)
                    changed = True
                else:
                    remaining.append(entry)
            pending = remaining
        components.append(component)

    return components


def measure_alignment(target_geom, predecessor_union_geom) -> dict[str, float]:
    return {
        "target_area_m2": round(float(target_geom.area), 2),
        "predecessor_union_area_m2": round(float(predecessor_union_geom.area), 2),
        "intersection_area_m2": round(float(target_geom.intersection(predecessor_union_geom).area), 2),
        "extra_area_m2": round(float(target_geom.difference(predecessor_union_geom).area), 2),
        "missing_area_m2": round(float(predecessor_union_geom.difference(target_geom).area), 2),
        "symmetric_difference_area_m2": round(
            float(target_geom.symmetric_difference(predecessor_union_geom).area), 2
        ),
    }


def main() -> None:
    current_source_path = get_current_source()
    y2026_source_path = get_y2026_source()
    current_runtime_path = get_current_runtime()
    y2026_runtime_path = get_y2026_runtime()
    report_path = get_report_path()
    report_path.parent.mkdir(parents=True, exist_ok=True)

    changed = load_changed_config()
    current_source = load_geojson(current_source_path)
    y2026_source = load_geojson(y2026_source_path)
    current_runtime = load_geojson(current_runtime_path)
    y2026_runtime = load_geojson(y2026_runtime_path)

    board_entries = []
    for item in changed:
        target_code = str(item["targetCode"])
        target_name = str(item["targetName"])
        change_kind = str(item["changeKind"])
        predecessor_codes = [str(code) for code in item["predecessorCurrentIcbCodes"]]

        source_target = get_single_geometry(y2026_source, target_code)
        source_union = get_union_geometry(current_source, predecessor_codes)
        runtime_target = get_single_geometry(y2026_runtime, target_code)
        runtime_union = get_union_geometry(current_runtime, predecessor_codes)

        board_entries.append(
            {
                "targetCode": target_code,
                "targetName": target_name,
                "changeKind": change_kind,
                "predecessorCurrentIcbCodes": predecessor_codes,
                "sourceStage": measure_alignment(source_target, source_union),
                "runtimeStage": measure_alignment(runtime_target, runtime_union),
            }
        )

    component_entries = []
    for component in build_overlap_components(changed):
        target_codes = [str(entry["targetCode"]) for entry in component]
        predecessor_codes = sorted(
            set().union(*(set(str(code) for code in entry["predecessorCurrentIcbCodes"]) for entry in component))
        )
        source_target = polygon_only(
            y2026_source.loc[y2026_source["boundary_code"].isin(target_codes)].geometry.union_all()
        )
        source_union = get_union_geometry(current_source, predecessor_codes)
        runtime_target = polygon_only(
            y2026_runtime.loc[y2026_runtime["boundary_code"].isin(target_codes)].geometry.union_all()
        )
        runtime_union = get_union_geometry(current_runtime, predecessor_codes)
        component_entries.append(
            {
                "targetCodes": target_codes,
                "targetNames": [str(entry["targetName"]) for entry in component],
                "changeKinds": sorted({str(entry["changeKind"]) for entry in component}),
                "predecessorCurrentIcbCodes": predecessor_codes,
                "sourceStage": measure_alignment(source_target, source_union),
                "runtimeStage": measure_alignment(runtime_target, runtime_union),
            }
        )

    summary = {
        "sourceStageMaxExtraAreaM2": max(
            entry["sourceStage"]["extra_area_m2"] for entry in component_entries
        ),
        "sourceStageMaxSymmetricDifferenceM2": max(
            entry["sourceStage"]["symmetric_difference_area_m2"] for entry in component_entries
        ),
        "runtimeStageMaxExtraAreaM2": max(
            entry["runtimeStage"]["extra_area_m2"] for entry in component_entries
        ),
        "runtimeStageMaxSymmetricDifferenceM2": max(
            entry["runtimeStage"]["symmetric_difference_area_m2"] for entry in component_entries
        ),
    }
    report = {
        "purpose": (
            "Measure the changed England 2026 boards against unions of their "
            "Current predecessor boards at both source and runtime stages, including "
            "overlap-component checks for multi-board redraw clusters."
        ),
        "currentSource": str(current_source_path),
        "y2026Source": str(y2026_source_path),
        "currentRuntime": str(current_runtime_path),
        "y2026Runtime": str(y2026_runtime_path),
        "boardEntries": board_entries,
        "componentEntries": component_entries,
        "summary": summary,
    }
    report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
