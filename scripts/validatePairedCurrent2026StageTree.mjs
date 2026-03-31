import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRebuildFamilyStagePlan } from './rebuildFamilyStagePlan.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_REBUILD_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'paired_current_2026_rebuild',
);

export function getPairedStageTreeValidationTargets(plan) {
  return [
    ['stage10.currentBoards', plan.stage10.currentBoards, 'final'],
    ['stage10.y2026Boards', plan.stage10.y2026Boards, 'final'],
    ['stage20.currentBoards', plan.stage20.currentBoards, 'final'],
    ['stage20.y2026Boards', plan.stage20.y2026Boards, 'final'],
    ['stage30.currentBoards', plan.stage30.currentBoards, 'promotable'],
    ['stage30.y2026Boards', plan.stage30.y2026Boards, 'promotable'],
    ['stage40.legacySelectedOutline', plan.stage40.legacySelectedOutline, 'final'],
    ['stage50.currentTopologyEdges', plan.stage50.currentTopologyEdges, 'internal_only'],
    ['stage50.y2026TopologyEdges', plan.stage50.y2026TopologyEdges, 'internal_only'],
    ['stage50.internalBorders', plan.stage50.internalBorders, 'promotable'],
    ['stage60.jmcBoards', plan.stage60.jmcBoards, 'promotable'],
    ['stage60.coa3aBoards', plan.stage60.coa3aBoards, 'promotable'],
    ['stage60.coa3bBoards', plan.stage60.coa3bBoards, 'promotable'],
    ['stage70.jmcOutline', plan.stage70.jmcOutline, 'promotable'],
    ['stage70.coa3aOutline', plan.stage70.coa3aOutline, 'promotable'],
    ['stage70.coa3bOutline', plan.stage70.coa3bOutline, 'promotable'],
    ['stage80.currentActiveComponents', plan.stage80.currentActiveComponents, 'promotable'],
    ['stage80.currentInactiveComponents', plan.stage80.currentInactiveComponents, 'promotable'],
    ['stage80.currentSelectedOutline', plan.stage80.currentSelectedOutline, 'promotable'],
    ['stage80.jmcLookup', plan.stage80.jmcLookup, 'internal_only'],
    ['stage80.coa3aLookup', plan.stage80.coa3aLookup, 'internal_only'],
    ['stage80.coa3bLookup', plan.stage80.coa3bLookup, 'internal_only'],
    ['stage90.currentLandmask', plan.stage90.currentLandmask, 'internal_only'],
    ['stage90.y2026Landmask', plan.stage90.y2026Landmask, 'internal_only'],
    ['stage90.land10m', plan.stage90.land10m, 'placeholder'],
    ['stage90.ocean10m', plan.stage90.ocean10m, 'placeholder'],
    ['stage100.facilities', plan.stage100.facilities, 'promotable'],
    ['stage110.manifest', plan.stage110.manifest, 'internal_only'],
  ];
}

export function summarizeGeoJsonFile(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return {
      exists: false,
      validJson: false,
      validFeatureCollection: false,
      featureCount: 0,
    };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const features = Array.isArray(parsed.features) ? parsed.features : [];
    return {
      exists: true,
      validJson: true,
      validFeatureCollection: parsed.type === 'FeatureCollection',
      featureCount: features.length,
    };
  } catch {
    return {
      exists: true,
      validJson: false,
      validFeatureCollection: false,
      featureCount: 0,
    };
  }
}

function countPlaceholderChecks(checks) {
  return checks.filter((entry) => entry.promotionClass === 'placeholder').length;
}

export function buildPairedStageTreeValidationReport(plan) {
  const checks = getPairedStageTreeValidationTargets(plan).map(([label, targetPath, promotionClass]) => {
    const summary = summarizeGeoJsonFile(targetPath);
    return {
      label,
      path: targetPath,
      promotionClass,
      ...summary,
    };
  });

  return {
    buildRoot: plan.buildRoot,
    checkedAt: new Date().toISOString(),
    totalChecks: checks.length,
    placeholderChecks: countPlaceholderChecks(checks),
    missingChecks: checks.filter((entry) => !entry.exists).length,
    invalidJsonChecks: checks.filter((entry) => entry.exists && !entry.validJson).length,
    invalidFeatureCollectionChecks: checks.filter(
      (entry) =>
        entry.exists &&
        entry.validJson &&
        !entry.validFeatureCollection &&
        !entry.label.endsWith('.manifest'),
    ).length,
    checks,
  };
}

export function writePairedStageTreeValidationReport(plan) {
  const report = buildPairedStageTreeValidationReport(plan);
  fs.writeFileSync(plan.stage110.validationReport, `${JSON.stringify(report, null, 2)}\n`);
  return report;
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
  writePairedStageTreeValidationReport(plan);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
