import { describe, expect, it } from 'vitest';
import { buildScenarioWorkspaceSummary } from '../src/lib/scenarioWorkspaceSummaries';

describe('scenarioWorkspaceSummaries', () => {
  it('combines workspace assignment counts with remapped facility summaries', () => {
    expect(
      buildScenarioWorkspaceSummary(
        {
          workspaceId: 'dphcEstimateCoaPlayground',
          boundarySystemId: 'icbHb2026',
          totalAssignedBoundaryUnits: 3,
          assignmentLookup: {
            a: 'londonEast',
            b: 'londonEast',
            c: 'southEast',
          },
          regions: [
            {
              regionId: 'londonEast',
              label: 'COA 3b London and East',
              assignmentCount: 2,
            },
            {
              regionId: 'southEast',
              label: 'COA 3b South East',
              assignmentCount: 1,
            },
          ],
        },
        {
          totalFacilities: 3,
          regions: [
            {
              regionId: 'londonEast',
              regionName: 'COA 3b London and East',
              facilityCount: 2,
              facilityTypes: [
                {
                  typeName: 'current-pmc',
                  facilityCount: 1,
                },
                {
                  typeName: 'future-pmc',
                  facilityCount: 1,
                },
              ],
            },
            {
              regionId: 'southEast',
              regionName: 'COA 3b South East',
              facilityCount: 1,
              facilityTypes: [
                {
                  typeName: 'future-pmc',
                  facilityCount: 1,
                },
              ],
            },
          ],
          facilityTypes: [
            {
              typeName: 'current-pmc',
              facilityCount: 1,
            },
            {
              typeName: 'future-pmc',
              facilityCount: 2,
            },
          ],
        },
      ),
    ).toEqual({
      workspaceId: 'dphcEstimateCoaPlayground',
      boundarySystemId: 'icbHb2026',
      totalAssignedBoundaryUnits: 3,
      totalFacilities: 3,
      regions: [
        {
          regionId: 'londonEast',
          label: 'COA 3b London and East',
          assignmentCount: 2,
          facilityCount: 2,
          facilityTypes: [
            {
              typeName: 'current-pmc',
              facilityCount: 1,
            },
            {
              typeName: 'future-pmc',
              facilityCount: 1,
            },
          ],
        },
        {
          regionId: 'southEast',
          label: 'COA 3b South East',
          assignmentCount: 1,
          facilityCount: 1,
          facilityTypes: [
            {
              typeName: 'future-pmc',
              facilityCount: 1,
            },
          ],
        },
      ],
      facilityTypes: [
        {
          typeName: 'current-pmc',
          facilityCount: 1,
        },
        {
          typeName: 'future-pmc',
          facilityCount: 2,
        },
      ],
    });
  });
});
