#!/usr/bin/env python3
"""
build_current_ward_split_exact.py

Rebuild the Current-preset split ICB ward product from official ward geometry
while preserving the parent ICB outer boundary from the canonical Current
board source.

Outputs:
  geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.gpkg
  geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson
"""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

from osgeo import ogr, osr


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WARD_GPKG = ROOT / "geopackages" / "compare_sources" / "Wards_December_2025_UK_BSC.gpkg"
DEFAULT_WARD_LAYER = "WD_DEC_2025_UK_BSC"
DEFAULT_WARD_SOURCE_TAG = "ward_bsc_2025"
DEFAULT_CURRENT_EXACT_GPKG = (
    ROOT
    / "geopackages"
    / "outputs"
    / "full_uk_current_boards"
    / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg"
)
DEFAULT_LEGACY_ACTIVE_COMPONENTS_CANDIDATES = [
    ROOT / "public" / "data" / "regions" / "UK_Active_Components_Codex_v10_geojson.geojson",
    ROOT / "public" / "data" / "regions" / "full-res" / "UK_Active_Components_Codex_v10_geojson.geojson",
]
FACILITIES_GEOJSON = ROOT / "public" / "data" / "facilities" / "facilities.geojson"
OUTPUT_DIR = ROOT / "geopackages" / "outputs" / "full_uk_current_boards"
DEFAULT_OUTPUT_GPKG = OUTPUT_DIR / "UK_WardSplit_Canonical_Current_exact.gpkg"
DEFAULT_OUTPUT_GEOJSON = OUTPUT_DIR / "UK_WardSplit_Canonical_Current_exact.geojson"

TARGET_PARENT_CODES = {
    "E54000025",
    "E54000042",
    "E54000048",
}
HAMPSHIRE_PARENT_CODE = "E54000042"
HAMPSHIRE_ISLE_OF_WIGHT_LAD = "E06000046"
HAMPSHIRE_EXPLICIT_REGION_OVERRIDES = {
    "E05014777": ("South West", "facility_region_seed_explicit_hampshire_override"),
    "E05012143": ("South West", "facility_region_seed_explicit_hampshire_override"),
    "E05013458": ("South West", "facility_region_seed_explicit_hampshire_override"),
}

COMPONENT_RE = re.compile(r"^icb_lad_(e\d{8})(?:_(.+))?$")


def make_srs(epsg: int) -> osr.SpatialReference:
    srs = osr.SpatialReference()
    srs.ImportFromEPSG(epsg)
    srs.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)
    return srs


WGS84 = make_srs(4326)
BNG = make_srs(27700)
TO_BNG = osr.CoordinateTransformation(WGS84, BNG)
TO_WGS84 = osr.CoordinateTransformation(BNG, WGS84)


def clone_geometry(geom: ogr.Geometry | None) -> ogr.Geometry | None:
    return geom.Clone() if geom is not None else None


def force_multipolygon(geom: ogr.Geometry) -> ogr.Geometry:
    geometry_type = ogr.GT_Flatten(geom.GetGeometryType())
    if geometry_type == ogr.wkbPolygon:
        multi = ogr.Geometry(ogr.wkbMultiPolygon)
        multi.AddGeometry(geom.Clone())
        return multi
    if geometry_type == ogr.wkbMultiPolygon:
        return geom.Clone()
    raise RuntimeError(f"Unsupported geometry type for ward split output: {geom.GetGeometryName()}")


def slugify_region(region_ref: str) -> str:
    return (
        region_ref.lower()
        .replace("&", "and")
        .replace(" ", "_")
        .replace("__", "_")
    )


def load_parent_geometries() -> tuple[dict[str, ogr.Geometry], dict[str, str]]:
    current_exact_gpkg = get_active_current_exact_gpkg()
    ds = ogr.Open(str(current_exact_gpkg))
    if ds is None:
        raise RuntimeError(f"Unable to open {current_exact_gpkg}")
    layer = ds.GetLayerByName("uk_current_board_boundaries")
    if layer is None:
        raise RuntimeError(f"Layer uk_current_board_boundaries not found in {current_exact_gpkg}")

    parent_geoms: dict[str, ogr.Geometry] = {}
    parent_names: dict[str, str] = {}
    for feature in layer:
        code = str(feature.GetField("boundary_code") or "").strip()
        if code not in TARGET_PARENT_CODES:
            continue
        geom = feature.GetGeometryRef()
        if geom is None:
            continue
        parent_geoms[code] = force_multipolygon(geom)
        parent_names[code] = str(feature.GetField("boundary_name") or "").strip()

    missing = TARGET_PARENT_CODES - set(parent_geoms)
    if missing:
        raise RuntimeError(f"Missing target parent geometries: {sorted(missing)}")
    return parent_geoms, parent_names


def get_active_current_exact_gpkg() -> Path:
    override = str(os.environ.get("CURRENT_EXACT_GPKG_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return DEFAULT_CURRENT_EXACT_GPKG


def get_active_ward_gpkg() -> Path:
    override = str(os.environ.get("WARD_GPKG_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return DEFAULT_WARD_GPKG


def get_active_ward_layer_name() -> str:
    return str(os.environ.get("WARD_LAYER_NAME") or "").strip() or DEFAULT_WARD_LAYER


def get_active_ward_source_tag() -> str:
    return str(os.environ.get("WARD_SOURCE_TAG") or "").strip() or DEFAULT_WARD_SOURCE_TAG


def get_output_gpkg() -> Path:
    override = str(os.environ.get("WARD_SPLIT_EXACT_GPKG_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return DEFAULT_OUTPUT_GPKG


def get_output_geojson() -> Path:
    override = str(os.environ.get("WARD_SPLIT_EXACT_GEOJSON_PATH") or "").strip()
    if override:
        return Path(override) if Path(override).is_absolute() else ROOT / override
    return DEFAULT_OUTPUT_GEOJSON


def get_legacy_active_components_path() -> Path:
    override = str(os.environ.get("LEGACY_ACTIVE_COMPONENTS_PATH") or "").strip()
    if override:
        candidate = Path(override)
        resolved = candidate if candidate.is_absolute() else ROOT / candidate
        if not resolved.exists():
            raise RuntimeError(f"Legacy active components source not found: {resolved}")
        return resolved

    for candidate in DEFAULT_LEGACY_ACTIVE_COMPONENTS_CANDIDATES:
        if candidate.exists():
            return candidate

    searched = ", ".join(str(path) for path in DEFAULT_LEGACY_ACTIVE_COMPONENTS_CANDIDATES)
    raise RuntimeError(f"Legacy active components source not found; checked: {searched}")


def load_legacy_assignments() -> tuple[dict[str, dict[str, set[str]]], dict[str, dict[str, dict[str, ogr.Geometry]]]]:
    data = json.loads(get_legacy_active_components_path().read_text())

    lad_region_map: dict[str, dict[str, set[str]]] = defaultdict(lambda: defaultdict(set))
    partial_reference_geoms: dict[str, dict[str, dict[str, ogr.Geometry]]] = defaultdict(
        lambda: defaultdict(dict)
    )

    for feature in data["features"]:
        props = feature.get("properties", {})
        if props.get("source_type") != "icb_lad_split_multi_region":
            continue
        parent_code = str(props.get("parent_code") or "").strip()
        if parent_code not in TARGET_PARENT_CODES:
            continue

        component_id = str(props.get("component_id") or "").strip().lower()
        match = COMPONENT_RE.match(component_id)
        if not match:
            continue

        lad_code = match.group(1).upper()
        suffix = match.group(2)
        region_ref = str(props.get("region_ref") or "").strip()
        if not region_ref:
            continue

        lad_region_map[parent_code][lad_code].add(region_ref)

        if suffix:
            geom = ogr.CreateGeometryFromJson(json.dumps(feature.get("geometry")))
            if geom is None:
                continue
            geom.Transform(TO_BNG)
            existing = partial_reference_geoms[parent_code][lad_code].get(region_ref)
            partial_reference_geoms[parent_code][lad_code][region_ref] = (
                geom.Clone() if existing is None else existing.Union(geom)
            )

    return lad_region_map, partial_reference_geoms


def load_relevant_wards(relevant_lads: set[str]) -> dict[str, list[dict[str, object]]]:
    ward_gpkg = get_active_ward_gpkg()
    ward_layer_name = get_active_ward_layer_name()
    ds = ogr.Open(str(ward_gpkg))
    if ds is None:
        raise RuntimeError(f"Unable to open {ward_gpkg}")
    layer = ds.GetLayerByName(ward_layer_name)
    if layer is None:
        raise RuntimeError(f"Layer {ward_layer_name} not found in ward gpkg {ward_gpkg}")

    ward_features: dict[str, list[dict[str, object]]] = defaultdict(list)
    for feature in layer:
        lad_code = str(feature.GetField("LAD25CD") or "").strip()
        if lad_code not in relevant_lads:
            continue
        geom = feature.GetGeometryRef()
        if geom is None:
            continue
        ward_features[lad_code].append(
            {
                "ward_code": str(feature.GetField("WD25CD") or "").strip(),
                "ward_name": str(feature.GetField("WD25NM") or "").strip(),
                "lad_code": lad_code,
                "lad_name": str(feature.GetField("LAD25NM") or "").strip(),
                "geometry": force_multipolygon(geom),
            }
        )
    return ward_features


def pick_partial_region(
    ward_geom: ogr.Geometry,
    parent_code: str,
    lad_code: str,
    region_refs: set[str],
    reference_geoms: dict[str, dict[str, dict[str, ogr.Geometry]]],
) -> tuple[str, str]:
    overlaps = []
    for region_ref in sorted(region_refs):
        ref_geom = reference_geoms.get(parent_code, {}).get(lad_code, {}).get(region_ref)
        if ref_geom is None:
            overlaps.append((0.0, region_ref))
            continue
        intersection = ward_geom.Intersection(ref_geom)
        area = intersection.GetArea() if intersection and not intersection.IsEmpty() else 0.0
        overlaps.append((area, region_ref))

    overlaps.sort(reverse=True)
    best_area, best_region = overlaps[0]
    if best_area > 0:
        return best_region, "ward_overlap_with_legacy_split"

    point = ward_geom.PointOnSurface()
    for region_ref in sorted(region_refs):
        ref_geom = reference_geoms.get(parent_code, {}).get(lad_code, {}).get(region_ref)
        if ref_geom is not None and ref_geom.Contains(point):
            return region_ref, "point_on_surface_with_legacy_split"

    return sorted(region_refs)[0], "fallback_legacy_region_order"


def get_shared_boundary_length(
    geom_a: ogr.Geometry | None,
    geom_b: ogr.Geometry | None,
) -> float:
    if geom_a is None or geom_b is None:
        return 0.0
    shared = geom_a.Boundary().Intersection(geom_b.Boundary())
    if shared is None or shared.IsEmpty():
        return 0.0
    return max(0.0, float(shared.Length()))


def load_facility_seed_points(parent_code: str) -> list[dict[str, object]]:
    data = json.loads(FACILITIES_GEOJSON.read_text())
    seed_points: list[dict[str, object]] = []
    for feature in data["features"]:
        props = feature.get("properties", {})
        if str(props.get("icb_hb_code") or "").strip() != parent_code:
            continue
        region_ref = str(props.get("region") or "").strip()
        coords = feature.get("geometry", {}).get("coordinates")
        if not region_ref or not isinstance(coords, list) or len(coords) < 2:
            continue
        point = ogr.Geometry(ogr.wkbPoint)
        point.AddPoint(float(coords[0]), float(coords[1]))
        point.Transform(TO_BNG)
        seed_points.append(
            {
                "facility_name": str(props.get("name") or props.get("facility_name") or "").strip(),
                "region_ref": region_ref,
                "geometry": point,
            }
        )
    return seed_points


def build_hampshire_facility_seed_assignments(
    parent_geoms: dict[str, ogr.Geometry],
    lad_region_map: dict[str, dict[str, set[str]]],
    wards_by_lad: dict[str, list[dict[str, object]]],
) -> dict[str, tuple[str, str]]:
    if HAMPSHIRE_PARENT_CODE not in parent_geoms:
        return {}
    if HAMPSHIRE_PARENT_CODE not in lad_region_map:
        return {}
    if not wards_by_lad:
        return {}

    parent_geom = parent_geoms[HAMPSHIRE_PARENT_CODE]
    seed_points = load_facility_seed_points(HAMPSHIRE_PARENT_CODE)
    if not seed_points:
        return {}

    ward_entries: list[dict[str, object]] = []
    assignments: dict[str, tuple[str, str]] = {}
    changes: list[tuple[str, str, str, str, str, float]] = []

    for lad_code, ward_records in sorted(wards_by_lad.items()):
        if lad_code not in lad_region_map[HAMPSHIRE_PARENT_CODE]:
            continue
        region_refs = lad_region_map[HAMPSHIRE_PARENT_CODE][lad_code]
        for ward in ward_records:
            ward_geom = clone_geometry(ward["geometry"])
            if ward_geom is None or not ward_geom.Intersects(parent_geom):
                continue
            clipped = ward_geom.Intersection(parent_geom)
            if clipped is None or clipped.IsEmpty() or clipped.GetArea() <= 0:
                continue
            clipped = force_multipolygon(clipped)
            ward_code = str(ward["ward_code"])
            if lad_code == HAMPSHIRE_ISLE_OF_WIGHT_LAD:
                assignments[ward_code] = (
                    "London & South",
                    "facility_region_seed_isle_of_wight_hold",
                )
                ward_entries.append(
                    {
                        "ward_code": ward_code,
                        "ward_name": str(ward["ward_name"]),
                        "geometry": clipped,
                        "region_ref": "London & South",
                        "facility_name": "",
                        "assignment_basis": "facility_region_seed_isle_of_wight_hold",
                    }
                )
                continue

            point = clipped.PointOnSurface()
            nearest_seed = None
            for seed in seed_points:
                distance = point.Distance(seed["geometry"])
                if nearest_seed is None or distance < nearest_seed[0]:
                    nearest_seed = (distance, str(seed["region_ref"]), str(seed["facility_name"]))
            if nearest_seed is None:
                continue
            region_ref = nearest_seed[1]
            assignment_basis = "facility_region_seed_nearest_hampshire_parent"
            override = HAMPSHIRE_EXPLICIT_REGION_OVERRIDES.get(ward_code)
            if override is not None:
                region_ref, assignment_basis = override
            assignments[ward_code] = (region_ref, assignment_basis)
            ward_entries.append(
                {
                    "ward_code": ward_code,
                    "ward_name": str(ward["ward_name"]),
                    "geometry": clipped,
                    "region_ref": region_ref,
                    "facility_name": nearest_seed[2],
                    "assignment_basis": assignment_basis,
                }
            )
            legacy_region = next(iter(sorted(region_refs))) if len(region_refs) == 1 else "/".join(sorted(region_refs))
            if legacy_region != region_ref:
                changes.append(
                    (
                        str(ward["ward_name"]),
                        ward_code,
                        legacy_region,
                        region_ref,
                        nearest_seed[2],
                        float(nearest_seed[0]),
                    )
                )

    adjacency: dict[str, dict[str, float]] = defaultdict(dict)
    for index, ward in enumerate(ward_entries):
        for other in ward_entries[index + 1:]:
            shared = get_shared_boundary_length(ward["geometry"], other["geometry"])
            if shared <= 0:
                continue
            adjacency[str(ward["ward_code"])][str(other["ward_code"])] = shared
            adjacency[str(other["ward_code"])][str(ward["ward_code"])] = shared

    ward_by_code = {str(ward["ward_code"]): ward for ward in ward_entries}
    region_seed_wards: dict[str, set[str]] = defaultdict(set)
    for ward in ward_entries:
        region_ref = str(ward["region_ref"])
        facility_name = str(ward["facility_name"])
        if not facility_name:
            continue
        region_seed_wards[region_ref].add(str(ward["ward_code"]))

    visited: set[str] = set()
    for ward in ward_entries:
        ward_code = str(ward["ward_code"])
        if ward_code in visited:
            continue
        region_ref = str(ward["region_ref"])
        stack = [ward_code]
        component: list[str] = []
        while stack:
            current = stack.pop()
            if current in visited:
                continue
            if str(ward_by_code[current]["region_ref"]) != region_ref:
                continue
            visited.add(current)
            component.append(current)
            for neighbor in adjacency.get(current, {}):
                if neighbor not in visited and str(ward_by_code[neighbor]["region_ref"]) == region_ref:
                    stack.append(neighbor)

        if not component:
            continue
        if any(code in region_seed_wards.get(region_ref, set()) for code in component):
            continue

        neighbor_scores: dict[str, float] = defaultdict(float)
        for code in component:
            for neighbor, shared in adjacency.get(code, {}).items():
                neighbor_region = str(ward_by_code[neighbor]["region_ref"])
                if neighbor_region == region_ref:
                    continue
                neighbor_scores[neighbor_region] += shared
        if not neighbor_scores:
            continue
        reassigned_region = sorted(neighbor_scores.items(), key=lambda item: (-item[1], item[0]))[0][0]
        for code in component:
            assignments[code] = (
                reassigned_region,
                "facility_region_seed_contiguity_reassign_hampshire_parent",
            )
            ward_by_code[code]["region_ref"] = reassigned_region

    if changes:
        print("Hampshire facility-seeded prototype reassignment:")
        for ward_name, ward_code, old_region, new_region, facility_name, distance in sorted(changes):
            print(
                f"  {ward_name} ({ward_code}): {old_region} -> {new_region} "
                f"via {facility_name} ({distance:.1f}m)"
            )

    return assignments


def build_output_features() -> list[dict[str, object]]:
    parent_geoms, parent_names = load_parent_geometries()
    lad_region_map, partial_reference_geoms = load_legacy_assignments()
    relevant_lads = {
        lad_code
        for per_parent in lad_region_map.values()
        for lad_code in per_parent.keys()
    }
    wards_by_lad = load_relevant_wards(relevant_lads)
    special_assignments = build_hampshire_facility_seed_assignments(
        parent_geoms,
        lad_region_map,
        wards_by_lad,
    )
    ward_source_tag = get_active_ward_source_tag()

    output_features: list[dict[str, object]] = []

    for parent_code in sorted(TARGET_PARENT_CODES):
        parent_geom = parent_geoms[parent_code]
        parent_name = parent_names[parent_code]
        for lad_code, region_refs in sorted(lad_region_map[parent_code].items()):
            ward_records = wards_by_lad.get(lad_code, [])
            if not ward_records:
                continue
            for ward in ward_records:
                ward_code = str(ward["ward_code"])
                ward_geom = clone_geometry(ward["geometry"])
                if ward_geom is None or not ward_geom.Intersects(parent_geom):
                    continue
                clipped = ward_geom.Intersection(parent_geom)
                if clipped is None or clipped.IsEmpty() or clipped.GetArea() <= 0:
                    continue

                if len(region_refs) == 1:
                    region_ref = next(iter(region_refs))
                    assignment_basis = "whole_lad_from_legacy_split"
                else:
                    region_ref, assignment_basis = pick_partial_region(
                        clipped,
                        parent_code,
                        lad_code,
                        region_refs,
                        partial_reference_geoms,
                    )
                special_assignment = special_assignments.get(ward_code)
                if special_assignment is not None:
                    region_ref, assignment_basis = special_assignment

                clipped = force_multipolygon(clipped)
                clipped.Transform(TO_WGS84)

                component_id = f"icb_ward_{ward_code.lower()}_{slugify_region(region_ref)}"

                output_features.append(
                    {
                        "type": "Feature",
                        "properties": {
                            "component_id": component_id,
                            "parent_code": parent_code,
                            "boundary_code": parent_code,
                            "parent_name": parent_name,
                            "boundary_name": parent_name,
                            "region_ref": region_ref,
                            "ward_code": ward_code,
                            "ward_name": str(ward["ward_name"]),
                            "lad_code": lad_code,
                            "lad_name": str(ward["lad_name"]),
                            "assignment_basis": assignment_basis,
                            "build_source": f"{ward_source_tag}_clipped_to_current_icb",
                        },
                        "geometry": json.loads(clipped.ExportToJson()),
                    }
                )

    return output_features


def write_outputs(features: list[dict[str, object]]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_gpkg = get_output_gpkg()
    output_geojson = get_output_geojson()
    output_gpkg.parent.mkdir(parents=True, exist_ok=True)
    output_geojson.parent.mkdir(parents=True, exist_ok=True)

    if output_gpkg.exists():
        output_gpkg.unlink()

    driver = ogr.GetDriverByName("GPKG")
    ds = driver.CreateDataSource(str(output_gpkg))
    if ds is None:
        raise RuntimeError(f"Unable to create {output_gpkg}")

    layer = ds.CreateLayer("uk_current_ward_split", srs=WGS84, geom_type=ogr.wkbMultiPolygon)
    fields = [
        ("component_id", ogr.OFTString),
        ("parent_code", ogr.OFTString),
        ("boundary_code", ogr.OFTString),
        ("parent_name", ogr.OFTString),
        ("boundary_name", ogr.OFTString),
        ("region_ref", ogr.OFTString),
        ("ward_code", ogr.OFTString),
        ("ward_name", ogr.OFTString),
        ("lad_code", ogr.OFTString),
        ("lad_name", ogr.OFTString),
        ("assignment_basis", ogr.OFTString),
        ("build_source", ogr.OFTString),
    ]
    for name, field_type in fields:
        layer.CreateField(ogr.FieldDefn(name, field_type))

    layer_defn = layer.GetLayerDefn()
    for item in features:
        feature = ogr.Feature(layer_defn)
        for key, value in item["properties"].items():
            feature.SetField(key, value)
        geom = ogr.CreateGeometryFromJson(json.dumps(item["geometry"]))
        feature.SetGeometry(geom)
        layer.CreateFeature(feature)

    ds = None

    geojson = {
        "type": "FeatureCollection",
        "name": "UK_WardSplit_Canonical_Current_exact",
        "features": features,
    }
    output_geojson.write_text(json.dumps(geojson))


def main() -> None:
    features = build_output_features()
    write_outputs(features)
    counts = defaultdict(int)
    for item in features:
        counts[item["properties"]["boundary_code"]] += 1

    print(f"Written exact ward split: {get_output_gpkg()}")
    print(f"Written exact ward split: {get_output_geojson()}")
    print(f"Feature count: {len(features)}")
    for code in sorted(counts):
        print(f"  {code}: {counts[code]}")


if __name__ == "__main__":
    main()
