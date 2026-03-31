import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import dissolve from '@turf/dissolve';
import GeoJSON from 'ol/format/GeoJSON.js';

export const LEGACY_REGION_OUTLINE_INPUT_PATHS = [
  'public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
  'public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson',
];
export const CURRENT_BOARD_GEOMETRY_INPUT_PATH =
  'geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson';
export const CURRENT_SPLIT_RUNTIME_INPUT_PATH =
  'geopackages/outputs/full_uk_current_boards/UK_SplitICB_Current_Canonical_Dissolved.geojson';

export const LEGACY_REGION_OUTLINE_OUTPUT_PATH =
  'public/data/regions/UK_Legacy_Region_Outlines_Codex_v01.geojson';
export const LEGACY_REGION_OUTLINE_CLEAN_OUTPUT_PATH =
  'public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson';

export const LEGACY_REGION_FRAGMENT_MIN_AREA_SQ_METERS = 1_000_000;
export const LEGACY_REGION_CLEAN_FRAGMENT_MIN_AREA_SQ_METERS = 500_000_000;
export const LEGACY_REGION_CLEAN_SIMPLIFY_TOLERANCE_METERS = 0;

const geoJsonFormat = new GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
});

export function buildLegacyRegionOutlineCollection(
  featureCollections,
  options = {},
) {
  const minFragmentAreaSqMeters =
    options.minFragmentAreaSqMeters ?? LEGACY_REGION_FRAGMENT_MIN_AREA_SQ_METERS;
  const simplifyToleranceMeters = options.simplifyToleranceMeters ?? 0;
  const polygonFeaturesByRegion = new Map();

  for (const featureCollection of featureCollections) {
    for (const feature of featureCollection.features ?? []) {
      const regionName = String(feature.properties?.region_ref ?? '').trim();
      if (!regionName) {
        continue;
      }

      const existing = polygonFeaturesByRegion.get(regionName) ?? [];
      existing.push(...flattenPolygonFeatures(regionName, feature));
      polygonFeaturesByRegion.set(regionName, existing);
    }
  }

  return {
    type: 'FeatureCollection',
    features: [...polygonFeaturesByRegion.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([regionName, polygonFeatures]) => {
        const retainedFeatures = retainMeaningfulFragments(
          polygonFeatures,
          minFragmentAreaSqMeters,
        );
        if (retainedFeatures.length === 0) {
          return [];
        }

        return [
          {
            type: 'Feature',
            properties: {
              region_name: regionName,
              jmc_name: regionName,
              boundary_name: regionName,
              region_ref: regionName,
              fragment_count_total: polygonFeatures.length,
              fragment_count_retained: retainedFeatures.length,
              min_fragment_area_sq_m: minFragmentAreaSqMeters,
              simplify_tolerance_m: simplifyToleranceMeters,
            },
            geometry: simplifyBoundaryGeometry(
              buildExternalBoundaryGeometry(retainedFeatures),
              simplifyToleranceMeters,
            ),
          },
        ];
      }),
  };
}

export async function generateLegacyRegionOutlineFile(
  options = {},
) {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..');
  const envInputPaths = String(process.env.LEGACY_REGION_OUTLINE_INPUT_PATHS ?? '')
    .split(path.delimiter)
    .map((entry) => entry.trim())
    .filter(Boolean);
  const inputPaths = options.inputPaths ??
    (envInputPaths.length > 0 ? envInputPaths : LEGACY_REGION_OUTLINE_INPUT_PATHS);
  const currentBoardsPath = path.resolve(
    repoRoot,
    String(process.env.CURRENT_BOARD_GEOMETRY_INPUT_PATH ?? '').trim() ||
      options.currentBoardsPath ||
      CURRENT_BOARD_GEOMETRY_INPUT_PATH,
  );
  const currentSplitRuntimePath = path.resolve(
    repoRoot,
    String(process.env.CURRENT_SPLIT_RUNTIME_INPUT_PATH ?? '').trim() ||
      options.currentSplitRuntimePath ||
      CURRENT_SPLIT_RUNTIME_INPUT_PATH,
  );
  const outputPath =
    options.outputPath ??
    (String(process.env.LEGACY_REGION_OUTLINE_OUTPUT_PATH ?? '').trim() ||
      LEGACY_REGION_OUTLINE_OUTPUT_PATH);

  const componentCollections = await Promise.all(
    inputPaths.map(async (relativePath) =>
      JSON.parse(
        await fs.readFile(path.resolve(repoRoot, relativePath), 'utf8'),
      ),
    ),
  );
  const boardCollection = JSON.parse(await fs.readFile(currentBoardsPath, 'utf8'));
  const splitCollection = JSON.parse(await fs.readFile(currentSplitRuntimePath, 'utf8'));
  const featureCollections = buildLegacyRegionSourceCollections({
    componentCollections,
    boardCollection,
    splitCollection,
  });

  const collection = buildLegacyRegionOutlineCollection(featureCollections, options);
  await fs.writeFile(
    path.resolve(repoRoot, outputPath),
    `${JSON.stringify(collection, null, 2)}\n`,
    'utf8',
  );
  return collection;
}

export async function generateLegacyRegionOutlineVariants() {
  await generateLegacyRegionOutlineFile({
    outputPath:
      String(process.env.LEGACY_REGION_OUTLINE_OUTPUT_PATH ?? '').trim() ||
      LEGACY_REGION_OUTLINE_OUTPUT_PATH,
    minFragmentAreaSqMeters: LEGACY_REGION_FRAGMENT_MIN_AREA_SQ_METERS,
    simplifyToleranceMeters: 0,
  });
  await generateLegacyRegionOutlineFile({
    outputPath:
      String(process.env.LEGACY_REGION_OUTLINE_CLEAN_OUTPUT_PATH ?? '').trim() ||
      LEGACY_REGION_OUTLINE_CLEAN_OUTPUT_PATH,
    minFragmentAreaSqMeters: LEGACY_REGION_CLEAN_FRAGMENT_MIN_AREA_SQ_METERS,
    simplifyToleranceMeters: LEGACY_REGION_CLEAN_SIMPLIFY_TOLERANCE_METERS,
  });
}

function flattenPolygonFeatures(regionName, feature) {
  const geometry = feature.geometry;
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    return [
      {
        type: 'Feature',
        properties: { region_name: regionName },
        geometry,
      },
    ];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coordinates) => ({
      type: 'Feature',
      properties: { region_name: regionName },
      geometry: {
        type: 'Polygon',
        coordinates,
      },
    }));
  }

  return [];
}

export function buildLegacyRegionSourceCollections({
  componentCollections,
  boardCollection,
  splitCollection,
}) {
  const regionByParentCode = buildSingleRegionParentMap(componentCollections);
  const splitParentCodes = new Set(
    (splitCollection.features ?? [])
      .map((feature) => String(feature.properties?.parent_code ?? '').trim())
      .filter(Boolean),
  );

  const boardFeatures = (boardCollection.features ?? [])
    .flatMap((feature) => {
      const properties = feature.properties ?? {};
      const parentCode = String(properties.boundary_code ?? '').trim();
      if (!parentCode || splitParentCodes.has(parentCode)) {
        return [];
      }
      const regionRef = regionByParentCode.get(parentCode);
      if (!regionRef) {
        return [];
      }
      return [
        {
          type: 'Feature',
          properties: {
            region_ref: regionRef,
            parent_code: parentCode,
            boundary_code: parentCode,
            source_type: 'whole_current_board_region',
          },
          geometry: feature.geometry,
        },
      ];
    });

  const splitFeatures = (splitCollection.features ?? []).map((feature) => ({
    type: 'Feature',
    properties: {
      region_ref: String(feature.properties?.region_ref ?? '').trim(),
      parent_code: String(feature.properties?.parent_code ?? '').trim(),
      boundary_code: String(feature.properties?.boundary_code ?? '').trim(),
      source_type: 'current_split_runtime_region',
    },
    geometry: feature.geometry,
  }));

  return [
    {
      type: 'FeatureCollection',
      features: boardFeatures,
    },
    {
      type: 'FeatureCollection',
      features: splitFeatures,
    },
  ];
}

function buildSingleRegionParentMap(componentCollections) {
  const regionsByParentCode = new Map();

  for (const featureCollection of componentCollections) {
    for (const feature of featureCollection.features ?? []) {
      const parentCode = String(feature.properties?.parent_code ?? '').trim();
      const regionRef = String(feature.properties?.region_ref ?? '').trim();
      if (!parentCode || !regionRef) {
        continue;
      }

      const existing = regionsByParentCode.get(parentCode) ?? new Set();
      existing.add(regionRef);
      regionsByParentCode.set(parentCode, existing);
    }
  }

  return new Map(
    [...regionsByParentCode.entries()]
      .filter(([, regionRefs]) => regionRefs.size === 1)
      .map(([parentCode, regionRefs]) => [parentCode, [...regionRefs][0]]),
  );
}

function retainMeaningfulFragments(features, minFragmentAreaSqMeters) {
  const rankedFeatures = [...features]
    .map((feature) => ({
      feature,
      area: getFeatureAreaSqMeters(feature),
    }))
    .sort((left, right) => right.area - left.area);

  if (rankedFeatures.length === 0) {
    return [];
  }

  const retained = rankedFeatures.filter(
    ({ area }) => area >= minFragmentAreaSqMeters,
  );

  if (retained.length > 0) {
    return retained.map(({ feature }) => feature);
  }

  return [rankedFeatures[0].feature];
}

function getFeatureAreaSqMeters(feature) {
  const olFeature = geoJsonFormat.readFeature(feature);
  return olFeature.getGeometry()?.getArea() ?? 0;
}

function buildExternalBoundaryGeometry(features) {
  const dissolved = dissolvePolygonFeatures(features);
  const lines = extractExteriorRings(dissolved);

  if (lines.length === 0) {
    return {
      type: 'MultiLineString',
      coordinates: [],
    };
  }

  if (lines.length === 1) {
    return {
      type: 'LineString',
      coordinates: lines[0],
    };
  }

  return {
    type: 'MultiLineString',
    coordinates: lines,
  };
}

function dissolvePolygonFeatures(features) {
  if (features.length === 0) {
    return [];
  }

  const flattened = features.flatMap((feature) => {
    const geometry = feature.geometry;
    if (!geometry) {
      return [];
    }

    if (geometry.type === 'Polygon') {
      return [feature];
    }

    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates.map((coordinates) => ({
        type: 'Feature',
        properties: { ...feature.properties },
        geometry: {
          type: 'Polygon',
          coordinates,
        },
      }));
    }

    return [];
  });

  const dissolved = dissolve(
    {
      type: 'FeatureCollection',
      features: flattened,
    },
    {
      propertyName: 'region_name',
    },
  );

  return dissolved.features ?? [];
}

function extractExteriorRings(features) {
  const lines = [];

  for (const feature of features) {
    const geometry = feature.geometry;
    if (!geometry) {
      continue;
    }

    if (geometry.type === 'Polygon') {
      const outerRing = geometry.coordinates[0] ?? [];
      if (outerRing.length >= 2) {
        lines.push(outerRing);
      }
      continue;
    }

    if (geometry.type === 'MultiPolygon') {
      for (const polygon of geometry.coordinates) {
        const outerRing = polygon[0] ?? [];
        if (outerRing.length >= 2) {
          lines.push(outerRing);
        }
      }
    }
  }

  return lines;
}

function simplifyBoundaryGeometry(geometry, simplifyToleranceMeters) {
  if (!simplifyToleranceMeters || simplifyToleranceMeters <= 0) {
    return geometry;
  }

  const feature = geoJsonFormat.readFeature({
    type: 'Feature',
    properties: {},
    geometry,
  });
  const olGeometry = feature.getGeometry();
  if (!olGeometry) {
    return geometry;
  }

  const simplifiedGeometry = olGeometry.simplify(simplifyToleranceMeters);
  if (!simplifiedGeometry) {
    return geometry;
  }
  return geoJsonFormat.writeGeometryObject(simplifiedGeometry);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await generateLegacyRegionOutlineVariants();
}
