import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  buildScenarioFacilityMetrics,
  getEffectiveFacilityRecord,
  getEffectiveFacilityRegionAssignment,
  getEffectiveFacilityRegionName,
} from '../src/features/map/scenarioFacilityMapping';

function createFacilityFeature(overrides: Record<string, unknown> = {}) {
  return new Feature({
    geometry: new Point([5, 5]),
    id: 'FAC-1',
    name: 'Alpha Clinic',
    region: 'North',
    type: 'pmc-facility',
    default_visible: true,
    point_color_hex: '#a7c636',
    ...overrides,
  });
}

describe('scenarioFacilityMapping', () => {
  it('falls back to the facility region when no scenario assignment source exists', () => {
    expect(getEffectiveFacilityRegionName(createFacilityFeature(), null)).toBe('North');
  });

  it('maps a facility into the active scenario region from the assignment source', () => {
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
          scenario_region_id: 'londonEast',
          region_name: 'COA 3b London and East',
        }),
      ],
    });

    expect(
      getEffectiveFacilityRegionName(createFacilityFeature(), assignmentSource),
    ).toBe('COA 3b London and East');
    expect(
      getEffectiveFacilityRecord(createFacilityFeature(), assignmentSource).searchText,
    ).toContain('coa 3b london and east');
    expect(
      getEffectiveFacilityRegionAssignment(createFacilityFeature(), assignmentSource),
    ).toEqual({
      regionId: 'londonEast',
      regionName: 'COA 3b London and East',
    });
  });

  it('builds facility counts from remapped scenario regions', () => {
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
          scenario_region_id: 'londonEast',
          region_name: 'COA 3b London and East',
        }),
      ],
    });

    const metrics = buildScenarioFacilityMetrics(
      [createFacilityFeature(), createFacilityFeature({ id: 'FAC-2' })],
      assignmentSource,
    );

    expect(metrics.totalFacilities).toBe(2);
    expect(metrics.facilitiesByRegion.get('COA 3b London and East')).toBe(2);
  });
});
