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
const DEFAULT_REBUILD_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'paired_current_2026_rebuild',
);

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

function copyFile(sourcePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);
}

function runNodeScript(scriptName, env = {}) {
  execFileSync('node', [path.join('scripts', scriptName)], {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...env,
    },
  });
}

function writeManifest(plan, runId) {
  const manifest = {
    runId,
    buildRoot: plan.buildRoot,
    mode: 'repo-contract-stage-tree-bootstrap',
    notes: [
      'This is the first safe staged rebuild layer for this checkout.',
      'It snapshots current public runtime products into a staged internal tree.',
      'It does not yet replace the full paired canonical board rebuild pipeline.',
    ],
    promotionTargets: {
      currentBoards: 'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
      y2026Boards: 'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
      jmcBoards: 'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson',
      coa3aBoards: 'public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson',
      coa3bBoards: 'public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson',
      jmcOutline: 'public/data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson',
      coa3aOutline: 'public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson',
      coa3bOutline: 'public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson',
      currentSelectedOutline: 'public/data/regions/UK_Legacy_Region_Outlines_Codex_v02_clean.geojson',
      internalBorders: 'public/data/basemaps/uk_internal_borders.geojson',
      land10mPlaceholder: 'public/data/basemaps/ne_10m_land.geojson',
      ocean10mPlaceholder: 'public/data/basemaps/ne_10m_ocean.geojson',
      facilities: 'public/data/facilities/facilities.geojson',
    },
  };

  fs.writeFileSync(plan.stage110.manifest, `${JSON.stringify(manifest, null, 2)}\n`);
}

function main() {
  const rebuildRoot = process.env.PAIRED_REBUILD_ROOT
    ? path.resolve(ROOT, process.env.PAIRED_REBUILD_ROOT)
    : DEFAULT_REBUILD_ROOT;
  const runId = getRunId();
  const plan = createRebuildFamilyStagePlan({ root: rebuildRoot, runId });
  ensureRebuildFamilyStagePlan(plan);

  copyFile(path.join(ROOT, 'src/lib/config/viewPresets.json'), plan.workspace.viewPresets);
  copyFile(path.join(ROOT, 'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson'), plan.workspace.regionsCurrentBoards);
  copyFile(path.join(ROOT, 'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson'), plan.workspace.regions2026Boards);
  copyFile(path.join(ROOT, 'public/data/regions/UK_Active_Components_Codex_v10_geojson.geojson'), plan.workspace.regionsActiveComponents);
  copyFile(path.join(ROOT, 'public/data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson'), plan.workspace.regionsInactiveComponents);
  copyFile(path.join(ROOT, 'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'), plan.workspace.regionsJmcBoards);
  copyFile(path.join(ROOT, 'public/data/regions/UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson'), plan.workspace.regionsJmcOutline);
  copyFile(path.join(ROOT, 'public/data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson'), plan.workspace.regionsCoa3aOutline);
  copyFile(path.join(ROOT, 'public/data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson'), plan.workspace.regionsCoa3bOutline);
  copyFile(path.join(ROOT, 'public/data/basemaps/uk_internal_borders.geojson'), plan.workspace.basemapInternalBorders);
  copyFile(path.join(ROOT, 'public/data/basemaps/ne_10m_land.geojson'), plan.workspace.basemapLand10m);
  copyFile(path.join(ROOT, 'public/data/basemaps/ne_10m_ocean.geojson'), plan.workspace.basemapOcean10m);
  copyFile(path.join(ROOT, 'public/data/facilities/facilities.geojson'), plan.workspace.facilities);

  runNodeScript('buildBoardFamiliesFromGpkg.mjs', {
    CURRENT_BOARDS_OUTPUT_PATH: plan.stage10.currentBoards,
    Y2026_BOARDS_OUTPUT_PATH: plan.stage10.y2026Boards,
  });
  copyFile(plan.stage10.currentBoards, plan.stage20.currentBoards);
  copyFile(plan.stage10.y2026Boards, plan.stage20.y2026Boards);
  copyFile(plan.stage20.currentBoards, plan.stage30.currentBoards);
  copyFile(plan.stage20.y2026Boards, plan.stage30.y2026Boards);

  runNodeScript('buildBoardTopologyProducts.mjs', {
    CURRENT_RUNTIME_BOARDS_PATH: plan.stage30.currentBoards,
    Y2026_RUNTIME_BOARDS_PATH: plan.stage30.y2026Boards,
    CURRENT_TOPOLOGY_OUTPUT_PATH: plan.stage50.currentTopologyEdges,
    Y2026_TOPOLOGY_OUTPUT_PATH: plan.stage50.y2026TopologyEdges,
  });
  copyFile(plan.workspace.basemapInternalBorders, plan.stage50.internalBorders);

  runNodeScript('buildJmcBoardAssignmentsFrom2026.mjs', {
    Y2026_BOARDS_PATH: plan.stage30.y2026Boards,
    JMC_OUTPUT_PATH: plan.stage60.jmcBoards,
  });

  runNodeScript('stampCoa3aBoardPopulation.mjs', {
    JMC_SOURCE_BOARDS_PATH: plan.stage60.jmcBoards,
    FACILITIES_SOURCE_PATH: plan.workspace.facilities,
  });

  runNodeScript('createCoa3aBoardAssignments.mjs', {
    JMC_SOURCE_BOARDS_PATH: plan.stage60.jmcBoards,
    COA3A_OUTPUT_BOARDS_PATH: plan.stage60.coa3aBoards,
    VIEW_PRESETS_PATH: plan.workspace.viewPresets,
  });

  runNodeScript('createCoa3bBoardAssignments.mjs', {
    JMC_SOURCE_BOARDS_PATH: plan.stage60.jmcBoards,
    COA3B_OUTPUT_BOARDS_PATH: plan.stage60.coa3bBoards,
    VIEW_PRESETS_PATH: plan.workspace.viewPresets,
  });

  runNodeScript('buildCurrentComponentLookupsFromGpkg.mjs', {
    CURRENT_ACTIVE_COMPONENTS_OUTPUT_PATH: plan.workspace.regionsActiveComponents,
    CURRENT_INACTIVE_COMPONENTS_OUTPUT_PATH: plan.workspace.regionsInactiveComponents,
  });

  runNodeScript('buildLegacyRegionOutlines.mjs', {
    LEGACY_REGION_OUTLINE_INPUT_PATHS: [
      plan.workspace.regionsActiveComponents,
      plan.workspace.regionsInactiveComponents,
    ].join(path.delimiter),
    LEGACY_REGION_OUTLINE_OUTPUT_PATH: path.join(
      plan.workspace.regionsDir,
      'UK_Legacy_Region_Outlines_Codex_v01.geojson',
    ),
    LEGACY_REGION_OUTLINE_CLEAN_OUTPUT_PATH: plan.workspace.regionsLegacyOutline,
  });

  runNodeScript('buildScenarioVisibleOutlines.mjs', {
    SCENARIO_BOARD_ASSIGNMENTS_PATH: plan.stage60.jmcBoards,
    SCENARIO_PRESET_ID: 'coa3a',
    VIEW_PRESETS_PATH: plan.workspace.viewPresets,
    SCENARIO_VISIBLE_OUTLINE_OUTPUT_PATH: plan.stage70.jmcOutline,
  });
  runNodeScript('buildScenarioVisibleOutlines.mjs', {
    SCENARIO_BOARD_ASSIGNMENTS_PATH: plan.stage60.coa3aBoards,
    SCENARIO_PRESET_ID: 'coa3b',
    VIEW_PRESETS_PATH: plan.workspace.viewPresets,
    SCENARIO_VISIBLE_OUTLINE_OUTPUT_PATH: plan.stage70.coa3aOutline,
  });
  runNodeScript('buildScenarioVisibleOutlines.mjs', {
    SCENARIO_BOARD_ASSIGNMENTS_PATH: plan.stage60.coa3bBoards,
    SCENARIO_PRESET_ID: 'coa3c',
    VIEW_PRESETS_PATH: plan.workspace.viewPresets,
    SCENARIO_VISIBLE_OUTLINE_OUTPUT_PATH: plan.stage70.coa3bOutline,
  });
  copyFile(plan.workspace.regionsLegacyOutline, plan.stage40.legacySelectedOutline);
  copyFile(plan.workspace.regionsActiveComponents, plan.stage80.currentActiveComponents);
  copyFile(plan.workspace.regionsInactiveComponents, plan.stage80.currentInactiveComponents);
  runNodeScript('buildSelectedOutlineLookups.mjs', {
    SELECTED_OUTLINE_SOURCE_PATH: plan.stage40.legacySelectedOutline,
    SELECTED_OUTLINE_OUTPUT_PATH: plan.stage80.currentSelectedOutline,
  });
  runNodeScript('buildSelectedOutlineLookups.mjs', {
    SELECTED_OUTLINE_SOURCE_PATH: plan.stage70.jmcOutline,
    SELECTED_OUTLINE_OUTPUT_PATH: plan.stage80.jmcLookup,
  });
  runNodeScript('buildSelectedOutlineLookups.mjs', {
    SELECTED_OUTLINE_SOURCE_PATH: plan.stage70.coa3aOutline,
    SELECTED_OUTLINE_OUTPUT_PATH: plan.stage80.coa3aLookup,
  });
  runNodeScript('buildSelectedOutlineLookups.mjs', {
    SELECTED_OUTLINE_SOURCE_PATH: plan.stage70.coa3bOutline,
    SELECTED_OUTLINE_OUTPUT_PATH: plan.stage80.coa3bLookup,
  });
  runNodeScript('buildBoardMaskProducts.mjs', {
    CURRENT_RUNTIME_BOARDS_PATH: plan.stage30.currentBoards,
    Y2026_RUNTIME_BOARDS_PATH: plan.stage30.y2026Boards,
    CURRENT_LANDMASK_OUTPUT_PATH: plan.stage90.currentLandmask,
    Y2026_LANDMASK_OUTPUT_PATH: plan.stage90.y2026Landmask,
  });
  copyFile(plan.workspace.basemapLand10m, plan.stage90.land10m);
  copyFile(plan.workspace.basemapOcean10m, plan.stage90.ocean10m);
  copyFile(plan.workspace.facilities, plan.stage100.facilities);

  writeManifest(plan, runId);
  runNodeScript('validatePairedCurrent2026StageTree.mjs', {
    PAIRED_REBUILD_ROOT: rebuildRoot,
    PAIRED_REBUILD_RUN_ID: runId,
  });
}

main();
