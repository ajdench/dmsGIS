import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const STEPS = [
  'scripts/build_water_edge_landmask_profiles.py',
  'scripts/preprocess-boundaries.mjs',
  'scripts/extract-topology-edges.mjs',
  'scripts/build_water_edge_arc_classes.py',
  'scripts/derive-boundary-presets.mjs',
  'scripts/create-ward-split.mjs',
  'scripts/extract-group-outlines.mjs',
  'scripts/build_group_inland_outline_modifiers.py',
  'scripts/build-uk-basemap-alignment.mjs',
  'scripts/enrich-facilities.mjs',
  'scripts/validate-runtime-geometry-family.mjs',
];

function runStep(scriptPath) {
  console.log(`\n=== ${scriptPath} ===`);
  const isPython = scriptPath.endsWith('.py');
  const command = isPython
    ? path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python')
    : 'node';
  execFileSync(command, [scriptPath], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

function main() {
  for (const step of STEPS) {
    runStep(step);
  }

  console.log('\nRuntime geometry family rebuilt.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
