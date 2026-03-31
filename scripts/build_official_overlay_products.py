#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
COMPARE_SOURCES = ROOT / "geopackages" / "compare_sources"
REGIONS_DIR = ROOT / "public" / "data" / "regions"
OGR2OGR = "/opt/homebrew/bin/ogr2ogr"
VIEW_PRESETS = ROOT / "src" / "lib" / "config" / "viewPresets.json"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, cwd=ROOT)


def build_nhs_england_regions_bsc_overlay() -> None:
    source = COMPARE_SOURCES / "NHS_England_Regions_January_2024_EN_BSC.gpkg"
    output = REGIONS_DIR / "NHS_England_Regions_January_2024_EN_BSC.geojson"
    if output.exists():
        output.unlink()

    run(
        [
            OGR2OGR,
            "-overwrite",
            "-f",
            "GeoJSON",
            "-t_srs",
            "EPSG:4326",
            str(output),
            str(source),
            "NHSER_JAN_2024_EN_BSC",
        ]
    )


def build_sjc_jmc_outline_bsc_overlay() -> None:
    presets = json.loads(VIEW_PRESETS.read_text())
    code_groupings = presets["presets"]["coa3a"]["codeGroupings"]
    english_groupings = {
        code: group_name
        for code, group_name in code_groupings.items()
        if code.startswith("E")
    }

    case_clauses = " ".join(
        "WHEN '{code}' THEN '{group_name}'".format(
            code=code,
            group_name=group_name.replace("'", "''"),
        )
        for code, group_name in sorted(english_groupings.items())
    )
    english_codes = ", ".join(f"'{code}'" for code in sorted(english_groupings))

    england_source = COMPARE_SOURCES / "Integrated_Care_Boards_April_2023_EN_BSC.gpkg"
    countries_source = COMPARE_SOURCES / "Countries_December_2023_UK_BSC.gpkg"
    output = REGIONS_DIR / "UK_JMC_Outline_BSC.geojson"
    if output.exists():
        output.unlink()

    with tempfile.TemporaryDirectory(prefix="jmc_bsc_", dir=ROOT) as temp_dir:
        temp_path = Path(temp_dir) / "jmc_bsc_parts.gpkg"

        run(
            [
                OGR2OGR,
                "-overwrite",
                "-f",
                "GPKG",
                str(temp_path),
                str(england_source),
                "-dialect",
                "SQLite",
                "-sql",
                (
                    "SELECT "
                    "ICB23CD AS boundary_code, "
                    "ICB23NM AS boundary_name, "
                    f"CASE ICB23CD {case_clauses} END AS region_name, "
                    "SHAPE AS geom "
                    "FROM ICB_APR_2023_EN_BSC "
                    f"WHERE ICB23CD IN ({english_codes})"
                ),
                "-nln",
                "jmc_bsc_parts",
                "-nlt",
                "PROMOTE_TO_MULTI",
            ]
        )

        run(
            [
                OGR2OGR,
                "-update",
                "-append",
                str(temp_path),
                str(countries_source),
                "-dialect",
                "SQLite",
                "-sql",
                (
                    "SELECT "
                    "CTRY23CD AS boundary_code, "
                    "CTRY23NM AS boundary_name, "
                    "CASE "
                    "WHEN CTRY23NM = 'Scotland' THEN 'JMC Scotland' "
                    "WHEN CTRY23NM = 'Wales' THEN 'JMC Wales' "
                    "WHEN CTRY23NM = 'Northern Ireland' THEN 'JMC Northern Ireland' "
                    "END AS region_name, "
                    "SHAPE AS geom "
                    "FROM CTRY_DEC_2023_UK_BSC "
                    "WHERE CTRY23NM IN ('Scotland', 'Wales', 'Northern Ireland')"
                ),
                "-nln",
                "jmc_bsc_parts",
                "-nlt",
                "PROMOTE_TO_MULTI",
            ]
        )

        run(
            [
                OGR2OGR,
                "-overwrite",
                "-f",
                "GeoJSON",
                "-t_srs",
                "EPSG:4326",
                str(output),
                str(temp_path),
                "-dialect",
                "SQLite",
                "-sql",
                (
                    "SELECT "
                    "region_name, "
                    "ST_Multi(ST_Union(geom)) AS geom "
                    "FROM jmc_bsc_parts "
                    "GROUP BY region_name"
                ),
            ]
        )


def main() -> None:
    REGIONS_DIR.mkdir(parents=True, exist_ok=True)
    build_nhs_england_regions_bsc_overlay()
    build_sjc_jmc_outline_bsc_overlay()


if __name__ == "__main__":
    main()
