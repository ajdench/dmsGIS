#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "geopackages" / "compare_sources"
METADATA_PATH = OUTPUT_DIR / "v37_coastal_compare_sources.json"
OGRINFO = "/opt/homebrew/bin/ogrinfo"
REQUEST_TIMEOUT_SECONDS = 600

SOURCES = [
    {
        "id": "england_icb_bfc",
        "label": "Integrated Care Boards (April 2023) EN BFC",
        "item_id": "da81300d4b624a0b81376416c8b5d90e",
        "local_path": OUTPUT_DIR / "Integrated_Care_Boards_April_2023_EN_BFC.gpkg",
        "kind": "canonical",
        "jurisdiction": "england",
    },
    {
        "id": "england_icb_bgc",
        "label": "Integrated Care Boards (April 2023) EN BGC",
        "item_id": "9a49e4d6f9b148b4b6173c638a10971c",
        "local_path": OUTPUT_DIR / "Integrated_Care_Boards_April_2023_EN_BGC.gpkg",
        "kind": "runtime",
        "jurisdiction": "england",
    },
    {
        "id": "england_icb_bsc",
        "label": "Integrated Care Boards (April 2023) EN BSC",
        "item_id": "76dad7f9577147b2b636d4f95345d28d",
        "local_path": OUTPUT_DIR / "Integrated_Care_Boards_April_2023_EN_BSC.gpkg",
        "kind": "runtime",
        "jurisdiction": "england",
    },
    {
        "id": "wales_lhb_bfc",
        "label": "Local Health Boards (December 2023) WA BFC",
        "item_id": "73a5bf52650244edbd5dd33522042c84",
        "local_path": OUTPUT_DIR / "Local_Health_Boards_December_2023_WA_BFC.gpkg",
        "kind": "canonical",
        "jurisdiction": "wales",
    },
    {
        "id": "wales_lhb_bgc",
        "label": "Local Health Boards (December 2023) WA BGC",
        "item_id": "69ee50036d7243bf80286ef8b5114a41",
        "local_path": OUTPUT_DIR / "Local_Health_Boards_December_2023_WA_BGC.gpkg",
        "kind": "runtime",
        "jurisdiction": "wales",
    },
    {
        "id": "england_regions_bfe",
        "label": "NHS England Regions (January 2024) EN BFE",
        "item_id": "56622e712ec040b3a281cf20f5209c1d",
        "local_path": OUTPUT_DIR / "NHS_England_Regions_January_2024_EN_BFE.gpkg",
        "kind": "overlay",
        "jurisdiction": "england",
    },
    {
        "id": "england_regions_bsc",
        "label": "NHS England Regions (January 2024) EN BSC",
        "item_id": "e9c506682a204bf6952a140af8e99bca",
        "local_path": OUTPUT_DIR / "NHS_England_Regions_January_2024_EN_BSC.gpkg",
        "kind": "runtime-envelope",
        "jurisdiction": "england",
    },
    {
        "id": "wales_lhb_bfe",
        "label": "Local Health Boards (December 2023) WA BFE",
        "item_id": "57380f046b354189b82c00489eecd970",
        "local_path": OUTPUT_DIR / "Local_Health_Boards_December_2023_WA_BFE.gpkg",
        "kind": "coastal-envelope",
        "jurisdiction": "wales",
    },
    {
        "id": "uk_countries_bfe",
        "label": "Countries (December 2023) UK BFE",
        "item_id": "8295b10303ce46c982f62af3733b9405",
        "local_path": OUTPUT_DIR / "Countries_December_2023_UK_BFE.gpkg",
        "kind": "coastal-envelope",
        "jurisdiction": "uk",
    },
    {
        "id": "uk_countries_bsc",
        "label": "Countries (December 2023) UK BSC",
        "item_id": "2a0af0a1ecfe473e98e13c7fb8457013",
        "local_path": OUTPUT_DIR / "Countries_December_2023_UK_BSC.gpkg",
        "kind": "coastal-envelope",
        "jurisdiction": "uk",
    },
]


def dataset_download_url(item_id: str) -> str:
    return (
        "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/"
        f"{item_id}/geoPackage?layers=0"
    )


def download_file(url: str, output_path: Path) -> None:
    if output_path.exists():
        output_path.unlink()
    subprocess.run(
        [
            "curl",
            "-L",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            str(REQUEST_TIMEOUT_SECONDS),
            "-o",
            str(output_path),
            url,
        ],
        check=True,
        cwd=ROOT,
    )


def inspect_gpkg(path: Path) -> dict[str, Any]:
    completed = subprocess.run(
        [OGRINFO, "-ro", "-so", "-json", str(path)],
        check=True,
        capture_output=True,
        text=True,
        cwd=ROOT,
    )
    payload = json.loads(completed.stdout)
    layer = (payload.get("layers") or [{}])[0]
    return {
        "layer_name": layer.get("name"),
        "feature_count": layer.get("featureCount"),
        "geometry_fields": layer.get("geometryFields"),
    }


def ensure_downloaded(source: dict[str, Any]) -> tuple[Path, dict[str, Any]]:
    output_path = Path(source["local_path"])
    if output_path.exists():
        try:
            return output_path, inspect_gpkg(output_path)
        except Exception:
            output_path.unlink()

    download_url = dataset_download_url(source["item_id"])
    download_file(download_url, output_path)
    return output_path, inspect_gpkg(output_path)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    metadata = {
        "version": "v3.8-bsc-source-refresh-1",
        "sources": [],
    }

    for source in SOURCES:
        download_url = dataset_download_url(source["item_id"])
        print(f"ensuring {source['label']} -> {Path(source['local_path']).name}", flush=True)
        output_path, inspection = ensure_downloaded(source)
        metadata["sources"].append(
            {
                "id": source["id"],
                "label": source["label"],
                "jurisdiction": source["jurisdiction"],
                "kind": source["kind"],
                "item_id": source["item_id"],
                "download_url": download_url,
                "local_path": str(output_path.relative_to(ROOT)),
                "size_bytes": output_path.stat().st_size,
                "layer_name": inspection["layer_name"],
                "feature_count": inspection["feature_count"],
                "geometry_fields": inspection["geometry_fields"],
            }
        )
        print(
            f"  wrote {inspection['feature_count']} features ({output_path.stat().st_size} bytes)",
            flush=True,
        )

    METADATA_PATH.write_text(json.dumps(metadata, indent=2) + "\n")
    print(f"metadata: wrote {METADATA_PATH.relative_to(ROOT)}", flush=True)


if __name__ == "__main__":
    main()
