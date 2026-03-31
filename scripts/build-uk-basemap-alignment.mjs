import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const REGIONS_DIR = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const BASEMAPS_DIR = process.env.BASEMAPS_DIR
  ? path.resolve(ROOT, process.env.BASEMAPS_DIR)
  : path.join(ROOT, 'public', 'data', 'basemaps');

const CURRENT_BOARDS = path.join(
  REGIONS_DIR,
  'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
);
const BOARDS_2026 = path.join(
  REGIONS_DIR,
  'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
);
const CURRENT_SPLIT = path.join(
  REGIONS_DIR,
  'UK_WardSplit_simplified.geojson',
);
const COUNTRIES = path.join(
  BASEMAPS_DIR,
  'ne_10m_admin_0_countries.geojson',
);
const LAND = path.join(
  BASEMAPS_DIR,
  'ne_10m_land.geojson',
);
const CURRENT_LAND_OUTPUT = path.join(
  BASEMAPS_DIR,
  'uk_landmask_current_v01.geojson',
);
const CURRENT_SEA_OUTPUT = path.join(
  BASEMAPS_DIR,
  'uk_seapatch_current_v01.geojson',
);
const Y2026_LAND_OUTPUT = path.join(
  BASEMAPS_DIR,
  'uk_landmask_2026_v01.geojson',
);
const Y2026_SEA_OUTPUT = path.join(
  BASEMAPS_DIR,
  'uk_seapatch_2026_v01.geojson',
);
function run(command, args) {
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function stripInteriorRingsFromGeometry(geometry) {
  if (!geometry) {
    return geometry;
  }

  if (geometry.type === 'Polygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.length > 0 ? [geometry.coordinates[0]] : [],
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.length > 0 ? [polygon[0]] : [],
      ),
    };
  }

  return geometry;
}

function stripInteriorRingsFromGeoJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const fc = JSON.parse(raw);
  fc.features = fc.features.map((feature) => ({
    ...feature,
    geometry: stripInteriorRingsFromGeometry(feature.geometry),
  }));
  fs.writeFileSync(filePath, `${JSON.stringify(fc)}\n`);
}

function buildAlignedLand(workspace, sourceSql, outputPath, landLayerName) {
  run('ogr2ogr', [
    '-f',
    'GeoJSON',
    outputPath,
    workspace,
    '-dialect',
    'sqlite',
    '-sql',
    `
      WITH board_union AS (
        ${sourceSql}
      ),
      ireland_union AS (
        SELECT ST_Union(geom) AS geom
        FROM ireland
      ),
      exact_land AS (
        SELECT ST_Union(board_union.geom, ireland_union.geom) AS geom
        FROM board_union, ireland_union
      ),
      context_land AS (
        SELECT ST_Union(geom) AS geom
        FROM regional_land
      ),
      context_exclusion AS (
        SELECT ST_Union(geom) AS geom
        FROM uk_ireland_context
      ),
      context_without_uk_ireland AS (
        SELECT
          ST_MakeValid(ST_Difference(context_land.geom, context_exclusion.geom)) AS geom
        FROM context_land, context_exclusion
      )
      SELECT
        ST_Multi(
          ST_CollectionExtract(
            ST_MakeValid(ST_Union(context_without_uk_ireland.geom, exact_land.geom)),
            3
          )
        ) AS geom,
        'UK aligned land' AS name
      FROM context_without_uk_ireland, exact_land
    `,
  ]);

  stripInteriorRingsFromGeoJson(outputPath);

  run('ogr2ogr', [
    '-f',
    'GPKG',
    workspace,
    outputPath,
    '-nln',
    landLayerName,
    '-update',
  ]);
}

function buildSeaPatch(workspace, landLayerName, outputPath) {
  const featureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'UK aligned sea patch',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-12, 48],
            [4, 48],
            [4, 62],
            [-12, 62],
            [-12, 48],
          ]],
        },
      },
    ],
  };
  fs.writeFileSync(outputPath, `${JSON.stringify(featureCollection)}\n`);
}

function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'uk-basemap-alignment-'));
  const workspace = path.join(tempDir, 'alignment.gpkg');

  try {
    run('ogr2ogr', ['-f', 'GPKG', workspace, CURRENT_BOARDS, '-nln', 'current']);
    run('ogr2ogr', ['-f', 'GPKG', workspace, CURRENT_SPLIT, '-nln', 'current_split', '-update']);
    run('ogr2ogr', ['-f', 'GPKG', workspace, BOARDS_2026, '-nln', 'y2026', '-update']);
    run('ogr2ogr', [
      '-f',
      'GPKG',
      workspace,
      LAND,
      '-nln',
      'regional_land',
      '-clipsrc',
      '-12',
      '48',
      '4',
      '62',
      '-update',
    ]);
    run('ogr2ogr', [
      '-f',
      'GPKG',
      workspace,
      COUNTRIES,
      '-nln',
      'ireland',
      '-where',
      "ADMIN='Ireland'",
      '-update',
    ]);
    run('ogr2ogr', [
      '-f',
      'GPKG',
      workspace,
      COUNTRIES,
      '-nln',
      'uk_ireland_context',
      '-where',
      "ADMIN IN ('Ireland','United Kingdom')",
      '-update',
    ]);

    buildAlignedLand(
      workspace,
      `
        SELECT ST_Union(geom) AS geom
        FROM (
          SELECT ST_MakeValid(geom) AS geom
          FROM current
          WHERE boundary_code NOT IN ('E54000025', 'E54000042', 'E54000048')
          UNION ALL
          SELECT ST_MakeValid(geom) AS geom
          FROM current_split
        )
      `,
      CURRENT_LAND_OUTPUT,
      'current_land_aligned',
    );
    buildAlignedLand(
      workspace,
      `
        SELECT ST_Union(geom) AS geom
        FROM (
          SELECT ST_MakeValid(geom) AS geom
          FROM y2026
        )
      `,
      Y2026_LAND_OUTPUT,
      'y2026_land_aligned',
    );
    buildSeaPatch(workspace, 'current_land_aligned', CURRENT_SEA_OUTPUT);
    buildSeaPatch(workspace, 'y2026_land_aligned', Y2026_SEA_OUTPUT);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
