import type { OverlayFamily, OverlayLayerStyle, ViewPresetId } from '../../types';

export function getOverlayLayersByFamily(
  layers: OverlayLayerStyle[],
  family: OverlayFamily,
): OverlayLayerStyle[] {
  return layers.filter((layer) => layer.family === family);
}

export function getOverlayLayersForPanel(
  layers: OverlayLayerStyle[],
  activeViewPreset: ViewPresetId,
): OverlayLayerStyle[] {
  if (activeViewPreset !== 'current') {
    return [];
  }

  return getOverlayLayersByFamily(layers, 'boardBoundaries');
}
