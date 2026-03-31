#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import Point, get_parts, make_valid, shortest_line
from shapely.geometry import GeometryCollection, LineString, MultiLineString, MultiPolygon, Polygon
from shapely.ops import polygonize, unary_union


ROOT = Path(__file__).resolve().parents[1]
CURRENT_EXACT_GEOJSON = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson"
)
Y2026_EXACT_GEOJSON = (
    ROOT
    / "geopackages"
    / "ICB 2026"
    / "outputs"
    / "full_uk_2026_boards"
    / "UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson"
)
ENGLAND_REGIONS_BFE_PATH = (
    ROOT / "geopackages" / "compare_sources" / "NHS_England_Regions_January_2024_EN_BFE.gpkg"
)
ENGLAND_REGIONS_BSC_PATH = (
    ROOT / "geopackages" / "compare_sources" / "NHS_England_Regions_January_2024_EN_BSC.gpkg"
)
WALES_LHB_BFE_PATH = (
    ROOT / "geopackages" / "compare_sources" / "Local_Health_Boards_December_2023_WA_BFE.gpkg"
)
UK_COUNTRIES_BSC_PATH = (
    ROOT / "geopackages" / "compare_sources" / "Countries_December_2023_UK_BSC.gpkg"
)
CURRENT_OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "full_uk_current_boards"
Y2026_OUTPUT_DIR = ROOT / "geopackages" / "ICB 2026" / "outputs" / "full_uk_2026_boards"
METADATA_PATH = ROOT / "geopackages" / "outputs" / "uk_landmask" / "UK_v37_coastalized_exact_products.json"
TARGET_CRS = "EPSG:27700"
OUTPUT_CRS = "EPSG:4326"
LINE_EPS = 1e-6
FACE_MIN_AREA = 1.0
CURRENT_SPLIT_PARENT_CODES = {"E54000025", "E54000042", "E54000048"}


@dataclass(frozen=True)
class ProductPaths:
    product_id: str
    current_gpkg: Path
    current_geojson: Path
    y2026_gpkg: Path
    y2026_geojson: Path


PRODUCTS = {
    "bfe": ProductPaths(
        product_id="bfe",
        current_gpkg=CURRENT_OUTPUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_v37_bfe_exact.gpkg",
        current_geojson=CURRENT_OUTPUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_v37_bfe_exact.geojson",
        y2026_gpkg=Y2026_OUTPUT_DIR / "UK_Health_Board_Boundaries_Codex_2026_v37_bfe_exact_gpkg.gpkg",
        y2026_geojson=Y2026_OUTPUT_DIR / "UK_Health_Board_Boundaries_Codex_2026_v37_bfe_exact_geojson.geojson",
    ),
    "bsc": ProductPaths(
        product_id="bsc",
        current_gpkg=CURRENT_OUTPUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_v37_bsc_exact.gpkg",
        current_geojson=CURRENT_OUTPUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_v37_bsc_exact.geojson",
        y2026_gpkg=Y2026_OUTPUT_DIR / "UK_Health_Board_Boundaries_Codex_2026_v37_bsc_exact_gpkg.gpkg",
        y2026_geojson=Y2026_OUTPUT_DIR / "UK_Health_Board_Boundaries_Codex_2026_v37_bsc_exact_geojson.geojson",
    ),
}


def load_target_crs(path: Path) -> gpd.GeoDataFrame:
    gdf = gpd.read_file(path)
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
        merged = unary_union(polys)
        if isinstance(merged, Polygon):
            return merged
        return merged
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
    return dissolved


def reconstruct_jurisdiction(label: str, boards: gpd.GeoDataFrame, envelope_geom):
    print(f"  reconstructing {label}: {len(boards)} boards", flush=True)
    envelope_geom = polygon_only(envelope_geom)
    if envelope_geom is None or envelope_geom.is_empty:
        raise RuntimeError("Missing envelope geometry for jurisdiction")

    internal_lines = extract_internal_shared_lines(boards)
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
        raise RuntimeError("Failed to polygonize reconstructed jurisdiction")

    reconstructed = assign_faces_to_boards(faces, boards)
    reconstructed = rescue_missing_boards(reconstructed, boards, envelope_geom)
    reconstructed_union = unary_union(reconstructed.geometry)
    area_delta = abs(reconstructed_union.symmetric_difference(envelope_geom).area)
    if area_delta > 5000:
        raise RuntimeError(f"Reconstructed jurisdiction drifted from envelope by {area_delta:.2f} m²")
    print(f"    {label}: {len(faces)} faces, envelope drift {area_delta:.2f} m²", flush=True)
    return reconstructed


def build_product_gdf(
    exact_path: Path,
    england_envelope,
    wales_envelope,
) -> gpd.GeoDataFrame:
    gdf = load_target_crs(exact_path)
    output_parts = []
    preserve_current_split_parents = exact_path == CURRENT_EXACT_GEOJSON
    for boundary_type, envelope in [
        ("ICB", england_envelope),
        ("LHB", wales_envelope),
    ]:
        subset = gdf.loc[gdf["boundary_type"] == boundary_type].copy()
        working_envelope = envelope
        if preserve_current_split_parents and boundary_type == "ICB":
            passthrough_split_parents = subset.loc[
                subset["boundary_code"].astype(str).isin(CURRENT_SPLIT_PARENT_CODES)
            ].copy()
            subset = subset.loc[
                ~subset["boundary_code"].astype(str).isin(CURRENT_SPLIT_PARENT_CODES)
            ].copy()
            if not passthrough_split_parents.empty:
                output_parts.append(passthrough_split_parents)
                preserved_union = unary_union(passthrough_split_parents.geometry)
                working_envelope = polygon_only(envelope.difference(preserved_union))
        if subset.empty:
            continue
        reconstructed = reconstruct_jurisdiction(boundary_type, subset, working_envelope)
        output_parts.append(reconstructed)

    for passthrough_type in ["SHB", "NIHB"]:
        subset = gdf.loc[gdf["boundary_type"] == passthrough_type].copy()
        if not subset.empty:
            output_parts.append(subset)

    result = gpd.GeoDataFrame(pd.concat(output_parts, ignore_index=True), geometry="geometry", crs=TARGET_CRS)
    result["geometry"] = result["geometry"].map(polygon_only)
    return result


def write_product(gdf: gpd.GeoDataFrame, gpkg_path: Path, geojson_path: Path, layer_name: str):
    gpkg_path.parent.mkdir(parents=True, exist_ok=True)
    if gpkg_path.exists():
        gpkg_path.unlink()
    gdf.to_file(gpkg_path, layer=layer_name, driver="GPKG")
    gdf.to_crs(OUTPUT_CRS).to_file(geojson_path, driver="GeoJSON")


def main() -> None:
    england_bfe = unary_union(load_target_crs(ENGLAND_REGIONS_BFE_PATH).geometry)
    england_bsc = unary_union(load_target_crs(ENGLAND_REGIONS_BSC_PATH).geometry)
    wales_bfe = unary_union(load_target_crs(WALES_LHB_BFE_PATH).geometry)
    countries_bsc = load_target_crs(UK_COUNTRIES_BSC_PATH)

    wales_bsc = unary_union(countries_bsc.loc[countries_bsc["CTRY23NM"] == "Wales"].geometry)

    metadata = {"version": "v3.7-coastalized-exact-1", "products": []}

    requested_product_id = str(os.environ.get("COASTAL_COMPARE_PRODUCT_ID") or "").strip().lower()
    requested_products = (
        {requested_product_id}
        if requested_product_id
        else set(PRODUCTS.keys())
    )

    for product_id, paths in PRODUCTS.items():
        if product_id not in requested_products:
            continue
        print(f"=== coastalized exact {product_id} ===", flush=True)
        if product_id == "bfe":
            current_gdf = build_product_gdf(
                CURRENT_EXACT_GEOJSON,
                england_bfe,
                wales_bfe,
            )
            y2026_gdf = build_product_gdf(
                Y2026_EXACT_GEOJSON,
                england_bfe,
                wales_bfe,
            )
        else:
            current_gdf = build_product_gdf(
                CURRENT_EXACT_GEOJSON,
                england_bsc,
                wales_bsc,
            )
            y2026_gdf = build_product_gdf(
                Y2026_EXACT_GEOJSON,
                england_bsc,
                wales_bsc,
            )

        write_product(current_gdf, paths.current_gpkg, paths.current_geojson, "uk_current_board_boundaries")
        write_product(y2026_gdf, paths.y2026_gpkg, paths.y2026_geojson, "uk_2026_board_boundaries")

        metadata["products"].append(
            {
                "id": product_id,
                "current_exact_geojson": str(paths.current_geojson.relative_to(ROOT)),
                "current_exact_gpkg": str(paths.current_gpkg.relative_to(ROOT)),
                "y2026_exact_geojson": str(paths.y2026_geojson.relative_to(ROOT)),
                "y2026_exact_gpkg": str(paths.y2026_gpkg.relative_to(ROOT)),
                "current_feature_count": int(len(current_gdf)),
                "y2026_feature_count": int(len(y2026_gdf)),
            }
        )
        print(f"wrote {paths.current_geojson.relative_to(ROOT)}")
        print(f"wrote {paths.y2026_geojson.relative_to(ROOT)}")

    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"wrote {METADATA_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
