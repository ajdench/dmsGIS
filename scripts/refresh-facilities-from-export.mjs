import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  formatFacilityRefreshSummary,
  loadFacilitiesGeoJson,
  summarizeFacilityRefreshFeatures,
} from './facility-refresh-validation.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_INPUT = path.join(ROOT, 'Export_30_Mar_26.csv');
const CANONICAL_FACILITIES_PATH = path.join(
  ROOT,
  'public',
  'data',
  'facilities',
  'facilities.geojson',
);
const ACCEPTED_RUNTIME_FACILITIES_PATH = path.join(
  ROOT,
  'public',
  'data',
  'compare',
  'shared-foundation-review',
  'facilities',
  'facilities.geojson',
);

function parseArgs(argv) {
  const options = {
    inputPath: DEFAULT_INPUT,
    rebuildAcceptedRuntime: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--input') {
      options.inputPath = path.resolve(ROOT, argv[index + 1] ?? DEFAULT_INPUT);
      index += 1;
      continue;
    }
    if (arg === '--skip-accepted-runtime-rebuild') {
      options.rebuildAcceptedRuntime = false;
      continue;
    }
  }

  return options;
}

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
  const options = parseArgs(process.argv.slice(2));

  console.log('=== refresh-facilities-from-export ===');
  console.log(`Canonical CSV input: ${path.relative(ROOT, options.inputPath)}`);

  run('node', ['scripts/import-facilities-csv.mjs', options.inputPath]);
  run('node', ['scripts/enrich-facilities.mjs']);

  if (options.rebuildAcceptedRuntime) {
    run('node', ['scripts/build-shared-foundation-review-family.mjs']);
  }

  const canonicalSummary = summarizeFacilityRefreshFeatures(
    loadFacilitiesGeoJson(CANONICAL_FACILITIES_PATH).features,
  );
  console.log(`\n${formatFacilityRefreshSummary(canonicalSummary, 'Canonical facilities')}`);

  if (options.rebuildAcceptedRuntime) {
    const runtimeSummary = summarizeFacilityRefreshFeatures(
      loadFacilitiesGeoJson(ACCEPTED_RUNTIME_FACILITIES_PATH).features,
    );
    console.log(
      `\n${formatFacilityRefreshSummary(runtimeSummary, 'Accepted runtime facilities')}`,
    );
  }

  console.log('\nFacilities refresh complete.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
