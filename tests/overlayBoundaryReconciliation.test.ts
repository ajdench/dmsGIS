import { describe, expect, it, vi } from 'vitest';
import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';
import type { OverlayLayerStyle } from '../src/types';
import { reconcileOverlayBoundaryLayers } from '../src/features/map/overlayBoundaryReconciliation';

function createOverlayLayer(
  overrides: Partial<OverlayLayerStyle> = {},
): OverlayLayerStyle {
  return {
    id: 'careBoardBoundaries',
    name: 'Care board boundaries',
    path: 'data/regions/board.geojson',
    family: 'boardBoundaries',
    visible: true,
    opacity: 0.3,
    borderVisible: true,
    borderColor: '#ffffff',
    borderOpacity: 0,
    swatchColor: '#ed5151',
    ...overrides,
  };
}

describe('overlayBoundaryReconciliation', () => {
  it('creates and syncs missing overlay boundary layers', () => {
    const map = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const regionBoundaryRefs = new Map<string, VectorLayer<VectorSource>>();
    const regionBoundaryPathRefs = new Map<string, string>();
    const createdLayer = new VectorLayer({ source: new VectorSource() });
    const style = new Style();

    reconcileOverlayBoundaryLayers({
      map,
      overlayLayers: [createOverlayLayer()],
      activeViewPreset: 'current',
      regionBoundaryRefs,
      regionBoundaryPathRefs,
      createBoundaryLayer: vi.fn(() => createdLayer),
      getBoundaryLayerStyle: vi.fn(() => style),
      resolveSourceUrl: (path) => `https://example.test/${path}`,
      createSource: (url) =>
        new VectorSource({
          url,
          format: new GeoJSON(),
        }),
    });

    expect(map.addLayer).toHaveBeenCalledWith(createdLayer);
    expect(regionBoundaryRefs.get('careBoardBoundaries')).toBe(createdLayer);
    expect(regionBoundaryPathRefs.get('careBoardBoundaries')).toBe(
      'https://example.test/data/regions/board.geojson',
    );
    expect(createdLayer.getVisible()).toBe(true);
    expect(createdLayer.getStyle()).toBe(style);
    expect(createdLayer.getSource()?.getUrl()).toBe(
      'https://example.test/data/regions/board.geojson',
    );
  });

  it('reuses unchanged boundary sources and removes stale layers', () => {
    const map = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const activeLayer = new VectorLayer({
      source: new VectorSource({
        url: 'https://example.test/data/regions/board.geojson',
        format: new GeoJSON(),
      }),
    });
    const staleLayer = new VectorLayer({ source: new VectorSource() });
    const regionBoundaryRefs = new Map<string, VectorLayer<VectorSource>>([
      ['careBoardBoundaries', activeLayer],
      ['stale', staleLayer],
    ]);
    const regionBoundaryPathRefs = new Map<string, string>([
      ['careBoardBoundaries', 'https://example.test/data/regions/board.geojson'],
      ['stale', 'https://example.test/data/regions/stale.geojson'],
    ]);
    const style = new Style();
    const existingSource = activeLayer.getSource();

    reconcileOverlayBoundaryLayers({
      map,
      overlayLayers: [createOverlayLayer({ visible: false })],
      activeViewPreset: 'coa3a',
      regionBoundaryRefs,
      regionBoundaryPathRefs,
      createBoundaryLayer: vi.fn(),
      getBoundaryLayerStyle: vi.fn(() => style),
      resolveSourceUrl: (path) => `https://example.test/${path}`,
    });

    expect(map.addLayer).not.toHaveBeenCalled();
    expect(activeLayer.getSource()).toBe(existingSource);
    expect(activeLayer.getVisible()).toBe(false);
    expect(activeLayer.getStyle()).toBe(style);
    expect(map.removeLayer).toHaveBeenCalledWith(staleLayer);
    expect(regionBoundaryRefs.has('stale')).toBe(false);
    expect(regionBoundaryPathRefs.has('stale')).toBe(false);
  });

  it('refreshes the source when the dataset path changes', () => {
    const map = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const activeLayer = new VectorLayer({
      source: new VectorSource({
        url: 'https://example.test/data/regions/board.geojson',
        format: new GeoJSON(),
      }),
    });
    const regionBoundaryRefs = new Map<string, VectorLayer<VectorSource>>([
      ['careBoardBoundaries', activeLayer],
    ]);
    const regionBoundaryPathRefs = new Map<string, string>([
      ['careBoardBoundaries', 'https://example.test/data/regions/board.geojson'],
    ]);

    reconcileOverlayBoundaryLayers({
      map,
      overlayLayers: [
        createOverlayLayer({
          path: 'data/regions/board-next.geojson',
        }),
      ],
      activeViewPreset: 'coa3b',
      regionBoundaryRefs,
      regionBoundaryPathRefs,
      createBoundaryLayer: vi.fn(),
      getBoundaryLayerStyle: vi.fn(() => new Style()),
      resolveSourceUrl: (path) => `https://example.test/${path}`,
    });

    expect(activeLayer.getSource()?.getUrl()).toBe(
      'https://example.test/data/regions/board-next.geojson',
    );
    expect(regionBoundaryPathRefs.get('careBoardBoundaries')).toBe(
      'https://example.test/data/regions/board-next.geojson',
    );
  });
});
