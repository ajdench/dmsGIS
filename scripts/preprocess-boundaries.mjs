/**
 * preprocess-boundaries.mjs
 *
 * Builds the app-facing canonical boundary products from the rebuilt exact
 * Current and 2026 board foundations.
 *
 * This is intentionally a topology-preserving simplification step:
 *
 * - inputs come from the exact canonical products under `geopackages/outputs`
 * - simplification is performed across the full feature collection so shared
 *   borders remain topologically consistent
 * - outputs are written as both GeoJSON and TopoJSON for downstream runtime
 *   and preprocessing consumers
 *
 * Current implementation note:
 *
 * - this step now clips the rebuilt exact board geometry to a prepared
 *   OSM-derived UK landmask before simplification
 * - the visible runtime basemap remains unchanged; only the hidden
 *   preprocessing coast truth changes here
 * - simplification still happens topologically after clipping so shared
 *   internal borders remain consistent
 *
 * Outputs (public/data/regions/):
 *   UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson
 *   UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json
 *   UK_Health_Board_Boundaries_Codex_2026_simplified.geojson
 *   UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json
 */

import mapshaper from 'mapshaper';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const DEFAULT_CURRENT_EXACT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'full_uk_current_boards',
  'UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson',
);
const DEFAULT_BOARDS_2026_EXACT = path.join(
  ROOT,
  'geopackages',
  'ICB 2026',
  'outputs',
  'full_uk_2026_boards',
  'UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson',
);
const CURRENT_EXACT = process.env.CURRENT_EXACT_PATH
  ? path.resolve(ROOT, process.env.CURRENT_EXACT_PATH)
  : DEFAULT_CURRENT_EXACT;
const BOARDS_2026_EXACT = process.env.Y2026_EXACT_PATH
  ? path.resolve(ROOT, process.env.Y2026_EXACT_PATH)
  : DEFAULT_BOARDS_2026_EXACT;
const UK_LANDMASK = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'uk_landmask',
  'UK_Landmask_OSM_simplified_v01_dissolved.geojson',
);
const UK_LANDMASK_NOHOLES = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'uk_landmask',
  'UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson',
);
const WATER_EDGE_TREATMENT_CONFIG = path.join(
  ROOT,
  'src',
  'lib',
  'config',
  'waterEdgeTreatment.json',
);
const NORMALIZE_BOUNDARY_GEOJSON = path.join(ROOT, 'scripts', 'normalize_boundary_geojson.py');
const CONSTRAIN_2026_MERGE_BSC_SHELLS = path.join(
  ROOT,
  'scripts',
  'constrain_2026_merge_bsc_shells.py',
);
const PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');

const CURRENT_SIMPLIFY_PERCENTAGE = '5%';
const Y2026_SIMPLIFY_PERCENTAGE = '5%';

fs.mkdirSync(REGIONS, { recursive: true });

function toFeatureCollection(geometry) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'UK landmask without inland-water holes',
        },
        geometry,
      },
    ],
  };
}

export function stripInteriorRingsFromGeometry(geometry) {
  if (!geometry) {
    return geometry;
  }

  switch (geometry.type) {
    case 'Polygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.length > 0 ? [geometry.coordinates[0]] : [],
      };
    case 'MultiPolygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.length > 0 ? [polygon[0]] : [],
        ),
      };
    case 'GeometryCollection':
      return {
        ...geometry,
        geometries: geometry.geometries.map((member) => stripInteriorRingsFromGeometry(member)),
      };
    default:
      return geometry;
  }
}

export function stripInteriorRingsFromGeoJson(source) {
  if (source.type === 'FeatureCollection') {
    return {
      ...source,
      features: source.features.map((feature) => ({
        ...feature,
        geometry: stripInteriorRingsFromGeometry(feature.geometry),
      })),
    };
  }

  if (source.type === 'Feature') {
    return {
      ...source,
      geometry: stripInteriorRingsFromGeometry(source.geometry),
    };
  }

  return stripInteriorRingsFromGeometry(source);
}

export function extractPolygonCoordinates(geometry) {
  if (!geometry) {
    return [];
  }

  switch (geometry.type) {
    case 'Polygon':
      return [geometry.coordinates];
    case 'MultiPolygon':
      return geometry.coordinates;
    case 'GeometryCollection':
      return geometry.geometries.flatMap((member) => extractPolygonCoordinates(member));
    default:
      return [];
  }
}

export function createHoleFreeLandmaskGeoJson(source) {
  const geometries =
    source.type === 'FeatureCollection'
      ? source.features.map((feature) => feature.geometry)
      : source.type === 'Feature'
        ? [source.geometry]
        : [source];

  const polygons = geometries.flatMap((geometry) => extractPolygonCoordinates(geometry));
  const holeFreeGeometry = {
    type: 'MultiPolygon',
    coordinates: polygons.map((polygon) => [polygon[0]]),
  };

  return toFeatureCollection(holeFreeGeometry);
}

export function getActivePreprocessLandmaskPath(config) {
  if (config.status !== 'active-review' && config.status !== 'active') {
    return UK_LANDMASK_NOHOLES;
  }

  const profileId = String(config.preprocessing?.activeProfileId ?? '').trim();
  if (!profileId) {
    throw new Error('Active water-edge treatment is missing preprocessing.activeProfileId');
  }

  return path.join(
    ROOT,
    'geopackages',
    'outputs',
    'uk_landmask',
    `UK_Landmask_OSM_simplified_v01_hydronormalized_${profileId}.geojson`,
  );
}

export function getActiveCoastalEnvelopeLandmaskPath(config) {
  if (config.status !== 'active-review' && config.status !== 'active') {
    return null;
  }

  const productId = String(config.activeProductId ?? '').trim();
  if (!productId) {
    throw new Error('Active coastal-envelope treatment is missing activeProductId');
  }

  const product = config.products?.[productId];
  const landmaskPath = String(product?.landmaskPath ?? '').trim();
  if (!landmaskPath) {
    throw new Error(`Active coastal-envelope product "${productId}" is missing landmaskPath`);
  }

  return path.join(ROOT, landmaskPath);
}

export function getActiveCoastalEnvelopeExactPaths(config) {
  if (config.status !== 'active-review' && config.status !== 'active') {
    return null;
  }

  const productId = String(config.activeProductId ?? '').trim();
  if (!productId) {
    throw new Error('Active coastal-envelope treatment is missing activeProductId');
  }

  const product = config.products?.[productId];
  const currentExactGeoJsonPath = String(product?.currentExactGeoJsonPath ?? '').trim();
  const y2026ExactGeoJsonPath = String(product?.y2026ExactGeoJsonPath ?? '').trim();
  if (!currentExactGeoJsonPath || !y2026ExactGeoJsonPath) {
    return null;
  }

  return {
    currentExactGeoJsonPath: path.join(ROOT, currentExactGeoJsonPath),
    y2026ExactGeoJsonPath: path.join(ROOT, y2026ExactGeoJsonPath),
  };
}

function createHoleFreeLandmask(inputPath, outputPath) {
  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const holeFreeGeoJson = createHoleFreeLandmaskGeoJson(source);
  fs.writeFileSync(outputPath, JSON.stringify(holeFreeGeoJson));
}

async function simplifyCanonical({
  inputPath,
  landmaskPath,
  outputGeoJson,
  outputTopoJson,
  simplifyPercentage,
  postNormalizeScriptPath = null,
  postNormalizeScriptArgs = [],
}) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }
  if (!fs.existsSync(landmaskPath)) {
    throw new Error(`Landmask file not found: ${landmaskPath}`);
  }

  console.log(`\nProcessing: ${path.basename(inputPath)}`);
  console.log(`  Input size: ${(fs.statSync(inputPath).size / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  Landmask: ${path.basename(landmaskPath)}`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'preprocess-boundaries-'));
  const tempGeoJson = path.join(tempDir, 'simplified.geojson');
  const tempNormalizedGeoJson = path.join(tempDir, 'simplified.normalized.geojson');
  const tempPostNormalizedGeoJson = path.join(tempDir, 'simplified.post-normalized.geojson');

  try {
    const geoSteps = [
      `-i "${inputPath}" name=boards snap`,
      `-i "${landmaskPath}" name=land`,
      `-clip source=land target=boards remove-slivers`,
    ];
    if (simplifyPercentage) {
      geoSteps.push(
        `-simplify target=boards visvalingam percentage=${simplifyPercentage} keep-shapes`,
      );
    }
    geoSteps.push(`-o target=boards "${tempGeoJson}" format=geojson precision=0.000001`);
    const geoCmd = geoSteps.join(' ');
    await mapshaper.runCommands(geoCmd);

    execFileSync(PYTHON, [NORMALIZE_BOUNDARY_GEOJSON, tempGeoJson, tempNormalizedGeoJson], {
      cwd: ROOT,
      stdio: 'inherit',
    });

    const finalNormalizedGeoJsonPath = postNormalizeScriptPath
      ? tempPostNormalizedGeoJson
      : tempNormalizedGeoJson;

    if (postNormalizeScriptPath) {
      execFileSync(
        PYTHON,
        [postNormalizeScriptPath, tempNormalizedGeoJson, tempPostNormalizedGeoJson, ...postNormalizeScriptArgs],
        {
          cwd: ROOT,
          stdio: 'inherit',
        },
      );
    }

    const simplifiedGeoJson = JSON.parse(fs.readFileSync(finalNormalizedGeoJsonPath, 'utf8'));
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

  console.log(`  GeoJSON: ${(fs.statSync(outputGeoJson).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  TopoJSON: ${(fs.statSync(outputTopoJson).size / 1024 / 1024).toFixed(2)} MB`);
}

async function main() {
  console.log('=== preprocess-boundaries ===');
  console.log(`Output dir: ${REGIONS}`);
  console.log(
    `Simplify percentages: current=${CURRENT_SIMPLIFY_PERCENTAGE}, 2026=${Y2026_SIMPLIFY_PERCENTAGE ?? 'clip-only'}`,
  );
  const waterEdgeTreatment = JSON.parse(fs.readFileSync(WATER_EDGE_TREATMENT_CONFIG, 'utf8'));
  const explicitLandmaskPath = process.env.PREPROCESS_LANDMASK_PATH
    ? path.resolve(ROOT, process.env.PREPROCESS_LANDMASK_PATH)
    : null;
  const activeLandmaskPath =
    explicitLandmaskPath ?? getActivePreprocessLandmaskPath(waterEdgeTreatment);
  const activeCurrentExactPath = CURRENT_EXACT;
  const active2026ExactPath = BOARDS_2026_EXACT;
  console.log(
    `Water-edge treatment: ${waterEdgeTreatment.version} (${waterEdgeTreatment.status}, preprocessing profile ${waterEdgeTreatment.preprocessing.activeProfileId})`,
  );
  if (activeLandmaskPath === UK_LANDMASK_NOHOLES) {
    createHoleFreeLandmask(UK_LANDMASK, UK_LANDMASK_NOHOLES);
  }
  if (!fs.existsSync(activeLandmaskPath)) {
    throw new Error(`Preprocessing landmask file not found: ${activeLandmaskPath}`);
  }
  console.log(`Preprocessing landmask: ${path.basename(activeLandmaskPath)}`);
  console.log(`Current exact input: ${path.basename(activeCurrentExactPath)}`);
  console.log(`2026 exact input: ${path.basename(active2026ExactPath)}`);

  await simplifyCanonical({
    inputPath: activeCurrentExactPath,
    landmaskPath: activeLandmaskPath,
    outputGeoJson: path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'),
    outputTopoJson: path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json'),
    simplifyPercentage: CURRENT_SIMPLIFY_PERCENTAGE,
  });

  await simplifyCanonical({
    inputPath: active2026ExactPath,
    landmaskPath: activeLandmaskPath,
    outputGeoJson: path.join(REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'),
    outputTopoJson: path.join(REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json'),
    simplifyPercentage: Y2026_SIMPLIFY_PERCENTAGE,
    postNormalizeScriptPath: CONSTRAIN_2026_MERGE_BSC_SHELLS,
    postNormalizeScriptArgs: [
      path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'),
    ],
  });

  console.log('\nDone.');
}

if (!process.env.VITEST && process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
