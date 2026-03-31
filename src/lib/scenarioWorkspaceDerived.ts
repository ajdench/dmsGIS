import {
  parseDerivedScenarioWorkspace,
  type DerivedScenarioWorkspace,
  type ScenarioWorkspaceDraft,
} from './schemas/scenarioWorkspaces';
import { getScenarioWorkspaceBaseline } from './config/scenarioWorkspaces';

export function deriveScenarioWorkspaceFromDraft(
  draft: ScenarioWorkspaceDraft,
): DerivedScenarioWorkspace | null {
  const baseline = getScenarioWorkspaceBaseline(draft.id);
  if (!baseline) {
    return null;
  }

  const assignmentLookup = Object.fromEntries(
    draft.assignments.map((assignment) => [
      assignment.boundaryUnitId,
      assignment.scenarioRegionId,
    ]),
  );

  return parseDerivedScenarioWorkspace({
    workspaceId: draft.id,
    boundarySystemId: draft.boundarySystemId,
    totalAssignedBoundaryUnits: draft.assignments.length,
    assignmentLookup,
    regions: baseline.regions.map((region) => ({
      regionId: region.id,
      label: region.label,
      assignmentCount: draft.assignments.filter(
        (assignment) => assignment.scenarioRegionId === region.id,
      ).length,
    })),
  });
}
