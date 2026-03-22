import { describe, expect, it, vi } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {
  syncBoundaryHighlightForPoint,
  syncJmcOutlineHighlight,
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
        'careBoardBoundaries',
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
      regionBoundaryRefs,
      selectedBoundaryLayer,
    });

    expect(result).toEqual({
      boundaryName: 'Boundary A',
      jmcName: 'JMC North',
    });
    expect(selectedBoundaryLayer.getSource()?.getFeatures()).toHaveLength(1);
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
        symbolShape: 'square',
        symbolSize: 7,
        jmcName: 'JMC North',
      },
      selectedPointLayer,
      createSelectedPointStyle,
    });

    expect(setStyle).toHaveBeenCalledTimes(1);
    expect(createSelectedPointStyle).toHaveBeenCalledWith('square', 7, true);
    const feature = source.getFeatures()[0];
    expect(feature?.getGeometry()).toBeInstanceOf(Point);
  });
});
