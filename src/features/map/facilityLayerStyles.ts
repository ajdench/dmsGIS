import type { FeatureLike } from 'ol/Feature';
import { Fill, Stroke, Style } from 'ol/style';
import type {
  FacilitySymbolShape,
  LayerState,
  RegionStyle,
} from '../../types';
import {
  getFacilityFeatureProperties,
} from '../../lib/facilities';
import {
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
} from '../../lib/facilityFilters';
import { createPointSymbol, withOpacity } from './mapStyleUtils';
import { getEffectiveFacilityRecord } from './scenarioFacilityMapping';
import type VectorSource from 'ol/source/Vector';

export function getStyleForLayer(
  layer: LayerState,
  regions: Map<string, RegionStyle>,
  symbolShape: FacilitySymbolShape,
  symbolSize: number,
  facilityFilters: ReturnType<typeof getFacilityFilterDefinitions>,
  assignmentSource: VectorSource | null = null,
) {
  if (layer.type === 'point') {
    const cache = new Map<string, Style>();
    return (feature: FeatureLike) => {
      const facility = getEffectiveFacilityRecord(feature, assignmentSource);
      if (!matchesFacilityFilters(facility, facilityFilters)) {
        return undefined;
      }

      const properties = getFacilityFeatureProperties(feature);
      const regionStyle = regions.get(facility.region);
      const defaultVisible = facility.isDefaultVisible;
      if ((regionStyle && !regionStyle.visible) || (!regionStyle && !defaultVisible)) {
        return undefined;
      }

      const hex = regionStyle?.color ?? properties.point_color_hex;
      const opacity = regionStyle ? regionStyle.opacity : 1;
      const borderVisible = regionStyle?.borderVisible ?? true;
      const borderColor = regionStyle?.borderColor ?? '#ffffff';
      const borderOpacity = regionStyle?.borderOpacity ?? 1;
      const borderWidth = borderVisible ? (regionStyle?.borderWidth ?? 1) : 0;
      const resolvedShape = regionStyle?.shape ?? symbolShape;
      const resolvedSize = regionStyle?.symbolSize ?? symbolSize;
      const key = `${hex}:${opacity}:${borderVisible}:${borderColor}:${borderOpacity}:${borderWidth}:${resolvedShape}:${resolvedSize}`;
      const existing = cache.get(key);
      if (existing) {
        return existing;
      }

      const style = new Style({
        image: createPointSymbol(
          resolvedShape,
          resolvedSize,
          withOpacity(hex, opacity),
          withOpacity(borderColor, borderOpacity),
          borderWidth,
        ),
      });
      cache.set(key, style);
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
