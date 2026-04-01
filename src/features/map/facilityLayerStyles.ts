import type { FeatureLike } from 'ol/Feature';
import { Fill, Stroke, Style } from 'ol/style';
import type {
  CombinedPracticeStyle,
  FacilitySymbolShape,
  LayerState,
  RegionStyle,
} from '../../types';
import {
  getFacilityFeatureProperties,
} from '../../lib/facilities';
import {
  getTrueCombinedPracticeName,
} from '../../lib/combinedPractices';
import {
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
} from '../../lib/facilityFilters';
import {
  blendWithWhite,
  createPointSymbol,
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  getNonCombinedPointInset,
  withOpacity,
} from './mapStyleUtils';
import { getEffectiveFacilityRecord } from './scenarioFacilityMapping';
import type VectorSource from 'ol/source/Vector';

// Module-level style cache — persists across getStyleForLayer calls so that
// OL Icon instances (SVG data-URL images) are reused rather than re-decoded,
// which prevents the visible "blip" when adjusting size or other style props.
const styleCache = new Map<string, Style>();

export function getStyleForLayer(
  layer: LayerState,
  regions: Map<string, RegionStyle>,
  combinedPracticeStyles: Map<string, CombinedPracticeStyle>,
  symbolShape: FacilitySymbolShape,
  symbolSize: number,
  facilityFilters: ReturnType<typeof getFacilityFilterDefinitions>,
  assignmentSource: VectorSource | null = null,
) {
  if (layer.type === 'point') {
    return (feature: FeatureLike) => {
      const facility = getEffectiveFacilityRecord(feature, assignmentSource);
      if (!matchesFacilityFilters(facility, facilityFilters)) {
        return undefined;
      }

      const properties = getFacilityFeatureProperties(feature);
      const regionStyle = regions.get(facility.region);
      const defaultVisible = facility.isDefaultVisible;
      if (!defaultVisible || (regionStyle && !regionStyle.visible)) {
        return undefined;
      }

      const hex = regionStyle?.color ?? properties.point_color_hex;
      const opacity = regionStyle ? regionStyle.opacity : 1;
      const borderVisible = regionStyle?.borderVisible ?? true;
      const borderColor = regionStyle?.borderColor ?? '#ffffff';
      const borderOpacity = regionStyle?.borderOpacity ?? 1;
      const borderWidth = (borderVisible && borderOpacity > 0) ? (regionStyle?.borderWidth ?? 1) : 0;
      const resolvedShape = regionStyle?.shape ?? symbolShape;
      const resolvedSize = regionStyle?.symbolSize ?? symbolSize;
      const combinedPracticeName = getTrueCombinedPracticeName(facility);
      const combinedPracticeStyle = combinedPracticeName
        ? combinedPracticeStyles.get(combinedPracticeName)
        : null;
      const combinedPracticeRingColor =
        combinedPracticeStyle &&
        combinedPracticeStyle.visible &&
        combinedPracticeStyle.borderOpacity > 0 &&
        combinedPracticeStyle.borderWidth > 0
          ? withOpacity(
              combinedPracticeStyle.borderColor,
              Math.max(
                0,
                Math.min(1, opacity * combinedPracticeStyle.borderOpacity),
              ),
            )
          : undefined;
      const combinedPracticeRingWidth =
        combinedPracticeStyle &&
        combinedPracticeStyle.visible &&
        combinedPracticeStyle.borderOpacity > 0 &&
        combinedPracticeStyle.borderWidth > 0
          ? getCombinedPracticeRingWidth(resolvedSize) *
            combinedPracticeStyle.borderWidth
          : 0;
      const combinedPracticeRingGap =
        combinedPracticeRingWidth > 0
          ? getCombinedPracticeRingGap(resolvedSize)
          : 0;
      const baseShapeInset =
        combinedPracticeRingWidth > 0
          ? 0
          : getNonCombinedPointInset(resolvedSize);
      const key = `${hex}:${opacity}:${borderVisible}:${borderColor}:${borderOpacity}:${borderWidth}:${resolvedShape}:${resolvedSize}:${combinedPracticeName ?? ''}:${combinedPracticeStyle?.visible ?? false}:${combinedPracticeStyle?.borderColor ?? ''}:${combinedPracticeStyle?.borderOpacity ?? 0}:${combinedPracticeStyle?.borderWidth ?? 0}`;
      const existing = styleCache.get(key);
      if (existing) {
        return existing;
      }

      const style = new Style({
        image: createPointSymbol(
          resolvedShape,
          resolvedSize,
          withOpacity(hex, opacity),
          blendWithWhite(borderColor, borderOpacity),
          borderWidth,
          {
            outerRingColor: combinedPracticeRingColor,
            outerRingGap: combinedPracticeRingGap,
            outerRingWidth: combinedPracticeRingWidth,
            outerRingPlacement: 'outside',
            baseShapeInset,
          },
        ),
      });
      styleCache.set(key, style);
      return style;
    };
  }

  return new Style({
    stroke: new Stroke({
      color: '#2b4c7e',
      width: 2,
    }),
    fill: new Fill({
      color: 'rgba(43, 76, 126, 0.15)',
    }),
  });
}
