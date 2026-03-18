import type { OverlayFamily, OverlayLayerStyle, ViewPresetId } from '../../types';

export interface OverlayFamilyMetadata {
  family: OverlayFamily;
  title: string;
  order: number;
  showWhenEmpty: boolean;
}

export interface OverlayPanelSection {
  family: OverlayFamily;
  title: string;
  showWhenEmpty: boolean;
  layers: OverlayLayerStyle[];
}

const OVERLAY_FAMILY_METADATA: Record<OverlayFamily, OverlayFamilyMetadata> = {
  boardBoundaries: {
    family: 'boardBoundaries',
    title: 'Board Boundaries',
    order: 1,
    showWhenEmpty: false,
  },
  scenarioRegions: {
    family: 'scenarioRegions',
    title: 'Scenario Regions',
    order: 2,
    showWhenEmpty: false,
  },
  nhsRegions: {
    family: 'nhsRegions',
    title: 'NHS Regions',
    order: 3,
    showWhenEmpty: false,
  },
  customRegions: {
    family: 'customRegions',
    title: 'Custom Regions',
    order: 4,
    showWhenEmpty: false,
  },
};

export function getOverlayLayersByFamily(
  layers: OverlayLayerStyle[],
  family: OverlayFamily,
): OverlayLayerStyle[] {
  return layers.filter((layer) => layer.family === family);
}

export function getOverlayFamilyMetadata(
  family: OverlayFamily,
): OverlayFamilyMetadata {
  return OVERLAY_FAMILY_METADATA[family];
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
    .map((family) => {
      const metadata = getOverlayFamilyMetadata(family);
      return {
        family,
        title: metadata.title,
        showWhenEmpty: metadata.showWhenEmpty,
        order: metadata.order,
        layers: getOverlayLayersByFamily(layers, family),
      };
    })
    .filter((section) => section.showWhenEmpty || section.layers.length > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...section }) => section);
}

export function getOverlayFamilyOrder(
  family: OverlayFamily,
): number {
  return getOverlayFamilyMetadata(family).order;
}

export function getOverlayFamiliesForPanel(
  activeViewPreset: ViewPresetId,
): OverlayFamily[] {
  if (activeViewPreset !== 'current') {
    return [];
  }

  return ['boardBoundaries'];
}

export function getOverlayPanelEmptyState(
  activeViewPreset: ViewPresetId,
): string | null {
  if (activeViewPreset === 'current') {
    return null;
  }

  return null;
}
