import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import {
  createFacilityRecord,
  getFacilityFeatureProperties,
  type FacilityRecord,
} from '../../lib/facilities';

export interface ScenarioFacilityMetrics {
  totalFacilities: number;
  facilitiesByRegion: Map<string, number>;
}

export function getEffectiveFacilityRegionName(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
): string {
  const properties = getFacilityFeatureProperties(feature);
  const coordinate = getFeaturePointCoordinate(feature);
  if (!coordinate || !assignmentSource) {
    return properties.region;
  }

  const assignmentFeature =
    assignmentSource
      .getFeatures()
      .find((candidate) => candidate.getGeometry()?.intersectsCoordinate(coordinate)) ?? null;
  if (!assignmentFeature) {
    return properties.region;
  }

  const mappedRegion = String(
    assignmentFeature.get('region_name') ?? assignmentFeature.get('jmc_name') ?? '',
  ).trim();
  return mappedRegion || properties.region;
}

export function getEffectiveFacilityRecord(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
): FacilityRecord {
  const properties = getFacilityFeatureProperties(feature);
  return createFacilityRecord({
    ...properties,
    region: getEffectiveFacilityRegionName(feature, assignmentSource),
  });
}

export function buildScenarioFacilityMetrics(
  features: FeatureLike[],
  assignmentSource: VectorSource | null,
): ScenarioFacilityMetrics {
  const facilitiesByRegion = new Map<string, number>();

  for (const feature of features) {
    const regionName = getEffectiveFacilityRegionName(feature, assignmentSource);
    facilitiesByRegion.set(regionName, (facilitiesByRegion.get(regionName) ?? 0) + 1);
  }

  return {
    totalFacilities: features.length,
    facilitiesByRegion,
  };
}

function getFeaturePointCoordinate(feature: FeatureLike): [number, number] | null {
  if (typeof (feature as Feature).getGeometry === 'function') {
    const geometry = (feature as Feature).getGeometry();
    if (
      geometry &&
      geometry.getType() === 'Point' &&
      typeof
        (geometry as unknown as { getCoordinates?: () => number[] }).getCoordinates ===
          'function'
    ) {
      const coordinates = (
        geometry as unknown as { getCoordinates: () => number[] }
      ).getCoordinates();
      if (coordinates.length >= 2) {
        return [coordinates[0], coordinates[1]];
      }
    }
  }

  const renderFeature = feature as unknown as {
    getType?: () => string;
    getFlatCoordinates?: () => number[];
  };
  if (
    typeof renderFeature.getType === 'function' &&
    renderFeature.getType() === 'Point' &&
    typeof renderFeature.getFlatCoordinates === 'function'
  ) {
    const flatCoordinates = renderFeature.getFlatCoordinates();
    if (flatCoordinates.length >= 2) {
      return [flatCoordinates[0], flatCoordinates[1]];
    }
  }

  return null;
}
