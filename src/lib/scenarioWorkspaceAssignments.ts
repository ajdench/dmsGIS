import type {
  ScenarioBoundaryAssignment,
  ScenarioWorkspaceDraft,
} from './schemas/scenarioWorkspaces';
import { parseScenarioWorkspaceDraft } from './schemas/scenarioWorkspaces';
import { getScenarioWorkspaceBaseline } from './config/scenarioWorkspaces';
import type { ScenarioWorkspaceId } from '../types';

const BOUNDARY_UNIT_ID_KEYS = [
  'boundary_unit_id',
  'boundary_id',
  'board_id',
  'icb_code',
  'boundary_code',
  'code',
  'boundary_name',
] as const;

export interface ScenarioBoundaryAssignmentRecord {
  boundary_name?: unknown;
  region_name?: unknown;
  jmc_name?: unknown;
  source_region_name?: unknown;
  boundary_unit_id?: unknown;
  boundary_id?: unknown;
  board_id?: unknown;
  icb_code?: unknown;
  boundary_code?: unknown;
  code?: unknown;
}

export function getScenarioBoundaryUnitId(
  properties: Record<string, unknown>,
): string | null {
  for (const key of BOUNDARY_UNIT_ID_KEYS) {
    const value = String(properties[key] ?? '').trim();
    if (value) {
      return value;
    }
  }
  return null;
}

export function resolveScenarioWorkspaceRegionId(
  workspaceId: ScenarioWorkspaceId,
  sourceRegionName: string,
  boundaryName = '',
): string | null {
  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  if (!baseline) {
    return null;
  }

  const normalizedBoundaryName = boundaryName.trim();
  const overrideRegionId = baseline.boundaryNameRegionOverrides[normalizedBoundaryName];
  if (overrideRegionId) {
    return overrideRegionId;
  }

  const normalizedSourceRegionName = sourceRegionName.trim();
  const region = baseline.regions.find(
    (entry) =>
      entry.id === normalizedSourceRegionName ||
      entry.label === normalizedSourceRegionName ||
      entry.sourceRegionNames.includes(normalizedSourceRegionName),
  );

  return region?.id ?? null;
}

export function buildScenarioWorkspaceAssignments(
  workspaceId: ScenarioWorkspaceId,
  records: ScenarioBoundaryAssignmentRecord[],
): ScenarioBoundaryAssignment[] {
  const assignments: ScenarioBoundaryAssignment[] = [];

  for (const record of records) {
    const boundaryUnitId = getScenarioBoundaryUnitId(
      record as Record<string, unknown>,
    );
    if (!boundaryUnitId) {
      continue;
    }

    const boundaryName = String(record.boundary_name ?? '').trim();
    const sourceRegionName = String(
      record.source_region_name ?? record.region_name ?? record.jmc_name ?? '',
    ).trim();
    if (!sourceRegionName) {
      continue;
    }

    const scenarioRegionId = resolveScenarioWorkspaceRegionId(
      workspaceId,
      sourceRegionName,
      boundaryName,
    );
    if (!scenarioRegionId) {
      continue;
    }

    assignments.push({
      boundaryUnitId,
      scenarioRegionId,
    });
  }

  return dedupeScenarioBoundaryAssignments(assignments);
}

export function upsertScenarioWorkspaceAssignment(
  draft: ScenarioWorkspaceDraft,
  boundaryUnitId: string,
  scenarioRegionId: string,
): ScenarioWorkspaceDraft {
  const nextAssignments = dedupeScenarioBoundaryAssignments([
    ...draft.assignments.filter(
      (assignment) => assignment.boundaryUnitId !== boundaryUnitId,
    ),
    {
      boundaryUnitId,
      scenarioRegionId,
    },
  ]);

  return parseScenarioWorkspaceDraft({
    ...draft,
    assignments: nextAssignments,
  });
}

export function dedupeScenarioBoundaryAssignments(
  assignments: ScenarioBoundaryAssignment[],
): ScenarioBoundaryAssignment[] {
  const byBoundaryUnitId = new Map<string, ScenarioBoundaryAssignment>();

  for (const assignment of assignments) {
    byBoundaryUnitId.set(assignment.boundaryUnitId, assignment);
  }

  return [...byBoundaryUnitId.values()].sort((a, b) =>
    a.boundaryUnitId.localeCompare(b.boundaryUnitId),
  );
}
