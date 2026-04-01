import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  facilityFeatureCollectionsMatch,
  loadFacilitiesGeoJson,
} from './facility-refresh-validation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const GEO_PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');

const PRODUCT_ID = 'shared-foundation-review';
const REVIEW_ROOT = path.join(ROOT, 'public', 'data', 'compare', PRODUCT_ID);
const REVIEW_REGIONS = path.join(REVIEW_ROOT, 'regions');
const REVIEW_BASEMAPS = path.join(REVIEW_ROOT, 'basemaps');
const REVIEW_FACILITIES = path.join(REVIEW_ROOT, 'facilities');
const REVIEW_MANIFESTS = path.join(REVIEW_ROOT, 'manifests');
const REVIEW_STAGE_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'review_families',
  PRODUCT_ID,
);
const REVIEW_CURRENT_SOURCE = path.join(
  REVIEW_STAGE_ROOT,
  'UK_ICB_LHB_Boundaries_Current_BSC_source.geojson',
);
const REVIEW_Y2026_SOURCE = path.join(
  REVIEW_STAGE_ROOT,
  'UK_Health_Board_Boundaries_2026_BSC_source.geojson',
);
const REVIEW_SOURCE_SUMMARY = path.join(REVIEW_STAGE_ROOT, 'SUMMARY.txt');
const REVIEW_ALIGNMENT_REPORT = path.join(
  REVIEW_STAGE_ROOT,
  'paired_current_2026_alignment_report.json',
);
const CANONICAL_FACILITIES = path.join(
  ROOT,
  'public',
  'data',
  'facilities',
  'facilities.geojson',
);
const REVIEW_FACILITIES_GEOJSON = path.join(REVIEW_FACILITIES, 'facilities.geojson');

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

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyTree(fromPath, toPath) {
  fs.rmSync(toPath, { recursive: true, force: true });
  fs.cpSync(fromPath, toPath, { recursive: true });
}

function main() {
  console.log(`=== build-shared-foundation-review-family (${PRODUCT_ID}) ===`);

  fs.rmSync(REVIEW_ROOT, { recursive: true, force: true });
  ensureDir(path.dirname(REVIEW_ROOT));
  ensureDir(REVIEW_STAGE_ROOT);

  copyTree(path.join(ROOT, 'public', 'data', 'regions'), REVIEW_REGIONS);
  copyTree(path.join(ROOT, 'public', 'data', 'basemaps'), REVIEW_BASEMAPS);
  copyTree(path.join(ROOT, 'public', 'data', 'facilities'), REVIEW_FACILITIES);
  copyTree(path.join(ROOT, 'public', 'data', 'manifests'), REVIEW_MANIFESTS);

  run(GEO_PYTHON, ['scripts/build_v38_bsc_source_family.py'], {
    BSC_SOURCE_OUT_DIR: path.relative(ROOT, REVIEW_STAGE_ROOT),
    CURRENT_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_CURRENT_SOURCE),
    Y2026_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_Y2026_SOURCE),
    BSC_SOURCE_SUMMARY_OUTPUT_PATH: path.relative(ROOT, REVIEW_SOURCE_SUMMARY),
  });

  run('node', ['scripts/preprocess-boundaries.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
    CURRENT_EXACT_PATH: path.relative(ROOT, REVIEW_CURRENT_SOURCE),
    Y2026_EXACT_PATH: path.relative(ROOT, REVIEW_Y2026_SOURCE),
  });

  run(GEO_PYTHON, ['scripts/report_paired_current_2026_alignment.py'], {
    BSC_SOURCE_OUT_DIR: path.relative(ROOT, REVIEW_STAGE_ROOT),
    CURRENT_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_CURRENT_SOURCE),
    Y2026_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_Y2026_SOURCE),
    CURRENT_RUNTIME_GEOJSON_PATH: path.relative(
      ROOT,
      path.join(REVIEW_REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'),
    ),
    Y2026_RUNTIME_GEOJSON_PATH: path.relative(
      ROOT,
      path.join(REVIEW_REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'),
    ),
    PAIRED_ALIGNMENT_REPORT_PATH: path.relative(ROOT, REVIEW_ALIGNMENT_REPORT),
  });

  run('node', ['scripts/extract-topology-edges.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
  });

  run('node', ['scripts/create-ward-split.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
  });

  run('node', ['scripts/derive-boundary-presets.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
  });

  run('node', ['scripts/extract-group-outlines.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
  });

  run(GEO_PYTHON, ['scripts/build_group_inland_outline_modifiers.py'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
  });

  run('node', ['scripts/build-uk-basemap-alignment.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
    BASEMAPS_DIR: path.relative(ROOT, REVIEW_BASEMAPS),
  });

  run('node', ['scripts/buildLegacyRegionOutlines.mjs'], {
    LEGACY_REGION_OUTLINE_INPUT_PATHS: [
      path.join(
        'public',
        'data',
        'compare',
        PRODUCT_ID,
        'regions',
        'full-res',
        'UK_Active_Components_Codex_v10_geojson.geojson',
      ),
      path.join(
        'public',
        'data',
        'compare',
        PRODUCT_ID,
        'regions',
        'full-res',
        'UK_Inactive_Remainder_Codex_v10_geojson.geojson',
      ),
    ].join(path.delimiter),
    CURRENT_BOARD_GEOMETRY_INPUT_PATH: path.relative(ROOT, REVIEW_CURRENT_SOURCE),
    CURRENT_SPLIT_RUNTIME_INPUT_PATH: path.join(
      'geopackages',
      'outputs',
      'full_uk_current_boards',
      'UK_SplitICB_Current_Canonical_Dissolved.geojson',
    ),
    LEGACY_REGION_OUTLINE_OUTPUT_PATH: path.join(
      'public',
      'data',
      'compare',
      PRODUCT_ID,
      'regions',
      'UK_Legacy_Region_Outlines_Codex_v01.geojson',
    ),
    LEGACY_REGION_OUTLINE_CLEAN_OUTPUT_PATH: path.join(
      'public',
      'data',
      'compare',
      PRODUCT_ID,
      'regions',
      'UK_Legacy_Region_Outlines_Codex_v02_clean.geojson',
    ),
  });

  run('node', ['scripts/validate-runtime-geometry-family.mjs'], {
    REGIONS_DIR: path.relative(ROOT, REVIEW_REGIONS),
    BASEMAPS_DIR: path.relative(ROOT, REVIEW_BASEMAPS),
    FACILITIES_GEOJSON_PATH: path.relative(
      ROOT,
      path.join(REVIEW_FACILITIES, 'facilities.geojson'),
    ),
    CURRENT_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_CURRENT_SOURCE),
    Y2026_SOURCE_OUTPUT_PATH: path.relative(ROOT, REVIEW_Y2026_SOURCE),
  });

  const canonicalFacilities = loadFacilitiesGeoJson(CANONICAL_FACILITIES);
  const reviewFacilities = loadFacilitiesGeoJson(REVIEW_FACILITIES_GEOJSON);
  if (
    !facilityFeatureCollectionsMatch(
      canonicalFacilities.features,
      reviewFacilities.features,
    )
  ) {
    throw new Error(
      'Shared-foundation review facilities drifted from the canonical enriched facilities artifact.',
    );
  }

  console.log(`\nShared-foundation review family built: public/data/compare/${PRODUCT_ID}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
