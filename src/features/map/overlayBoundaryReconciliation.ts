import GeoJSON from 'ol/format/GeoJSON';
import type VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleLike } from 'ol/style/Style';
import type { OverlayLayerStyle, ViewPresetId } from '../../types';

export interface OverlayBoundaryMapLike {
  addLayer: (layer: VectorLayer<VectorSource>) => void;
  removeLayer: (layer: VectorLayer<VectorSource>) => void;
}

interface ReconcileOverlayBoundaryLayersParams {
  map: OverlayBoundaryMapLike;
  overlayLayers: OverlayLayerStyle[];
  activeViewPreset: ViewPresetId;
  regionBoundaryRefs: Map<string, VectorLayer<VectorSource>>;
  regionBoundaryPathRefs: Map<string, string>;
  runtimeSourceOverrides?: Map<string, VectorSource>;
  createBoundaryLayer: (
    layer: OverlayLayerStyle,
    preset: ViewPresetId,
  ) => VectorLayer<VectorSource>;
  getBoundaryLayerStyle: (
    layer: OverlayLayerStyle,
    preset: ViewPresetId,
  ) => StyleLike;
  resolveSourceUrl?: (path: string) => string;
  createSource?: (url: string) => VectorSource;
}

export function reconcileOverlayBoundaryLayers(
  params: ReconcileOverlayBoundaryLayersParams,
): void {
  const {
    map,
    overlayLayers,
    activeViewPreset,
    regionBoundaryRefs,
    regionBoundaryPathRefs,
    runtimeSourceOverrides = new Map(),
    createBoundaryLayer,
    getBoundaryLayerStyle,
    resolveSourceUrl = resolveOverlayBoundarySourceUrl,
    createSource = createOverlayBoundarySource,
  } = params;

  overlayLayers.forEach((layerConfig) => {
    let boundaryLayer = regionBoundaryRefs.get(layerConfig.id);
    if (!boundaryLayer) {
      boundaryLayer = createBoundaryLayer(layerConfig, activeViewPreset);
      regionBoundaryRefs.set(layerConfig.id, boundaryLayer);
      map.addLayer(boundaryLayer);
    }

    const runtimeOverrideSource = runtimeSourceOverrides.get(layerConfig.id) ?? null;
    if (runtimeOverrideSource) {
      if (boundaryLayer.getSource() !== runtimeOverrideSource) {
        boundaryLayer.setSource(runtimeOverrideSource);
      }
      regionBoundaryPathRefs.set(layerConfig.id, `runtime:${layerConfig.id}`);
      boundaryLayer.setVisible(layerConfig.visible);
      boundaryLayer.setStyle(getBoundaryLayerStyle(layerConfig, activeViewPreset));
      return;
    }

    const sourceUrl = resolveSourceUrl(layerConfig.path);
    const previousSourceUrl = regionBoundaryPathRefs.get(layerConfig.id);
    if (previousSourceUrl !== sourceUrl || !boundaryLayer.getSource()) {
      boundaryLayer.setSource(createSource(sourceUrl));
      regionBoundaryPathRefs.set(layerConfig.id, sourceUrl);
    }

    boundaryLayer.setVisible(layerConfig.visible);
    boundaryLayer.setStyle(getBoundaryLayerStyle(layerConfig, activeViewPreset));
  });

  const activeIds = new Set(overlayLayers.map((layer) => layer.id));
  regionBoundaryRefs.forEach((layerRef, id) => {
    if (activeIds.has(id)) return;
    map.removeLayer(layerRef);
    regionBoundaryRefs.delete(id);
    regionBoundaryPathRefs.delete(id);
  });
}

export function createOverlayBoundarySource(url: string): VectorSource {
  return new VectorSource({
    url,
    format: new GeoJSON(),
  });
}

export function resolveOverlayBoundarySourceUrl(path: string): string {
  return new URL(
    path,
    new URL(import.meta.env.BASE_URL, window.location.origin),
  ).toString();
}
