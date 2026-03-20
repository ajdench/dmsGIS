import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import {
  parseScenarioFacilityMetricSummary,
  type ScenarioFacilityMetricSummary,
} from '../../lib/schemas/scenarioMetrics';
import { getEffectiveFacilityRecord } from './scenarioFacilityMapping';

export function buildScenarioFacilityMetricSummary(
  facilityFeatures: FeatureLike[],
  assignmentSource: VectorSource | null,
): ScenarioFacilityMetricSummary {
  const facilitiesByRegion = new Map<string, number>();
  const facilitiesByType = new Map<string, number>();
  const facilitiesByRegionAndType = new Map<string, Map<string, number>>();

  for (const feature of facilityFeatures) {
    const facility = getEffectiveFacilityRecord(feature, assignmentSource);
    const regionName = facility.region;
    const typeName = facility.type;

    facilitiesByRegion.set(regionName, (facilitiesByRegion.get(regionName) ?? 0) + 1);
    facilitiesByType.set(typeName, (facilitiesByType.get(typeName) ?? 0) + 1);

    const regionTypeMap = facilitiesByRegionAndType.get(regionName) ?? new Map();
    regionTypeMap.set(typeName, (regionTypeMap.get(typeName) ?? 0) + 1);
    facilitiesByRegionAndType.set(regionName, regionTypeMap);
  }

  return parseScenarioFacilityMetricSummary({
    totalFacilities: facilityFeatures.length,
    regions: [...facilitiesByRegion.entries()]
      .map(([regionName, facilityCount]) => ({
        regionName,
        facilityCount,
        facilityTypes: [...(facilitiesByRegionAndType.get(regionName) ?? new Map()).entries()]
          .map(([typeName, count]) => ({
            typeName,
            facilityCount: count,
          }))
          .sort((a, b) => a.typeName.localeCompare(b.typeName)),
      }))
      .sort((a, b) => a.regionName.localeCompare(b.regionName)),
    facilityTypes: [...facilitiesByType.entries()]
      .map(([typeName, facilityCount]) => ({
        typeName,
        facilityCount,
      }))
      .sort((a, b) => a.typeName.localeCompare(b.typeName)),
  });
}
