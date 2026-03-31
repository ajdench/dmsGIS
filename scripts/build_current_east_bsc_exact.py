#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import Point, get_parts, make_valid, shortest_line
from shapely.geometry import GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon
from shapely.ops import polygonize, unary_union


ROOT = Path(__file__).resolve().parents[1]
CURRENT_EXACT = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson"
)
CURRENT_SPLIT_DISSOLVED = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_SplitICB_Current_Canonical_Dissolved.geojson"
)
ICB_BSC = (
    ROOT
    / "geopackages"
    / "compare_sources"
    / "Integrated_Care_Boards_April_2023_EN_BSC.gpkg"
)
OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "compare" / "current_east_bsc"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_EXACT_GEOJSON = OUTPUT_DIR / "Current_East_BSC_exact.geojson"
OUTPUT_EXACT_GPKG = OUTPUT_DIR / "Current_East_BSC_exact.gpkg"
OUTPUT_SPLIT_GEOJSON = OUTPUT_DIR / "Current_East_BSC_split.geojson"
OUTPUT_LANDMASK_GEOJSON = OUTPUT_DIR / "Current_East_BSC_landmask.geojson"
TARGET_CRS = "EPSG:27700"
OUTPUT_CRS = "EPSG:4326"
LINE_EPS = 1e-6
FACE_MIN_AREA = 1.0
EAST_CODES = {
    "E54000013",
    "E54000015",
    "E54000022",
    "E54000023",
    "E54000024",
    "E54000026",
    "E54000056",
    "E54000059",
    "E54000060",
}
EAST_STRUCTURAL_PARENT_CODES = {"E54000025"}
EAST_RECONSTRUCTION_CODES = EAST_CODES | EAST_STRUCTURAL_PARENT_CODES
EAST_SPLIT_REGION_REF = "East"


def load_target_crs(path: Path, layer: str | None = None) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(path, layer=layer) if layer else gpd.read_file(path)
    if gdf.crs is None:
        raise RuntimeError(f"Missing CRS on source: {path}")
    return gdf.to_crs(TARGET_CRS)


def polygon_only(geom):
    if geom is None or geom.is_empty:
        return None
    fixed = make_valid(geom)
    polygons = []
    for part in get_parts(fixed):
        if isinstance(part, Polygon):
            polygons.append(part)
        elif isinstance(part, MultiPolygon):
            polygons.extend(list(part.geoms))
    polygons = [polygon for polygon in polygons if not polygon.is_empty and polygon.area > 0]
    if not polygons:
        return None
    merged = unary_union(polygons)
    if isinstance(merged, Polygon):
        return merged
    if isinstance(merged, MultiPolygon):
        return merged
    if isinstance(merged, GeometryCollection):
        polys = []
        for part in get_parts(merged):
            if isinstance(part, Polygon):
                polys.append(part)
            elif isinstance(part, MultiPolygon):
                polys.extend(list(part.geoms))
        if not polys:
            return None
        return unary_union(polys)
    return None


def iter_line_parts(geom):
    if geom is None or geom.is_empty:
        return []
    if isinstance(geom, LineString):
        return [geom]
    if isinstance(geom, MultiLineString):
        return [part for part in geom.geoms if not part.is_empty and part.length > LINE_EPS]
    if isinstance(geom, GeometryCollection):
        parts = []
        for member in geom.geoms:
            parts.extend(iter_line_parts(member))
        return parts
    return []


def extract_internal_shared_lines(gdf: gpd.GeoDataFrame):
    geometries = gdf.geometry.tolist()
    spatial_index = gdf.sindex
    shared_parts = []

    for left_position, left_geom in enumerate(geometries):
        candidate_positions = spatial_index.query(left_geom, predicate="intersects")
        for right_position in candidate_positions:
            if right_position <= left_position:
                continue
            right_geom = geometries[right_position]
            shared = left_geom.boundary.intersection(right_geom.boundary)
            for part in iter_line_parts(shared):
                if part.length > LINE_EPS:
                    shared_parts.append(part)

    if not shared_parts:
        return MultiLineString([])
    return unary_union(shared_parts)


def endpoint_key(point: Point) -> tuple[float, float]:
    return (round(point.x, 6), round(point.y, 6))


def build_extension_lines(internal_lines, envelope_geom):
    boundary = envelope_geom.boundary
    endpoint_counts: dict[tuple[float, float], int] = {}
    endpoint_points: dict[tuple[float, float], Point] = {}
    for line in iter_line_parts(internal_lines):
        coords = list(line.coords)
        for coord in (coords[0], coords[-1]):
            point = Point(coord)
            key = endpoint_key(point)
            endpoint_counts[key] = endpoint_counts.get(key, 0) + 1
            endpoint_points[key] = point

    extensions = []
    for key, count in endpoint_counts.items():
        if count != 1:
            continue
        point = endpoint_points[key]
        if point.distance(boundary) <= LINE_EPS:
            continue
        connector = shortest_line(point, boundary)
        for part in iter_line_parts(connector):
            if part.length > LINE_EPS:
                extensions.append(part)
    if not extensions:
        return MultiLineString([])
    return unary_union(extensions)


def assign_faces_to_boards(faces, boards: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    board_geometries = boards.geometry.tolist()
    board_index = boards.sindex
    records = []

    for face in faces:
        candidate_positions = list(board_index.query(face, predicate="intersects"))
        best_position = None
        best_overlap = 0.0
        for position in candidate_positions:
            overlap = face.intersection(board_geometries[position]).area
            if overlap > best_overlap:
                best_overlap = overlap
                best_position = position

        if best_position is None:
            distances = [face.distance(geom) for geom in board_geometries]
            best_position = min(range(len(board_geometries)), key=lambda position: distances[position])

        row = boards.iloc[best_position]
        records.append(
            {
                **{column: row[column] for column in boards.columns if column != "geometry"},
                "geometry": face,
            }
        )

    assigned = gpd.GeoDataFrame(records, geometry="geometry", crs=TARGET_CRS)
    dissolved = (
        assigned.groupby("boundary_code", as_index=False)
        .agg(
            {
                "boundary_type": "first",
                "boundary_name": "first",
                "line_color_hex": "first",
                "line_alpha": "first",
                "line_width": "first",
                "build_source": "first",
                "geometry": lambda geoms: unary_union(list(geoms)),
            }
        )
    )
    dissolved = gpd.GeoDataFrame(dissolved, geometry="geometry", crs=TARGET_CRS)
    dissolved["geometry"] = dissolved["geometry"].map(polygon_only)
    dissolved = dissolved.loc[dissolved.geometry.notna()].copy()
    return dissolved


def rescue_missing_boards(
    reconstructed: gpd.GeoDataFrame,
    boards: gpd.GeoDataFrame,
    envelope_geom,
) -> gpd.GeoDataFrame:
    expected_codes = sorted(set(boards["boundary_code"].astype(str)))
    rescue_payload = []
    reconstructed["boundary_code"] = reconstructed["boundary_code"].astype(str)

    for code in expected_codes:
        source_row = boards.loc[boards["boundary_code"].astype(str) == code].iloc[0]
        target_geom = polygon_only(source_row.geometry.intersection(envelope_geom))
        if target_geom is None or target_geom.is_empty or target_geom.area <= FACE_MIN_AREA:
            continue

        existing_rows = reconstructed.loc[reconstructed["boundary_code"] == code]
        existing_geom = None if existing_rows.empty else polygon_only(unary_union(existing_rows.geometry))
        existing_area = 0.0 if existing_geom is None or existing_geom.is_empty else existing_geom.area
        target_ratio = existing_area / target_geom.area
        if target_ratio >= 0.9:
            continue

        rescue_payload.append((code, source_row, target_geom))

    if not rescue_payload:
        return reconstructed

    rescued = reconstructed.copy()
    for code, source_row, target_geom in rescue_payload:
        rescued = rescued.loc[rescued["boundary_code"] != code].copy()

        overlap_positions = [
            position
            for position, geom in enumerate(rescued.geometry)
            if geom is not None and not geom.is_empty and geom.intersects(target_geom)
        ]
        for position in overlap_positions:
            trimmed = polygon_only(rescued.geometry.iloc[position].difference(target_geom))
            rescued.at[rescued.index[position], "geometry"] = trimmed

        rescued = pd.concat(
            [
                rescued,
                gpd.GeoDataFrame(
                    [
                        {
                            **{column: source_row[column] for column in boards.columns if column != "geometry"},
                            "geometry": target_geom,
                        }
                    ],
                    geometry="geometry",
                    crs=TARGET_CRS,
                ),
            ],
            ignore_index=True,
        )

    rescued = rescued.loc[rescued.geometry.notna()].copy()
    rescued["geometry"] = rescued["geometry"].map(polygon_only)
    rescued = rescued.loc[rescued.geometry.notna()].copy()
    return gpd.GeoDataFrame(rescued, geometry="geometry", crs=TARGET_CRS)


def subtract_split_from_boards(
    boards: gpd.GeoDataFrame,
    split: gpd.GeoDataFrame,
) -> gpd.GeoDataFrame:
    if boards.empty or split.empty:
        return boards

    split_union = polygon_only(unary_union(list(split.geometry)))
    if split_union is None or split_union.is_empty:
        return boards

    trimmed = boards.copy()
    trimmed["geometry"] = trimmed["geometry"].map(
        lambda geom: polygon_only(geom.difference(split_union)) if geom is not None and not geom.is_empty else None
    )
    trimmed = trimmed.loc[trimmed.geometry.notna()].copy()
    return gpd.GeoDataFrame(trimmed, geometry="geometry", crs=TARGET_CRS)


def build_current_east_exact() -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame, object]:
    current = load_target_crs(CURRENT_EXACT)
    current = current.loc[current["boundary_code"].isin(EAST_RECONSTRUCTION_CODES)].copy()
    split = load_target_crs(CURRENT_SPLIT_DISSOLVED)
    split = split.loc[split["region_ref"] == EAST_SPLIT_REGION_REF].copy()
    split["geometry"] = split["geometry"].map(polygon_only)
    split = split.loc[split.geometry.notna()].copy()

    icb_bsc = load_target_crs(ICB_BSC, layer="ICB_APR_2023_EN_BSC")
    icb_bsc = icb_bsc.loc[icb_bsc["ICB23CD"].isin(EAST_RECONSTRUCTION_CODES)].copy()
    if icb_bsc.empty:
        raise RuntimeError("East ICBs not found in ICB BSC source")
    envelope_geom = polygon_only(unary_union(icb_bsc.geometry))
    if envelope_geom is None or envelope_geom.is_empty:
        raise RuntimeError("Missing East BSC envelope geometry")

    current["geometry"] = current["geometry"].map(polygon_only)
    current = current.loc[current.geometry.notna()].copy()

    internal_lines = extract_internal_shared_lines(current)
    clipped_internal = internal_lines.intersection(envelope_geom)
    extension_lines = build_extension_lines(clipped_internal, envelope_geom)
    network = [envelope_geom.boundary]
    if not clipped_internal.is_empty:
        network.append(clipped_internal)
    if not extension_lines.is_empty:
        network.append(extension_lines)
    merged_network = unary_union(network)

    faces = [
        polygon
        for polygon in polygonize(merged_network)
        if polygon.area > FACE_MIN_AREA and polygon.representative_point().within(envelope_geom.buffer(LINE_EPS))
    ]
    if not faces:
        raise RuntimeError("Failed to polygonize East BSC reconstruction")

    boards = assign_faces_to_boards(faces, current)
    boards = rescue_missing_boards(boards, current, envelope_geom)
    boards = boards.loc[boards["boundary_code"].isin(EAST_CODES)].copy()
    split["geometry"] = split["geometry"].map(lambda geom: polygon_only(geom.intersection(envelope_geom)))
    split_out = split.loc[split.geometry.notna()].copy()
    boards = subtract_split_from_boards(boards, split_out)

    return boards, split_out, envelope_geom


def write_outputs(boards: gpd.GeoDataFrame, split: gpd.GeoDataFrame, envelope_geom) -> None:
    boards = boards[
        [
            "boundary_type",
            "boundary_code",
            "boundary_name",
            "line_color_hex",
            "line_alpha",
            "line_width",
            "build_source",
            "geometry",
        ]
    ].copy()
    boards.to_file(OUTPUT_EXACT_GPKG, layer="current_east_bsc_exact", driver="GPKG")
    boards.to_crs(OUTPUT_CRS).to_file(OUTPUT_EXACT_GEOJSON, driver="GeoJSON")

    split = split[
        [
            "component_id",
            "parent_code",
            "boundary_code",
            "parent_name",
            "boundary_name",
            "region_ref",
            "assignment_basis",
            "build_source",
            "geometry",
        ]
    ].copy()
    split.to_crs(OUTPUT_CRS).to_file(OUTPUT_SPLIT_GEOJSON, driver="GeoJSON")

    gpd.GeoDataFrame(
        [{"name": "Current East BSC landmask", "geometry": envelope_geom}],
        geometry="geometry",
        crs=TARGET_CRS,
    ).to_crs(OUTPUT_CRS).to_file(OUTPUT_LANDMASK_GEOJSON, driver="GeoJSON")


def main() -> None:
    boards, split, envelope_geom = build_current_east_exact()
    write_outputs(boards, split, envelope_geom)
    print(f"wrote {OUTPUT_EXACT_GEOJSON.relative_to(ROOT)}")
    print(f"wrote {OUTPUT_SPLIT_GEOJSON.relative_to(ROOT)}")
    print(f"wrote {OUTPUT_LANDMASK_GEOJSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
