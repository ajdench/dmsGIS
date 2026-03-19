import { describe, expect, it, vi } from 'vitest';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Style } from 'ol/style';
import type { LayerState } from '../src/types';
import {
  createRuntimeVectorLayer,
  reconcileRuntimeLayers,
} from '../src/features/map/runtimeLayerReconciliation';

function createLayerState(overrides: Partial<LayerState> = {}): LayerState {
  return {
    id: 'facilities',
    name: 'Facilities',
    type: 'point',
    path: 'data/facilities/facilities.geojson',
    visible: true,
    opacity: 1,
    ...overrides,
  };
}

describe('runtimeLayerReconciliation', () => {
  it('creates and syncs missing runtime layers', () => {
    const map = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const layerRefs = new Map<string, VectorLayer<VectorSource>>();
    const style = new Style();

    reconcileRuntimeLayers({
      map,
      layers: [createLayerState({ opacity: 0.35 })],
      layerRefs,
      getLayerStyle: () => style,
    });

    const vectorLayer = layerRefs.get('facilities');
    expect(map.addLayer).toHaveBeenCalledTimes(1);
    expect(vectorLayer).toBeInstanceOf(VectorLayer);
    expect(vectorLayer?.getStyle()).toBe(style);
    expect(vectorLayer?.getVisible()).toBe(true);
    expect(vectorLayer?.getOpacity()).toBe(0.35);
  });

  it('updates existing runtime layers and removes stale ones', () => {
    const map = {
      addLayer: vi.fn(),
      removeLayer: vi.fn(),
    };
    const staleLayer = new VectorLayer({ source: new VectorSource() });
    const activeLayer = new VectorLayer({ source: new VectorSource() });
    const layerRefs = new Map<string, VectorLayer<VectorSource>>([
      ['facilities', activeLayer],
      ['stale', staleLayer],
    ]);
    const nextStyle = new Style();

    reconcileRuntimeLayers({
      map,
      layers: [createLayerState({ visible: false, opacity: 0.5 })],
      layerRefs,
      getLayerStyle: () => nextStyle,
    });

    expect(map.addLayer).not.toHaveBeenCalled();
    expect(activeLayer.getStyle()).toBe(nextStyle);
    expect(activeLayer.getVisible()).toBe(false);
    expect(activeLayer.getOpacity()).toBe(0.5);
    expect(map.removeLayer).toHaveBeenCalledWith(staleLayer);
    expect(layerRefs.has('stale')).toBe(false);
  });

  it('creates point layers above polygon layers by default', () => {
    const pointLayer = createRuntimeVectorLayer(
      createLayerState({ type: 'point' }),
      new Style(),
    );
    const polygonLayer = createRuntimeVectorLayer(
      createLayerState({
        id: 'regions',
        name: 'Regions',
        type: 'polygon',
        path: 'data/regions/regions.geojson',
      }),
      new Style(),
    );

    expect(pointLayer.getZIndex()).toBe(35);
    expect(polygonLayer.getZIndex()).toBe(1);
  });
});
