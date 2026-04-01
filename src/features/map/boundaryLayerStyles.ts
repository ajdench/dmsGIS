import type { FeatureLike } from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import MultiLineString from 'ol/geom/MultiLineString';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import type {
  OverlayFamily,
  OverlayLayerStyle,
  RegionGroupStyleOverride,
  ViewPresetId,
} from '../../types';
import {
  BOARD_BOUNDARY_BASE_STYLE,
  getGroupNameForCode,
  getRegionGroup,
  getScenarioWardSplitParentCodes,
} from '../../lib/config/viewPresets';
import { getActiveWaterEdgeVisualProfile } from '../../lib/config/waterEdgeTreatment';
import { withOpacity } from './mapStyleUtils';

const REGION_FILL_SEAM_STROKE_WIDTH = 0.2;
const REGION_FILL_SEAM_STROKE_ALPHA_FACTOR = 0.18;
const REGION_FILL_SEAM_STROKE_MAX_ALPHA = 0.08;
const WATER_EDGE_ARC_WIDTH_BONUS = 0.35;
const WATER_EDGE_MASK_WIDTH_BONUS = 0.95;
const WATER_EDGE_GROUP_NAME_CACHE = new WeakMap<object, string>();

// ---------------------------------------------------------------------------
// Layer creation
// ---------------------------------------------------------------------------

export function createRegionBoundaryLayer(
  layerConfig: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
  populatedCodes: ReadonlySet<string> = new Set(),
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
  overlayFamilyVisibility: Partial<Record<OverlayFamily, boolean>> = {},
): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: createRegionBoundaryStyle(
      layerConfig,
      activeViewPreset,
      populatedCodes,
      groupOverrides,
      overlayFamilyVisibility,
    ),
    zIndex: getRegionBoundaryLayerZIndex(layerConfig),
  });
}

/** @deprecated Ward splits are reconciled via createRegionBoundaryLayer. Retained for potential direct use. */
export function createWardSplitLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: createWardSplitStyle(),
    zIndex: 4,
  });
}

// ---------------------------------------------------------------------------
// Style factories
// ---------------------------------------------------------------------------

export function createRegionBoundaryStyle(
  layer: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
  populatedCodes: ReadonlySet<string> = new Set(),
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
  overlayFamilyVisibility: Partial<Record<OverlayFamily, boolean>> = {},
) {
  // Dispatch to dedicated style factories for filtered / non-code boundary layers.
  if (layer.family === 'englandIcb') return createEnglandIcbStyle(layer);
  if (layer.family === 'devolvedHb') {
    return createDevolvedHbStyle(layer, overlayFamilyVisibility);
  }
  if (layer.family === 'nhsRegions' || layer.family === 'customRegions') {
    return createGenericOverlayOutlineStyle(layer);
  }
  if (layer.family === 'wardSplitFill') return createWardSplitStyle(groupOverrides);
  if (layer.family === 'scenarioRegions') {
    return createScenarioRegionOutlineStyle(
      layer,
      activeViewPreset,
      groupOverrides,
    );
  }

  const cache = new Map<string, Style>();
  const hiddenWardSplitParentCodes = layer.family === 'regionFill'
    ? getScenarioWardSplitParentCodes(activeViewPreset)
    : new Set<string>();

  return (feature: FeatureLike) => {
    const boundaryCode = String(feature.get('boundary_code') ?? '').trim();
    if (hiddenWardSplitParentCodes.has(boundaryCode)) {
      return undefined;
    }

    const groupName = getFeatureRegionGroupName(feature, activeViewPreset);
    const group = groupName ? getRegionGroup(activeViewPreset, groupName) : null;
    const override = groupName ? (groupOverrides[groupName] ?? null) : null;

    const isPopulated = populatedCodes.has(boundaryCode);

    // Respect per-group visibility override.
    if (override && !override.visible) return undefined;

    // Respect per-fill visibility flags when a group is known.
    if (group && override) {
      const fillVisible = isPopulated
        ? (override.populatedFillVisible ?? true)
        : (override.unpopulatedFillVisible ?? true);
      if (!fillVisible) return undefined;
    }

    // Select fill color by population state, or fall back to per-feature/swatch.
    // Per-group overrides can supply an explicit fill colour (null = use config default).
    const baseColor = group
      ? (isPopulated
          ? (override?.populatedFillColor ?? group.colors.populated)
          : (override?.unpopulatedFillColor ?? group.colors.unpopulated))
      : (getFeatureBoundaryFillColor(feature) ?? layer.swatchColor);

    const fillOpacity = group
      ? (isPopulated
          ? (override?.populatedOpacity ?? group.populatedOpacity)
          : (override?.unpopulatedOpacity ?? group.unpopulatedOpacity))
      : layer.opacity;
    const fillColor = withOpacity(baseColor, fillOpacity);

    const usesSeamStroke = layer.family === 'regionFill';

    const strokeColor = usesSeamStroke
      ? withOpacity(
          baseColor,
          Math.min(fillOpacity * REGION_FILL_SEAM_STROKE_ALPHA_FACTOR, REGION_FILL_SEAM_STROKE_MAX_ALPHA),
        )
      : getFeatureBoundaryStrokeColor(layer, feature, baseColor, group, override);
    const strokeWidth = usesSeamStroke
      ? REGION_FILL_SEAM_STROKE_WIDTH
      : getFeatureBoundaryStrokeWidth(layer, feature, override);

    const cacheKey = `${usesSeamStroke}:${baseColor}:${fillOpacity}:${strokeColor}:${strokeWidth}`;
    const existing = cache.get(cacheKey);
    if (existing) return existing;

    const style = new Style({
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      fill: new Fill({ color: fillColor }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

/**
 * Style function for ward-split sub-polygons (Current preset, 3 special ICBs).
 * Features carry `region_ref` (DPHC group name).  All ward-split features are
 * coloured as populated.  Zero border by default (matches regionFill behaviour).
 */
export function createWardSplitStyle(
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
) {
  const cache = new Map<string, Style>();

  return (feature: FeatureLike) => {
    const regionRef = String(feature.get('region_ref') ?? '').trim();
    const group = regionRef ? getRegionGroup('current', regionRef) : null;
    const override = regionRef ? (groupOverrides[regionRef] ?? null) : null;

    // Respect per-group visibility override.
    if (override && !override.visible) return undefined;
    if (override && !(override.populatedFillVisible ?? true)) return undefined;

    const baseColor = (override?.populatedFillColor ?? group?.colors.populated) ?? '#8f8f8f';
    const fillOpacity = override?.populatedOpacity ?? group?.populatedOpacity ?? 0.7;
    const strokeColor = withOpacity(
      baseColor,
      Math.min(
        fillOpacity * REGION_FILL_SEAM_STROKE_ALPHA_FACTOR,
        REGION_FILL_SEAM_STROKE_MAX_ALPHA,
      ),
    );

    const cacheKey = `${baseColor}:${fillOpacity}:${strokeColor}`;
    const existing = cache.get(cacheKey);
    if (existing) return existing;

    const style = new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: REGION_FILL_SEAM_STROKE_WIDTH,
      }),
      fill: new Fill({ color: withOpacity(baseColor, fillOpacity) }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

export function createScenarioRegionOutlineStyle(
  layer: OverlayLayerStyle,
  activeViewPreset: ViewPresetId,
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
) {
  const cache = new Map<string, Style>();

  return (feature: FeatureLike) => {
    const groupName = getFeatureRegionGroupName(feature, activeViewPreset);
    if (!groupName) {
      return undefined;
    }

    const group = getRegionGroup(activeViewPreset, groupName);
    const override = groupOverrides[groupName] ?? null;
    const borderVisible = override?.borderVisible ?? false;
    if (!borderVisible) {
      return undefined;
    }

    const borderColor = override?.borderColor ?? group?.borderColor ?? layer.borderColor;
    const borderOpacity = override?.borderOpacity ?? group?.borderOpacity ?? layer.borderOpacity;
    const borderWidth = override?.borderWidth ?? group?.borderWidth ?? layer.borderWidth ?? 1;
    const strokeColor = withOpacity(borderColor, borderOpacity);
    const cacheKey = `${groupName}:${strokeColor}:${borderWidth}`;
    const existing = cache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const style = new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: borderWidth,
        lineCap: 'round',
        lineJoin: 'round',
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0)',
      }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

export function createGenericOverlayOutlineStyle(layer: OverlayLayerStyle) {
  const cache = new Map<string, Style>();

  return () => {
    const strokeColor = withOpacity(
      layer.borderColor,
      layer.borderVisible ? layer.borderOpacity : 0,
    );
    const fillColor = withOpacity(layer.swatchColor, layer.visible ? layer.opacity : 0);
    const borderWidth = layer.borderWidth ?? 1;
    const cacheKey = `${strokeColor}:${fillColor}:${borderWidth}`;
    const existing = cache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const style = new Style({
      stroke: new Stroke({
        color: strokeColor,
        width: borderWidth,
        lineCap: 'round',
        lineJoin: 'round',
      }),
      fill: new Fill({
        color: fillColor,
      }),
    });
    cache.set(cacheKey, style);
    return style;
  };
}

export function createSplitInternalArcStyle(
  layer: OverlayLayerStyle,
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
) {
  const style = new Style({
    stroke: new Stroke({
      color: withOpacity(
        layer.borderColor || BOARD_BOUNDARY_BASE_STYLE.borderColor,
        layer.borderVisible ? layer.borderOpacity : 0,
      ),
      width: layer.borderVisible ? (layer.borderWidth ?? 1) : 0,
      lineDash: [5, 5],
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });

  return (feature: FeatureLike) => {
    const leftRegion = String(feature.get('left_region_ref') ?? '').trim();
    const rightRegion = String(feature.get('right_region_ref') ?? '').trim();
    if (!leftRegion || !rightRegion) {
      return undefined;
    }

    const leftVisible = groupOverrides[leftRegion]?.visible ?? true;
    const rightVisible = groupOverrides[rightRegion]?.visible ?? true;
    if (!leftVisible || !rightVisible) {
      return undefined;
    }

    return style;
  };
}

export function createWaterEdgeArcStyle(
  layer: OverlayLayerStyle,
  targetFamily: 'englandIcb' | 'devolvedHb',
  strokeHex: string = layer.borderColor,
) {
  const visualProfile = getActiveWaterEdgeVisualProfile();
  const inlandWaterStyle = new Style({
    stroke: new Stroke({
      color: withOpacity(
        strokeHex,
        layer.borderVisible ? visualProfile.inlandWaterArcOpacity : 0,
      ),
      width: layer.borderVisible ? (layer.borderWidth ?? 1) + WATER_EDGE_ARC_WIDTH_BONUS : 0,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });
  const estuaryStyle = new Style({
    stroke: new Stroke({
      color: withOpacity(
        strokeHex,
        layer.borderVisible ? visualProfile.estuaryArcOpacity : 0,
      ),
      width: layer.borderVisible ? (layer.borderWidth ?? 1) + WATER_EDGE_ARC_WIDTH_BONUS : 0,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });

  return (feature: FeatureLike) => {
    if (feature.get('internal')) {
      return undefined;
    }

    const edgeClass = String(feature.get('edge_class') ?? '').trim();
    if (edgeClass !== 'inlandWater' && edgeClass !== 'estuary') {
      return undefined;
    }

    const leftType = String(feature.get('left_type') ?? '').trim();
    const belongsToEngland = leftType === 'ICB';
    if (targetFamily === 'englandIcb') {
      if (!belongsToEngland) return undefined;
      return edgeClass === 'inlandWater' ? inlandWaterStyle : estuaryStyle;
    }

    if (belongsToEngland) return undefined;
    return edgeClass === 'inlandWater' ? inlandWaterStyle : estuaryStyle;
  };
}

export function createWaterEdgeBorderModifierStyle(
  activeViewPreset: ViewPresetId,
  targetFamily: 'englandIcb' | 'devolvedHb',
  regionBoundaryRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
  groupOverrides: Record<string, RegionGroupStyleOverride> = {},
  seaMaskColor = 'rgba(0, 0, 0, 0)',
) {
  const visualProfile = getActiveWaterEdgeVisualProfile();
  const cache = new Map<string, Style[]>();

  return (feature: FeatureLike) => {
    if (feature.get('internal')) {
      return undefined;
    }

    const edgeClass = String(feature.get('edge_class') ?? '').trim();
    if (edgeClass !== 'inlandWater') {
      return undefined;
    }

    const leftType = String(feature.get('left_type') ?? '').trim();
    const belongsToEngland = leftType === 'ICB';
    if (targetFamily === 'englandIcb') {
      if (!belongsToEngland) return undefined;
    } else if (belongsToEngland) {
      return undefined;
    }

    const groupName = resolveWaterEdgeRegionGroupName(
      feature,
      activeViewPreset,
      regionBoundaryRefs,
    );
    if (!groupName) {
      return undefined;
    }

    const group = getRegionGroup(activeViewPreset, groupName);
    if (!group) {
      return undefined;
    }
    const override = groupOverrides[groupName] ?? null;
    if (override && !override.visible) {
      return undefined;
    }

    const borderVisible = override?.borderVisible ?? false;
    if (!borderVisible) {
      return undefined;
    }

    const borderColor = override?.borderColor ?? group.borderColor;
    const borderWidth = override?.borderWidth ?? group.borderWidth ?? 1;
    const cacheKey = `${groupName}:${borderColor}:${borderWidth}:${seaMaskColor}`;
    const existing = cache.get(cacheKey);
    if (existing) {
      return existing;
    }

    const styles = [
      new Style({
        stroke: new Stroke({
          color: seaMaskColor,
          width: borderWidth + WATER_EDGE_MASK_WIDTH_BONUS,
          lineCap: 'round',
          lineJoin: 'round',
        }),
      }),
      new Style({
        stroke: new Stroke({
          color: withOpacity(borderColor, visualProfile.inlandWaterArcOpacity),
          width: borderWidth + WATER_EDGE_ARC_WIDTH_BONUS,
          lineCap: 'round',
          lineJoin: 'round',
        }),
      }),
    ];
    cache.set(cacheKey, styles);
    return styles;
  };
}

export function createSelectedWaterEdgeModifierStyle(
  selectionColor: string | null,
  seaMaskColor = 'rgba(0, 0, 0, 0)',
) {
  const visualProfile = getActiveWaterEdgeVisualProfile();
  const selectedColor = selectionColor ?? '#419632';
  const selectedWidth = 2;
  return [
    new Style({
      stroke: new Stroke({
        color: seaMaskColor,
        width: selectedWidth + WATER_EDGE_MASK_WIDTH_BONUS,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    }),
    new Style({
      stroke: new Stroke({
        color: withOpacity(selectedColor, visualProfile.inlandArcSelectedOpacity),
        width: selectedWidth,
        lineCap: 'round',
        lineJoin: 'round',
      }),
    }),
  ];
}

/**
 * Style for the `englandIcb` overlay: renders topology edge LineString features
 * that are internal (shared between two polygons) and where at least one side
 * is an ICB boundary type.  This covers ICB-ICB and ICB-LHB internal edges.
 * External/coastal arcs and devolved-only arcs are hidden.
 */
export function createEnglandIcbStyle(layer: OverlayLayerStyle) {
  const strokeColor = withOpacity(
    layer.borderColor,
    layer.borderVisible ? layer.borderOpacity : 0,
  );
  const activeStyle = new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: layer.borderWidth ?? 1,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });

  return (feature: FeatureLike) => {
    if (!feature.get('internal')) return undefined;
    const leftType = String(feature.get('left_type') ?? '').trim();
    const rightType = String(feature.get('right_type') ?? '').trim();
    // Show edges where at least one side is an ICB (England).
    return (leftType === 'ICB' || rightType === 'ICB') ? activeStyle : undefined;
  };
}

/**
 * Style for the `devolvedHb` overlay: renders topology edge LineString features
 * that are internal and where neither side is an ICB boundary type.
 * This covers LHB-LHB (Wales), SHB-SHB (Scotland), and NIHB-NIHB (N. Ireland)
 * internal edges.  ICB-adjacent arcs and coastal arcs are hidden.
 */
export function createDevolvedHbStyle(
  layer: OverlayLayerStyle,
  overlayFamilyVisibility: Partial<Record<OverlayFamily, boolean>> = {},
) {
  const strokeColor = withOpacity(
    layer.borderColor,
    layer.borderVisible ? layer.borderOpacity : 0,
  );
  const englandIcbVisible = overlayFamilyVisibility.englandIcb ?? true;
  const activeStyle = new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: layer.borderWidth ?? 1,
      lineCap: 'round',
      lineJoin: 'round',
    }),
  });

  return (feature: FeatureLike) => {
    if (!feature.get('internal')) return undefined;
    const leftType = String(feature.get('left_type') ?? '').trim();
    const rightType = String(feature.get('right_type') ?? '').trim();
    const leftIsIcb = leftType === 'ICB';
    const rightIsIcb = rightType === 'ICB';
    if (!leftIsIcb && !rightIsIcb) {
      return activeStyle;
    }

    // England/devolved shared arcs should remain available through the devolved
    // overlay when England ICB borders are hidden, but avoid double-drawing the
    // same line when both overlays are visible.
    const isEnglandDevolvedBoundary = leftIsIcb !== rightIsIcb;
    if (isEnglandDevolvedBoundary && !englandIcbVisible) {
      return activeStyle;
    }

    return undefined;
  };
}

// ---------------------------------------------------------------------------
// Selected-outline helper (used by selection highlights)
// ---------------------------------------------------------------------------

export function getSelectedJmcOutlineColor(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string | null {
  const groupName = getFeatureRegionGroupName(feature, activeViewPreset);
  if (!groupName) return null;
  const group = getRegionGroup(activeViewPreset, groupName);
  return group?.colors.outline ?? null;
}

// ---------------------------------------------------------------------------
// Z-index
// ---------------------------------------------------------------------------

export function getRegionBoundaryLayerZIndex(layer: OverlayLayerStyle): number {
  // Z-order: regionFill / wardSplitFill → 4, englandIcb / devolvedHb → 6, outline → 7
  if (layer.family === 'regionFill') return 4;
  if (layer.family === 'wardSplitFill') return 4;
  if (layer.family === 'nhsRegions') return 5;
  if (layer.family === 'customRegions') return 5;
  if (layer.family === 'englandIcb') return 6;
  if (layer.family === 'devolvedHb') return 6;
  if (layer.family === 'scenarioRegions') return 5;
  return 4;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function getFeatureBoundaryFillColor(feature: FeatureLike): string | null {
  const rawColor = String(feature.get('fill_color_hex') ?? '').replace('#', '');
  if (/^([0-9a-fA-F]{6})$/.test(rawColor)) {
    return `#${rawColor}`;
  }
  return null;
}

function getFeatureRegionGroupName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId,
): string | null {
  const runtimeRegionName = String(
    feature.get('region_name') ?? feature.get('jmc_name') ?? '',
  ).trim();
  if (runtimeRegionName && getRegionGroup(activeViewPreset, runtimeRegionName)) {
    return runtimeRegionName;
  }

  const boundaryCode = String(feature.get('boundary_code') ?? '').trim();
  return getGroupNameForCode(activeViewPreset, boundaryCode);
}

function getFeatureBoundaryStrokeColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
  baseColor: string,
  group: ReturnType<typeof getRegionGroup>,
  override: RegionGroupStyleOverride | null = null,
): string {
  // Health Board file carries per-feature line colours.
  const featureLineColor = getFeatureBoundaryLineColor(layer, feature);
  if (featureLineColor) {
    const lineOpacity = getFeatureBoundaryLineOpacity(feature);
    return withOpacity(featureLineColor, layer.borderVisible ? lineOpacity : 0);
  }

  // Per-group override border handling.
  if (override) {
    const borderVisible = override.borderVisible;
    return withOpacity(override.borderColor, borderVisible ? override.borderOpacity : 0);
  }

  // Preset-group border handling (no override).
  if (group) {
    return withOpacity(group.borderColor, layer.borderVisible ? group.borderOpacity : 0);
  }

  return withOpacity(layer.borderColor, layer.borderVisible ? layer.borderOpacity : 0);
}

function getFeatureBoundaryLineColor(
  layer: OverlayLayerStyle,
  feature: FeatureLike,
): string | null {
  if (!layer.path.includes('UK_Health_Board_Boundaries_Codex_2026')) {
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
  override: RegionGroupStyleOverride | null = null,
): number {
  // Per-group override: use override border visibility and width.
  if (override) return override.borderVisible ? (override.borderWidth ?? 1) : 0;

  if (!layer.borderVisible) return 0;

  // Health Board file carries per-feature line widths.
  if (layer.path.includes('UK_Health_Board_Boundaries_Codex_2026')) {
    const rawWidth = Number(feature.get('line_width'));
    if (Number.isFinite(rawWidth) && rawWidth > 0) {
      return Math.max(0.75, Math.min(2, rawWidth));
    }
  }

  return 1;
}

function resolveWaterEdgeRegionGroupName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId,
  regionBoundaryRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): string | null {
  if (typeof feature === 'object' && feature !== null) {
    const cachedGroupName = WATER_EDGE_GROUP_NAME_CACHE.get(feature);
    if (cachedGroupName) {
      return cachedGroupName;
    }
  }

  const hiddenParentCodes = getScenarioWardSplitParentCodes(activeViewPreset);
  const leftCode = String(feature.get('left_code') ?? '').trim();
  if (leftCode && !hiddenParentCodes.has(leftCode)) {
    const directGroupName = getGroupNameForCode(activeViewPreset, leftCode);
    if (directGroupName) {
      if (typeof feature === 'object' && feature !== null) {
        WATER_EDGE_GROUP_NAME_CACHE.set(feature, directGroupName);
      }
      return directGroupName;
    }
  }

  const probeCoordinate = getWaterEdgeProbeCoordinate(feature);
  if (!probeCoordinate) {
    return null;
  }

  const wardSplitSource = regionBoundaryRefs.get('wardSplitFill')?.getSource() ?? null;
  const wardSplitFeature =
    wardSplitSource
      ?.getFeatures()
      .find((candidate) => candidate.getGeometry()?.intersectsCoordinate(probeCoordinate)) ??
    null;
  if (wardSplitFeature) {
    const regionRef = String(wardSplitFeature.get('region_ref') ?? '').trim();
    if (regionRef) {
      if (typeof feature === 'object' && feature !== null) {
        WATER_EDGE_GROUP_NAME_CACHE.set(feature, regionRef);
      }
      return regionRef;
    }
  }

  const regionFillSource = regionBoundaryRefs.get('regionFill')?.getSource() ?? null;
  const regionFillFeature =
    regionFillSource
      ?.getFeatures()
      .find((candidate) => {
        const boundaryCode = String(candidate.get('boundary_code') ?? '').trim();
        if (!boundaryCode || hiddenParentCodes.has(boundaryCode)) {
          return false;
        }
        return candidate.getGeometry()?.intersectsCoordinate(probeCoordinate) ?? false;
      }) ?? null;
  if (!regionFillFeature) {
    return null;
  }

  const boundaryCode = String(regionFillFeature.get('boundary_code') ?? '').trim();
  const groupName = getGroupNameForCode(activeViewPreset, boundaryCode);
  if (!groupName) {
    return null;
  }
  if (typeof feature === 'object' && feature !== null) {
    WATER_EDGE_GROUP_NAME_CACHE.set(feature, groupName);
  }
  return groupName;
}

function getWaterEdgeProbeCoordinate(feature: FeatureLike): [number, number] | null {
  const geometry = feature.getGeometry();
  if (geometry instanceof LineString) {
    return geometry.getCoordinateAt(0.5) as [number, number];
  }
  if (geometry instanceof MultiLineString) {
    const lineStrings = geometry.getLineStrings();
    if (lineStrings.length === 0) {
      return null;
    }
    const longest = lineStrings.reduce((current, candidate) =>
      candidate.getLength() > current.getLength() ? candidate : current,
    );
    return longest.getCoordinateAt(0.5) as [number, number];
  }
  return null;
}
