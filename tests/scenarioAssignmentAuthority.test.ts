import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  buildAssignmentByBoundaryUnitId,
  buildScenarioAssignmentAuthority,
  findScenarioAssignmentFeatureAtCoordinate,
  resolvePlaygroundBoundaryAssignment,
} from '../src/features/map/scenarioAssignmentAuthority';

describe('scenarioAssignmentAuthority', () => {
  it('prefers the runtime assignment source when available', () => {
    const runtimeAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          boundary_name: 'NHS Essex Integrated Care Board',
          region_name: 'COA 3b London and East',
        }),
      ],
    });
    const liveAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [20, 0],
            [30, 0],
            [30, 10],
            [20, 10],
            [20, 0],
          ]]),
          boundary_name: 'NHS Kent and Medway Integrated Care Board',
          region_name: 'COA 3b South East',
        }),
      ],
    });

    const authority = buildScenarioAssignmentAuthority({
      runtimeAssignmentSource,
      runtimeAssignmentByBoundaryName: new Map([
        ['NHS Essex Integrated Care Board', 'COA 3b London and East'],
      ]),
      runtimeAssignmentByBoundaryUnitId: new Map([
        [
          'UNIT-ESSEX',
          {
            boundaryUnitId: 'UNIT-ESSEX',
            boundaryName: 'NHS Essex Integrated Care Board',
            boundaryCode: null,
            scenarioRegionId: null,
            regionName: 'COA 3b London and East',
          },
        ],
      ]),
      liveAssignmentSource,
      liveAssignmentByBoundaryName: new Map([
        ['NHS Kent and Medway Integrated Care Board', 'COA 3b South East'],
      ]),
      liveAssignmentByBoundaryUnitId: new Map(),
    });

    expect(authority.sourceRole).toBe('runtime');
    expect(authority.assignmentSource).toBe(runtimeAssignmentSource);
    expect(authority.assignmentByBoundaryName.get('NHS Essex Integrated Care Board')).toBe(
      'COA 3b London and East',
    );
    expect(authority.assignmentByBoundaryUnitId.get('UNIT-ESSEX')?.regionName).toBe(
      'COA 3b London and East',
    );
  });

  it('falls back to the live assignment source when no runtime source exists', () => {
    const liveAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [20, 0],
            [30, 0],
            [30, 10],
            [20, 10],
            [20, 0],
          ]]),
          boundary_name: 'NHS Kent and Medway Integrated Care Board',
          region_name: 'COA 3b South East',
        }),
      ],
    });

    const authority = buildScenarioAssignmentAuthority({
      runtimeAssignmentSource: null,
      runtimeAssignmentByBoundaryName: new Map(),
      runtimeAssignmentByBoundaryUnitId: new Map(),
      liveAssignmentSource,
      liveAssignmentByBoundaryName: new Map([
        ['NHS Kent and Medway Integrated Care Board', 'COA 3b South East'],
      ]),
      liveAssignmentByBoundaryUnitId: new Map([
        [
          'UNIT-KENT',
          {
            boundaryUnitId: 'UNIT-KENT',
            boundaryName: 'NHS Kent and Medway Integrated Care Board',
            boundaryCode: null,
            scenarioRegionId: null,
            regionName: 'COA 3b South East',
          },
        ],
      ]),
    });

    expect(authority.sourceRole).toBe('live');
    expect(authority.assignmentSource).toBe(liveAssignmentSource);
    expect(authority.assignmentByBoundaryName.get('NHS Kent and Medway Integrated Care Board')).toBe(
      'COA 3b South East',
    );
    expect(authority.assignmentByBoundaryUnitId.get('UNIT-KENT')?.regionName).toBe(
      'COA 3b South East',
    );
  });

  it('prefers the authoritative boundary-unit assignment over stale boundary feature props', () => {
    expect(
      resolvePlaygroundBoundaryAssignment({
        workspaceId: 'dphcEstimateCoaPlayground',
        boundaryProperties: {
          boundary_name: 'NHS Essex Integrated Care Board',
          boundary_unit_id: 'UNIT-ESSEX',
          boundary_code: 'E54000068',
          region_name: 'COA 3b South East',
          scenario_region_id: 'coa3b_south_east',
        },
        assignmentByBoundaryUnitId: new Map([
          [
            'UNIT-ESSEX',
            {
              boundaryUnitId: 'UNIT-ESSEX',
              boundaryName: 'NHS Essex Integrated Care Board',
              boundaryCode: 'E54000068',
              scenarioRegionId: 'coa3b_london_east',
              regionName: 'COA 3b London and East',
            },
          ],
        ]),
      }),
    ).toEqual({
      boundaryUnitId: 'UNIT-ESSEX',
      boundaryName: 'NHS Essex Integrated Care Board',
      boundaryCode: 'E54000068',
      scenarioRegionId: 'coa3b_london_east',
      regionName: 'COA 3b London and East',
    });
  });

  it('finds the intersecting assignment feature for a coordinate', () => {
    const expectedFeature = new Feature({
      geometry: new Polygon([[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ]]),
      boundary_name: 'NHS Essex Integrated Care Board',
      region_name: 'COA 3b London and East',
    });
    const assignmentSource = new VectorSource({
      features: [
        expectedFeature,
        new Feature({
          geometry: new Point([50, 50]),
          boundary_name: 'Ignored point feature',
        }),
      ],
    });

    expect(findScenarioAssignmentFeatureAtCoordinate(assignmentSource, [5, 5])).toBe(
      expectedFeature,
    );
    expect(findScenarioAssignmentFeatureAtCoordinate(assignmentSource, [20, 20])).toBeNull();
  });

  it('resolves Playground boundary assignment from the active unit-id authority first', () => {
    const runtimeAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          boundary_name: 'NHS Essex Integrated Care Board',
          boundary_unit_id: 'UNIT-ESSEX',
          boundary_code: 'E54000068',
          scenario_region_id: 'coa3b_london_east',
          region_name: 'COA 3b London and East',
        }),
      ],
    });

    expect(
      resolvePlaygroundBoundaryAssignment({
        boundaryProperties: {
          boundary_name: 'NHS Essex Integrated Care Board',
          boundary_unit_id: 'UNIT-ESSEX',
          boundary_code: 'E54000068',
          scenario_region_id: 'stale_region_id',
          region_name: 'Stale Region',
        },
        workspaceId: null,
        assignmentByBoundaryUnitId: buildAssignmentByBoundaryUnitId(
          runtimeAssignmentSource,
        ),
      }),
    ).toMatchObject({
      boundaryUnitId: 'UNIT-ESSEX',
      scenarioRegionId: 'coa3b_london_east',
      regionName: 'COA 3b London and East',
    });
  });
});
