import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_CRS_NAME = 'urn:ogc:def:crs:OGC:1.3:CRS84';

function resolveFromRoot(inputPath) {
  return path.resolve(ROOT, inputPath);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function normalizeBoardGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') {
    return geometry ?? null;
  }

  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates) && geometry.coordinates.length === 1) {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates[0],
    };
  }

  return geometry;
}

export function normalizeBoardCollection({
  collection,
  collectionName,
  crsName = DEFAULT_CRS_NAME,
}) {
  const normalizedFeatures = Array.isArray(collection?.features)
    ? collection.features.map((feature) => ({
        ...feature,
        geometry: normalizeBoardGeometry(feature?.geometry),
      }))
    : [];

  return {
    type: 'FeatureCollection',
    name: collectionName,
    crs: {
      type: 'name',
      properties: {
        name: crsName,
      },
    },
    features: normalizedFeatures,
  };
}

export function exportBoardFamilyFile({
  sourcePath,
  layerName,
  outputPath,
  collectionName,
  ogr2ogrBin = process.env.OGR2OGR_BIN || 'ogr2ogr',
}) {
  const absoluteSourcePath = path.resolve(sourcePath);
  const absoluteOutputPath = path.resolve(outputPath);
  const tempOutputPath = `${absoluteOutputPath}.tmp`;
  ensureDir(absoluteOutputPath);

  execFileSync(
    ogr2ogrBin,
    ['-f', 'GeoJSON', tempOutputPath, absoluteSourcePath, layerName],
    { cwd: ROOT, stdio: 'pipe' },
  );

  const exported = JSON.parse(fs.readFileSync(tempOutputPath, 'utf8'));
  const normalized = normalizeBoardCollection({
    collection: exported,
    collectionName,
  });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(normalized, null, 2)}\n`);
  fs.rmSync(tempOutputPath, { force: true });
  return normalized;
}

export function buildBoardFamiliesFromGpkg({
  currentSourcePath = resolveFromRoot('geopackages/UK_ICB_LHB_Boundaries_Codex_v10_gpkg.gpkg'),
  currentLayerName = 'icb_wales_boundaries',
  currentOutputPath = resolveFromRoot('public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson'),
  currentCollectionName = 'UK_ICB_LHB_Boundaries_Codex_v10_geojson',
  y2026SourcePath = resolveFromRoot('geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_exact_gpkg_updated.gpkg'),
  y2026LayerName = 'uk_health_board_boundaries_2026',
  y2026OutputPath = resolveFromRoot('public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson'),
  y2026CollectionName = 'UK_Health_Board_Boundaries_Codex_2026_exact_geojson',
  ogr2ogrBin,
} = {}) {
  return {
    current: exportBoardFamilyFile({
      sourcePath: currentSourcePath,
      layerName: currentLayerName,
      outputPath: currentOutputPath,
      collectionName: currentCollectionName,
      ogr2ogrBin,
    }),
    y2026: exportBoardFamilyFile({
      sourcePath: y2026SourcePath,
      layerName: y2026LayerName,
      outputPath: y2026OutputPath,
      collectionName: y2026CollectionName,
      ogr2ogrBin,
    }),
  };
}

function main() {
  buildBoardFamiliesFromGpkg({
    currentSourcePath: process.env.CURRENT_BOARDS_GPKG_PATH || undefined,
    currentLayerName: process.env.CURRENT_BOARDS_LAYER_NAME || undefined,
    currentOutputPath: process.env.CURRENT_BOARDS_OUTPUT_PATH || undefined,
    currentCollectionName: process.env.CURRENT_BOARDS_COLLECTION_NAME || undefined,
    y2026SourcePath: process.env.Y2026_BOARDS_GPKG_PATH || undefined,
    y2026LayerName: process.env.Y2026_BOARDS_LAYER_NAME || undefined,
    y2026OutputPath: process.env.Y2026_BOARDS_OUTPUT_PATH || undefined,
    y2026CollectionName: process.env.Y2026_BOARDS_COLLECTION_NAME || undefined,
    ogr2ogrBin: process.env.OGR2OGR_BIN || undefined,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
