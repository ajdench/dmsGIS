import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  collectPointTooltipEntries,
  getDirectPointHitsAtPixel,
  getPointCoordinate,
  prioritizePointTooltipEntries,
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
        hasCombinedPracticeRing: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'JMC North',
        scenarioRegionId: null,
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
        hasCombinedPracticeRing: false,
        symbolShape: 'circle',
        symbolSize: 6,
        jmcName: 'COA 3b London and East',
        scenarioRegionId: null,
      },
    ]);
  });

  it('prefers draft-aware scenario region identity for facility tooltip entries without remapping facility styling', () => {
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
      activeViewPreset: 'coa3c',
      getBoundaryNameAtCoordinate: () => 'Boundary A',
      getJmcNameAtCoordinate: () => 'COA 3b North',
      facilityFilters: {
        searchQuery: '',
      },
      scenarioAssignmentSource: new VectorSource({
        features: [
          new Feature({
            geometry: new Polygon([[
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ]]),
            scenario_region_id: 'coa3b_london_east',
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
        hasVisibleBorder: false,
        hasCombinedPracticeRing: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'COA 3b London and East',
        scenarioRegionId: 'coa3b_london_east',
      },
    ]);
  });

  it('marks tooltip entries for true combined practices so the family ring can clear the selection highlight', () => {
    const feature = new Feature({
      geometry: new Point([1, 2]),
      id: 'FAC-1',
      name: 'Nelson Medical Centre',
      combined_practice: 'Portsmouth Combined Medical Practice',
      region: 'London & South',
      type: 'pmc-facility',
      default_visible: true,
      point_color_hex: '#419632',
    });

    const entries = collectPointTooltipEntries({
      features: [feature],
      fallbackCoordinate: [0, 0],
      regions: [],
      activeViewPreset: 'current',
      getBoundaryNameAtCoordinate: () => null,
      getJmcNameAtCoordinate: () => 'London & South',
      facilityFilters: {
        searchQuery: '',
      },
    });

    expect(entries[0]?.hasCombinedPracticeRing).toBe(true);
  });

  it('uses a non-zero pixel hit tolerance for facility point picking', () => {
    const feature = new Feature({
      geometry: new Point([1, 2]),
      id: 'FAC-1',
      name: 'Test Facility',
      region: 'London & South',
      type: 'pmc-facility',
      default_visible: true,
      point_color_hex: '#419632',
    });

    let capturedOptions: { hitTolerance?: number } | null = null;
    const map = {
      getFeaturesAtPixel: (_pixel: number[], options: { hitTolerance?: number }) => {
        capturedOptions = options;
        return [feature];
      },
      getPixelFromCoordinate: () => [10, 20],
    };

    const hits = getDirectPointHitsAtPixel(
      map as never,
      [10, 20],
      new Set(),
      new Map([
        [
          'London & South',
          {
            name: 'London & South',
            visible: true,
            color: '#419632',
            opacity: 1,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            symbolSize: 3.5,
          },
        ],
      ]),
      'circle',
      3.5,
      {
        searchQuery: '',
      },
      null,
    );

    expect(hits).toEqual([feature]);
    expect(capturedOptions?.hitTolerance).toBe(6);
  });

  it('does not return direct point hits for default-hidden facilities in visible regions', () => {
    const feature = new Feature({
      geometry: new Point([1, 2]),
      id: 'CMP19-1',
      name: 'Aldergrove Medical Practice',
      region: 'Scotland & Northern Ireland',
      type: 'pmc-facility',
      default_visible: 0,
      point_color_hex: '#4862b8',
    });

    const map = {
      getFeaturesAtPixel: () => [feature],
      getPixelFromCoordinate: () => [10, 20],
    };

    const hits = getDirectPointHitsAtPixel(
      map as never,
      [10, 20],
      new Set(),
      new Map([
        [
          'Scotland & Northern Ireland',
          {
            name: 'Scotland & Northern Ireland',
            visible: true,
            color: '#4862b8',
            opacity: 1,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            symbolSize: 3.5,
          },
        ],
      ]),
      'circle',
      3.5,
      {
        searchQuery: '',
      },
      null,
    );

    expect(hits).toEqual([]);
  });

  it('moves the requested facility to the first tooltip page', () => {
    const entries = prioritizePointTooltipEntries(
      [
        {
          facilityId: 'FAC-1',
          facilityName: 'First',
          coordinate: [1, 2],
          boundaryName: 'Boundary A',
          hasVisibleBorder: false,
          symbolShape: 'circle',
          symbolSize: 3.5,
          jmcName: 'North',
          scenarioRegionId: null,
        },
        {
          facilityId: 'FAC-2',
          facilityName: 'Second',
          coordinate: [3, 4],
          boundaryName: 'Boundary A',
          hasVisibleBorder: false,
          symbolShape: 'circle',
          symbolSize: 3.5,
          jmcName: 'North',
          scenarioRegionId: null,
        },
      ],
      'FAC-2',
    );

    expect(entries.map((entry) => entry.facilityId)).toEqual(['FAC-2', 'FAC-1']);
  });
});
