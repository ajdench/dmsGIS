import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dissolve from '@turf/dissolve';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function flattenPolygonFeatures(featureCollection) {
  const features = [];

  for (const feature of featureCollection.features ?? []) {
    const geometry = feature.geometry;
    const properties = feature.properties ?? {};
    if (!geometry) {
      continue;
    }

    if (geometry.type === 'Polygon') {
      features.push({
        type: 'Feature',
        properties,
        geometry,
      });
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const coordinates of geometry.coordinates ?? []) {
        features.push({
          type: 'Feature',
          properties,
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

function getPreset(presetConfig, presetId) {
  const preset = presetConfig.presets?.[presetId];
  if (!preset) {
    throw new Error(`Missing preset config for ${presetId}`);
  }
  return preset;
}

function getSortOrderMap(preset) {
  return new Map(
    (preset.regionGroups ?? []).map((group, index) => [group.name, index + 1]),
  );
}

function buildRegionMetadata(features, preset) {
  const metadata = new Map();
  const sortOrder = getSortOrderMap(preset);

  for (const feature of features) {
    const properties = feature.properties ?? {};
    const regionCode = String(properties.jmc_code ?? '').trim();
    const regionName = String(properties.jmc_name ?? '').trim();
    if (!regionCode || !regionName) {
      continue;
    }

    if (!metadata.has(regionCode)) {
      metadata.set(regionCode, {
        regionCode,
        regionName,
        nationGroups: new Set(),
      });
    }

    const entry = metadata.get(regionCode);
    entry.nationGroups.add(String(properties.nation_group ?? '').trim());
    entry.sortOrder = sortOrder.get(regionName) ?? null;
  }

  return metadata;
}

function buildOutputProperties(presetId, regionInfo) {
  if (presetId === 'coa3a') {
    return {
      region_code: regionInfo.regionCode,
      region_name: regionInfo.regionName,
      command_type: 'JMC',
      nation_group:
        regionInfo.nationGroups.size === 1
          ? [...regionInfo.nationGroups][0]
          : 'Mixed',
      region_ref: regionInfo.regionName,
      sort_order: regionInfo.sortOrder,
      build_src: 'staged_jmc_board',
    };
  }

  return {
    region_name: regionInfo.regionName,
    region_ref: regionInfo.regionCode,
  };
}

export function buildScenarioVisibleOutlineCollection({
  boardAssignments,
  presetConfig,
  presetId,
}) {
  const preset = getPreset(presetConfig, presetId);
  const metadata = buildRegionMetadata(boardAssignments.features ?? [], preset);
  const flattened = flattenPolygonFeatures({
    type: 'FeatureCollection',
    features: (boardAssignments.features ?? []).map((feature) => ({
      ...feature,
      properties: {
        region_code: feature.properties?.jmc_code,
      },
    })),
  });

  const dissolved = dissolve(flattened, { propertyName: 'region_code' });
  const dissolvedByCode = new Map();
  for (const feature of dissolved.features ?? []) {
    const regionCode = String(feature.properties?.region_code ?? '').trim();
    if (!regionCode) {
      continue;
    }
    const existing = dissolvedByCode.get(regionCode) ?? [];
    existing.push(feature);
    dissolvedByCode.set(regionCode, existing);
  }

  const features = [...metadata.values()]
    .sort((left, right) =>
      String(left.sortOrder ?? Number.MAX_SAFE_INTEGER).localeCompare(
        String(right.sortOrder ?? Number.MAX_SAFE_INTEGER),
        undefined,
        { numeric: true },
      ) || left.regionName.localeCompare(right.regionName),
    )
    .flatMap((regionInfo) => {
      const mergedGeometry = mergeFeatureGeometries(
        dissolvedByCode.get(regionInfo.regionCode) ?? [],
      );
      if (!mergedGeometry) {
        return [];
      }

      return [
        {
          type: 'Feature',
          properties: buildOutputProperties(presetId, regionInfo),
          geometry: mergedGeometry,
        },
      ];
    });

  return {
    type: 'FeatureCollection',
    features,
  };
}

export function buildScenarioVisibleOutlineFile({
  boardAssignmentsPath,
  presetConfigPath,
  presetId,
  outputPath,
}) {
  const boardAssignments = readJson(boardAssignmentsPath);
  const presetConfig = readJson(presetConfigPath);
  const collection = buildScenarioVisibleOutlineCollection({
    boardAssignments,
    presetConfig,
    presetId,
  });
  writeJson(outputPath, collection);
  return collection;
}

function resolveEnv(name, fallback = '') {
  const value = String(process.env[name] ?? '').trim();
  return value || fallback;
}

function main() {
  const boardAssignmentsPath = path.resolve(
    ROOT,
    resolveEnv('SCENARIO_BOARD_ASSIGNMENTS_PATH'),
  );
  const presetConfigPath = path.resolve(
    ROOT,
    resolveEnv('VIEW_PRESETS_PATH', 'src/lib/config/viewPresets.json'),
  );
  const presetId = resolveEnv('SCENARIO_PRESET_ID');
  const outputPath = path.resolve(ROOT, resolveEnv('SCENARIO_VISIBLE_OUTLINE_OUTPUT_PATH'));

  if (!boardAssignmentsPath || !presetId || !outputPath) {
    throw new Error(
      'Missing required env: SCENARIO_BOARD_ASSIGNMENTS_PATH, SCENARIO_PRESET_ID, SCENARIO_VISIBLE_OUTLINE_OUTPUT_PATH',
    );
  }

  buildScenarioVisibleOutlineFile({
    boardAssignmentsPath,
    presetConfigPath,
    presetId,
    outputPath,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
