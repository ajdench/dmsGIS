import type VectorSource from 'ol/source/Vector';
import { buildDerivedScenarioOutlineSource } from './derivedScenarioOutlineSource';
import {
  buildPlaygroundRuntimeDiagnosticsSnapshot,
  buildScenarioWorkspaceRuntimeState,
  resolveScenarioWorkspaceBaselineAssignmentSource,
  type PlaygroundRuntimeDiagnosticsSnapshot,
  type ScenarioWorkspaceRuntimeState,
} from './scenarioWorkspaceRuntime';
import type { ScenarioWorkspaceDraft } from '../../lib/schemas/scenarioWorkspaces';
import type { ScenarioWorkspaceId } from '../../types';

interface BuildPlaygroundRuntimeSessionParams {
  workspaceId: ScenarioWorkspaceId | null;
  runtimeActive: boolean;
  baselineAssignmentKind: string | null;
  preloadedAssignmentSource: VectorSource | null;
  liveAssignmentSource: VectorSource | null;
  liveAssignmentPath: string | null;
  currentBaselineAssignmentSource: VectorSource | null;
  draft: ScenarioWorkspaceDraft | null;
  topologyEdgeSource: VectorSource | null;
  presetGroupOutlineSource: VectorSource | null;
}

export interface PlaygroundRuntimeSession {
  baselineAssignmentSource: VectorSource | null;
  runtimeState: ScenarioWorkspaceRuntimeState;
  derivedOutlineAssignmentSource: VectorSource | null;
  derivedOutlineSource: VectorSource | null;
  runtimeSourceOverrides: Map<string, VectorSource>;
  diagnosticsSnapshot: PlaygroundRuntimeDiagnosticsSnapshot | null;
}

export function buildPlaygroundRuntimeSession(
  params: BuildPlaygroundRuntimeSessionParams,
): PlaygroundRuntimeSession {
  const {
    workspaceId,
    runtimeActive,
    baselineAssignmentKind,
    preloadedAssignmentSource,
    liveAssignmentSource,
    liveAssignmentPath,
    currentBaselineAssignmentSource,
    draft,
    topologyEdgeSource,
    presetGroupOutlineSource,
  } = params;

  const baselineAssignmentSource = resolveScenarioWorkspaceBaselineAssignmentSource({
    runtimeActive,
    baselineAssignmentKind,
    preloadedAssignmentSource,
    liveAssignmentSource,
    liveAssignmentPath,
    currentBaselineAssignmentSource,
  });

  const runtimeAssignmentBaselineSource =
    baselineAssignmentKind === 'interactive-runtime'
      ? baselineAssignmentSource
      : baselineAssignmentSource ?? liveAssignmentSource;

  const runtimeState =
    runtimeActive && workspaceId
      ? buildScenarioWorkspaceRuntimeState(
          workspaceId,
          runtimeAssignmentBaselineSource,
          draft,
          {
            includeBaselineWhenUnedited:
              baselineAssignmentKind === 'interactive-runtime',
          },
        )
      : {
          assignmentSource: null,
          assignmentByBoundaryName: new Map<string, string>(),
        };

  const derivedOutlineAssignmentSource =
    runtimeState.assignmentSource ?? (runtimeActive ? runtimeAssignmentBaselineSource : null);
  const derivedOutlineSource = buildDerivedScenarioOutlineSource(
    derivedOutlineAssignmentSource,
    topologyEdgeSource,
  );

  const runtimeSourceOverrides = new Map<string, VectorSource>();
  if (runtimeState.assignmentSource) {
    runtimeSourceOverrides.set('regionFill', runtimeState.assignmentSource);
  }
  if (derivedOutlineSource) {
    runtimeSourceOverrides.set('scenarioOutline', derivedOutlineSource);
  } else if (presetGroupOutlineSource) {
    runtimeSourceOverrides.set('scenarioOutline', presetGroupOutlineSource);
  }

  const diagnosticsSnapshot =
    runtimeActive && workspaceId && baselineAssignmentKind === 'interactive-runtime'
      ? buildPlaygroundRuntimeDiagnosticsSnapshot({
          workspaceId,
          baselineAssignmentKind,
          liveAssignmentPath,
          preloadedAssignmentSource,
          liveAssignmentSource,
          resolvedBaselineAssignmentSource: baselineAssignmentSource,
          runtimeAssignmentBaselineSource,
          runtimeAssignmentSource: runtimeState.assignmentSource,
          derivedOutlineAssignmentSource,
          topologyEdgeSource,
          derivedOutlineSource,
        })
      : null;

  return {
    baselineAssignmentSource,
    runtimeState,
    derivedOutlineAssignmentSource,
    derivedOutlineSource,
    runtimeSourceOverrides,
    diagnosticsSnapshot,
  };
}
