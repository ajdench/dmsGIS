from __future__ import annotations

import json
import sys
from pathlib import Path

import geopandas as gpd
from shapely.geometry import GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon
from shapely.ops import polygonize, unary_union
from shapely.validation import make_valid


ROOT = Path(__file__).resolve().parents[1]
ENGLAND_ICB_BSC = ROOT / "geopackages" / "compare_sources" / "Integrated_Care_Boards_April_2023_EN_BSC.gpkg"
ENGLAND_ICB_BSC_LAYER = "ICB_APR_2023_EN_BSC"
TARGET_CRS = "EPSG:27700"
CHANGED_CONFIG = ROOT / "src" / "lib" / "config" / "england2026ChangedBoards.json"


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


def load_changed_entries() -> list[dict[str, object]]:
    return json.loads(CHANGED_CONFIG.read_text(encoding="utf-8"))


def load_changed_predecessor_codes() -> dict[str, set[str]]:
    return {
        str(entry["targetCode"]): {str(code) for code in entry["predecessorCurrentIcbCodes"]}
        for entry in load_changed_entries()
    }


def get_row_geometry_by_code(gdf: gpd.GeoDataFrame, boundary_code: str):
    row = gdf.loc[gdf["boundary_code"] == boundary_code]
    if len(row) != 1:
        raise RuntimeError(f"Expected exactly one feature for {boundary_code}, found {len(row)}")
    geometry = polygon_only(row.iloc[0].geometry)
    if geometry is None or geometry.is_empty:
        raise RuntimeError(f"Missing polygon geometry for {boundary_code}")
    return geometry


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


def rebuild_changed_component_geometries(
    component: list[dict[str, object]],
    current_shell_boundaries: gpd.GeoDataFrame,
    y2026_boundaries: gpd.GeoDataFrame,
) -> dict[str, object]:
    predecessor_codes = set().union(
        *(entry["predecessorCurrentIcbCodes"] for entry in component)
    )
    current_cluster_shell = get_union_geometry_by_codes(current_shell_boundaries, predecessor_codes)

    target_geometries = {
        str(entry["targetCode"]): get_row_geometry_by_code(y2026_boundaries, str(entry["targetCode"]))
        for entry in component
    }
    component_codes = set(target_geometries.keys())
    occupied_elsewhere = polygon_only(
        y2026_boundaries.loc[~y2026_boundaries["boundary_code"].isin(component_codes)].geometry.union_all()
    )
    cluster_shell = current_cluster_shell
    if occupied_elsewhere is not None and not occupied_elsewhere.is_empty:
        constrained_shell = polygon_only(current_cluster_shell.difference(occupied_elsewhere))
        if constrained_shell is None or constrained_shell.is_empty:
            raise RuntimeError(
                f"Changed 2026 runtime shell became empty after neighbor reconciliation for {sorted(component_codes)}"
            )
        cluster_shell = constrained_shell

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
            raise RuntimeError(f"Changed 2026 runtime rebuild produced no faces for {target_code}")
        geometry = polygon_only(unary_union(assigned_faces))
        if geometry is None or geometry.is_empty:
            raise RuntimeError(f"Changed 2026 runtime rebuild produced empty geometry for {target_code}")
        rebuilt[target_code] = geometry

    rebuilt_union = polygon_only(unary_union(list(rebuilt.values())))
    if rebuilt_union is None or rebuilt_union.is_empty:
        raise RuntimeError("Changed 2026 runtime rebuild produced an empty component union")
    if rebuilt_union.symmetric_difference(cluster_shell).area > 1.0:
        raise RuntimeError(
            "Changed 2026 runtime rebuild drifted from the Current shell by more than 1 square metre"
        )

    return rebuilt


def load_shells(shell_boundaries_path: Path | None = None) -> dict[str, object]:
    if shell_boundaries_path is None:
        shell_boundaries = gpd.read_file(ENGLAND_ICB_BSC, layer=ENGLAND_ICB_BSC_LAYER).to_crs(TARGET_CRS)
        shell_boundaries = shell_boundaries.rename(columns={"ICB23CD": "boundary_code"})
    else:
        shell_boundaries = gpd.read_file(shell_boundaries_path)
        if shell_boundaries.crs is None:
            raise RuntimeError(f"Missing CRS in shell boundary file: {shell_boundaries_path}")
        shell_boundaries = shell_boundaries.to_crs(TARGET_CRS)
    changed_predecessor_codes = load_changed_predecessor_codes()

    shells: dict[str, object] = {}
    for target_code, predecessor_codes in changed_predecessor_codes.items():
        shell = shell_boundaries.loc[shell_boundaries["boundary_code"].isin(predecessor_codes)].geometry.union_all()
        polygon = polygon_only(shell)
        if polygon is None or polygon.is_empty:
            raise RuntimeError(f"Missing predecessor BSC shell for {target_code}")
        shells[target_code] = polygon
    return shells


def main() -> None:
    if len(sys.argv) not in {3, 4}:
        raise SystemExit(
            "usage: constrain_2026_merge_bsc_shells.py <input.geojson> <output.geojson> [shell_boundaries.geojson]"
        )

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    shell_boundaries_path = Path(sys.argv[3]) if len(sys.argv) == 4 else None
    shells = load_shells(shell_boundaries_path)

    gdf = gpd.read_file(input_path)
    if gdf.crs is None:
        raise RuntimeError("Missing CRS in 2026 runtime source before shell constraint")
    gdf = gdf.to_crs(TARGET_CRS)

    component_replacements: dict[str, object] = {}
    if shell_boundaries_path is not None:
        current_shell_boundaries = gpd.read_file(shell_boundaries_path)
        if current_shell_boundaries.crs is None:
            raise RuntimeError(f"Missing CRS in shell boundary file: {shell_boundaries_path}")
        current_shell_boundaries = current_shell_boundaries.to_crs(TARGET_CRS)
        changed_components = build_overlap_components(load_changed_entries())
        for component in changed_components:
            component_replacements.update(
                rebuild_changed_component_geometries(component, current_shell_boundaries, gdf)
            )

    geometries = []
    for row in gdf.itertuples():
        boundary_code = str(getattr(row, "boundary_code", "")).strip()
        geometry = row.geometry
        if boundary_code in component_replacements:
            geometry = component_replacements[boundary_code]
        elif boundary_code in shells:
            geometry = polygon_only(geometry.intersection(shells[boundary_code]))
            if geometry is None or geometry.is_empty:
                raise RuntimeError(f"Predecessor shell constraint removed all geometry for {boundary_code}")
        else:
            geometry = polygon_only(geometry)
        geometries.append(geometry)

    gdf["geometry"] = geometries
    if output_path.exists():
        output_path.unlink()
    gdf.to_crs(4326).to_file(output_path, driver="GeoJSON")


if __name__ == "__main__":
    main()
