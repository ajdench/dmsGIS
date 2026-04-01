import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const GEO_PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');
const REGIONS_DIR = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const BASEMAPS_DIR = process.env.BASEMAPS_DIR
  ? path.resolve(ROOT, process.env.BASEMAPS_DIR)
  : path.join(ROOT, 'public', 'data', 'basemaps');
const FACILITIES_PATH = process.env.FACILITIES_GEOJSON_PATH
  ? path.resolve(ROOT, process.env.FACILITIES_GEOJSON_PATH)
  : path.join(ROOT, 'public', 'data', 'facilities', 'facilities.geojson');

const CURRENT_BOARDS = path.join(REGIONS_DIR, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson');
const Y2026_BOARDS = path.join(REGIONS_DIR, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson');
const CURRENT_LAND = path.join(BASEMAPS_DIR, 'uk_landmask_current_v01.geojson');
const CURRENT_SEA = path.join(BASEMAPS_DIR, 'uk_seapatch_current_v01.geojson');
const Y2026_LAND = path.join(BASEMAPS_DIR, 'uk_landmask_2026_v01.geojson');
const Y2026_SEA = path.join(BASEMAPS_DIR, 'uk_seapatch_2026_v01.geojson');
const CURRENT_TOPOLOGY = path.join(REGIONS_DIR, 'UK_ICB_LHB_v10_topology_edges.geojson');
const Y2026_TOPOLOGY = path.join(REGIONS_DIR, 'UK_Health_Board_2026_topology_edges.geojson');
const CURRENT_SPLIT = path.join(REGIONS_DIR, 'UK_WardSplit_simplified.geojson');
const CURRENT_SPLIT_INTERNAL_ARCS = path.join(REGIONS_DIR, 'UK_WardSplit_internal_arcs.geojson');
const CURRENT_SPLIT_EXACT = process.env.CURRENT_SPLIT_EXACT_PATH
  ? path.resolve(ROOT, process.env.CURRENT_SPLIT_EXACT_PATH)
  : path.join(ROOT, 'geopackages', 'outputs', 'full_uk_current_boards', 'UK_WardSplit_Canonical_Current_exact.geojson');
const CURRENT_SPLIT_DISSOLVED = process.env.CURRENT_SPLIT_DISSOLVED_PATH
  ? path.resolve(ROOT, process.env.CURRENT_SPLIT_DISSOLVED_PATH)
  : path.join(ROOT, 'geopackages', 'outputs', 'full_uk_current_boards', 'UK_SplitICB_Current_Canonical_Dissolved.geojson');
const FACILITIES = FACILITIES_PATH;
const JMC_BOARD = path.join(REGIONS_DIR, 'UK_JMC_Board_simplified.geojson');
const JMC_OUTLINE = path.join(REGIONS_DIR, 'UK_JMC_Outline_simplified.geojson');
const COA3A_BOARD = path.join(REGIONS_DIR, 'UK_COA3A_Board_simplified.geojson');
const COA3A_OUTLINE = path.join(REGIONS_DIR, 'UK_COA3A_Outline_simplified.geojson');
const COA3B_BOARD = path.join(REGIONS_DIR, 'UK_COA3B_Board_simplified.geojson');
const COA3B_OUTLINE = path.join(REGIONS_DIR, 'UK_COA3B_Outline_simplified.geojson');
const CURRENT_SOURCE = process.env.CURRENT_SOURCE_OUTPUT_PATH
  ? path.resolve(ROOT, process.env.CURRENT_SOURCE_OUTPUT_PATH)
  : path.join(ROOT, 'geopackages', 'outputs', 'v38_bsc_runtime_family', 'UK_ICB_LHB_Boundaries_Current_BSC_source.geojson');
const Y2026_SOURCE = process.env.Y2026_SOURCE_OUTPUT_PATH
  ? path.resolve(ROOT, process.env.Y2026_SOURCE_OUTPUT_PATH)
  : path.join(ROOT, 'geopackages', 'outputs', 'v38_bsc_runtime_family', 'UK_Health_Board_Boundaries_2026_BSC_source.geojson');
const CHANGED_2026_CONFIG = 'src/lib/config/england2026ChangedBoards.json';

function absolute(relPath) {
  return path.isAbsolute(relPath) ? relPath : path.join(ROOT, relPath);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFeatureCollection(relPath) {
  const abs = absolute(relPath);
  assert(fs.existsSync(abs), `Missing artifact: ${relPath}`);
  return JSON.parse(fs.readFileSync(abs, 'utf8'));
}

function getPolygonSets(geometry) {
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    return [geometry.coordinates];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates;
  }

  return [];
}

function getExtent(fc) {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const feature of fc.features ?? []) {
    for (const polygon of getPolygonSets(feature.geometry)) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          minLon = Math.min(minLon, lon);
          minLat = Math.min(minLat, lat);
          maxLon = Math.max(maxLon, lon);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
  }

  return { minLon, minLat, maxLon, maxLat };
}

function countInteriorRings(fc) {
  let holes = 0;

  for (const feature of fc.features ?? []) {
    for (const polygon of getPolygonSets(feature.geometry)) {
      holes += Math.max(0, polygon.length - 1);
    }
  }

  return holes;
}

function countLineParts(fc) {
  let parts = 0;

  for (const feature of fc.features ?? []) {
    const geometry = feature.geometry;
    if (!geometry) continue;
    if (geometry.type === 'LineString') {
      parts += 1;
    } else if (geometry.type === 'MultiLineString') {
      parts += geometry.coordinates.length;
    }
  }

  return parts;
}

function measureMaxBoardOverlap(relPath) {
  const script = `
from pathlib import Path
import geopandas as gpd

root = Path(${JSON.stringify(ROOT)})
gdf = gpd.read_file(root / ${JSON.stringify(relPath)}).to_crs(27700)
max_overlap = 0.0
pair = ("", "")
for i, row in gdf.iterrows():
    others = gdf.iloc[i + 1 :]
    if others.empty:
        continue
    overlaps = others.geometry.intersection(row.geometry).area
    if len(overlaps):
        value = float(overlaps.max())
        if value > max_overlap:
            idx = overlaps.idxmax()
            max_overlap = value
            pair = (str(row["boundary_code"]), str(others.loc[idx, "boundary_code"]))
print(f"{max_overlap}|{pair[0]}|{pair[1]}")
`.trim();
  const output = execFileSync(GEO_PYTHON, ['-c', script], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim();
  const [areaText, codeA = '', codeB = ''] = output.split('|');
  return {
    maxOverlap: Number.parseFloat(areaText),
    codeA,
    codeB,
  };
}

export function validateBoards() {
  for (const [relPath, expectedCount] of [
    [CURRENT_BOARDS, 68],
    [Y2026_BOARDS, 62],
  ]) {
    const fc = readFeatureCollection(relPath);
    assert(fc.features.length === expectedCount, `${relPath} expected ${expectedCount} features`);
    assert(countInteriorRings(fc) === 0, `${relPath} must remain hole-free`);
    const extent = getExtent(fc);
    assert(extent.minLon > -9 && extent.minLon < -8, `${relPath} minLon out of clipped UK range`);
    assert(extent.maxLon > 1.7 && extent.maxLon < 1.9, `${relPath} maxLon out of clipped UK range`);
    assert(extent.minLat > 49.8 && extent.minLat < 50, `${relPath} minLat out of clipped UK range`);
    assert(extent.maxLat > 60.8 && extent.maxLat < 60.9, `${relPath} maxLat out of clipped UK range`);

    const { maxOverlap, codeA, codeB } = measureMaxBoardOverlap(relPath);
    assert(
      maxOverlap <= 5_000_000,
      `${relPath} board overlap drifted: ${codeA} vs ${codeB} :: ${maxOverlap}`,
    );
  }
}

export function validateMasks() {
  for (const [boardsPath, landmaskPath] of [
    [CURRENT_BOARDS, CURRENT_LAND],
    [Y2026_BOARDS, Y2026_LAND],
  ]) {
    const boards = readFeatureCollection(boardsPath);
    const landmask = readFeatureCollection(landmaskPath);
    assert(landmask.features.length === 1, `${landmaskPath} must remain a single-feature patch`);
    assert(countInteriorRings(landmask) === 0, `${landmaskPath} must remain hole-free`);

    const boardExtent = getExtent(boards);
    const maskExtent = getExtent(landmask);
    assert(maskExtent.minLon > -10.6 && maskExtent.minLon < -10.3, `${landmaskPath} minLon out of patch range`);
    assert(maskExtent.maxLon === 4, `${landmaskPath} maxLon must remain 4`);
    assert(maskExtent.minLat === 48, `${landmaskPath} minLat must remain 48`);
    assert(maskExtent.maxLat === 62, `${landmaskPath} maxLat must remain 62`);
    assert(maskExtent.minLon <= boardExtent.minLon, `${landmaskPath} must contain board minLon`);
    assert(maskExtent.maxLon >= boardExtent.maxLon, `${landmaskPath} must contain board maxLon`);
    assert(maskExtent.minLat <= boardExtent.minLat, `${landmaskPath} must contain board minLat`);
    assert(maskExtent.maxLat >= boardExtent.maxLat, `${landmaskPath} must contain board maxLat`);
  }

  for (const relPath of [CURRENT_SEA, Y2026_SEA]) {
    const sea = readFeatureCollection(relPath);
    const extent = getExtent(sea);
    assert(sea.features.length === 1, `${relPath} must remain a single-feature patch`);
    assert(countInteriorRings(sea) === 0, `${relPath} must remain hole-free`);
    assert(extent.minLon === -12, `${relPath} minLon must remain -12`);
    assert(extent.maxLon === 4, `${relPath} maxLon must remain 4`);
    assert(extent.minLat === 48, `${relPath} minLat must remain 48`);
    assert(extent.maxLat === 62, `${relPath} maxLat must remain 62`);
  }
}

export function validateSplitArtifacts() {
  const split = readFeatureCollection(CURRENT_SPLIT);
  assert(split.features.length === 8, `${CURRENT_SPLIT} expected 8 features`);
  assert(countInteriorRings(split) === 0, `${CURRENT_SPLIT} must remain hole-free`);

  const dissolved = readFeatureCollection(CURRENT_SPLIT_DISSOLVED);
  assert(
    countInteriorRings(dissolved) === 0,
    `${CURRENT_SPLIT_DISSOLVED} must remain hole-free`,
  );

  const perParent = new Map();
  for (const feature of split.features) {
    const boundaryCode = String(feature.properties?.boundary_code ?? '');
    const assignmentBasis = String(feature.properties?.assignment_basis ?? '');
    assert(boundaryCode.length > 0, `${CURRENT_SPLIT} contains missing boundary_code`);
    assert(assignmentBasis === 'ward_bsc_with_parent_remainder', `${CURRENT_SPLIT} assignment_basis drifted`);
    perParent.set(boundaryCode, (perParent.get(boundaryCode) ?? 0) + 1);

    const geometry = feature.geometry;
    const partCount =
      geometry?.type === 'Polygon'
        ? 1
        : geometry?.type === 'MultiPolygon'
          ? geometry.coordinates.length
          : 0;
    assert(partCount > 0 && partCount <= 60, `${CURRENT_SPLIT} runaway fragmentation detected for ${boundaryCode}`);
  }

  const expected = {
    E54000025: 3,
    E54000042: 3,
    E54000048: 2,
  };
  assert(
    JSON.stringify(Object.fromEntries([...perParent.entries()].sort())) === JSON.stringify(expected),
    `${CURRENT_SPLIT} split-parent counts drifted`,
  );

  const arcs = readFeatureCollection(CURRENT_SPLIT_INTERNAL_ARCS);
  assert(arcs.features.length === 5, `${CURRENT_SPLIT_INTERNAL_ARCS} expected 5 helper features`);
  assert(countLineParts(arcs) <= 16, `${CURRENT_SPLIT_INTERNAL_ARCS} line-part count drifted`);
}

export function validateScenarioArtifacts() {
  for (const [relPath, expectedCount] of [
    [JMC_BOARD, 62],
    [COA3A_BOARD, 62],
    [COA3B_BOARD, 62],
  ]) {
    const fc = readFeatureCollection(relPath);
    assert(fc.features.length === expectedCount, `${relPath} expected ${expectedCount} features`);
    assert(countInteriorRings(fc) === 0, `${relPath} must remain hole-free`);
  }

  for (const [relPath, expectedCount] of [
    [JMC_OUTLINE, 8],
    [COA3A_OUTLINE, 5],
    [COA3B_OUTLINE, 6],
  ]) {
    const fc = readFeatureCollection(relPath);
    assert(fc.features.length === expectedCount, `${relPath} expected ${expectedCount} features`);
  }
}

export function validateTopologyArtifacts() {
  for (const relPath of [CURRENT_TOPOLOGY, Y2026_TOPOLOGY]) {
    const fc = readFeatureCollection(relPath);
    assert(fc.features.length > 100, `${relPath} expected to retain generated edge density`);
    assert(
      fc.features.some((feature) => feature.properties?.internal),
      `${relPath} must retain internal shared-edge features`,
    );
    for (const feature of fc.features) {
      const coordinates = feature.geometry?.type === 'LineString'
        ? [feature.geometry.coordinates]
        : feature.geometry?.type === 'MultiLineString'
          ? feature.geometry.coordinates
          : [];
      for (const line of coordinates) {
        for (const [lon, lat] of line) {
          assert(lon >= -180 && lon <= 180, `${relPath} longitude drifted out of range`);
          assert(lat >= -90 && lat <= 90, `${relPath} latitude drifted out of range`);
        }
      }
    }
  }
}

export function validateHampshireContract() {
  const exact = readFeatureCollection(CURRENT_SPLIT_EXACT);
  const hampshire = exact.features.filter(
    (feature) => feature.properties?.parent_code === 'E54000042',
  );
  assert(hampshire.length > 0, `${CURRENT_SPLIT_EXACT} missing Hampshire split features`);

  const wardAssignments = hampshire.filter(
    (feature) =>
      String(feature.properties?.assignment_basis) !== 'canonical_parent_remainder_by_adjacency',
  );
  const bases = new Set(
    wardAssignments.map((feature) => String(feature.properties?.assignment_basis)),
  );
  for (const expectedBasis of [
    'facility_region_seed_explicit_hampshire_override',
    'facility_region_seed_isle_of_wight_hold',
    'facility_region_seed_nearest_hampshire_parent',
  ]) {
    assert(bases.has(expectedBasis), `Hampshire split basis missing ${expectedBasis}`);
  }

  const wardToRegion = new Map(
    wardAssignments.map((feature) => [
      String(feature.properties?.ward_name),
      String(feature.properties?.region_ref),
    ]),
  );
  for (const [wardName, regionRef] of [
    ["Badger Farm and Oliver's Battery", 'South West'],
    ["Bishop's Waltham", 'London & South'],
    ['Downlands & Forest North', 'South West'],
    ['Totland & Colwell', 'London & South'],
  ]) {
    assert(
      wardToRegion.get(wardName) === regionRef,
      `Hampshire accepted split spot-check drifted: ${wardName} should be ${regionRef}`,
    );
  }
}

export function runGeoPythonChecks() {
  const script = `
from pathlib import Path
import geopandas as gpd
from shapely.geometry import shape
from shapely.validation import explain_validity
import json

root = Path(${JSON.stringify(ROOT)})
split_path = root / ${JSON.stringify(CURRENT_SPLIT)}
dissolved_path = root / ${JSON.stringify(CURRENT_SPLIT_DISSOLVED)}
boards_path = root / ${JSON.stringify(CURRENT_BOARDS)}
facilities_path = root / ${JSON.stringify(FACILITIES)}

for path in [split_path, dissolved_path]:
    data = json.loads(path.read_text())
    for feature in data["features"]:
        geom = shape(feature["geometry"])
        if not geom.is_valid:
            props = feature.get("properties", {})
            raise SystemExit(
                f"invalid geometry :: {path.name} :: {props.get('boundary_code')} :: {props.get('region_ref')} :: {explain_validity(geom)}"
            )

split = gpd.read_file(split_path).to_crs(27700)
boards = gpd.read_file(boards_path).to_crs(27700)
y2026_boards = gpd.read_file(root / ${JSON.stringify(Y2026_BOARDS)}).to_crs(27700)
current_source = gpd.read_file(root / ${JSON.stringify(CURRENT_SOURCE)}).to_crs(27700)
y2026_source = gpd.read_file(root / ${JSON.stringify(Y2026_SOURCE)}).to_crs(27700)
changed_2026 = json.loads((root / ${JSON.stringify(CHANGED_2026_CONFIG)}).read_text())
changed_entries = [
    {
        "targetCode": str(entry["targetCode"]),
        "changeKind": str(entry.get("changeKind", "")),
        "predecessorCurrentIcbCodes": {str(code) for code in entry["predecessorCurrentIcbCodes"]},
    }
    for entry in changed_2026
]
changed_components = []
pending_entries = changed_entries.copy()
while pending_entries:
    component = [pending_entries.pop(0)]
    changed = True
    while changed:
        changed = False
        component_predecessors = set().union(
            *(entry["predecessorCurrentIcbCodes"] for entry in component)
        )
        remaining_entries = []
        for entry in pending_entries:
            if component_predecessors.intersection(entry["predecessorCurrentIcbCodes"]):
                component.append(entry)
                changed = True
            else:
                remaining_entries.append(entry)
        pending_entries = remaining_entries
    changed_components.append(component)
changed_codes = {
    entry["targetCode"]
    for component in changed_components
    for entry in component
}
for _, row in split.iterrows():
    others = boards[boards["boundary_code"] != row["boundary_code"]].copy()
    overlaps = others.geometry.intersection(row.geometry).area
    max_overlap = float(overlaps.max()) if len(overlaps) else 0.0
    if max_overlap > 500:
        raise SystemExit(
            f"split overlap drift :: {row['boundary_code']} :: {row['region_ref']} :: {max_overlap}"
        )

facilities = gpd.read_file(facilities_path).to_crs(27700)
domestic = facilities[facilities["region"] != "Overseas"].copy()
board_lookup = boards[["boundary_code", "geometry"]].rename(columns={"geometry": "board_geometry"})
joined = domestic.merge(board_lookup, left_on="icb_hb_code", right_on="boundary_code", how="left")
if joined["board_geometry"].isna().any():
    raise SystemExit("facility board lookup missing for domestic facilities")

outside = joined[~joined.apply(lambda row: row.geometry.within(row.board_geometry) or row.geometry.touches(row.board_geometry), axis=1)]
if len(outside) > 0:
    sample = outside.iloc[0]
    raise SystemExit(
        f"facility containment drift :: {sample.get('site_code')} :: {sample.get('site_name')} :: {sample.get('icb_hb_code')}"
    )

y2026_lookup = y2026_boards[["boundary_code", "geometry"]].rename(columns={"geometry": "board_geometry"})
y2026_joined = domestic.merge(y2026_lookup, left_on="icb_hb_code_2026", right_on="boundary_code", how="left")
if y2026_joined["board_geometry"].isna().any():
    raise SystemExit("2026 facility board lookup missing for domestic facilities")

y2026_outside = y2026_joined[~y2026_joined.apply(lambda row: row.geometry.within(row.board_geometry) or row.geometry.touches(row.board_geometry), axis=1)]
if len(y2026_outside) > 0:
    sample = y2026_outside.iloc[0]
    raise SystemExit(
        f"2026 facility containment drift :: {sample.get('site_code')} :: {sample.get('site_name')} :: {sample.get('icb_hb_code_2026')}"
    )

for component in changed_components:
    target_codes = [entry["targetCode"] for entry in component]
    predecessor_codes = set().union(
        *(entry["predecessorCurrentIcbCodes"] for entry in component)
    )
    runtime_cluster = y2026_boards.loc[y2026_boards["boundary_code"].isin(target_codes)].geometry.union_all()
    runtime_shell = boards.loc[boards["boundary_code"].isin(predecessor_codes)].geometry.union_all()
    runtime_extra = float(runtime_cluster.difference(runtime_shell).area)
    if runtime_extra > 1_000:
        raise SystemExit(
            f"2026 runtime predecessor-shell drift :: {','.join(target_codes)} :: {runtime_extra}"
        )

    source_cluster = y2026_source.loc[y2026_source["boundary_code"].isin(target_codes)].geometry.union_all()
    source_shell = current_source.loc[current_source["boundary_code"].isin(predecessor_codes)].geometry.union_all()
    source_extra = float(source_cluster.difference(source_shell).area)
    if source_extra > 10:
        raise SystemExit(
            f"2026 source predecessor-shell drift :: {','.join(target_codes)} :: {source_extra}"
        )
`;

  execFileSync(GEO_PYTHON, ['-c', script], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

export function main() {
  console.log('=== validate-runtime-geometry-family ===');
  validateBoards();
  validateMasks();
  validateTopologyArtifacts();
  validateScenarioArtifacts();
  validateSplitArtifacts();
  validateHampshireContract();
  runGeoPythonChecks();
  console.log('Runtime geometry family validation passed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
