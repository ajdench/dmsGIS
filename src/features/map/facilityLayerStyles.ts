import type { FeatureLike } from 'ol/Feature';
import { Fill, Stroke, Style } from 'ol/style';
import type {
  CombinedPracticeStyle,
  FacilitySymbolShape,
  LayerState,
  RegionStyle,
} from '../../types';
import {
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
} from '../../lib/facilityFilters';
import {
  createPointSymbol,
} from './mapStyleUtils';
import { getEffectiveFacilityRecord } from './scenarioFacilityMapping';
import type VectorSource from 'ol/source/Vector';
import { resolvePointPresentation } from './pointPresentation';

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

      const regionStyle = regions.get(facility.region);
      const defaultVisible = facility.isDefaultVisible;
      if (!defaultVisible || (regionStyle && !regionStyle.visible)) {
        return undefined;
      }
      const pointPresentation = resolvePointPresentation({
        feature,
        regions,
        combinedPracticeStyles,
        symbolShape,
        symbolSize,
        assignmentSource,
      });
      const key = [
        pointPresentation.fillColor,
        pointPresentation.borderColor,
        pointPresentation.borderWidth,
        pointPresentation.shape,
        pointPresentation.size,
        pointPresentation.outerRingColor ?? '',
        pointPresentation.outerRingGap,
        pointPresentation.outerRingWidth,
        pointPresentation.outerRingPlacement,
        pointPresentation.baseShapeInset,
      ].join(':');
      const existing = styleCache.get(key);
      if (existing) {
        return existing;
      }

      const style = new Style({
        image: createPointSymbol(
          pointPresentation.shape,
          pointPresentation.size,
          pointPresentation.fillColor,
          pointPresentation.borderColor,
          pointPresentation.borderWidth,
          {
            outerRingColor: pointPresentation.outerRingColor,
            outerRingGap: pointPresentation.outerRingGap,
            outerRingWidth: pointPresentation.outerRingWidth,
            outerRingPlacement: pointPresentation.outerRingPlacement,
            baseShapeInset: pointPresentation.baseShapeInset,
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
