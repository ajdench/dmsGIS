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

export function normalizeCurrentComponentCollection({
  collection,
  collectionName,
  crsName = DEFAULT_CRS_NAME,
}) {
  const normalizedFeatures = Array.isArray(collection?.features)
    ? collection.features.map((feature) => ({
        ...feature,
        geometry: normalizeCurrentComponentGeometry(feature?.geometry),
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

export function normalizeCurrentComponentGeometry(geometry) {
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

export function exportCurrentComponentLookupFile({
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
  const normalized = normalizeCurrentComponentCollection({
    collection: exported,
    collectionName,
  });
  fs.writeFileSync(absoluteOutputPath, `${JSON.stringify(normalized, null, 2)}\n`);
  fs.rmSync(tempOutputPath, { force: true });
  return normalized;
}

export function buildCurrentComponentLookupsFromGpkg({
  activeSourcePath = resolveFromRoot('geopackages/UK_Active_Components_Codex_v10_gpkg.gpkg'),
  activeLayerName = 'active_components',
  activeOutputPath = resolveFromRoot('public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson'),
  activeCollectionName = 'UK_Active_Components_Codex_v10_geojson',
  inactiveSourcePath = resolveFromRoot('geopackages/UK_Inactive_Remainder_Codex_v10_gpkg.gpkg'),
  inactiveLayerName = 'inactive_remainder',
  inactiveOutputPath = resolveFromRoot('public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson'),
  inactiveCollectionName = 'UK_Inactive_Remainder_Codex_v10_geojson',
  ogr2ogrBin,
} = {}) {
  return {
    active: exportCurrentComponentLookupFile({
      sourcePath: activeSourcePath,
      layerName: activeLayerName,
      outputPath: activeOutputPath,
      collectionName: activeCollectionName,
      ogr2ogrBin,
    }),
    inactive: exportCurrentComponentLookupFile({
      sourcePath: inactiveSourcePath,
      layerName: inactiveLayerName,
      outputPath: inactiveOutputPath,
      collectionName: inactiveCollectionName,
      ogr2ogrBin,
    }),
  };
}

function main() {
  buildCurrentComponentLookupsFromGpkg({
    activeSourcePath: process.env.CURRENT_ACTIVE_COMPONENTS_GPKG_PATH || undefined,
    activeLayerName: process.env.CURRENT_ACTIVE_COMPONENTS_LAYER_NAME || undefined,
    activeOutputPath: process.env.CURRENT_ACTIVE_COMPONENTS_OUTPUT_PATH || undefined,
    activeCollectionName: process.env.CURRENT_ACTIVE_COMPONENTS_COLLECTION_NAME || undefined,
    inactiveSourcePath: process.env.CURRENT_INACTIVE_COMPONENTS_GPKG_PATH || undefined,
    inactiveLayerName: process.env.CURRENT_INACTIVE_COMPONENTS_LAYER_NAME || undefined,
    inactiveOutputPath: process.env.CURRENT_INACTIVE_COMPONENTS_OUTPUT_PATH || undefined,
    inactiveCollectionName: process.env.CURRENT_INACTIVE_COMPONENTS_COLLECTION_NAME || undefined,
    ogr2ogrBin: process.env.OGR2OGR_BIN || undefined,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
