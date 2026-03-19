import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { resolveSingleClickSelection } from '../src/features/map/singleClickSelection';

describe('singleClickSelection', () => {
  it('prefers point tooltip entries when a visible point hit is present', () => {
    const pointFeature = new Feature({
      id: 'FAC-1',
      name: 'Test Facility',
      type: 'pmc-facility',
      region: 'North',
      default_visible: 1,
      point_color_hex: '#64748b',
      point_alpha: 1,
      geometry: new Point([10, 20]),
    });
    const pointLayer = new VectorLayer({
      source: new VectorSource({
        features: [pointFeature],
      }),
    });
    const map = {
      getFeaturesAtPixel: () => [pointFeature],
      getPixelFromCoordinate: (coordinate: [number, number]) => coordinate,
    };

    const result = resolveSingleClickSelection({
      map: map as never,
      pixel: [10, 20],
      coordinate: [10, 20],
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: true,
          opacity: 1,
        },
      ],
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
      overlayLayers: [],
      layerRefs: new Map([['facilities', pointLayer]]),
      regionBoundaryRefs: new Map(),
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityFilters: {
        searchQuery: '',
        regions: [],
        types: [],
        defaultVisibility: 'all',
      },
      activeViewPreset: 'current',
      getJmcNameAtCoordinate: () => 'JMC North',
    });

    expect(result.boundaryFeature).toBeNull();
    expect(result.pointEntries).toEqual([
      {
        facilityId: 'FAC-1',
        facilityName: 'Test Facility',
        coordinate: [10, 20],
        boundaryName: null,
        hasVisibleBorder: false,
        symbolSize: 3.5,
        jmcName: 'JMC North',
      },
    ]);
  });

  it('falls back to care-board boundary selection when no point hit is present', () => {
    const boundaryFeature = new Feature({
      boundary_name: 'Boundary A',
      geometry: new Polygon([[
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ]]),
    });
    const boundaryLayer = new VectorLayer({
      source: new VectorSource({
        features: [boundaryFeature],
      }),
    });
    const map = {
      getFeaturesAtPixel: () => [],
      getPixelFromCoordinate: (coordinate: [number, number]) => coordinate,
    };

    const result = resolveSingleClickSelection({
      map: map as never,
      pixel: [10, 10],
      coordinate: [10, 10],
      layers: [],
      regions: [],
      overlayLayers: [
        {
          id: 'careBoardBoundaries',
          name: 'Care board boundaries',
          path: 'data/regions/boards.geojson',
          family: 'boardBoundaries',
          visible: true,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderOpacity: 0.14,
          swatchColor: '#8f8f8f',
        },
      ],
      layerRefs: new Map(),
      regionBoundaryRefs: new Map([['careBoardBoundaries', boundaryLayer]]),
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityFilters: {
        searchQuery: '',
        regions: [],
        types: [],
        defaultVisibility: 'all',
      },
      activeViewPreset: 'current',
      getJmcNameAtCoordinate: () => null,
    });

    expect(result.pointEntries).toEqual([]);
    expect(result.boundaryFeature).toBe(boundaryFeature);
  });

  it('filters overlapping point hits down to the searched facility for paging', () => {
    const alphaFeature = new Feature({
      id: 'FAC-1',
      name: 'Alpha Clinic',
      type: 'pmc-facility',
      region: 'North',
      default_visible: 1,
      point_color_hex: '#64748b',
      point_alpha: 1,
      geometry: new Point([10, 20]),
    });
    const betaFeature = new Feature({
      id: 'FAC-2',
      name: 'Beta Clinic',
      type: 'pmc-facility',
      region: 'North',
      default_visible: 1,
      point_color_hex: '#64748b',
      point_alpha: 1,
      geometry: new Point([10, 20]),
    });
    const pointLayer = new VectorLayer({
      source: new VectorSource({
        features: [alphaFeature, betaFeature],
      }),
    });
    const map = {
      getFeaturesAtPixel: () => [alphaFeature, betaFeature],
      getPixelFromCoordinate: (coordinate: [number, number]) => coordinate,
    };

    const result = resolveSingleClickSelection({
      map: map as never,
      pixel: [10, 20],
      coordinate: [10, 20],
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: true,
          opacity: 1,
        },
      ],
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
      overlayLayers: [],
      layerRefs: new Map([['facilities', pointLayer]]),
      regionBoundaryRefs: new Map(),
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityFilters: {
        searchQuery: 'alpha',
        regions: [],
        types: [],
        defaultVisibility: 'all',
      },
      activeViewPreset: 'current',
      getJmcNameAtCoordinate: () => 'JMC North',
    });

    expect(result.boundaryFeature).toBeNull();
    expect(result.pointEntries).toEqual([
      {
        facilityId: 'FAC-1',
        facilityName: 'Alpha Clinic',
        coordinate: [10, 20],
        boundaryName: null,
        hasVisibleBorder: false,
        symbolSize: 3.5,
        jmcName: 'JMC North',
      },
    ]);
  });
});
