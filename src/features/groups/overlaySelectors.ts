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
  // Legacy families — retained for backward compatibility.
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
  wardSplitFill: {
    family: 'wardSplitFill',
    title: 'Ward Split Fill',
    order: 3,
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
  // Active families.
  regionFill: {
    family: 'regionFill',
    title: 'Region Fill',
    order: 1,
    showWhenEmpty: false,
  },
  englandIcb: {
    family: 'englandIcb',
    title: 'NHS England ICBs',
    order: 5,
    showWhenEmpty: false,
  },
  devolvedHb: {
    family: 'devolvedHb',
    title: 'Devolved Administrations Health Boards',
    order: 6,
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
  const families = getOverlayFamiliesForPanel(activeViewPreset, layers);
  if (families.length === 0) {
    return [];
  }

  return buildOverlaySections(layers, families);
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
    .map(({ order, ...section }) => {
      void order;
      return section;
    });
}

export function getOverlayFamilyOrder(
  family: OverlayFamily,
): number {
  return getOverlayFamilyMetadata(family).order;
}

export function getOverlayFamiliesForPanel(
  activeViewPreset: ViewPresetId,
  layers: OverlayLayerStyle[] = [],
): OverlayFamily[] {
  const preferredFamilies: OverlayFamily[] =
    activeViewPreset === 'current'
      ? [
          'boardBoundaries',
          'nhsRegions',
          'customRegions',
          'englandIcb',
          'devolvedHb',
        ]
      : ['nhsRegions', 'customRegions', 'englandIcb', 'devolvedHb'];
  const availableFamilies = new Set(layers.map((layer) => layer.family));

  return preferredFamilies.filter((family) => availableFamilies.has(family));
}

export function getOverlayPanelEmptyState(
  activeViewPreset: ViewPresetId,
  sectionCount = 0,
): string | null {
  if (sectionCount > 0) {
    return null;
  }

  if (activeViewPreset !== 'current') {
    return 'Additional overlay controls are not available for this preset yet';
  }

  return 'No overlay datasets are available';
}
