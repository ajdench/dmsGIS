import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const WARD_SPLIT_PATH = path.join(
  ROOT,
  'public',
  'data',
  'regions',
  'UK_WardSplit_simplified.geojson',
);
const WARD_SPLIT_EXACT_PATH = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'full_uk_current_boards',
  'UK_WardSplit_Canonical_Current_exact.geojson',
);
const WARD_SPLIT_DISSOLVED_PATH = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'full_uk_current_boards',
  'UK_SplitICB_Current_Canonical_Dissolved.geojson',
);
const GEO_PYTHON = path.join(
  ROOT,
  'geopackages',
  'ICB 2026',
  '.venv',
  'bin',
  'python',
);

describe('ward split artifacts', () => {
  it('ships a dissolved Current split product for the three special ICBs', () => {
    const geojson = JSON.parse(fs.readFileSync(WARD_SPLIT_PATH, 'utf8')) as {
      features: Array<{ properties?: Record<string, unknown> }>;
    };

    expect(geojson.features.length).toBe(8);

    const boundaryCodes = new Map<string, number>();
    for (const feature of geojson.features) {
      const props = feature.properties ?? {};
      expect(typeof props.boundary_code).toBe('string');
      expect(typeof props.parent_code).toBe('string');
      expect(typeof props.region_ref).toBe('string');
      expect(typeof props.assignment_basis).toBe('string');
      expect(props.assignment_basis).toBe('ward_bsc_with_parent_remainder');
      const code = String(props.boundary_code);
      boundaryCodes.set(code, (boundaryCodes.get(code) ?? 0) + 1);
    }

    expect(Object.fromEntries([...boundaryCodes.entries()].sort())).toEqual({
      E54000025: 3,
      E54000042: 3,
      E54000048: 2,
    });
  });

  it('keeps shipped split runtime fragmentation below the old runaway level', () => {
    const geojson = JSON.parse(fs.readFileSync(WARD_SPLIT_PATH, 'utf8')) as {
      features: Array<{
        properties?: Record<string, unknown>;
        geometry?: { type?: string; coordinates?: unknown[] };
      }>;
    };

    for (const feature of geojson.features) {
      const geometry = feature.geometry;
      const partCount = geometry?.type === 'MultiPolygon'
        ? (geometry.coordinates?.length ?? 0)
        : geometry?.type === 'Polygon'
          ? 1
          : 0;

      expect(partCount).toBeGreaterThan(0);
      expect(partCount).toBeLessThanOrEqual(60);
    }
  });

  it('keeps shipped split runtime overlap with neighboring current boards immaterial', () => {
    const script = `
import json
from pathlib import Path
import geopandas as gpd

split = gpd.read_file(Path(${JSON.stringify(WARD_SPLIT_PATH)})).to_crs(27700)
boards = gpd.read_file(
    Path(${JSON.stringify(path.join(ROOT, 'public', 'data', 'regions', 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'))})
).to_crs(27700)

for _, row in split.iterrows():
    others = boards[boards["boundary_code"] != row["boundary_code"]].copy()
    overlaps = others.geometry.intersection(row.geometry).area
    max_overlap = float(overlaps.max()) if len(overlaps) else 0.0
    if max_overlap > 500:
        raise SystemExit(
            f"{row['boundary_code']} :: {row['region_ref']} :: max_neighbor_overlap={max_overlap}"
        )
`;

    expect(() =>
      execFileSync(GEO_PYTHON, ['-c', script], {
        cwd: ROOT,
        stdio: 'pipe',
      })).not.toThrow();
  });

  it('keeps the shipped and dissolved split products geometrically valid', () => {
    const script = `
import json
from pathlib import Path
from shapely.geometry import shape
from shapely.validation import explain_validity

paths = [
    Path(${JSON.stringify(WARD_SPLIT_PATH)}),
    Path(${JSON.stringify(WARD_SPLIT_DISSOLVED_PATH)}),
]

for path in paths:
    data = json.loads(path.read_text())
    for feature in data["features"]:
        geom = shape(feature["geometry"])
        if not geom.is_valid:
            props = feature.get("properties", {})
            raise SystemExit(
                f"{path.name} :: {props.get('boundary_code')} :: {props.get('region_ref')} :: {explain_validity(geom)}"
            )
`;

    expect(() =>
      execFileSync(GEO_PYTHON, ['-c', script], {
        cwd: ROOT,
        stdio: 'pipe',
      })).not.toThrow();
  });

  it('keeps the Hampshire prototype split source as a facility-seeded assignment with Hampshire corrections', () => {
    const geojson = JSON.parse(fs.readFileSync(WARD_SPLIT_EXACT_PATH, 'utf8')) as {
      features: Array<{ properties?: Record<string, unknown> }>;
    };

    const hampshire = geojson.features.filter(
      (feature) => feature.properties?.parent_code === 'E54000042',
    );

    expect(hampshire.length).toBeGreaterThan(0);
    const wardAssignments = hampshire.filter(
      (feature) =>
        String(feature.properties?.assignment_basis) !== 'canonical_parent_remainder_by_adjacency',
    );
    expect(wardAssignments.length).toBeGreaterThan(200);
    expect(
      [...new Set(wardAssignments.map((feature) => String(feature.properties?.region_ref)))].sort(),
    ).toEqual(['Central & Wessex', 'London & South', 'South West']);
    const bases = new Set(
      wardAssignments.map((feature) => String(feature.properties?.assignment_basis)),
    );
    expect(bases).toEqual(
      new Set([
        'facility_region_seed_explicit_hampshire_override',
        'facility_region_seed_isle_of_wight_hold',
        'facility_region_seed_nearest_hampshire_parent',
      ]),
    );

    const wardToRegion = new Map(
      wardAssignments.map((feature) => [
        String(feature.properties?.ward_name),
        String(feature.properties?.region_ref),
      ]),
    );
    expect(wardToRegion.get("Badger Farm and Oliver's Battery")).toBe('South West');
    expect(wardToRegion.get('Bishop\'s Waltham')).toBe('London & South');
    expect(wardToRegion.get('The Worthys')).toBe('South West');
    expect(wardToRegion.get('Downlands & Forest North')).toBe('South West');
    expect(wardToRegion.get('Totland & Colwell')).toBe('London & South');
  });
});
