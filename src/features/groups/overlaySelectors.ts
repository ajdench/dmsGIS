import type { OverlayFamily, OverlayLayerStyle, ViewPresetId } from '../../types';

export interface OverlayPanelSection {
  family: OverlayFamily;
  title: string;
  layers: OverlayLayerStyle[];
}

export function getOverlayLayersByFamily(
  layers: OverlayLayerStyle[],
  family: OverlayFamily,
): OverlayLayerStyle[] {
  return layers.filter((layer) => layer.family === family);
}

export function getOverlaySectionsForPanel(
  layers: OverlayLayerStyle[],
  activeViewPreset: ViewPresetId,
): OverlayPanelSection[] {
  if (activeViewPreset !== 'current') {
    return [];
  }

  return buildOverlaySections(layers, ['boardBoundaries']);
}

export function getOverlayLayersForPanel(
  layers: OverlayLayerStyle[],
  activeViewPreset: ViewPresetId,
): OverlayLayerStyle[] {
  return getOverlaySectionsForPanel(layers, activeViewPreset).flatMap(
    (section) => section.layers,
  );
}

function buildOverlaySections(
  layers: OverlayLayerStyle[],
  families: OverlayFamily[],
): OverlayPanelSection[] {
  return families
    .map((family) => ({
      family,
      title: getOverlayFamilyTitle(family),
      layers: getOverlayLayersByFamily(layers, family),
    }))
    .filter((section) => section.layers.length > 0);
}

function getOverlayFamilyTitle(family: OverlayFamily): string {
  if (family === 'boardBoundaries') return 'Board Boundaries';
  if (family === 'scenarioRegions') return 'Scenario Regions';
  if (family === 'nhsRegions') return 'NHS Regions';
  return 'Custom Regions';
}
