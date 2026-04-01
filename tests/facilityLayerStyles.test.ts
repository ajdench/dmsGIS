import { describe, expect, it, vi } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import CircleStyle from 'ol/style/Circle';
import { Fill, Stroke, Style } from 'ol/style';
import { createFacilityFilterState, getFacilityFilterDefinitions } from '../src/lib/facilityFilters';
import { getStyleForLayer } from '../src/features/map/facilityLayerStyles';
import { blendWithWhite } from '../src/features/map/mapStyleUtils';
import type { LayerState, RegionStyle } from '../src/types';

const { createPointSymbolMock } = vi.hoisted(() => ({
  createPointSymbolMock: vi.fn(),
}));

vi.mock('../src/features/map/mapStyleUtils', async () => {
  const actual = await vi.importActual<typeof import('../src/features/map/mapStyleUtils')>(
    '../src/features/map/mapStyleUtils',
  );

  return {
    ...actual,
    createPointSymbol: (
      _shape: string,
      size: number,
      fillColor: string,
      borderColor: string,
      borderWidth: number,
      options?: {
        outerRingColor?: string;
        outerRingGap?: number;
        outerRingWidth?: number;
        outerRingPlacement?: 'outside' | 'inside';
      },
    ) => {
      createPointSymbolMock({
        size,
        fillColor,
        borderColor,
        borderWidth,
        options,
      });
      return new CircleStyle({
        radius: size,
        fill: new Fill({ color: fillColor }),
        stroke:
          borderWidth > 0
            ? new Stroke({ color: borderColor, width: borderWidth })
            : undefined,
      });
    },
  };
});

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

function createCombinedPracticeStyleMap(overrides: Array<{
  name: string;
  displayName?: string;
  visible?: boolean;
  borderColor?: string;
  borderWidth?: number;
  borderOpacity?: number;
}> = []) {
  return new Map(
    overrides.map((override) => [
      override.name,
      {
        name: override.name,
        displayName: override.displayName ?? override.name,
        visible: override.visible ?? true,
        borderColor: override.borderColor ?? '#0f766e',
        borderWidth: override.borderWidth ?? 1,
        borderOpacity: override.borderOpacity ?? 1,
      },
    ]),
  );
}

describe('facilityLayerStyles', () => {
  it('adds a deterministic outer ring for true combined practices', () => {
    createPointSymbolMock.mockClear();

    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap(),
      createCombinedPracticeStyleMap([
        {
          name: 'Portsmouth Combined Medical Practice',
          displayName: 'Portsmouth',
          borderColor: '#0f766e',
        },
      ]),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    styleFn(
      createFacilityFeature({
        name: 'Nelson Medical Centre',
        combined_practice: 'Portsmouth Combined Medical Practice',
      }),
    );

    expect(createPointSymbolMock).toHaveBeenCalledTimes(1);
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingColor).toBeTruthy();
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingGap).toBe(0);
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingWidth).toBeGreaterThan(0);
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingPlacement).toBe(
      'inside',
    );
  });

  it('does not add the outer ring for singleton self-only combined practice values', () => {
    createPointSymbolMock.mockClear();

    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap(),
      createCombinedPracticeStyleMap(),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    styleFn(
      createFacilityFeature({
        name: 'Abbey Wood Medical Centre',
        combined_practice: 'Abbey Wood Medical Centre',
      }),
    );

    expect(createPointSymbolMock).toHaveBeenCalledTimes(1);
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingColor).toBeUndefined();
    expect(createPointSymbolMock.mock.calls[0]?.[0]?.options?.outerRingWidth).toBe(0);
  });

  it('returns undefined when a facility does not match active filters', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap(),
      createCombinedPracticeStyleMap(),
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
      createCombinedPracticeStyleMap(),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    expect(styleFn(createFacilityFeature())).toBeUndefined();
  });

  it('returns undefined when a facility is default-hidden even inside a visible region', () => {
    const styleFn = getStyleForLayer(
      pointLayer,
      createRegionMap({ visible: true }),
      createCombinedPracticeStyleMap(),
      'circle',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    expect(
      styleFn(
        createFacilityFeature({
          name: 'Aldergrove Medical Practice',
          default_visible: 0,
        }),
      ),
    ).toBeUndefined();
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
      createCombinedPracticeStyleMap(),
      'square',
      3.5,
      getFacilityFilterDefinitions(createFacilityFilterState()),
    ) as (feature: Feature) => Style | undefined;

    const style = styleFn(createFacilityFeature());

    expect(style).toBeInstanceOf(Style);
    const image = style?.getImage() as CircleStyle | undefined;
    expect(image?.getFill()?.getColor()).toBe('rgba(18, 52, 86, 0.25)');
    expect(image?.getStroke()?.getColor()).toBe(blendWithWhite('#654321', 0.75));
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
      createCombinedPracticeStyleMap(),
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
