import GeoJSON from 'ol/format/GeoJSON';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleLike } from 'ol/style/Style';
import type { LayerState } from '../../types';
import { WHOLE_WORLD_RENDER_EXTENT_3857 } from './worldExtent';

export interface RuntimeLayerMapLike {
  addLayer: (layer: VectorLayer<VectorSource>) => void;
  removeLayer: (layer: VectorLayer<VectorSource>) => void;
}

interface ReconcileRuntimeLayersParams {
  map: RuntimeLayerMapLike;
  layers: LayerState[];
  layerRefs: Map<string, VectorLayer<VectorSource>>;
  getLayerStyle: (layer: LayerState) => StyleLike;
  createLayer?: (
    layer: LayerState,
    style: StyleLike,
  ) => VectorLayer<VectorSource>;
}

export function reconcileRuntimeLayers(
  params: ReconcileRuntimeLayersParams,
): void {
  const {
    map,
    layers,
    layerRefs,
    getLayerStyle,
    createLayer = createRuntimeVectorLayer,
  } = params;

  layers.forEach((layer) => {
    const style = getLayerStyle(layer);
    let vectorLayer = layerRefs.get(layer.id);

    if (!vectorLayer) {
      vectorLayer = createLayer(layer, style);
      layerRefs.set(layer.id, vectorLayer);
      map.addLayer(vectorLayer);
    }

    vectorLayer.setStyle(style);
    vectorLayer.setVisible(layer.visible);
    vectorLayer.setOpacity(layer.opacity);
  });

  const activeIds = new Set(layers.map((layer) => layer.id));
  layerRefs.forEach((vectorLayer, id) => {
    if (activeIds.has(id)) return;
    map.removeLayer(vectorLayer);
    layerRefs.delete(id);
  });
}

export function createRuntimeVectorLayer(
  layer: LayerState,
  style: StyleLike,
): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({
      url: layer.path,
      format: new GeoJSON(),
      wrapX: false,
    }),
    extent: WHOLE_WORLD_RENDER_EXTENT_3857,
    zIndex: layer.type === 'point' ? 35 : 1,
    style,
  });
}
