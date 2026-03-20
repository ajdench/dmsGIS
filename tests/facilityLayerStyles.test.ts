import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import { Style } from 'ol/style';
import { createFacilityFilterState, getFacilityFilterDefinitions } from '../src/lib/facilityFilters';
import { getStyleForLayer } from '../src/features/map/facilityLayerStyles';
import type { LayerState, RegionStyle } from '../src/types';

const pointLayer: LayerState = {
  id: 'facilities',
  name: 'Facilities',
  type: 'point',
  path: 'data/facilities/facilities.geojson',
  visible: true,
  opacity: 1,
};

function createFacilityFeature(overrides: Record<string, unknown> = {}) {
  return new Feature({
    geometry: new Point([0, 0]),
    id: 'FAC-1',
    name: 'Alpha Clinic',
    region: 'North',
    type: 'pmc-facility',
    default_visible: true,
    point_color_hex: '#a7c636',
    ...overrides,
  });
}

function createRegionMap(region: Partial<RegionStyle> = {}) {
  return new Map<string, RegionStyle>([
    [
      'North',
      {
        name: 'North',
        visible: true,
        color: '#a7c636',
        opacity: 1,
        borderVisible: true,
        borderColor: '#ffffff',
        borderOpacity: 0.5,
        symbolSize: 3.5,
        ...region,
      },
    ],
  ]);
}

describe('facilityLayerStyles', () => {
  it('returns undefined when a facility does not match active filters', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap(),
      'circle',
      3.5,
      getFacilityFilterDefinitions(
        createFacilityFilterState({ searchQuery: 'beta' }),
      ),
    ) as (feature: Feature) => Style | undefined;

    expect(styleFn(createFacilityFeature())).toBeUndefined();
  });

  it('returns undefined when a region is hidden', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap({ visible: false }),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    expect(styleFn(createFacilityFeature())).toBeUndefined();
  });

  it('builds a styled point symbol when facility and region are visible', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap({
        color: '#123456',
        opacity: 0.25,
        borderColor: '#654321',
        borderOpacity: 0.75,
        symbolSize: 5,
      }),
      'square',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    const style = styleFn(createFacilityFeature());

    expect(style).toBeInstanceOf(Style);
    const image = style?.getImage() as CircleStyle | undefined;
    expect(image?.getFill()?.getColor()).toBe('rgba(18, 52, 86, 0.25)');
    expect(image?.getStroke()?.getColor()).toBe('rgba(101, 67, 33, 0.75)');
  });

  it('uses the remapped scenario region when a draft-aware assignment source is present', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      new Map<string, RegionStyle>([
        [
          'COA 3b London and East',
          {
            name: 'COA 3b London and East',
            visible: true,
            color: '#8767ac',
            opacity: 0.5,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0.4,
            symbolSize: 6,
          },
        ],
      ]),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
      new VectorSource({
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
        ],
      }),
    ) as (feature: Feature) => Style | undefined;

    const style = styleFn(createFacilityFeature());

    expect(style).toBeInstanceOf(Style);
    const image = style?.getImage() as CircleStyle | undefined;
    expect(image?.getFill()?.getColor()).toBe('rgba(135, 103, 172, 0.5)');
  });
});
