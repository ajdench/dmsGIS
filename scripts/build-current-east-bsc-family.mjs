import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mapshaper from 'mapshaper';
import { stripInteriorRingsFromGeoJson } from './preprocess-boundaries.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');
const NORMALIZE_BOUNDARY_GEOJSON = path.join(ROOT, 'scripts', 'normalize_boundary_geojson.py');

const COMPARE_ROOT = path.join(ROOT, 'public', 'data', 'compare', 'current-east-bsc');
const COMPARE_REGIONS = path.join(COMPARE_ROOT, 'regions');
const COMPARE_BASEMAPS = path.join(COMPARE_ROOT, 'basemaps');
const COMPARE_FACILITIES = path.join(COMPARE_ROOT, 'facilities');
const COMPARE_MANIFESTS = path.join(COMPARE_ROOT, 'manifests');
const CURRENT_EXACT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'compare',
  'current_east_bsc',
  'Current_East_BSC_exact.geojson',
);
const CURRENT_LANDMASK = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'compare',
  'current_east_bsc',
  'Current_East_BSC_landmask.geojson',
);
const CURRENT_SPLIT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'compare',
  'current_east_bsc',
  'Current_East_BSC_split.geojson',
);
const BASELINE_FACILITIES = path.join(ROOT, 'public', 'data', 'facilities', 'facilities.geojson');
const EAST_FACILITIES_OUTPUT = path.join(COMPARE_FACILITIES, 'facilities.geojson');
const EAST_REGION_NAME = 'East';

function buildEastFacilitiesProduct() {
  const source = JSON.parse(fs.readFileSync(BASELINE_FACILITIES, 'utf8'));
  const features = (source.features ?? []).filter(
    (feature) => String(feature?.properties?.region ?? '').trim() === EAST_REGION_NAME,
  );
  fs.mkdirSync(COMPARE_FACILITIES, { recursive: true });
  fs.writeFileSync(
    EAST_FACILITIES_OUTPUT,
    JSON.stringify({
      ...source,
      features,
    }),
  );
}

function run(command, args, env = {}) {
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

async function buildCurrentBoardProducts() {
  const outputGeoJson = path.join(
    COMPARE_REGIONS,
    'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
  );
  const outputTopoJson = path.join(
    COMPARE_REGIONS,
    'UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json',
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'current-east-bsc-'));
  const tempGeoJson = path.join(tempDir, 'simplified.geojson');
  const tempNormalizedGeoJson = path.join(tempDir, 'simplified.normalized.geojson');

  try {
    const geoCmd = [
      `-i "${CURRENT_EXACT}" name=boards snap`,
      `-i "${CURRENT_LANDMASK}" name=land`,
      `-clip source=land target=boards remove-slivers`,
      `-o target=boards "${tempGeoJson}" format=geojson precision=0.000001`,
    ].join(' ');
    await mapshaper.runCommands(geoCmd);

    run(PYTHON, [NORMALIZE_BOUNDARY_GEOJSON, tempGeoJson, tempNormalizedGeoJson]);

    const simplifiedGeoJson = JSON.parse(fs.readFileSync(tempNormalizedGeoJson, 'utf8'));
    const holeFreeGeoJson = stripInteriorRingsFromGeoJson(simplifiedGeoJson);
    fs.writeFileSync(outputGeoJson, JSON.stringify(holeFreeGeoJson));

    const topoCmd = [
      `-i "${outputGeoJson}" snap`,
      `-o "${outputTopoJson}" format=topojson precision=0.000001`,
    ].join(' ');
    await mapshaper.runCommands(topoCmd);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function clearCurrentOutlineFiles() {
  const outlineDir = path.join(COMPARE_REGIONS, 'outlines');
  if (!fs.existsSync(outlineDir)) return;
  for (const entry of fs.readdirSync(outlineDir)) {
    if (entry.startsWith('current_')) {
      fs.rmSync(path.join(outlineDir, entry), { force: true });
    }
  }
}

async function main() {
  fs.rmSync(COMPARE_ROOT, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(COMPARE_ROOT), { recursive: true });
  fs.cpSync(path.join(ROOT, 'public', 'data', 'regions'), COMPARE_REGIONS, { recursive: true });
  fs.cpSync(path.join(ROOT, 'public', 'data', 'basemaps'), COMPARE_BASEMAPS, { recursive: true });
  fs.cpSync(path.join(ROOT, 'public', 'data', 'manifests'), COMPARE_MANIFESTS, {
    recursive: true,
  });

  run(PYTHON, ['scripts/build_current_east_bsc_exact.py']);
  await buildCurrentBoardProducts();
  buildEastFacilitiesProduct();

  fs.copyFileSync(CURRENT_SPLIT, path.join(COMPARE_REGIONS, 'UK_WardSplit_simplified.geojson'));
  fs.writeFileSync(
    path.join(COMPARE_REGIONS, 'UK_WardSplit_internal_arcs.geojson'),
    JSON.stringify({ type: 'FeatureCollection', features: [] }),
  );

  run('node', ['scripts/extract-topology-edges.mjs'], {
    REGIONS_DIR: path.relative(ROOT, COMPARE_REGIONS),
  });

  clearCurrentOutlineFiles();
  run('node', ['scripts/extract-group-outlines.mjs'], {
    REGIONS_DIR: path.relative(ROOT, COMPARE_REGIONS),
  });
  run(PYTHON, ['scripts/build_group_inland_outline_modifiers.py'], {
    REGIONS_DIR: path.relative(ROOT, COMPARE_REGIONS),
  });
  run(PYTHON, ['scripts/build_current_east_bsc_basemap.py'], {
    REGIONS_DIR: path.relative(ROOT, COMPARE_REGIONS),
    BASEMAPS_DIR: path.relative(ROOT, COMPARE_BASEMAPS),
  });

  console.log(`\nCurrent East BSC compare family built: public/data/compare/current-east-bsc`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
