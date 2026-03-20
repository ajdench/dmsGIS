import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import { buildScenarioFacilityMetricSummary } from '../src/features/map/scenarioFacilityMetrics';

describe('scenarioFacilityMetrics', () => {
  it('summarizes remapped facility counts by scenario region', () => {
    const facilities = [
      new Feature({
        geometry: new Point([5, 5]),
        id: 'FAC-1',
        name: 'Alpha Clinic',
        region: 'North',
      }),
      new Feature({
        geometry: new Point([15, 5]),
        id: 'FAC-2',
        name: 'Beta Clinic',
        region: 'South',
      }),
    ];
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          region_name: 'COA 3b London and East',
        }),
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          region_name: 'COA 3b South East',
        }),
      ],
    });

    expect(
      buildScenarioFacilityMetricSummary(facilities, assignmentSource),
    ).toEqual({
      totalFacilities: 2,
      regions: [
        {
          regionName: 'COA 3b London and East',
          facilityCount: 1,
          facilityTypes: [
            {
              typeName: 'pmc-facility',
              facilityCount: 1,
            },
          ],
        },
        {
          regionName: 'COA 3b South East',
          facilityCount: 1,
          facilityTypes: [
            {
              typeName: 'pmc-facility',
              facilityCount: 1,
            },
          ],
        },
      ],
      facilityTypes: [
        {
          typeName: 'pmc-facility',
          facilityCount: 2,
        },
      ],
    });
  });
});
