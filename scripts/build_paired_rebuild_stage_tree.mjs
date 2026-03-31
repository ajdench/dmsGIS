import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  createRebuildFamilyStagePlan,
  ensureRebuildFamilyStagePlan,
} from './rebuildFamilyStagePlan.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const GEO_PYTHON = path.join(ROOT, 'geopackages', 'ICB 2026', '.venv', 'bin', 'python');

const DEFAULT_REBUILD_ROOT = path.join(ROOT, 'geopackages', 'outputs', 'rebuild_family');
const DEFAULT_CURRENT_EXACT_GEOJSON = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'full_uk_current_boards',
  'UK_ICB_LHB_Boundaries_Canonical_Current_exact.geojson',
);
const DEFAULT_CURRENT_EXACT_GPKG = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'full_uk_current_boards',
  'UK_ICB_LHB_Boundaries_Canonical_Current_exact.gpkg',
);
const DEFAULT_2026_EXACT_GEOJSON = path.join(
  ROOT,
  'geopackages',
  'ICB 2026',
  'outputs',
  'full_uk_2026_boards',
  'UK_Health_Board_Boundaries_Codex_2026_exact_geojson.geojson',
);
const DEFAULT_2026_EXACT_GPKG = path.join(
  ROOT,
  'geopackages',
  'ICB 2026',
  'outputs',
  'full_uk_2026_boards',
  'UK_Health_Board_Boundaries_Codex_2026_exact_gpkg.gpkg',
);
const DEFAULT_FACILITIES = path.join(
  ROOT,
  'public',
  'data',
  'facilities',
  'facilities.geojson',
);

function getRunId() {
  const override = String(process.env.REBUILD_FAMILY_RUN_ID ?? '').trim();
  if (override) {
    return override;
  }

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-paired-rebuild`;
}

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function snapshotStageOutput(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing staged source output: ${sourcePath}`);
  }
  copyFile(sourcePath, targetPath);
}

function runStep(command, args, env = {}) {
  const label = `${command} ${args.join(' ')}`;
  console.log(`\n=== ${label} ===`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

function writeManifest(plan, runId) {
  const manifestPath = path.join(plan.buildRoot, 'build_manifest.json');
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        runId,
        buildRoot: plan.buildRoot,
        stages: {
          exactCanonical: plan.stage10.root,
          runtimeBoardFamily: plan.stage20.root,
          scenarioDerivations: plan.stage30.root,
          outlineArcs: plan.stage40.root,
          lookupPolygons: plan.stage50.root,
          masks: plan.stage60.root,
          topologyEdges: plan.stage70.root,
          facilitiesEnrichment: plan.stage80.root,
          validation: plan.stage90.root,
        },
      },
      null,
      2,
    ),
  );
}

function main() {
  const rebuildRoot = process.env.REBUILD_FAMILY_ROOT
    ? path.resolve(ROOT, process.env.REBUILD_FAMILY_ROOT)
    : DEFAULT_REBUILD_ROOT;
  const runId = getRunId();
  const plan = createRebuildFamilyStagePlan({
    root: rebuildRoot,
    runId,
  });
  ensureRebuildFamilyStagePlan(plan);
  writeManifest(plan, runId);

  copyFile(DEFAULT_CURRENT_EXACT_GEOJSON, plan.stage10.current.boardsGeoJson);
  copyFile(DEFAULT_CURRENT_EXACT_GPKG, plan.stage10.current.boardsGpkg);
  copyFile(DEFAULT_2026_EXACT_GEOJSON, plan.stage10.merged2026.boardsGeoJson);
  copyFile(DEFAULT_2026_EXACT_GPKG, plan.stage10.merged2026.boardsGpkg);
  copyFile(DEFAULT_FACILITIES, plan.workspace.facilitiesGeoJson);

  runStep(GEO_PYTHON, ['scripts/build_v38_bsc_source_family.py'], {
    CURRENT_SOURCE_OUTPUT_PATH: plan.stage20.source.currentGeoJson,
    Y2026_SOURCE_OUTPUT_PATH: plan.stage20.source.y2026GeoJson,
    BSC_SOURCE_SUMMARY_OUTPUT_PATH: plan.stage20.source.summary,
  });

  runStep('node', ['scripts/preprocess-boundaries.mjs'], {
    CURRENT_EXACT_PATH: plan.stage20.source.currentGeoJson,
    Y2026_EXACT_PATH: plan.stage20.source.y2026GeoJson,
    REGIONS_DIR: plan.workspace.regionsDir,
  });

  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'),
    plan.stage20.current.boardsGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.topo.json'),
    plan.stage20.current.boardsTopoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'),
    plan.stage20.merged2026.boardsGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_Health_Board_Boundaries_Codex_2026_simplified.topo.json'),
    plan.stage20.merged2026.boardsTopoJson,
  );

  runStep(GEO_PYTHON, ['scripts/report_paired_current_2026_alignment.py'], {
    CURRENT_SOURCE_OUTPUT_PATH: plan.stage20.source.currentGeoJson,
    Y2026_SOURCE_OUTPUT_PATH: plan.stage20.source.y2026GeoJson,
    CURRENT_RUNTIME_GEOJSON_PATH: path.join(
      plan.workspace.regionsDir,
      'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
    ),
    Y2026_RUNTIME_GEOJSON_PATH: path.join(
      plan.workspace.regionsDir,
      'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
    ),
    PAIRED_ALIGNMENT_REPORT_PATH: plan.stage90.pairedAlignmentReport,
  });

  runStep('node', ['scripts/extract-topology-edges.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
  });

  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_ICB_LHB_v10_topology_edges.geojson'),
    plan.stage70.currentEdges,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_Health_Board_2026_topology_edges.geojson'),
    plan.stage70.y2026Edges,
  );

  runStep('node', ['scripts/derive-boundary-presets.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
  });

  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_JMC_Board_simplified.geojson'),
    plan.stage30.coa3aBoardGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3A_Board_simplified.geojson'),
    plan.stage30.coa3bBoardGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3B_Board_simplified.geojson'),
    plan.stage30.coa3cBoardGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_JMC_Outline_simplified.geojson'),
    plan.stage50.coa3aLookupGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3A_Outline_simplified.geojson'),
    plan.stage50.coa3bLookupGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3B_Outline_simplified.geojson'),
    plan.stage50.coa3cLookupGeoJson,
  );

  runStep('node', ['scripts/create-ward-split.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
    CURRENT_EXACT_GPKG_PATH: plan.stage10.current.boardsGpkg,
    WARD_SPLIT_EXACT_GPKG_PATH: plan.stage10.current.wardSplitGpkg,
    WARD_SPLIT_EXACT_GEOJSON_PATH: plan.stage10.current.wardSplitGeoJson,
    WARD_SPLIT_RUNTIME_GPKG_PATH: plan.stage20.current.wardSplitDissolvedGpkg,
    WARD_SPLIT_RUNTIME_GEOJSON_PATH: plan.stage20.current.wardSplitDissolvedGeoJson,
    WARD_SPLIT_RUNTIME_PUBLIC_GEOJSON_PATH: plan.stage20.current.wardSplitRuntimeGeoJson,
    WARD_SPLIT_INTERNAL_ARCS_GEOJSON_PATH: plan.stage20.current.wardSplitInternalArcsGeoJson,
  });

  snapshotStageOutput(
    plan.stage20.current.wardSplitRuntimeGeoJson,
    path.join(plan.workspace.regionsDir, 'UK_WardSplit_simplified.geojson'),
  );
  snapshotStageOutput(
    plan.stage20.current.wardSplitInternalArcsGeoJson,
    path.join(plan.workspace.regionsDir, 'UK_WardSplit_internal_arcs.geojson'),
  );

  runStep('node', ['scripts/extract-group-outlines.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
  });

  runStep(GEO_PYTHON, ['scripts/build_group_inland_outline_modifiers.py'], {
    REGIONS_DIR: plan.workspace.regionsDir,
  });

  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_JMC_Outline_arcs.geojson'),
    plan.stage40.coa3aOutlineArcsGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3A_Outline_arcs.geojson'),
    plan.stage40.coa3bOutlineArcsGeoJson,
  );
  snapshotStageOutput(
    path.join(plan.workspace.regionsDir, 'UK_COA3B_Outline_arcs.geojson'),
    plan.stage40.coa3cOutlineArcsGeoJson,
  );
  fs.rmSync(plan.stage40.outlinesDir, { recursive: true, force: true });
  fs.cpSync(path.join(plan.workspace.regionsDir, 'outlines'), plan.stage40.outlinesDir, {
    recursive: true,
  });

  runStep('node', ['scripts/build-uk-basemap-alignment.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
    BASEMAPS_DIR: plan.workspace.basemapsDir,
  });

  snapshotStageOutput(
    path.join(plan.workspace.basemapsDir, 'uk_landmask_current_v01.geojson'),
    plan.stage60.currentLandmask,
  );
  snapshotStageOutput(
    path.join(plan.workspace.basemapsDir, 'uk_seapatch_current_v01.geojson'),
    plan.stage60.currentSeapatch,
  );
  snapshotStageOutput(
    path.join(plan.workspace.basemapsDir, 'uk_landmask_2026_v01.geojson'),
    plan.stage60.y2026Landmask,
  );
  snapshotStageOutput(
    path.join(plan.workspace.basemapsDir, 'uk_seapatch_2026_v01.geojson'),
    plan.stage60.y2026Seapatch,
  );

  runStep('node', ['scripts/enrich-facilities.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
    FACILITIES_GEOJSON_PATH: plan.workspace.facilitiesGeoJson,
  });

  snapshotStageOutput(plan.workspace.facilitiesGeoJson, plan.stage80.facilitiesGeoJson);

  runStep('node', ['scripts/validate-runtime-geometry-family.mjs'], {
    REGIONS_DIR: plan.workspace.regionsDir,
    BASEMAPS_DIR: plan.workspace.basemapsDir,
    FACILITIES_GEOJSON_PATH: plan.workspace.facilitiesGeoJson,
    CURRENT_SOURCE_OUTPUT_PATH: plan.stage20.source.currentGeoJson,
    Y2026_SOURCE_OUTPUT_PATH: plan.stage20.source.y2026GeoJson,
    CURRENT_SPLIT_EXACT_PATH: plan.stage10.current.wardSplitGeoJson,
    CURRENT_SPLIT_DISSOLVED_PATH: plan.stage20.current.wardSplitDissolvedGeoJson,
  });

  console.log(`\nPaired rebuild stage tree written to ${plan.buildRoot}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
