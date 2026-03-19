import { describe, expect, it } from 'vitest';
import type Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
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
      facilitySearchQuery: '',
    });

    expect(entries).toEqual([
      {
        facilityId: '',
        facilityName: 'Test Facility',
        coordinate: [1, 2],
        boundaryName: 'Boundary A',
        hasVisibleBorder: false,
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
      facilitySearchQuery: 'missing',
    });

    expect(entries).toEqual([]);
  });
});
