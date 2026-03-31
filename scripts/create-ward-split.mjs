/**
 * create-ward-split.mjs
 *
 * Rebuilds the Current-preset split ICB ward product from the official
 * ward BSC source while preserving the parent ICB outer boundary from the
 * canonical Current board product.
 *
 * Usage:
 *   node scripts/create-ward-split.mjs
 *
 * Inputs:
 *   geopackages/compare_sources/Wards_December_2025_UK_BSC.gpkg
 *   geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg
 *   public/data/regions/full-res/UK_Active_Components_Codex_v10_geojson.geojson
 *
 * Outputs:
 *   geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.gpkg
 *   geopackages/outputs/full_uk_current_boards/UK_WardSplit_Canonical_Current_exact.geojson
 *   public/data/regions/UK_WardSplit_simplified.geojson
 *   public/data/regions/UK_WardSplit_internal_arcs.geojson
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');
const GEO_PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');
const OUTPUT_PATH = path.join(REGIONS, 'UK_WardSplit_simplified.geojson');

async function main() {
  console.log('=== create-ward-split ===');

  execFileSync('python3', ['scripts/build_current_ward_split_exact.py'], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  execFileSync(GEO_PYTHON, ['scripts/fix_current_ward_split_parent_coverage.py'], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  execFileSync(GEO_PYTHON, ['scripts/build_current_split_icb_runtime.py'], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  execFileSync(GEO_PYTHON, ['scripts/build_current_split_internal_arcs.py'], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  const result = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));

  const sizeMB = (fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(3);
  const byParent = result.features.reduce((acc, feature) => {
    const code = String(feature.properties?.boundary_code ?? '');
    acc.set(code, (acc.get(code) ?? 0) + 1);
    return acc;
  }, new Map());

  console.log(`Written: UK_WardSplit_simplified.geojson (${result.features.length} features, ${sizeMB} MB)`);
  for (const [code, count] of [...byParent.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`  ${code}: ${count}`);
  }
  console.log('\nDone.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
