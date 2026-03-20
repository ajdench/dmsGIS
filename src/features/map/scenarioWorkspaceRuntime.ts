import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import type { FeatureLike } from 'ol/Feature';
import type {
  ScenarioWorkspaceDraft,
} from '../../lib/schemas/scenarioWorkspaces';
import { getScenarioWorkspaceBaseline } from '../../lib/config/scenarioWorkspaces';
import { getScenarioBoundaryUnitId } from '../../lib/scenarioWorkspaceAssignments';
import type { ScenarioWorkspaceId } from '../../types';

export interface ScenarioWorkspaceRuntimeState {
  assignmentSource: VectorSource | null;
  assignmentByBoundaryName: Map<string, string>;
}

export function buildScenarioWorkspaceRuntimeState(
  workspaceId: ScenarioWorkspaceId,
  baselineAssignmentSource: VectorSource | null,
  draft: ScenarioWorkspaceDraft | null,
): ScenarioWorkspaceRuntimeState {
  if (!baselineAssignmentSource || !draft || draft.assignments.length === 0) {
    return {
      assignmentSource: null,
      assignmentByBoundaryName: new Map(),
    };
  }

  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  if (!baseline) {
    return {
      assignmentSource: null,
      assignmentByBoundaryName: new Map(),
    };
  }

  const regionLabelById = new Map(
    baseline.regions.map((region) => [region.id, region.label] as const),
  );
  const assignmentByBoundaryUnitId = new Map(
    draft.assignments.map((assignment) => [
      assignment.boundaryUnitId,
      assignment.scenarioRegionId,
    ] as const),
  );

  const features = baselineAssignmentSource.getFeatures().map((feature) => {
    const clone = feature.clone();
    const boundaryUnitId = getScenarioBoundaryUnitId(
      clone.getProperties() as Record<string, unknown>,
    );
    const scenarioRegionId = boundaryUnitId
      ? assignmentByBoundaryUnitId.get(boundaryUnitId)
      : null;
    if (!scenarioRegionId) {
      return clone;
    }

    const scenarioRegionLabel = regionLabelById.get(scenarioRegionId);
    if (!scenarioRegionLabel) {
      return clone;
    }

    clone.set('scenario_region_id', scenarioRegionId);
    clone.set('region_name', scenarioRegionLabel);
    clone.set('jmc_name', scenarioRegionLabel);
    return clone;
  });

  const assignmentSource = new VectorSource();
  assignmentSource.addFeatures(features);

  return {
    assignmentSource,
    assignmentByBoundaryName: buildBoundaryNameAssignmentMap(features),
  };
}

function buildBoundaryNameAssignmentMap(
  features: FeatureLike[],
): Map<string, string> {
  return new Map(
    features.flatMap((feature) => {
      const boundaryName = String(feature.get('boundary_name') ?? '').trim();
      const assignmentName = String(
        feature.get('region_name') ?? feature.get('jmc_name') ?? '',
      ).trim();
      if (!boundaryName || !assignmentName) {
        return [];
      }
      return [[boundaryName, assignmentName] as const];
    }),
  );
}
