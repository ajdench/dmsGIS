import { describe, expect, it } from 'vitest';
import {
  buildScenarioWorkspaceAssignments,
  getScenarioBoundaryUnitId,
  resolveScenarioWorkspaceRegionIdForRecord,
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

  it('builds stable scenario assignments from boundary records using boundary_code', () => {
    // New architecture: region lookup is driven by boundary_code → codeGroupings,
    // not by legacy jmc_name / sourceRegionNames matching.
    // E54000008 → 'COA 3a North' → coa3a_north in coa3b preset
    // E54000065 → 'COA 3a South East' → coa3a_south_east in coa3b preset
    const assignments = buildScenarioWorkspaceAssignments('coa3b', [
      { boundary_code: 'E54000065' },
      { boundary_code: 'E54000008' },
    ]);

    expect(assignments).toEqual([
      {
        boundaryUnitId: 'E54000008',
        scenarioRegionId: 'coa3a_north',
      },
      {
        boundaryUnitId: 'E54000065',
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

  it('prefers an explicit runtime scenario_region_id when present on a feature record', () => {
    expect(
      resolveScenarioWorkspaceRegionIdForRecord('dphcEstimateCoaPlayground', {
        boundary_code: 'E54000065',
        scenario_region_id: 'coa3b_midlands',
        region_name: 'COA 3b Midlands',
      }),
    ).toBe('coa3b_midlands');
  });
});
