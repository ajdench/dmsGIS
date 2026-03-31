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

export interface EffectiveFacilityRegionAssignment {
  regionId: string | null;
  regionName: string;
}

export function getEffectiveFacilityRegionName(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
): string {
  return getEffectiveFacilityRegionAssignment(feature, assignmentSource).regionName;
}

export function getEffectiveFacilityRegionAssignment(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
): EffectiveFacilityRegionAssignment {
  const properties = getFacilityFeatureProperties(feature);
  const coordinate = getFeaturePointCoordinate(feature);
  if (!coordinate || !assignmentSource) {
    return {
      regionId: null,
      regionName: properties.region,
    };
  }

  const assignmentFeature =
    assignmentSource
      .getFeatures()
      .find((candidate) => candidate.getGeometry()?.intersectsCoordinate(coordinate)) ?? null;
  if (!assignmentFeature) {
    return {
      regionId: null,
      regionName: properties.region,
    };
  }

  const regionName = String(
    assignmentFeature.get('region_name') ?? assignmentFeature.get('jmc_name') ?? '',
  ).trim();
  const regionId = String(assignmentFeature.get('scenario_region_id') ?? '').trim();

  return {
    regionId: regionId || null,
    regionName: regionName || properties.region,
  };
}

export function getEffectiveFacilityRecord(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
): FacilityRecord {
  const properties = getFacilityFeatureProperties(feature);
  const regionAssignment = getEffectiveFacilityRegionAssignment(feature, assignmentSource);
  return createFacilityRecord({
    ...properties,
    region: regionAssignment.regionName,
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
