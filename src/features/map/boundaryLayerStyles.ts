import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import type { OverlayLayerStyle, ViewPresetId } from '../../types';
import {
  getScenarioRegionColor,
  getScenarioRegionName,
} from '../../lib/config/viewPresets';
import { withOpacity } from './mapStyleUtils';

export function createRegionBoundaryLayer(
  layerConfig: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource(),
    style: createRegionBoundaryStyle(layerConfig, activeViewPreset),
    zIndex: getRegionBoundaryLayerZIndex(layerConfig),
  });
}

export function createRegionBoundaryStyle(
  layer: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
) {
  const cache = new Map<string, Style>();

  return (feature: FeatureLike) => {
    if (shouldHideRegionBoundaryFeature(layer, feature)) {
      return undefined;
    }

    const baseColor =
      getJmcBoundaryColor(feature, activeViewPreset) ??
      getFeatureBoundaryFillColor(feature) ??
      layer.swatchColor;
    const strokeColor = getFeatureBoundaryStrokeColor(layer, feature, baseColor);
    const strokeWidth = getFeatureBoundaryStrokeWidth(layer, feature);
    const fillOpacity = getFeatureBoundaryFillOpacity(layer, feature);
    const cacheKey = `${baseColor}:${strokeColor}:${strokeWidth}:${fillOpacity}`;
    const existing = cache.get(cacheKey);
    if (existing) return existing;

    const style = new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
      }),
      fill: new Fill({
        color: withOpacity(baseColor, fillOpacity),
      }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

export function getSelectedJmcOutlineColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const sourceRegionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  return getScenarioRegionColor(
    activeViewPreset,
    sourceRegionName,
    boundaryName,
    'outline',
  );
}

export function getRegionBoundaryLayerZIndex(layer: OverlayLayerStyle): number {
  if (isCoa3aLondonDistrictOverlayLayer(layer)) {
    return 7;
  }
  if (layer.id === 'pmcUnpopulatedCareBoardBoundaries') {
    return 4;
  }
  if (layer.id === 'pmcPopulatedCareBoardBoundaries') {
    return 5;
  }
  if (layer.id === 'careBoardBoundaries') {
    return 6;
  }
  return 4;
}

function getFeatureBoundaryFillOpacity(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): number {
  if (layer.path.includes('UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson')) {
    return feature.get('is_populated') ? 0.3 : 0.2;
  }

  return layer.opacity;
}

function getFeatureBoundaryFillColor(feature: FeatureLike): string | null {
  const rawColor = String(feature.get('fill_color_hex') ?? '').replace('#', '');
  if (/^([0-9a-fA-F]{6})$/.test(rawColor)) {
    return `#${rawColor}`;
  }
  return null;
}

function getFeatureBoundaryStrokeColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
  baseColor: string,
): string {
  const featureLineColor = getFeatureBoundaryLineColor(layer, feature);
  const strokeBaseColor = featureLineColor ??
    (usesPerFeatureBoundaryColor(layer) ? baseColor : layer.borderColor);
  const strokeOpacity = featureLineColor
    ? getFeatureBoundaryLineOpacity(feature)
    : layer.borderOpacity;
  return withOpacity(strokeBaseColor, layer.borderVisible ? strokeOpacity : 0);
}

function usesPerFeatureBoundaryColor(layer: OverlayLayerStyle): boolean {
  return (
    layer.path.includes('UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson')
  );
}

function getFeatureBoundaryLineColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): string | null {
  if (!layer.path.includes('UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson')) {
    return null;
  }
  const rawColor = String(feature.get('line_color_hex') ?? '').replace('#', '');
  if (/^([0-9a-fA-F]{6})$/.test(rawColor)) {
    return `#${rawColor}`;
  }
  return null;
}

function getFeatureBoundaryLineOpacity(feature: FeatureLike): number {
  const alpha = Number(feature.get('line_alpha'));
  if (Number.isFinite(alpha)) {
    return Math.max(0, Math.min(1, alpha / 100));
  }
  return 1;
}

function getFeatureBoundaryStrokeWidth(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): number {
  if (!layer.borderVisible) return 0;
  if (
    isCoa3aLondonDistrictOverlay(layer, feature) ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_geojson.geojson') ||
    layer.path.includes('UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson')
  ) {
    return 1.5;
  }
  const rawWidth = Number(feature.get('line_width'));
  if (
    layer.path.includes('UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson') &&
    Number.isFinite(rawWidth) &&
    rawWidth > 0
  ) {
    return Math.max(0.75, Math.min(2, rawWidth));
  }
  return 1;
}

function shouldHideRegionBoundaryFeature(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) !== 'London District'
  );
}

function isCoa3aLondonDistrictOverlay(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): boolean {
  return (
    isCoa3aLondonDistrictOverlayLayer(layer) &&
    getJmcRegionName(feature) === 'London District'
  );
}

function isCoa3aLondonDistrictOverlayLayer(layer: OverlayLayerStyle): boolean {
  return (
    layer.id === 'pmcUnpopulatedCareBoardBoundaries' &&
    layer.path.includes('UK_JMC_Boundaries_AGOL_Ready_Codex_v01_geojson.geojson')
  );
}

function getJmcRegionName(feature: FeatureLike): string {
  return String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim();
}

function getJmcBoundaryColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const sourceRegionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  const regionName = getScenarioJmcName(feature, activeViewPreset);
  if (!regionName) return null;

  const populationState = feature.get('is_populated') ? 'populated' : 'unpopulated';
  return getScenarioRegionColor(
    activeViewPreset,
    sourceRegionName,
    boundaryName,
    populationState,
  );
}

function getScenarioJmcName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string {
  const regionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  return getScenarioRegionName(activeViewPreset, regionName, boundaryName);
}
