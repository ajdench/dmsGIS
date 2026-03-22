import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  collectPointTooltipEntries,
  getPointCoordinate,
} from '../src/features/map/pointSelection';

describe('pointSelection', () => {
  it('extracts coordinates from point features', () => {
    const feature = {
      getGeometry() {
        return new Point([100, 200]);
      },
    } as unknown as Feature;

    expect(getPointCoordinate(feature)).toEqual([100, 200]);
  });

  it('collects unique tooltip entries with boundary and scenario names', () => {
    const feature = {
      get(key: string) {
        if (key === 'name') return 'Test Facility';
        if (key === 'region') return 'North';
        return undefined;
      },
      getGeometry() {
        return new Point([1, 2]);
      },
    } as unknown as Feature;

    const entries = collectPointTooltipEntries({
      features: [feature, feature],
      fallbackCoordinate: [0, 0],
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
      activeViewPreset: 'coa3a',
      getBoundaryNameAtCoordinate: () => 'Boundary A',
      getJmcNameAtCoordinate: () => 'JMC North',
      facilityFilters: {
        searchQuery: '',
      },
    });

    expect(entries).toEqual([
      {
        facilityId: '',
        facilityName: 'Test Facility',
        coordinate: [1, 2],
        boundaryName: 'Boundary A',
        hasVisibleBorder: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'JMC North',
      },
    ]);
  });

  it('filters tooltip entries by facility search query', () => {
    const feature = {
      get(key: string) {
        if (key === 'name') return 'Test Facility';
        if (key === 'region') return 'North';
        return undefined;
      },
      getGeometry() {
        return new Point([1, 2]);
      },
    } as unknown as Feature;

    const entries = collectPointTooltipEntries({
      features: [feature],
      fallbackCoordinate: [0, 0],
      regions: [],
      activeViewPreset: 'coa3a',
      getBoundaryNameAtCoordinate: () => null,
      getJmcNameAtCoordinate: () => null,
      facilityFilters: {
        searchQuery: 'missing',
      },
    });

    expect(entries).toEqual([]);
  });

  it('uses the remapped scenario region when collecting tooltip entries', () => {
    const feature = new Feature({
      geometry: new Point([1, 2]),
      id: 'FAC-1',
      name: 'Test Facility',
      region: 'North',
      type: 'pmc-facility',
      default_visible: true,
      point_color_hex: '#a7c636',
    });

    const entries = collectPointTooltipEntries({
      features: [feature],
      fallbackCoordinate: [0, 0],
      regions: [
        {
          name: 'COA 3b London and East',
          visible: true,
          color: '#8767ac',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0.5,
          symbolSize: 6,
        },
      ],
      activeViewPreset: 'coa3c',
      getBoundaryNameAtCoordinate: () => 'Boundary A',
      getJmcNameAtCoordinate: () => 'COA 3b London and East',
      facilityFilters: {
        searchQuery: '',
      },
      assignmentSource: new VectorSource({
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
    });

    expect(entries).toEqual([
      {
        facilityId: 'FAC-1',
        facilityName: 'Test Facility',
        coordinate: [1, 2],
        boundaryName: 'Boundary A',
        hasVisibleBorder: true,
        symbolShape: 'circle',
        symbolSize: 6,
        jmcName: 'COA 3b London and East',
      },
    ]);
  });
});
