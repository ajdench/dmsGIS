import { describe, expect, it } from 'vitest';
import {
  buildScenarioWorkspaceAssignments,
  getScenarioBoundaryUnitId,
  upsertScenarioWorkspaceAssignment,
} from '../src/lib/scenarioWorkspaceAssignments';
import { createScenarioWorkspaceDraft } from '../src/lib/config/scenarioWorkspaces';

describe('scenarioWorkspaceAssignments', () => {
  it('prefers explicit boundary unit identifiers over boundary names', () => {
    expect(
      getScenarioBoundaryUnitId({
        boundary_unit_id: 'UNIT-123',
        boundary_name: 'NHS Essex Integrated Care Board',
      }),
    ).toBe('UNIT-123');
  });

  it('builds stable scenario assignments from boundary records and applies overrides', () => {
    const assignments = buildScenarioWorkspaceAssignments('coa3b', [
      {
        boundary_name: 'NHS Essex Integrated Care Board',
        region_name: 'Any upstream name',
      },
      {
        boundary_name: 'Boundary North',
        jmc_name: 'JMC North',
      },
    ]);

    expect(assignments).toEqual([
      {
        boundaryUnitId: 'Boundary North',
        scenarioRegionId: 'coa3a_north',
      },
      {
        boundaryUnitId: 'NHS Essex Integrated Care Board',
        scenarioRegionId: 'coa3a_south_east',
      },
    ]);
  });

  it('reassigns a boundary unit by replacing its prior draft assignment', () => {
    const draft = createScenarioWorkspaceDraft('coa3b');
    const first = upsertScenarioWorkspaceAssignment(
      draft,
      'UNIT-123',
      'coa3a_north',
    );
    const second = upsertScenarioWorkspaceAssignment(
      first,
      'UNIT-123',
      'coa3a_south_east',
    );

    expect(second.assignments).toEqual([
      {
        boundaryUnitId: 'UNIT-123',
        scenarioRegionId: 'coa3a_south_east',
      },
    ]);
  });
});
