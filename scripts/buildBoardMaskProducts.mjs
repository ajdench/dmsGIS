import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dissolve from '@turf/dissolve';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'manual_masks',
);

const DEFAULT_CURRENT_BOARDS_PATH = path.join(
  ROOT,
  'public',
  'data',
  'regions',
  'UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
);
const DEFAULT_2026_BOARDS_PATH = path.join(
  ROOT,
  'public',
  'data',
  'regions',
  'UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
);
const DEFAULT_CURRENT_LANDMASK_OUTPUT_PATH = path.join(
  DEFAULT_OUTPUT_ROOT,
  'uk_landmask_current_runtime.geojson',
);
const DEFAULT_2026_LANDMASK_OUTPUT_PATH = path.join(
  DEFAULT_OUTPUT_ROOT,
  'uk_landmask_2026_runtime.geojson',
);

function resolveEnvPath(envName, fallbackPath) {
  const value = String(process.env[envName] ?? '').trim();
  return value ? path.resolve(ROOT, value) : fallbackPath;
}

function readGeoJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeGeoJson(filePath, collection) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(collection, null, 2)}\n`);
}

function flattenPolygonFeatures(featureCollection) {
  const features = [];

  for (const feature of featureCollection.features ?? []) {
    const geometry = feature.geometry;
    if (!geometry) {
      continue;
    }

    if (geometry.type === 'Polygon') {
      features.push({
        type: 'Feature',
        properties: { dissolve_key: 'land' },
        geometry,
      });
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const coordinates of geometry.coordinates ?? []) {
        features.push({
          type: 'Feature',
          properties: { dissolve_key: 'land' },
          geometry: {
            type: 'Polygon',
            coordinates,
          },
        });
      }
    }
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

function mergeFeatureGeometries(features) {
  const polygons = [];

  for (const feature of features) {
    const geometry = feature.geometry;
    if (!geometry) {
      continue;
    }

    if (geometry.type === 'Polygon') {
      polygons.push(geometry.coordinates);
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      polygons.push(...geometry.coordinates);
    }
  }

  if (polygons.length === 0) {
    return null;
  }

  if (polygons.length === 1) {
    return {
      type: 'Polygon',
      coordinates: polygons[0],
    };
  }

  return {
    type: 'MultiPolygon',
    coordinates: polygons,
  };
}

function buildLandmaskCollection(featureCollection, sourceFamily) {
  const dissolved = dissolve(flattenPolygonFeatures(featureCollection), {
    propertyName: 'dissolve_key',
  });
  const mergedGeometry = mergeFeatureGeometries(dissolved.features ?? []);

  return {
    type: 'FeatureCollection',
    features: mergedGeometry
      ? [
          {
            type: 'Feature',
            properties: {
              source_family: sourceFamily,
              geometry_basis: 'board_union',
              source_feature_count: featureCollection.features?.length ?? 0,
              dissolved_fragment_count: dissolved.features?.length ?? 0,
            },
            geometry: mergedGeometry,
          },
        ]
      : [],
  };
}

export function buildBoardMaskProducts({
  currentBoardsPath = DEFAULT_CURRENT_BOARDS_PATH,
  y2026BoardsPath = DEFAULT_2026_BOARDS_PATH,
  currentLandmaskOutputPath = DEFAULT_CURRENT_LANDMASK_OUTPUT_PATH,
  y2026LandmaskOutputPath = DEFAULT_2026_LANDMASK_OUTPUT_PATH,
} = {}) {
  const currentBoards = readGeoJson(currentBoardsPath);
  const y2026Boards = readGeoJson(y2026BoardsPath);

  const currentLandmask = buildLandmaskCollection(currentBoards, 'current');
  const y2026Landmask = buildLandmaskCollection(y2026Boards, 'merged2026');

  writeGeoJson(currentLandmaskOutputPath, currentLandmask);
  writeGeoJson(y2026LandmaskOutputPath, y2026Landmask);

  return {
    currentLandmask,
    y2026Landmask,
  };
}

function main() {
  buildBoardMaskProducts({
    currentBoardsPath: resolveEnvPath('CURRENT_RUNTIME_BOARDS_PATH', DEFAULT_CURRENT_BOARDS_PATH),
    y2026BoardsPath: resolveEnvPath('Y2026_RUNTIME_BOARDS_PATH', DEFAULT_2026_BOARDS_PATH),
    currentLandmaskOutputPath: resolveEnvPath(
      'CURRENT_LANDMASK_OUTPUT_PATH',
      DEFAULT_CURRENT_LANDMASK_OUTPUT_PATH,
    ),
    y2026LandmaskOutputPath: resolveEnvPath(
      'Y2026_LANDMASK_OUTPUT_PATH',
      DEFAULT_2026_LANDMASK_OUTPUT_PATH,
    ),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
