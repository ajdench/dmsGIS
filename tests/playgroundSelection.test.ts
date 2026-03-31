import { describe, expect, it } from 'vitest';
import { resolvePlaygroundSelectedRegion } from '../src/features/map/playgroundSelection';

describe('playgroundSelection', () => {
  it('prefers an active facility selection over stale board-editor selection', () => {
    const resolved = resolvePlaygroundSelectedRegion({
      selection: {
        facilityIds: ['FAC-1'],
        boundaryName: 'NHS Essex Integrated Care Board',
        jmcName: 'London and East',
        scenarioRegionId: 'coa3b_london_east',
      },
      scenarioWorkspaceEditor: {
        selectedBoundaryUnitId: 'E54000025',
        selectedScenarioRegionId: 'coa3b_midlands',
        pendingScenarioRegionId: 'coa3b_midlands',
        isDirty: true,
      },
      scenarioAssignmentPopover: {
        selectedRegionId: 'coa3b_midlands',
      },
      regions: [
        {
          id: 'coa3b_midlands',
          label: 'COA 3b Midlands',
          assignmentCode: 'COA3B_MIDLANDS',
          sourceRegionNames: [],
          palette: {
            populated: '#ef4444',
            unpopulated: '#fecaca',
            outline: '#b91c1c',
          },
          order: 0,
        },
        {
          id: 'coa3b_london_east',
          label: 'COA 3b London and East',
          assignmentCode: 'COA3B_LONDON_EAST',
          sourceRegionNames: [],
          palette: {
            populated: '#8b5cf6',
            unpopulated: '#ddd6fe',
            outline: '#7c3aed',
          },
          order: 1,
        },
      ],
    });

    expect(resolved).toEqual({
      selectedRegionId: 'coa3b_london_east',
      selectedRegionName: 'London and East',
    });
  });

  it('falls back to the editor or popover selection when no facility is active', () => {
    const resolved = resolvePlaygroundSelectedRegion({
      selection: {
        facilityIds: [],
        boundaryName: 'NHS Essex Integrated Care Board',
        jmcName: null,
        scenarioRegionId: null,
      },
      scenarioWorkspaceEditor: {
        selectedBoundaryUnitId: 'E54000025',
        selectedScenarioRegionId: 'coa3b_midlands',
        pendingScenarioRegionId: 'coa3b_midlands',
        isDirty: true,
      },
      scenarioAssignmentPopover: {
        selectedRegionId: 'coa3b_midlands',
      },
      regions: [
        {
          id: 'coa3b_midlands',
          label: 'COA 3b Midlands',
          assignmentCode: 'COA3B_MIDLANDS',
          sourceRegionNames: [],
          palette: {
            populated: '#ef4444',
            unpopulated: '#fecaca',
            outline: '#b91c1c',
          },
          order: 0,
        },
      ],
    });

    expect(resolved).toEqual({
      selectedRegionId: 'coa3b_midlands',
      selectedRegionName: 'COA 3b Midlands',
    });
  });

  it('prefers the editor selection over a stale popover region id', () => {
    const resolved = resolvePlaygroundSelectedRegion({
      selection: {
        facilityIds: [],
        boundaryName: 'NHS Essex Integrated Care Board',
        jmcName: null,
        scenarioRegionId: null,
      },
      scenarioWorkspaceEditor: {
        selectedBoundaryUnitId: 'E54000025',
        selectedScenarioRegionId: 'coa3b_london_east',
        pendingScenarioRegionId: 'coa3b_london_east',
        isDirty: true,
      },
      scenarioAssignmentPopover: {
        selectedRegionId: 'coa3b_midlands',
      },
      regions: [
        {
          id: 'coa3b_midlands',
          label: 'COA 3b Midlands',
          assignmentCode: 'COA3B_MIDLANDS',
          sourceRegionNames: [],
          palette: {
            populated: '#ef4444',
            unpopulated: '#fecaca',
            outline: '#b91c1c',
          },
          order: 0,
        },
        {
          id: 'coa3b_london_east',
          label: 'COA 3b London and East',
          assignmentCode: 'COA3B_LONDON_EAST',
          sourceRegionNames: [],
          palette: {
            populated: '#8b5cf6',
            unpopulated: '#ddd6fe',
            outline: '#7c3aed',
          },
          order: 1,
        },
      ],
    });

    expect(resolved).toEqual({
      selectedRegionId: 'coa3b_london_east',
      selectedRegionName: 'COA 3b London and East',
    });
  });
});
