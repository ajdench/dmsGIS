import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const GEO_PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');
const CURRENT_SOURCE_PATH = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'v38_bsc_runtime_family',
  'UK_ICB_LHB_Boundaries_Current_BSC_source.geojson',
);
const Y2026_SOURCE_PATH = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'v38_bsc_runtime_family',
  'UK_Health_Board_Boundaries_2026_BSC_source.geojson',
);

const STEPS = [
  {
    command: GEO_PYTHON,
    args: ['scripts/build_v38_bsc_source_family.py'],
  },
  {
    command: 'node',
    args: ['scripts/preprocess-boundaries.mjs'],
    env: {
      CURRENT_EXACT_PATH: CURRENT_SOURCE_PATH,
      Y2026_EXACT_PATH: Y2026_SOURCE_PATH,
    },
  },
  {
    command: GEO_PYTHON,
    args: ['scripts/report_paired_current_2026_alignment.py'],
  },
  {
    command: 'node',
    args: ['scripts/extract-topology-edges.mjs'],
  },
  {
    command: 'node',
    args: ['scripts/derive-boundary-presets.mjs'],
  },
  {
    command: 'node',
    args: ['scripts/create-ward-split.mjs'],
  },
  {
    command: 'node',
    args: ['scripts/extract-group-outlines.mjs'],
  },
  {
    command: GEO_PYTHON,
    args: ['scripts/build_group_inland_outline_modifiers.py'],
  },
  {
    command: 'node',
    args: ['scripts/build-uk-basemap-alignment.mjs'],
  },
  {
    command: 'node',
    args: ['scripts/enrich-facilities.mjs'],
  },
  {
    command: 'node',
    args: ['scripts/validate-runtime-geometry-family.mjs'],
  },
];

function runStep(step) {
  const label = `${step.command} ${step.args.join(' ')}`;
  console.log(`\n=== ${label} ===`);
  execFileSync(step.command, step.args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...(step.env ?? {}),
    },
  });
}

function main() {
  for (const step of STEPS) {
    runStep(step);
  }

  console.log('\nv3.8 full BSC runtime family rebuilt.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
