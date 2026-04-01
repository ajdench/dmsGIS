import GeoJSON from 'ol/format/GeoJSON';
import type VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import type { StyleLike } from 'ol/style/Style';
import type {
  OverlayFamily,
  OverlayLayerStyle,
  RegionGroupStyleOverride,
  ViewPresetId,
} from '../../types';
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssetUrls';

const DEV_OVERLAY_SOURCE_VERSION = import.meta.env.DEV
  ? String(Date.now())
  : null;

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
  /** Boundary codes that contain ≥1 facility; drives populated vs unpopulated styling. */
  populatedCodes?: ReadonlySet<string>;
  /** Per-group style overrides from the Regions pane. */
  groupOverrides?: Record<string, RegionGroupStyleOverride>;
  createBoundaryLayer: (
    layer: OverlayLayerStyle,
    preset: ViewPresetId,
    populatedCodes: ReadonlySet<string>,
    groupOverrides?: Record<string, RegionGroupStyleOverride>,
    overlayFamilyVisibility?: Partial<Record<OverlayFamily, boolean>>,
  ) => VectorLayer<VectorSource>;
  getBoundaryLayerStyle: (
    layer: OverlayLayerStyle,
    preset: ViewPresetId,
    populatedCodes: ReadonlySet<string>,
    groupOverrides?: Record<string, RegionGroupStyleOverride>,
    overlayFamilyVisibility?: Partial<Record<OverlayFamily, boolean>>,
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
    populatedCodes = new Set<string>(),
    groupOverrides = {},
    createBoundaryLayer,
    getBoundaryLayerStyle,
    resolveSourceUrl = resolveOverlayBoundarySourceUrl,
    createSource = createOverlayBoundarySource,
  } = params;
  const overlayFamilyVisibility = getOverlayFamilyVisibility(overlayLayers);

  overlayLayers.forEach((layerConfig) => {
    let boundaryLayer = regionBoundaryRefs.get(layerConfig.id);
    if (!boundaryLayer) {
      boundaryLayer = createBoundaryLayer(
        layerConfig,
        activeViewPreset,
        populatedCodes,
        groupOverrides,
        overlayFamilyVisibility,
      );
      regionBoundaryRefs.set(layerConfig.id, boundaryLayer);
      map.addLayer(boundaryLayer);
    }

    const runtimeOverrideSource = runtimeSourceOverrides.get(layerConfig.id) ?? null;
    if (runtimeOverrideSource) {
      if (boundaryLayer.getSource() !== runtimeOverrideSource) {
        boundaryLayer.setSource(runtimeOverrideSource);
      }
      regionBoundaryPathRefs.set(layerConfig.id, `runtime:${layerConfig.id}`);
      boundaryLayer.setVisible(
        getEffectiveBoundaryLayerVisibility(layerConfig, groupOverrides),
      );
      boundaryLayer.setStyle(
        getBoundaryLayerStyle(
          layerConfig,
          activeViewPreset,
          populatedCodes,
          groupOverrides,
          overlayFamilyVisibility,
        ),
      );
      return;
    }

    const shouldBeVisible = getEffectiveBoundaryLayerVisibility(layerConfig, groupOverrides);
    const shouldLazyUnload = layerConfig.family === 'wardSplitWards' && !shouldBeVisible;
    if (shouldLazyUnload) {
      boundaryLayer.setSource(new VectorSource({ wrapX: false }));
      regionBoundaryPathRefs.delete(layerConfig.id);
      boundaryLayer.setVisible(false);
      boundaryLayer.setStyle(
        getBoundaryLayerStyle(
          layerConfig,
          activeViewPreset,
          populatedCodes,
          groupOverrides,
          overlayFamilyVisibility,
        ),
      );
      return;
    }

    const sourceUrl = resolveSourceUrl(layerConfig.path);
    const previousSourceUrl = regionBoundaryPathRefs.get(layerConfig.id);
    if (previousSourceUrl !== sourceUrl || !boundaryLayer.getSource()) {
      boundaryLayer.setSource(createSource(sourceUrl));
      regionBoundaryPathRefs.set(layerConfig.id, sourceUrl);
    }

    boundaryLayer.setVisible(shouldBeVisible);
    boundaryLayer.setStyle(
      getBoundaryLayerStyle(
        layerConfig,
        activeViewPreset,
        populatedCodes,
        groupOverrides,
        overlayFamilyVisibility,
      ),
    );
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
    wrapX: false,
  });
}

export function resolveOverlayBoundarySourceUrl(
  path: string,
  sourceVersion: string | null = DEV_OVERLAY_SOURCE_VERSION,
): string {
  const url = new URL(resolveRuntimeAssetUrl(path));
  if (sourceVersion) {
    url.searchParams.set('v', sourceVersion);
  }
  return url.toString();
}

function getOverlayFamilyVisibility(
  overlayLayers: OverlayLayerStyle[],
): Partial<Record<OverlayFamily, boolean>> {
  return overlayLayers.reduce<Partial<Record<OverlayFamily, boolean>>>(
    (visibility, layer) => {
      visibility[layer.family] = getEffectiveBoundaryLayerVisibility(layer);
      return visibility;
    },
    {},
  );
}

function getEffectiveBoundaryLayerVisibility(
  layer: OverlayLayerStyle,
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
): boolean {
  if (
    layer.family === 'wardSplitWards' ||
    layer.family === 'englandIcb' ||
    layer.family === 'devolvedHb' ||
    layer.family === 'nhsRegions' ||
    layer.family === 'customRegions'
  ) {
    return layer.visible || layer.borderVisible;
  }

  if (layer.family === 'scenarioRegions') {
    return layer.visible || Object.values(groupOverrides).some((override) => override.borderVisible);
  }

  return layer.visible;
}
