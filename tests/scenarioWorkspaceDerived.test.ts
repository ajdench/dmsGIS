import { describe, expect, it } from 'vitest';
import { deriveScenarioWorkspaceFromDraft } from '../src/lib/scenarioWorkspaceDerived';
import { createScenarioWorkspaceDraft } from '../src/lib/config/scenarioWorkspaces';
import { upsertScenarioWorkspaceAssignment } from '../src/lib/scenarioWorkspaceAssignments';

describe('scenarioWorkspaceDerived', () => {
  it('builds a region summary from a scenario workspace draft', () => {
    const draft = upsertScenarioWorkspaceAssignment(
      upsertScenarioWorkspaceAssignment(
        createScenarioWorkspaceDraft('coa3b'),
        'UNIT-1',
        'coa3a_north',
      ),
      'UNIT-2',
      'coa3a_south_east',
    );

    const derived = deriveScenarioWorkspaceFromDraft(draft);

    expect(derived).toMatchObject({
      workspaceId: 'coa3b',
      boundarySystemId: 'icbHb2026',
      totalAssignedBoundaryUnits: 2,
      assignmentLookup: {
        'UNIT-1': 'coa3a_north',
        'UNIT-2': 'coa3a_south_east',
      },
    });
    expect(derived?.regions.find((region) => region.regionId === 'coa3a_north')).toEqual({
      regionId: 'coa3a_north',
      label: 'COA 3a North',
      assignmentCount: 1,
    });
  });
});
