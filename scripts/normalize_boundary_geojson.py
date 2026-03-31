from __future__ import annotations

import json
import sys
from pathlib import Path

from shapely.geometry import GeometryCollection, MultiPolygon, Polygon, mapping, shape
from shapely.validation import make_valid


def flatten_polygons(geometry):
    if geometry.is_empty:
        return []
    if isinstance(geometry, Polygon):
        return [geometry]
    if isinstance(geometry, MultiPolygon):
        return list(geometry.geoms)
    if isinstance(geometry, GeometryCollection):
        polygons = []
        for member in geometry.geoms:
            polygons.extend(flatten_polygons(member))
        return polygons
    if hasattr(geometry, "geoms"):
        polygons = []
        for member in geometry.geoms:
            polygons.extend(flatten_polygons(member))
        return polygons
    return []


def normalize_geometry(raw_geometry):
    geometry = shape(raw_geometry)
    geometry = make_valid(geometry)
    polygons = flatten_polygons(geometry)
    if not polygons:
        raise RuntimeError("No polygonal geometry remained after normalization")

    if len(polygons) == 1:
        return polygons[0]

    return MultiPolygon(polygons)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("usage: normalize_boundary_geojson.py <input.geojson> <output.geojson>")

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    data = json.loads(input_path.read_text())

    features = []
    for feature in data["features"]:
        normalized_geometry = normalize_geometry(feature["geometry"])
        features.append(
            {
                "type": "Feature",
                "properties": feature.get("properties", {}),
                "geometry": mapping(normalized_geometry),
            }
        )

    output = {
        "type": "FeatureCollection",
        "features": features,
    }
    output_path.write_text(json.dumps(output))


if __name__ == "__main__":
    main()
