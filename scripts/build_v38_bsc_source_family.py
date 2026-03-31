#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon, make_valid
from shapely.ops import polygonize, unary_union


ROOT = Path(__file__).resolve().parents[1]
COMPARE_SOURCES = ROOT / "geopackages" / "compare_sources"
DEFAULT_OUT_DIR = ROOT / "geopackages" / "outputs" / "v38_bsc_runtime_family"

CURRENT_EXACT = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson"
)
Y2026_EXACT = (
    ROOT
    / "geopackages"
    / "ICB 2026"
    / "outputs"
    / "full_uk_2026_boards"
    / "UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson"
)

ENGLAND_ICB_BSC = COMPARE_SOURCES / "Integrated_Care_Boards_April_2023_EN_BSC.gpkg"
ENGLAND_ICB_BSC_LAYER = "ICB_APR_2023_EN_BSC"
TARGET_CRS = "EPSG:27700"
CHANGED_ENGLAND_2026_CONFIG = ROOT / "src" / "lib" / "config" / "england2026ChangedBoards.json"

ENGLAND_2026_BSC_LIKE_SIMPLIFY_TOLERANCE_M = 50.0
DEVOLVED_BSC_LIKE_SIMPLIFY_TOLERANCE_M = 25.0


def load_changed_england_2026_config() -> list[dict[str, object]]:
    return json.loads(CHANGED_ENGLAND_2026_CONFIG.read_text(encoding="utf-8"))


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


def get_current_output() -> Path:
    return resolve_path(
        "CURRENT_SOURCE_OUTPUT_PATH",
        get_out_dir() / "UK_ICB_LHB_Boundaries_Current_BSC_source.geojson",
    )


def get_y2026_output() -> Path:
    return resolve_path(
        "Y2026_SOURCE_OUTPUT_PATH",
        get_out_dir() / "UK_Health_Board_Boundaries_2026_BSC_source.geojson",
    )


def get_summary_output() -> Path:
    return resolve_path("BSC_SOURCE_SUMMARY_OUTPUT_PATH", get_out_dir() / "SUMMARY.txt")


CHANGED_ENGLAND_2026 = load_changed_england_2026_config()
MERGE_ONLY_2026_CODES = {
    str(entry["targetCode"])
    for entry in CHANGED_ENGLAND_2026
    if str(entry["changeKind"]) == "merge_only"
}
FRIMLEY_DRIVEN_2026_CODES = {
    str(entry["targetCode"])
    for entry in CHANGED_ENGLAND_2026
    if str(entry["changeKind"]) == "frimley_redraw"
}
CHANGED_ENGLAND_2026_PREDECESSOR_BSC_CODES = {
    str(entry["targetCode"]): set(entry["predecessorCurrentIcbCodes"])
    for entry in CHANGED_ENGLAND_2026
}
CHANGED_ENGLAND_2026_BY_CODE = {
    str(entry["targetCode"]): dict(entry)
    for entry in CHANGED_ENGLAND_2026
}


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


def ensure_target_crs(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    if gdf.crs is None:
        raise RuntimeError("Missing CRS")
    if str(gdf.crs) != TARGET_CRS:
        return gdf.to_crs(TARGET_CRS)
    return gdf


def simplify_geometry_bsc_like(geom, tolerance_m: float):
    polygon = polygon_only(geom)
    if polygon is None:
        return None
    simplified = polygon.simplify(tolerance_m, preserve_topology=True)
    return polygon_only(simplified)


def apply_bsc_like_simplification(gdf: gpd.GeoDataFrame, tolerance_m: float) -> gpd.GeoDataFrame:
    out = gdf.copy()
    out["geometry"] = out["geometry"].map(lambda geom: simplify_geometry_bsc_like(geom, tolerance_m))
    return out


def collect_line_parts(geometry):
    if geometry is None or geometry.is_empty:
        return []
    if isinstance(geometry, LineString):
        return [geometry]
    if isinstance(geometry, MultiLineString):
        return list(geometry.geoms)
    if isinstance(geometry, GeometryCollection):
        lines = []
        for part in geometry.geoms:
            lines.extend(collect_line_parts(part))
        return lines
    return []


def partition_shell_by_lines(shell_geometry, lines: list[LineString]):
    if not lines:
        return list(shell_geometry.geoms) if isinstance(shell_geometry, MultiPolygon) else [shell_geometry]

    linework = unary_union([shell_geometry.boundary, *lines])
    faces = []
    for polygon in polygonize(linework):
        representative_point = polygon.representative_point()
        if representative_point.within(shell_geometry) or representative_point.touches(shell_geometry):
            faces.append(polygon)
    return faces


def build_overlap_components(entries: list[dict[str, object]]) -> list[list[dict[str, object]]]:
    pending = [
        {
            **entry,
            "targetCode": str(entry["targetCode"]),
            "predecessorCurrentIcbCodes": {
                str(code) for code in entry["predecessorCurrentIcbCodes"]
            },
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
                *(entry["predecessorCurrentIcbCodes"] for entry in component)
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


def get_union_geometry_by_codes(gdf: gpd.GeoDataFrame, boundary_codes: set[str]):
    subset = gdf.loc[gdf["boundary_code"].isin(boundary_codes)]
    if len(subset) != len(boundary_codes):
        actual_codes = {str(code) for code in subset["boundary_code"].tolist()}
        missing = sorted(boundary_codes.difference(actual_codes))
        raise RuntimeError(f"Missing predecessor codes in shell boundaries: {missing}")
    geometry = polygon_only(subset.geometry.union_all())
    if geometry is None or geometry.is_empty:
        raise RuntimeError(f"Failed to build predecessor union geometry for {sorted(boundary_codes)}")
    return geometry


def get_row_geometry_by_code(gdf: gpd.GeoDataFrame, boundary_code: str):
    row = gdf.loc[gdf["boundary_code"] == boundary_code]
    if len(row) != 1:
        raise RuntimeError(f"Expected exactly one feature for {boundary_code}, found {len(row)}")
    geometry = polygon_only(row.iloc[0].geometry)
    if geometry is None or geometry.is_empty:
        raise RuntimeError(f"Missing polygon geometry for {boundary_code}")
    return geometry


def rebuild_changed_component_geometries(
    component: list[dict[str, object]],
    shell_boundaries: gpd.GeoDataFrame,
    changed_england: gpd.GeoDataFrame,
) -> dict[str, object]:
    predecessor_codes = set().union(
        *(entry["predecessorCurrentIcbCodes"] for entry in component)
    )
    cluster_shell = get_union_geometry_by_codes(shell_boundaries, predecessor_codes)

    target_geometries = {
        str(entry["targetCode"]): get_row_geometry_by_code(changed_england, str(entry["targetCode"]))
        for entry in component
    }

    if len(component) == 1:
        target_code = str(component[0]["targetCode"])
        return {target_code: cluster_shell}

    internal_cut_lines: list[LineString] = []
    for geometry in target_geometries.values():
        internal_cut_lines.extend(
            collect_line_parts(geometry.boundary.difference(cluster_shell.boundary))
        )

    faces = partition_shell_by_lines(cluster_shell, internal_cut_lines)
    if not faces:
        raise RuntimeError(
            f"Failed to split changed 2026 component for {[entry['targetCode'] for entry in component]}"
        )

    assignments: dict[str, list[object]] = {target_code: [] for target_code in target_geometries}

    for face in faces:
        overlap_areas = {
            target_code: float(face.intersection(geometry).area)
            for target_code, geometry in target_geometries.items()
        }
        max_overlap = max(overlap_areas.values())
        if max_overlap > 1.0:
            best_code = max(overlap_areas, key=overlap_areas.get)
            assignments[best_code].append(face)
            continue

        adjacency_lengths = {
            target_code: float(face.boundary.intersection(geometry.boundary).length)
            for target_code, geometry in target_geometries.items()
        }
        max_adjacency = max(adjacency_lengths.values())
        if max_adjacency > 0:
            best_code = max(adjacency_lengths, key=adjacency_lengths.get)
            assignments[best_code].append(face)
            continue

        best_code = min(
            target_geometries,
            key=lambda target_code: face.distance(target_geometries[target_code]),
        )
        assignments[best_code].append(face)

    rebuilt: dict[str, object] = {}
    for target_code, assigned_faces in assignments.items():
        if not assigned_faces:
            raise RuntimeError(f"Changed 2026 component rebuild produced no faces for {target_code}")
        geometry = polygon_only(unary_union(assigned_faces))
        if geometry is None or geometry.is_empty:
            raise RuntimeError(f"Changed 2026 component rebuild produced empty geometry for {target_code}")
        rebuilt[target_code] = geometry

    rebuilt_union = polygon_only(unary_union(list(rebuilt.values())))
    if rebuilt_union is None or rebuilt_union.is_empty:
        raise RuntimeError("Changed 2026 component rebuild produced an empty component union")
    if rebuilt_union.symmetric_difference(cluster_shell).area > 1.0:
        raise RuntimeError(
            "Changed 2026 component rebuild drifted from the Current shell by more than 1 square metre"
        )

    return rebuilt


def load_official_england_bsc() -> gpd.GeoDataFrame:
    gdf = gpd.read_file(ENGLAND_ICB_BSC, layer=ENGLAND_ICB_BSC_LAYER)
    gdf = ensure_target_crs(gdf)
    out = gdf.rename(
        columns={
            "ICB23CD": "boundary_code",
            "ICB23NM": "boundary_name",
        }
    ).copy()
    out["boundary_type"] = "ICB"
    out["line_color_hex"] = "4d4d4d"
    out["line_alpha"] = 100
    out["line_width"] = 1.5
    out["build_source"] = "official_icb_apr_2023_en_bsc"
    out["runtime_source_kind"] = "official_bsc"
    out["geometry"] = out["geometry"].map(polygon_only)
    return out[
        [
            "boundary_type",
            "boundary_code",
            "boundary_name",
            "line_color_hex",
            "line_alpha",
            "line_width",
            "build_source",
            "runtime_source_kind",
            "geometry",
        ]
    ].copy()


def load_current_exact() -> gpd.GeoDataFrame:
    gdf = gpd.read_file(CURRENT_EXACT)
    gdf = ensure_target_crs(gdf)
    gdf["geometry"] = gdf["geometry"].map(polygon_only)
    gdf["runtime_source_kind"] = "exact_upstream"
    return gdf


def load_2026_exact() -> gpd.GeoDataFrame:
    gdf = gpd.read_file(Y2026_EXACT)
    gdf = ensure_target_crs(gdf)
    gdf["geometry"] = gdf["geometry"].map(polygon_only)
    gdf["runtime_source_kind"] = "exact_upstream"
    return gdf


def build_current_source() -> gpd.GeoDataFrame:
    england_bsc = load_official_england_bsc()
    current_exact = load_current_exact()
    devolved = current_exact.loc[current_exact["boundary_type"] != "ICB"].copy()
    devolved = apply_bsc_like_simplification(devolved, DEVOLVED_BSC_LIKE_SIMPLIFY_TOLERANCE_M)
    devolved["runtime_source_kind"] = "exact_upstream_bsc_like_simplified"
    devolved["build_source"] = "exact_upstream_bsc_like_simplified"

    out = pd.concat([england_bsc, devolved], ignore_index=True)
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=TARGET_CRS)

    expected = {"ICB": 42, "LHB": 7, "SHB": 14, "NIHB": 5}
    actual = out.groupby("boundary_type").size().to_dict()
    if actual != expected:
        raise RuntimeError(f"Current v3.8 source counts mismatch. expected={expected} actual={actual}")
    return out


def build_2026_source() -> gpd.GeoDataFrame:
    england_bsc = load_official_england_bsc()
    y2026_exact = load_2026_exact()

    england_exact = y2026_exact.loc[y2026_exact["boundary_type"] == "ICB"].copy()
    devolved = y2026_exact.loc[y2026_exact["boundary_type"] != "ICB"].copy()

    bsc_by_code = england_bsc.set_index("boundary_code")
    directly_mappable_codes = set(england_exact["boundary_code"]).intersection(
        set(england_bsc["boundary_code"])
    )
    direct_official_exact = england_exact.loc[
        england_exact["boundary_code"].isin(directly_mappable_codes)
    ].copy()
    merge_only_exact = england_exact.loc[
        england_exact["boundary_code"].isin(MERGE_ONLY_2026_CODES)
    ].copy()
    frimley_exact = england_exact.loc[
        england_exact["boundary_code"].isin(FRIMLEY_DRIVEN_2026_CODES)
    ].copy()
    changed_england_exact = pd.concat([merge_only_exact, frimley_exact], ignore_index=True)
    changed_england_exact = gpd.GeoDataFrame(
        changed_england_exact,
        geometry="geometry",
        crs=TARGET_CRS,
    )
    changed_england_exact = apply_bsc_like_simplification(
        changed_england_exact, ENGLAND_2026_BSC_LIKE_SIMPLIFY_TOLERANCE_M
    )
    replacements: dict[str, object] = {}
    for component in build_overlap_components(CHANGED_ENGLAND_2026):
        replacements.update(
            rebuild_changed_component_geometries(component, england_bsc, changed_england_exact)
        )
    changed_england_exact["geometry"] = changed_england_exact["boundary_code"].map(
        lambda code: replacements[str(code)]
    )
    changed_england_exact["runtime_source_kind"] = changed_england_exact["boundary_code"].map(
        lambda code: "exact_2026_sicbl_merge_bsc_shell_seed"
        if str(CHANGED_ENGLAND_2026_BY_CODE[str(code)]["changeKind"]) == "merge_only"
        else "exact_2026_redraw_bsc_shell_seed"
    )
    changed_england_exact["build_source"] = changed_england_exact["runtime_source_kind"]
    devolved = apply_bsc_like_simplification(devolved, DEVOLVED_BSC_LIKE_SIMPLIFY_TOLERANCE_M)

    replacement_rows = []
    for row in direct_official_exact.itertuples():
        bsc_row = bsc_by_code.loc[row.boundary_code]
        replacement_rows.append(
            {
                "boundary_type": row.boundary_type,
                "boundary_code": row.boundary_code,
                "boundary_name": row.boundary_name,
                "line_color_hex": row.line_color_hex,
                "line_alpha": row.line_alpha,
                "line_width": row.line_width,
                "build_source": "official_icb_apr_2023_en_bsc_for_unchanged_2026",
                "runtime_source_kind": "official_bsc",
                "geometry": bsc_row.geometry,
            }
        )

    replacement = gpd.GeoDataFrame(replacement_rows, geometry="geometry", crs=TARGET_CRS)
    devolved["runtime_source_kind"] = "exact_upstream_bsc_like_simplified"
    devolved["build_source"] = "exact_upstream_bsc_like_simplified"

    out = pd.concat([replacement, changed_england_exact, devolved], ignore_index=True)
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=TARGET_CRS)

    expected = {"ICB": 36, "LHB": 7, "SHB": 14, "NIHB": 5}
    actual = out.groupby("boundary_type").size().to_dict()
    if actual != expected:
        raise RuntimeError(f"2026 v3.8 source counts mismatch. expected={expected} actual={actual}")
    return out


def build_paired_source_families() -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Build Current and 2026 together from one shared England ICB BSC base.

    The branch point is explicit:
    - Current keeps the unmerged board family
    - 2026 applies the NHS England 2026 merge/redraw cases on top of that same
      shared England BSC coastal truth
    """
    current = build_current_source()
    y2026 = build_2026_source()
    return current, y2026


def write_output(gdf: gpd.GeoDataFrame, output_path: Path) -> None:
    if output_path.exists():
        output_path.unlink()
    gdf.to_crs(4326).to_file(output_path, driver="GeoJSON")


def main() -> None:
    current, y2026 = build_paired_source_families()

    current_output = get_current_output()
    y2026_output = get_y2026_output()
    summary_output = get_summary_output()
    summary_output.parent.mkdir(parents=True, exist_ok=True)

    write_output(current, current_output)
    write_output(y2026, y2026_output)

    summary_lines = [
        f"current_count: {len(current)}",
        f"current_official_bsc: {int((current['runtime_source_kind'] == 'official_bsc').sum())}",
        f"current_exact_upstream_bsc_like_simplified: {int((current['runtime_source_kind'] == 'exact_upstream_bsc_like_simplified').sum())}",
        f"y2026_count: {len(y2026)}",
        f"y2026_official_bsc: {int((y2026['runtime_source_kind'] == 'official_bsc').sum())}",
        f"y2026_exact_2026_sicbl_merge_bsc_shell_seed: {int((y2026['runtime_source_kind'] == 'exact_2026_sicbl_merge_bsc_shell_seed').sum())}",
        f"y2026_exact_2026_redraw_bsc_shell_seed: {int((y2026['runtime_source_kind'] == 'exact_2026_redraw_bsc_shell_seed').sum())}",
        f"y2026_exact_upstream_bsc_like_simplified: {int((y2026['runtime_source_kind'] == 'exact_upstream_bsc_like_simplified').sum())}",
    ]
    summary_output.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
    print(
        {
            "current_count": len(current),
            "current_official_bsc": int((current["runtime_source_kind"] == "official_bsc").sum()),
            "current_exact_upstream_bsc_like_simplified": int(
                (current["runtime_source_kind"] == "exact_upstream_bsc_like_simplified").sum()
            ),
            "y2026_count": len(y2026),
            "y2026_official_bsc": int((y2026["runtime_source_kind"] == "official_bsc").sum()),
            "y2026_exact_2026_sicbl_merge_bsc_shell_seed": int(
                (y2026["runtime_source_kind"] == "exact_2026_sicbl_merge_bsc_shell_seed").sum()
            ),
            "y2026_exact_2026_redraw_bsc_shell_seed": int(
                (y2026["runtime_source_kind"] == "exact_2026_redraw_bsc_shell_seed").sum()
            ),
            "y2026_exact_upstream_bsc_like_simplified": int(
                (y2026["runtime_source_kind"] == "exact_upstream_bsc_like_simplified").sum()
            ),
        }
    )


if __name__ == "__main__":
    main()
