import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRebuildFamilyStagePlan } from './rebuildFamilyStagePlan.mjs';
import { getPairedStageTreeValidationTargets } from './validatePairedCurrent2026StageTree.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_REBUILD_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'paired_current_2026_rebuild',
);

export function getPairedStageTreePromotionTargets(plan) {
  return [
    {
      sourcePath: plan.stage30.currentBoards,
      targetPath: path.join(ROOT, 'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage30.y2026Boards,
      targetPath: path.join(ROOT, 'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage50.internalBorders,
      targetPath: path.join(ROOT, 'public/data/basemaps/uk_internal_borders.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage60.jmcBoards,
      targetPath: path.join(ROOT, 'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage60.coa3aBoards,
      targetPath: path.join(ROOT, 'public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage60.coa3bBoards,
      targetPath: path.join(ROOT, 'public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage70.jmcOutline,
      targetPath: path.join(ROOT, 'public/data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage70.coa3aOutline,
      targetPath: path.join(ROOT, 'public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage70.coa3bOutline,
      targetPath: path.join(ROOT, 'public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage80.currentActiveComponents,
      targetPath: path.join(ROOT, 'public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage80.currentInactiveComponents,
      targetPath: path.join(ROOT, 'public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage80.currentSelectedOutline,
      targetPath: path.join(ROOT, 'public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson'),
      promotionClass: 'promotable',
    },
    {
      sourcePath: plan.stage90.land10m,
      targetPath: path.join(ROOT, 'public/data/basemaps/ne_10m_land.geojson'),
      promotionClass: 'placeholder',
    },
    {
      sourcePath: plan.stage90.ocean10m,
      targetPath: path.join(ROOT, 'public/data/basemaps/ne_10m_ocean.geojson'),
      promotionClass: 'placeholder',
    },
    {
      sourcePath: plan.stage100.facilities,
      targetPath: path.join(ROOT, 'public/data/facilities/facilities.geojson'),
      promotionClass: 'promotable',
    },
  ];
}

export function isPromotionSafe(report) {
  return (
    Number(report?.missingChecks ?? 1) === 0 &&
    Number(report?.invalidJsonChecks ?? 1) === 0 &&
    Number(report?.invalidFeatureCollectionChecks ?? 1) === 0
  );
}

function readValidationReport(plan) {
  return JSON.parse(fs.readFileSync(plan.stage110.validationReport, 'utf8'));
}

function buildValidationIndex(plan) {
  return new Map(
    getPairedStageTreeValidationTargets(plan).map(([label, sourcePath, promotionClass]) => [
      sourcePath,
      { label, promotionClass },
    ]),
  );
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function getRunId() {
  const override = String(process.env.PAIRED_REBUILD_RUN_ID ?? '').trim();
  if (override) {
    return override;
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function main() {
  const rebuildRoot = process.env.PAIRED_REBUILD_ROOT
    ? path.resolve(ROOT, process.env.PAIRED_REBUILD_ROOT)
    : DEFAULT_REBUILD_ROOT;
  const plan = createRebuildFamilyStagePlan({
    root: rebuildRoot,
    runId: getRunId(),
  });

  if (!fs.existsSync(plan.stage110.validationReport)) {
    throw new Error(`Missing validation report: ${plan.stage110.validationReport}`);
  }

  const report = readValidationReport(plan);
  if (!isPromotionSafe(report)) {
    throw new Error('Promotion blocked: staged validation report is not clean.');
  }

  const apply = process.argv.includes('--apply');
  const includePlaceholders = process.argv.includes('--include-placeholders');
  const validationIndex = buildValidationIndex(plan);
  const targets = getPairedStageTreePromotionTargets(plan).map((entry) => ({
    ...entry,
    label: validationIndex.get(entry.sourcePath)?.label ?? entry.sourcePath,
  }));

  const blockedTargets = targets.filter(
    (entry) => entry.promotionClass === 'placeholder',
  );
  const effectiveTargets = includePlaceholders
    ? targets
    : targets.filter((entry) => entry.promotionClass !== 'placeholder');

  if (!apply) {
    process.stdout.write(
      `${JSON.stringify(
        {
          mode: 'dry-run',
          includePlaceholders,
          blockedTargets: includePlaceholders ? [] : blockedTargets,
          targets: effectiveTargets,
        },
        null,
        2,
      )}\n`,
    );
    return;
  }

  if (blockedTargets.length > 0 && !includePlaceholders) {
    throw new Error(
      'Promotion blocked: placeholder topology/mask products are present. Re-run with --include-placeholders only if you explicitly want placeholder promotion.',
    );
  }

  for (const { sourcePath, targetPath } of effectiveTargets) {
    copyFile(sourcePath, targetPath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
