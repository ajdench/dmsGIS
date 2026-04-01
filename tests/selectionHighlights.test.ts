import { describe, expect, it, vi } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  syncBoundaryHighlightForPoint,
  syncJmcOutlineHighlight,
  syncSelectedRegionHighlightFromAvailableSources,
  syncSelectedRegionHighlightFromDerivedSource,
  syncSelectedPointHighlight,
} from '../src/features/map/selectionHighlights';

describe('selectionHighlights', () => {
  it('syncs the selected care-board boundary for a point entry', () => {
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
    const selectedBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const regionBoundaryRefs = new Map([
      [
        'regionFill',
        new VectorLayer({
          source: new VectorSource({
            features: [boundaryFeature],
          }),
        }),
      ],
    ]);

    const result = syncBoundaryHighlightForPoint({
      entry: {
        facilityId: 'FAC-1',
        facilityName: 'Test Facility',
        coordinate: [10, 10],
        boundaryName: null,
        hasVisibleBorder: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'JMC North',
      },
      overlayLayers: [
        {
          id: 'regionFill',
          name: 'Region fill',
          path: 'data/regions/boards.geojson',
          family: 'regionFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
      ],
      regionBoundaryRefs,
      selectedBoundaryLayer,
    });

    expect(result).toEqual({
      boundaryName: 'Boundary A',
      jmcName: 'JMC North',
    });
    expect(selectedBoundaryLayer.getSource()?.getFeatures()).toHaveLength(1);
  });

  it('highlights the parent care-board boundary for split-area point entries', () => {
    const parentBoundaryFeature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      geometry: new Polygon([[
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ]]),
    });
    const wardSplitFeature = new Feature({
      parent_code: 'E54000042',
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      region_ref: 'Central & Wessex',
      geometry: new Polygon([[
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ]]),
    });
    const selectedBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const regionBoundaryRefs = new Map([
      [
        'regionFill',
        new VectorLayer({
          source: new VectorSource({
            features: [parentBoundaryFeature],
          }),
        }),
      ],
      [
        'wardSplitFill',
        new VectorLayer({
          source: new VectorSource({
            features: [wardSplitFeature],
          }),
        }),
      ],
    ]);

    const result = syncBoundaryHighlightForPoint({
      entry: {
        facilityId: 'FAC-1',
        facilityName: 'Split Facility',
        coordinate: [10, 10],
        boundaryName: 'NHS Hampshire and Isle of Wight Integrated Care Board',
        hasVisibleBorder: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'Central & Wessex',
      },
      overlayLayers: [
        {
          id: 'regionFill',
          name: 'Region fill',
          path: 'data/regions/boards.geojson',
          family: 'regionFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'wardSplitFill',
          name: 'Ward split fill',
          path: 'data/regions/ward-split.geojson',
          family: 'wardSplitFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
      ],
      regionBoundaryRefs,
      selectedBoundaryLayer,
    });

    expect(result).toEqual({
      boundaryName: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      jmcName: 'Central & Wessex',
    });
    const highlighted = selectedBoundaryLayer.getSource()?.getFeatures()[0];
    expect(highlighted?.get('boundary_code')).toBe('E54000042');
    expect(highlighted?.get('region_ref')).toBe('Central & Wessex');
    expect(highlighted?.get('selection_region_ref')).toBe('Central & Wessex');
    expect(highlighted?.get('selection_parent_code')).toBe('E54000042');
  });

  it('syncs selected JMC outline features onto the highlight layer', () => {
    const boundaryFeature = new Feature({
      jmc_name: 'JMC North',
      geometry: new Polygon([[
        [0, 0],
        [20, 0],
        [20, 20],
        [0, 20],
        [0, 0],
      ]]),
    });
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });

    syncJmcOutlineHighlight({
      entry: {
        facilityId: 'FAC-1',
        facilityName: 'Test Facility',
        coordinate: [10, 10],
        boundaryName: null,
        hasVisibleBorder: false,
        symbolShape: 'circle',
        symbolSize: 3.5,
        jmcName: 'JMC North',
      },
      activeViewPreset: 'current',
      selectedJmcBoundaryLayer,
      scenarioBoundarySource: null,
      jmcBoundaryLookupSource: new VectorSource({
        features: [boundaryFeature],
      }),
      getSelectedOutlineColor: () => '#419632',
    });

    const features = selectedJmcBoundaryLayer.getSource()?.getFeatures() ?? [];
    expect(features).toHaveLength(1);
    expect(features[0].get('selectionColor')).toBe('#419632');
  });

  it('syncs the selected point highlight geometry and style', () => {
    const setStyle = vi.fn();
    const source = new VectorSource({
      features: [],
    });
    const selectedPointLayer = {
      getSource: () => source,
      setStyle,
    } as unknown as VectorLayer<VectorSource>;
    const createSelectedPointStyle = vi.fn(() => ({}));

    syncSelectedPointHighlight({
      entry: {
        facilityId: 'FAC-1',
        facilityName: 'Test Facility',
        coordinate: [4, 6],
        boundaryName: null,
        hasVisibleBorder: true,
        hasCombinedPracticeRing: true,
        symbolShape: 'square',
        symbolSize: 7,
        jmcName: 'JMC North',
      },
      selectedPointLayer,
      createSelectedPointStyle,
    });

    expect(setStyle).toHaveBeenCalledTimes(1);
    expect(createSelectedPointStyle).toHaveBeenCalledWith('square', 7, true, true);
    const feature = source.getFeatures()[0];
    expect(feature?.getGeometry()).toBeInstanceOf(Point);
  });

  it('syncs the selected editable region highlight directly from derived region geometry', () => {
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const derivedOutlineSource = new VectorSource({
      features: [
        new Feature({
          scenario_region_id: 'coa3b_midlands',
          region_name: 'COA 3b Midlands',
          geometry: new Polygon([[
            [0, 0],
            [20, 0],
            [20, 20],
            [0, 20],
            [0, 0],
          ]]),
        }),
        new Feature({
          scenario_region_id: 'coa3b_north',
          region_name: 'COA 3b North',
          geometry: new Polygon([[
            [20, 0],
            [40, 0],
            [40, 20],
            [20, 20],
            [20, 0],
          ]]),
        }),
      ],
    });

    const synced = syncSelectedRegionHighlightFromDerivedSource({
      selectedRegionId: 'coa3b_midlands',
      selectedRegionName: 'COA 3b Midlands',
      selectionColor: '#ff0000',
      derivedOutlineSource,
      selectedJmcBoundaryLayer,
    });

    const features = selectedJmcBoundaryLayer.getSource()?.getFeatures() ?? [];
    expect(synced).toBe(true);
    expect(features).toHaveLength(1);
    expect(features[0].get('scenario_region_id')).toBe('coa3b_midlands');
    expect(features[0].get('selectionColor')).toBe('#ff0000');
  });

  it('prefers the current-mode derived outline feature before fallback sources', () => {
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });
    const currentOutlineFeature = new Feature({
      geometry: new Polygon([[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ]]),
    });
    currentOutlineFeature.set('selectionColor', '#4862b8');

    const synced = syncSelectedRegionHighlightFromAvailableSources({
      activeViewPreset: 'current',
      preferDerivedOutlineSource: true,
      selectedRegionId: null,
      selectedRegionName: 'Scotland & Northern Ireland',
      selectionColor: '#4862b8',
      currentOutlineFeature,
      derivedOutlineSource: new VectorSource(),
      selectedJmcBoundaryLayer,
    });

    const features = selectedJmcBoundaryLayer.getSource()?.getFeatures() ?? [];
    expect(synced).toBe(true);
    expect(features).toHaveLength(1);
    expect(features[0].get('selectionColor')).toBe('#4862b8');
  });

  it('skips derived scenario outlines for static presets when disabled', () => {
    const selectedJmcBoundaryLayer = new VectorLayer({
      source: new VectorSource(),
    });

    const synced = syncSelectedRegionHighlightFromAvailableSources({
      activeViewPreset: 'coa3c',
      preferDerivedOutlineSource: false,
      selectedRegionId: 'coa3b_london_east',
      selectedRegionName: 'COA 3b London and East',
      selectionColor: '#8767ac',
      currentOutlineFeature: null,
      derivedOutlineSource: new VectorSource({
        features: [
          new Feature({
            scenario_region_id: 'coa3b_london_east',
            region_name: 'COA 3b London and East',
            geometry: new Polygon([[
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ]]),
          }),
        ],
      }),
      selectedJmcBoundaryLayer,
    });

    expect(synced).toBe(false);
    expect(selectedJmcBoundaryLayer.getSource()?.getFeatures()).toHaveLength(0);
  });
});
