import type { ScenarioWorkspaceId } from '../../types';
import { getPresetBoundarySystemId } from './boundarySystems';
import {
  getPresetLabel,
  getScenarioBoundaryLookupPresets,
  getScenarioPresetConfig,
  type ScenarioPresetConfig,
} from './viewPresets';
import { resolveRuntimeMapProductPath } from './runtimeMapProducts';
import {
  parseScenarioWorkspaceBaseline,
  parseScenarioWorkspaceDraft,
  type ScenarioWorkspaceBaseline,
  type ScenarioWorkspaceDraft,
} from '../schemas/scenarioWorkspaces';

export const DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID = 'dphcEstimateCoa3aPlayground';
export const DPHC_ESTIMATE_COA_PLAYGROUND_ID = 'dphcEstimateCoaPlayground';
type InteractiveScenarioWorkspaceId =
  | typeof DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID
  | typeof DPHC_ESTIMATE_COA_PLAYGROUND_ID;
type ScenarioPresetWorkspaceId = Exclude<ScenarioWorkspaceId, InteractiveScenarioWorkspaceId>;
const interactiveScenarioWorkspaceIds: InteractiveScenarioWorkspaceId[] = [
  DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
  DPHC_ESTIMATE_COA_PLAYGROUND_ID,
];

const scenarioPresetIds = getScenarioBoundaryLookupPresets().filter(
  (preset): preset is ScenarioPresetWorkspaceId =>
    preset !== 'current',
);

export const SCENARIO_WORKSPACE_BASELINES: ScenarioWorkspaceBaseline[] = [
  ...scenarioPresetIds.map((preset) =>
    createScenarioWorkspaceBaselineFromPreset(
      preset,
      getScenarioPresetConfig(preset)!,
    ),
  ),
  createInteractivePlaygroundBaseline(
    DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
    'DPHC Estimate COA Playground (COA 3a)',
    'coa3b',
  ),
  createInteractivePlaygroundBaseline(
    DPHC_ESTIMATE_COA_PLAYGROUND_ID,
    'DPHC Estimate COA Playground (COA 3b)',
    'coa3c',
  ),
];

export function getScenarioWorkspacePresetIds(): ScenarioPresetWorkspaceId[] {
  return scenarioPresetIds;
}

export function getInteractiveScenarioWorkspaceIds(): InteractiveScenarioWorkspaceId[] {
  return [...interactiveScenarioWorkspaceIds];
}

export function getScenarioWorkspaceBaseline(
  workspaceId: ScenarioWorkspaceId,
): ScenarioWorkspaceBaseline | null {
  return (
    SCENARIO_WORKSPACE_BASELINES.find((workspace) => workspace.id === workspaceId) ??
    null
  );
}

export function getScenarioWorkspaceLookupBoundaryPath(
  workspaceId: ScenarioWorkspaceId,
): string | null {
  return getScenarioWorkspaceBaseline(workspaceId)?.lookupBoundaryPath ?? null;
}

export function getScenarioWorkspaceSourcePresetId(
  workspaceId: ScenarioWorkspaceId,
): ScenarioPresetWorkspaceId | null {
  const sourcePresetId = getScenarioWorkspaceBaseline(workspaceId)?.sourcePresetId ?? null;
  if (!sourcePresetId || sourcePresetId === 'current') {
    return null;
  }
  return sourcePresetId as ScenarioPresetWorkspaceId;
}

export function isScenarioWorkspaceCompatibleWithPreset(
  workspaceId: ScenarioWorkspaceId | null,
  presetId: string,
): boolean {
  if (!workspaceId) {
    return false;
  }
  return getScenarioWorkspaceSourcePresetId(workspaceId) === presetId;
}

export function getScenarioWorkspaceAssignmentDatasetPath(
  workspaceId: ScenarioWorkspaceId,
): string | null {
  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  const source = baseline?.assignmentSource;
  if (source?.kind === 'static-dataset') {
    return source.path;
  }

  const sourcePresetId = baseline?.sourcePresetId;
  if (!sourcePresetId || sourcePresetId === 'current') {
    return null;
  }

  const boardPath = getScenarioPresetConfig(sourcePresetId)?.boardLayer.path ?? null;
  return boardPath ? resolveRuntimeMapProductPath(boardPath) : null;
}

export function getScenarioWorkspaceIdForPreset(
  presetId: string,
): ScenarioWorkspaceId | null {
  if (scenarioPresetIds.includes(presetId as ScenarioPresetWorkspaceId)) {
    return presetId as ScenarioPresetWorkspaceId;
  }
  return null;
}

export function getScenarioWorkspaceRegionIds(
  workspaceId: ScenarioWorkspaceId,
): string[] {
  return getScenarioWorkspaceBaseline(workspaceId)?.regions.map((region) => region.id) ?? [];
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
  presetId: ScenarioPresetWorkspaceId,
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
      // sourceRegionNames is legacy; assignments now derive from codeGroupings at runtime.
      sourceRegionNames: [],
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
      path: resolveRuntimeMapProductPath(config.boardLayer.path),
    },
    derivedOutlineSource: {
      kind: 'derived-dataset',
      path: resolveRuntimeMapProductPath(config.outlineLayer.path),
    },
    lookupBoundaryPath: resolveRuntimeMapProductPath(config.lookupBoundaryPath),
    regions,
    // boundaryNameRegionOverrides is legacy; overrides are absorbed into codeGroupings.
    boundaryNameRegionOverrides: {},
  });
}

function createInteractivePlaygroundBaseline(
  workspaceId: InteractiveScenarioWorkspaceId,
  label: string,
  sourcePresetId: ScenarioPresetWorkspaceId,
): ScenarioWorkspaceBaseline {
  return parseScenarioWorkspaceBaseline({
    id: workspaceId,
    label,
    sourcePresetId,
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
      sourcePresetId,
      getScenarioPresetConfig(sourcePresetId)!,
    ).regions,
    boundaryNameRegionOverrides: {},
  });
}

export function isDphcEstimateCoaPlaygroundWorkspaceId(
  workspaceId: ScenarioWorkspaceId | null,
): workspaceId is InteractiveScenarioWorkspaceId {
  if (!workspaceId) {
    return false;
  }

  return interactiveScenarioWorkspaceIds.includes(workspaceId as InteractiveScenarioWorkspaceId);
}

function createFallbackAssignmentCode(label: string): string {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}
