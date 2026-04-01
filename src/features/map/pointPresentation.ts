import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import type {
  CombinedPracticeStyle,
  FacilitySymbolShape,
  RegionStyle,
} from '../../types';
import { getFacilityFeatureProperties } from '../../lib/facilities';
import { getTrueCombinedPracticeName } from '../../lib/combinedPractices';
import { getEffectiveFacilityRecord } from './scenarioFacilityMapping';
import {
  blendWithWhite,
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  withOpacity,
} from './mapStyleUtils';

export interface ResolvedPointPresentation {
  shape: FacilitySymbolShape;
  size: number;
  fillColor: string;
  borderColor: string;
  borderWidth: number;
  baseShapeInset: number;
  outerRingColor?: string;
  outerRingGap: number;
  outerRingWidth: number;
  outerRingPlacement: 'outside' | 'inside';
}

interface ResolvePointPresentationParams {
  feature: FeatureLike;
  regions: Map<string, RegionStyle>;
  combinedPracticeStyles: Map<string, CombinedPracticeStyle>;
  symbolShape: FacilitySymbolShape;
  symbolSize: number;
  assignmentSource?: VectorSource | null;
}

export function resolvePointPresentation(
  params: ResolvePointPresentationParams,
): ResolvedPointPresentation {
  const {
    feature,
    regions,
    combinedPracticeStyles,
    symbolShape,
    symbolSize,
    assignmentSource = null,
  } = params;
  const facility = getEffectiveFacilityRecord(feature, assignmentSource);
  const properties = getFacilityFeatureProperties(feature);
  const regionStyle = regions.get(facility.region);
  const fillHex = regionStyle?.color ?? properties.point_color_hex;
  const fillOpacity = regionStyle ? regionStyle.opacity : 1;
  const borderVisible = regionStyle?.borderVisible ?? true;
  const borderColor = regionStyle?.borderColor ?? '#ffffff';
  const borderOpacity = regionStyle?.borderOpacity ?? 1;
  const borderWidth =
    borderVisible && borderOpacity > 0
      ? (regionStyle?.borderWidth ?? 1)
      : 0;
  const shape = regionStyle?.shape ?? symbolShape;
  const size = regionStyle?.symbolSize ?? symbolSize;
  const combinedPracticeName = getTrueCombinedPracticeName(facility);
  const combinedPracticeStyle = combinedPracticeName
    ? combinedPracticeStyles.get(combinedPracticeName)
    : null;
  const activeCombinedTreatmentWidth = getActiveCombinedTreatmentWidth(
    combinedPracticeStyles,
    size,
  );
  const outerRingColor =
    combinedPracticeStyle &&
    combinedPracticeStyle.visible &&
    combinedPracticeStyle.borderOpacity > 0 &&
    combinedPracticeStyle.borderWidth > 0
      ? withOpacity(
          combinedPracticeStyle.borderColor,
          Math.max(
            0,
            Math.min(1, fillOpacity * combinedPracticeStyle.borderOpacity),
          ),
        )
      : undefined;
  const outerRingWidth =
    outerRingColor && combinedPracticeStyle
      ? getCombinedPracticeRingWidth(size) * combinedPracticeStyle.borderWidth
      : 0;
  const outerRingGap =
    outerRingWidth > 0 ? getCombinedPracticeRingGap(size) : 0;
  const baseShapeInset =
    outerRingWidth > 0
      ? borderWidth > 0
        ? outerRingGap + outerRingWidth
        : 0
      : activeCombinedTreatmentWidth > 0
        ? -(activeCombinedTreatmentWidth / 2)
        : 0;

  return {
    shape,
    size,
    fillColor: withOpacity(fillHex, fillOpacity),
    borderColor: blendWithWhite(borderColor, borderOpacity),
    borderWidth,
    baseShapeInset,
    outerRingColor,
    outerRingGap,
    outerRingWidth,
    outerRingPlacement: borderWidth > 0 ? 'inside' : 'outside',
  };
}

export function getPointPresentationOuterDistance(
  presentation: ResolvedPointPresentation,
): number {
  const {
    borderWidth,
    baseShapeInset,
    outerRingGap,
    outerRingWidth,
    outerRingPlacement,
  } = presentation;
  const pointOuterInset =
    outerRingPlacement === 'inside' && outerRingWidth > 0
      ? baseShapeInset - outerRingGap - outerRingWidth
      : baseShapeInset;
  const borderOutsideDistance =
    borderWidth > 0 ? baseShapeInset - (pointOuterInset - borderWidth) : 0;
  const ringOutsideDistance =
    outerRingWidth > 0 ? outerRingGap + outerRingWidth : 0;

  return Math.max(0, borderOutsideDistance, ringOutsideDistance);
}

export function getRenderedPointPixelRadiusFromPresentation(
  presentation: ResolvedPointPresentation,
): number {
  const { shape, size, baseShapeInset } = presentation;
  const innerRadius = Math.max(0, size - baseShapeInset);
  const outsideDistance = getPointPresentationOuterDistance(presentation);

  if (shape === 'circle') {
    return innerRadius + outsideDistance;
  }

  if (shape === 'square' || shape === 'diamond') {
    return innerRadius * 1.05 + outsideDistance;
  }

  return innerRadius * 1.15 + outsideDistance;
}

function getActiveCombinedTreatmentWidth(
  combinedPracticeStyles: Map<string, CombinedPracticeStyle>,
  size: number,
): number {
  let maxWidth = 0;

  for (const practice of combinedPracticeStyles.values()) {
    if (!practice.visible || practice.borderOpacity <= 0 || practice.borderWidth <= 0) {
      continue;
    }

    maxWidth = Math.max(
      maxWidth,
      getCombinedPracticeRingWidth(size) * practice.borderWidth,
    );
  }

  return maxWidth;
}
