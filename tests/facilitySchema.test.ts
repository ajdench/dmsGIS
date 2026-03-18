import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { describe, expect, it } from 'vitest';
import { getFacilityFeatureProperties } from '../src/lib/facilities';
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
});
