import fs from 'node:fs';
import path from 'node:path';

export function createRebuildFamilyStagePlan({
  root,
  runId,
}) {
  const buildRoot = path.resolve(root, runId);
  const workspace = path.join(buildRoot, 'workspace');

  return {
    buildRoot,
    stage10: {
      root: path.join(buildRoot, '10_exact_canonical'),
      currentBoards: path.join(buildRoot, '10_exact_canonical', 'current', 'uk_boards_current_exact_canonical.geojson'),
      y2026Boards: path.join(buildRoot, '10_exact_canonical', 'merged2026', 'uk_boards_2026_exact_canonical.geojson'),
    },
    stage20: {
      root: path.join(buildRoot, '20_paired_runtime_source'),
      currentBoards: path.join(buildRoot, '20_paired_runtime_source', 'current', 'uk_boards_current_runtime_source.geojson'),
      y2026Boards: path.join(buildRoot, '20_paired_runtime_source', 'merged2026', 'uk_boards_2026_runtime_source.geojson'),
    },
    stage30: {
      root: path.join(buildRoot, '30_shipped_runtime_boards'),
      currentBoards: path.join(buildRoot, '30_shipped_runtime_boards', 'current', 'uk_boards_current_runtime.geojson'),
      y2026Boards: path.join(buildRoot, '30_shipped_runtime_boards', 'merged2026', 'uk_boards_2026_runtime.geojson'),
    },
    stage40: {
      root: path.join(buildRoot, '40_current_split_products'),
      legacySelectedOutline: path.join(buildRoot, '40_current_split_products', 'current', 'uk_regions_current_selected_outline.geojson'),
    },
    stage50: {
      root: path.join(buildRoot, '50_topology_edges'),
      currentTopologyEdges: path.join(buildRoot, '50_topology_edges', 'current', 'uk_boards_current_topology_edges.geojson'),
      y2026TopologyEdges: path.join(buildRoot, '50_topology_edges', 'merged2026', 'uk_boards_2026_topology_edges.geojson'),
      internalBorders: path.join(buildRoot, '50_topology_edges', 'shared', 'uk_internal_borders.geojson'),
    },
    stage60: {
      root: path.join(buildRoot, '60_scenario_board_derivations'),
      jmcBoards: path.join(buildRoot, '60_scenario_board_derivations', 'jmc', 'uk_regions_jmc_runtime_from_2026.geojson'),
      coa3aBoards: path.join(buildRoot, '60_scenario_board_derivations', 'coa3a', 'uk_regions_coa3a_runtime_from_2026.geojson'),
      coa3bBoards: path.join(buildRoot, '60_scenario_board_derivations', 'coa3b', 'uk_regions_coa3b_runtime_from_2026.geojson'),
    },
    stage70: {
      root: path.join(buildRoot, '70_visible_outline_arcs'),
      jmcOutline: path.join(buildRoot, '70_visible_outline_arcs', 'jmc', 'uk_regions_jmc_visible_outline_arcs.geojson'),
      coa3aOutline: path.join(buildRoot, '70_visible_outline_arcs', 'coa3a', 'uk_regions_coa3a_visible_outline_arcs.geojson'),
      coa3bOutline: path.join(buildRoot, '70_visible_outline_arcs', 'coa3b', 'uk_regions_coa3b_visible_outline_arcs.geojson'),
    },
    stage80: {
      root: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines'),
      currentActiveComponents: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'current', 'uk_current_active_components_lookup.geojson'),
      currentInactiveComponents: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'current', 'uk_current_inactive_components_lookup.geojson'),
      currentSelectedOutline: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'current', 'uk_regions_current_selected_outline_lookup.geojson'),
      jmcLookup: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'jmc', 'uk_regions_jmc_selected_outline.geojson'),
      coa3aLookup: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'coa3a', 'uk_regions_coa3a_selected_outline.geojson'),
      coa3bLookup: path.join(buildRoot, '80_lookup_polygons_and_selected_outlines', 'coa3b', 'uk_regions_coa3b_selected_outline.geojson'),
    },
    stage90: {
      root: path.join(buildRoot, '90_masks_and_alignment'),
      currentLandmask: path.join(buildRoot, '90_masks_and_alignment', 'current', 'uk_landmask_current_runtime.geojson'),
      y2026Landmask: path.join(buildRoot, '90_masks_and_alignment', 'merged2026', 'uk_landmask_2026_runtime.geojson'),
      land10m: path.join(buildRoot, '90_masks_and_alignment', 'shared', 'uk_landmask_placeholder_10m.geojson'),
      ocean10m: path.join(buildRoot, '90_masks_and_alignment', 'shared', 'uk_seapatch_placeholder_10m.geojson'),
    },
    stage100: {
      root: path.join(buildRoot, '100_facilities_enrichment'),
      facilities: path.join(buildRoot, '100_facilities_enrichment', 'uk_facilities_enriched_current_2026.geojson'),
    },
    stage110: {
      root: path.join(buildRoot, '110_validation_and_promotion'),
      manifest: path.join(buildRoot, '110_validation_and_promotion', 'build_manifest.json'),
      validationReport: path.join(buildRoot, '110_validation_and_promotion', 'contract_validation_report.json'),
    },
    workspace: {
      root: workspace,
      regionsDir: path.join(workspace, 'public', 'data', 'regions'),
      basemapsDir: path.join(workspace, 'public', 'data', 'basemaps'),
      facilitiesDir: path.join(workspace, 'public', 'data', 'facilities'),
      regionsCurrentBoards: path.join(workspace, 'public', 'data', 'regions', 'UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson'),
      regions2026Boards: path.join(workspace, 'public', 'data', 'regions', 'UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson'),
      regionsActiveComponents: path.join(workspace, 'public', 'data', 'regions', 'UK_Active_Components_Codex_v10_geojson.geojson'),
      regionsInactiveComponents: path.join(workspace, 'public', 'data', 'regions', 'UK_Inactive_Remainder_Codex_v10_geojson.geojson'),
      regionsJmcBoards: path.join(workspace, 'public', 'data', 'regions', 'UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'),
      regionsCoa3aBoards: path.join(workspace, 'public', 'data', 'regions', 'UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson'),
      regionsCoa3bBoards: path.join(workspace, 'public', 'data', 'regions', 'UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson'),
      regionsJmcOutline: path.join(workspace, 'public', 'data', 'regions', 'UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson'),
      regionsCoa3aOutline: path.join(workspace, 'public', 'data', 'regions', 'UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson'),
      regionsCoa3bOutline: path.join(workspace, 'public', 'data', 'regions', 'UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson'),
      regionsLegacyOutline: path.join(workspace, 'public', 'data', 'regions', 'UK_Legacy_Region_Outlines_Codex_v02_clean.geojson'),
      basemapInternalBorders: path.join(workspace, 'public', 'data', 'basemaps', 'uk_internal_borders.geojson'),
      basemapLand10m: path.join(workspace, 'public', 'data', 'basemaps', 'ne_10m_land.geojson'),
      basemapOcean10m: path.join(workspace, 'public', 'data', 'basemaps', 'ne_10m_ocean.geojson'),
      facilities: path.join(workspace, 'public', 'data', 'facilities', 'facilities.geojson'),
      viewPresets: path.join(workspace, 'src', 'lib', 'config', 'viewPresets.json'),
    },
  };
}

export function ensureRebuildFamilyStagePlan(plan) {
  const dirs = [
    plan.stage10.root,
    path.dirname(plan.stage10.currentBoards),
    path.dirname(plan.stage10.y2026Boards),
    plan.stage20.root,
    path.dirname(plan.stage20.currentBoards),
    path.dirname(plan.stage20.y2026Boards),
    plan.stage30.root,
    path.dirname(plan.stage30.currentBoards),
    path.dirname(plan.stage30.y2026Boards),
    plan.stage40.root,
    path.dirname(plan.stage40.legacySelectedOutline),
    plan.stage50.root,
    path.dirname(plan.stage50.currentTopologyEdges),
    path.dirname(plan.stage50.y2026TopologyEdges),
    path.dirname(plan.stage50.internalBorders),
    plan.stage60.root,
    path.dirname(plan.stage60.jmcBoards),
    path.dirname(plan.stage60.coa3aBoards),
    path.dirname(plan.stage60.coa3bBoards),
    plan.stage70.root,
    path.dirname(plan.stage70.jmcOutline),
    path.dirname(plan.stage70.coa3aOutline),
    path.dirname(plan.stage70.coa3bOutline),
    plan.stage80.root,
    path.dirname(plan.stage80.currentActiveComponents),
    path.dirname(plan.stage80.currentInactiveComponents),
    path.dirname(plan.stage80.currentSelectedOutline),
    path.dirname(plan.stage80.jmcLookup),
    path.dirname(plan.stage80.coa3aLookup),
    path.dirname(plan.stage80.coa3bLookup),
    plan.stage90.root,
    path.dirname(plan.stage90.currentLandmask),
    path.dirname(plan.stage90.y2026Landmask),
    path.dirname(plan.stage90.land10m),
    path.dirname(plan.stage90.ocean10m),
    plan.stage100.root,
    plan.stage110.root,
    plan.workspace.regionsDir,
    plan.workspace.basemapsDir,
    plan.workspace.facilitiesDir,
    path.dirname(plan.workspace.viewPresets),
  ];

  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
