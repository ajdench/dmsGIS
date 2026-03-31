import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');
const REBUILD_COMPARE_EXACTS = process.env.REBUILD_COMPARE_EXACTS === '1';

const PRODUCTS = {
  bfe: {
    currentExactPath:
      'geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_v37_bfe_exact.geojson',
    y2026ExactPath:
      'geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_v37_bfe_exact_geojson.geojson',
    landmaskPath:
      'geopackages/outputs/uk_landmask/UK_Landmask_v37_bfe_coastal_envelope.geojson',
  },
};

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

function main() {
  const productId = String(process.argv[2] || 'bfe').trim().toLowerCase();
  const product = PRODUCTS[productId];
  if (!product) {
    throw new Error(`Unsupported compare product: ${productId}`);
  }

  const compareRoot = path.join(ROOT, 'public', 'data', 'compare', productId);
  const compareRegions = path.join(compareRoot, 'regions');
  const compareBasemaps = path.join(compareRoot, 'basemaps');
  const compareWaterEdges = path.join(
    ROOT,
    'geopackages',
    'outputs',
    'water_edges',
    'compare',
    productId,
  );

  fs.rmSync(compareRoot, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(compareRoot), { recursive: true });
  fs.cpSync(path.join(ROOT, 'public', 'data', 'regions'), compareRegions, { recursive: true });
  fs.cpSync(path.join(ROOT, 'public', 'data', 'basemaps'), compareBasemaps, { recursive: true });

  const currentExactAbsolute = path.join(ROOT, product.currentExactPath);
  const y2026ExactAbsolute = path.join(ROOT, product.y2026ExactPath);
  if (REBUILD_COMPARE_EXACTS || !fs.existsSync(currentExactAbsolute) || !fs.existsSync(y2026ExactAbsolute)) {
    run(PYTHON, ['scripts/build_v37_coastalized_exact_boards.py'], {
      COASTAL_COMPARE_PRODUCT_ID: productId,
    });
  } else {
    console.log(`Reusing existing ${productId.toUpperCase()} exact compare inputs.`);
  }

  run('node', ['scripts/preprocess-boundaries.mjs'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
    CURRENT_EXACT_PATH: product.currentExactPath,
    Y2026_EXACT_PATH: product.y2026ExactPath,
    PREPROCESS_LANDMASK_PATH: product.landmaskPath,
  });
  run('node', ['scripts/extract-topology-edges.mjs'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
  });
  run(PYTHON, ['scripts/build_water_edge_arc_classes.py'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
    WATER_EDGE_DIR: compareWaterEdges,
  });
  run('node', ['scripts/derive-boundary-presets.mjs'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
  });
  run('node', ['scripts/extract-group-outlines.mjs'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
  });
  run(PYTHON, ['scripts/build_group_inland_outline_modifiers.py'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
  });
  run('node', ['scripts/build-uk-basemap-alignment.mjs'], {
    REGIONS_DIR: path.relative(ROOT, compareRegions),
    BASEMAPS_DIR: path.relative(ROOT, compareBasemaps),
  });

  console.log(`\nRuntime compare family built: public/data/compare/${productId}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
