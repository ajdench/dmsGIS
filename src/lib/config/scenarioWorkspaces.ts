import type { ScenarioWorkspaceId } from '../../types';
import { getPresetBoundarySystemId } from './boundarySystems';
import {
  getPresetLabel,
  getScenarioBoundaryLookupPresets,
  getScenarioPresetConfig,
  type ScenarioPresetConfig,
} from './viewPresets';
import {
  parseScenarioWorkspaceBaseline,
  parseScenarioWorkspaceDraft,
  type ScenarioWorkspaceBaseline,
  type ScenarioWorkspaceDraft,
} from '../schemas/scenarioWorkspaces';

export const DPHC_ESTIMATE_COA_PLAYGROUND_ID = 'dphcEstimateCoaPlayground';

const scenarioPresetIds = getScenarioBoundaryLookupPresets().filter(
  (preset): preset is Exclude<ScenarioWorkspaceId, 'dphcEstimateCoaPlayground'> =>
    preset !== 'current',
);

export const SCENARIO_WORKSPACE_BASELINES: ScenarioWorkspaceBaseline[] = [
  ...scenarioPresetIds.map((preset) =>
    createScenarioWorkspaceBaselineFromPreset(
      preset,
      getScenarioPresetConfig(preset)!,
    ),
  ),
  parseScenarioWorkspaceBaseline({
    id: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
    label: 'DPHC Estimate COA Playground',
    sourcePresetId: 'coa3c',
    boundarySystemId: 'icbHb2026',
    assignmentSource: {
      kind: 'interactive-runtime',
      path: null,
    },
    derivedOutlineSource: {
      kind: 'derived-dataset',
      path: null,
    },
    lookupBoundaryPath: null,
    regions: createScenarioWorkspaceBaselineFromPreset(
      'coa3c',
      getScenarioPresetConfig('coa3c')!,
    ).regions,
    boundaryNameRegionOverrides: {},
  }),
];

export function getScenarioWorkspaceBaseline(
  workspaceId: ScenarioWorkspaceId,
): ScenarioWorkspaceBaseline | null {
  return (
    SCENARIO_WORKSPACE_BASELINES.find((workspace) => workspace.id === workspaceId) ??
    null
  );
}

export function createScenarioWorkspaceDraft(
  workspaceId: ScenarioWorkspaceId,
): ScenarioWorkspaceDraft {
  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  if (!baseline) {
    throw new Error(`Unknown scenario workspace: ${workspaceId}`);
  }

  return parseScenarioWorkspaceDraft({
    schemaVersion: 1,
    id: baseline.id,
    label: baseline.label,
    boundarySystemId: baseline.boundarySystemId,
    baseWorkspaceId: baseline.id,
    assignments: [],
  });
}

function createScenarioWorkspaceBaselineFromPreset(
  presetId: Exclude<ScenarioWorkspaceId, 'dphcEstimateCoaPlayground'>,
  config: ScenarioPresetConfig,
): ScenarioWorkspaceBaseline {
  const regionIdByName = new Map<string, string>();
  const regions = config.regionGroups.map((regionGroup, index) => {
    const assignmentCode =
      config.assignment?.codeOverrides[regionGroup.name] ??
      createFallbackAssignmentCode(regionGroup.name);
    const regionId = assignmentCode.toLowerCase();
    regionIdByName.set(regionGroup.name, regionId);

    return {
      id: regionId,
      label: regionGroup.name,
      assignmentCode,
      sourceRegionNames: [...regionGroup.sourceRegions],
      palette: { ...regionGroup.colors },
      order: index,
    };
  });

  return parseScenarioWorkspaceBaseline({
    id: presetId,
    label: getPresetLabel(presetId),
    sourcePresetId: presetId,
    boundarySystemId: getPresetBoundarySystemId(presetId),
    assignmentSource: {
      kind: 'static-dataset',
      path: config.boardLayer.path,
    },
    derivedOutlineSource: {
      kind: 'derived-dataset',
      path: config.outlineLayer.path,
    },
    lookupBoundaryPath: config.lookupBoundaryPath,
    regions,
    boundaryNameRegionOverrides: Object.fromEntries(
      Object.entries(config.boundaryOverrides).flatMap(([boundaryName, regionName]) => {
        const regionId = regionIdByName.get(regionName);
        return regionId ? [[boundaryName, regionId] as const] : [];
      }),
    ),
  });
}

function createFallbackAssignmentCode(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}
