#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path

import geopandas as gpd
import pandas as pd
from shapely import GeometryCollection, MultiPolygon, Polygon, make_valid


ROOT = Path(__file__).resolve().parents[1]
GEOPACKAGES = ROOT / "geopackages"
OUT_DIR = GEOPACKAGES / "outputs" / "full_uk_current_boards"
OUT_DIR.mkdir(parents=True, exist_ok=True)

ENGLAND_ICB_BFC = GEOPACKAGES / "Integrated_Care_Boards_April_2023_EN_BFC_-2874981933571631596.gpkg"
ENGLAND_ICB_LAYER = "ICB_APR_2023_EN_BFC"

WALES_LHB_BFC = GEOPACKAGES / "Local_Health_Boards_December_2023_WA_BFC_-5927802952650685957.gpkg"
WALES_LHB_LAYER = "LHB_DEC_2023_WA_BFC"

SCOTLAND_HB = GEOPACKAGES / "Healthcare_NHS_Health_Boards__Scotland__2695629962780893909.gpkg"
SCOTLAND_HB_LAYER = "healthcare___nhs_health_boards__scotland_"

NI_HB = GEOPACKAGES / "nhs_ni_health_boards_bxx_gpkg.gpkg"
NI_HB_LAYER = "nhs_ni_health_boards_polygons"

TARGET_CRS = "EPSG:27700"


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


def normalize(
    gdf: gpd.GeoDataFrame,
    *,
    boundary_type: str,
    code_column: str,
    name_column: str,
    build_source: str,
) -> gpd.GeoDataFrame:
    if gdf.crs is None:
        raise RuntimeError(f"Missing CRS for {build_source}")
    if str(gdf.crs) != TARGET_CRS:
        gdf = gdf.to_crs(TARGET_CRS)
    out = gdf.rename(
        columns={
            code_column: "boundary_code",
            name_column: "boundary_name",
        }
    ).copy()
    out["boundary_type"] = boundary_type
    out["line_color_hex"] = "4d4d4d"
    out["line_alpha"] = 100
    out["line_width"] = 1.5
    out["build_source"] = build_source
    out = out[
        [
            "boundary_type",
            "boundary_code",
            "boundary_name",
            "line_color_hex",
            "line_alpha",
            "line_width",
            "geometry",
            "build_source",
        ]
    ].copy()
    out["geometry"] = out["geometry"].map(polygon_only)
    if out["geometry"].isna().any():
        missing = out.loc[out["geometry"].isna(), "boundary_code"].tolist()
        raise RuntimeError(f"Polygon cleanup removed all geometry for: {missing}")
    return out


def build_current_canonical() -> gpd.GeoDataFrame:
    england = normalize(
        gpd.read_file(ENGLAND_ICB_BFC, layer=ENGLAND_ICB_LAYER),
        boundary_type="ICB",
        code_column="ICB23CD",
        name_column="ICB23NM",
        build_source="official_icb_apr_2023_en_bfc",
    )
    wales = normalize(
        gpd.read_file(WALES_LHB_BFC, layer=WALES_LHB_LAYER),
        boundary_type="LHB",
        code_column="LHB23CD",
        name_column="LHB23NM",
        build_source="official_lhb_dec_2023_wa_bfc",
    )
    scotland = normalize(
        gpd.read_file(SCOTLAND_HB, layer=SCOTLAND_HB_LAYER),
        boundary_type="SHB",
        code_column="h06_code",
        name_column="h06_name",
        build_source="official_equivalent_scotland_hb",
    )
    northern_ireland = normalize(
        gpd.read_file(NI_HB, layer=NI_HB_LAYER),
        boundary_type="NIHB",
        code_column="TrustCode",
        name_column="TrustName",
        build_source="official_equivalent_ni_trust",
    )

    out = pd.concat([england, wales, scotland, northern_ireland], ignore_index=True)
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=TARGET_CRS)

    expected = {"ICB": 42, "LHB": 7, "SHB": 14, "NIHB": 5}
    actual = out.groupby("boundary_type").size().to_dict()
    if actual != expected:
        raise RuntimeError(f"Boundary type counts mismatch. expected={expected} actual={actual}")

    expected_total = sum(expected.values())
    if len(out) != expected_total:
        raise RuntimeError(f"Expected {expected_total} current boards, got {len(out)}")

    return out


def main() -> None:
    out = build_current_canonical()

    gpkg = OUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg"
    geojson = OUT_DIR / "UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson"
    out.to_file(gpkg, layer="uk_current_board_boundaries", driver="GPKG")
    out.to_crs(4326).to_file(geojson, driver="GeoJSON")

    summary_lines = [
        f"uk_board_count: {len(out)}",
        f"icb_count: {len(out[out['boundary_type'] == 'ICB'])}",
        f"lhb_count: {len(out[out['boundary_type'] == 'LHB'])}",
        f"shb_count: {len(out[out['boundary_type'] == 'SHB'])}",
        f"nihb_count: {len(out[out['boundary_type'] == 'NIHB'])}",
    ]
    (OUT_DIR / "SUMMARY.txt").write_text("\n".join(summary_lines) + "\n", encoding="utf-8")
    print(
        {
            "uk_board_count": len(out),
            "icb_count": len(out[out["boundary_type"] == "ICB"]),
            "lhb_count": len(out[out["boundary_type"] == "LHB"]),
            "shb_count": len(out[out["boundary_type"] == "SHB"]),
            "nihb_count": len(out[out["boundary_type"] == "NIHB"]),
        }
    )


if __name__ == "__main__":
    main()
