import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { describe, expect, it } from 'vitest';
import {
  createFacilityRecord,
  getFacilityFeatureProperties,
  getFacilityRecord,
  matchesFacilitySearch,
  normalizeFacilitySearchQuery,
} from '../src/lib/facilities';
import { parseFacilityProperties } from '../src/lib/schemas/facilities';

describe('facility schema', () => {
  it('normalizes facility properties with defaults', () => {
    expect(
      parseFacilityProperties({
        id: 'TEST',
        name: 'Test Facility',
        region: 'North',
        point_color_hex: 'a7c636',
      }),
    ).toMatchObject({
      id: 'TEST',
      name: 'Test Facility',
      type: 'pmc-facility',
      region: 'North',
      default_visible: 1,
      point_color_hex: '#a7c636',
      point_alpha: 1,
      lon_original: null,
      lat_original: null,
      snapped_to_land: null,
      snap_distance_m: null,
    });
  });

  it('reads normalized facility properties from an OpenLayers feature', () => {
    const feature = new Feature({
      id: 'ABC',
      name: 'Example',
      region: 'London & South',
      default_visible: 0,
      point_color_hex: '#419632',
      geometry: new Point([0, 0]),
    });

    expect(getFacilityFeatureProperties(feature)).toMatchObject({
      id: 'ABC',
      name: 'Example',
      region: 'London & South',
      default_visible: 0,
      point_color_hex: '#419632',
    });
  });

  it('builds a richer facility domain record with derived fields', () => {
    expect(
      createFacilityRecord(
        parseFacilityProperties({
          id: 'ABC',
          name: 'Example',
          type: 'pmc-facility',
          region: 'London & South',
          default_visible: 0,
          point_color_hex: '#419632',
          snapped_to_land: true,
        }),
      ),
    ).toMatchObject({
      displayName: 'Example',
      searchText: 'abc example london & south pmc-facility',
      isDefaultVisible: false,
      hasSnappedCoordinates: true,
    });
  });

  it('builds a facility record directly from an OpenLayers feature', () => {
    const feature = new Feature({
      id: 'XYZ',
      name: 'Another',
      region: 'North',
      default_visible: 1,
      point_color_hex: '#a7c636',
      snapped_to_land: false,
      geometry: new Point([1, 1]),
    });

    expect(getFacilityRecord(feature)).toMatchObject({
      id: 'XYZ',
      displayName: 'Another',
      isDefaultVisible: true,
      hasSnappedCoordinates: false,
    });
  });

  it('normalizes and matches facility search queries against the facility record', () => {
    const facility = createFacilityRecord(
      parseFacilityProperties({
        id: 'XYZ',
        name: 'Another',
        type: 'pmc-facility',
        region: 'North',
      }),
    );

    expect(normalizeFacilitySearchQuery('  North  ')).toBe('north');
    expect(matchesFacilitySearch(facility, 'another')).toBe(true);
    expect(matchesFacilitySearch(facility, 'north')).toBe(true);
    expect(matchesFacilitySearch(facility, 'missing')).toBe(false);
  });
});
