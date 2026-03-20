import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import { buildScenarioFacilityMetrics } from './scenarioFacilityMapping';

export interface ScenarioFacilityMetricSummary {
  totalFacilities: number;
  regions: Array<{
    regionName: string;
    facilityCount: number;
  }>;
}

export function buildScenarioFacilityMetricSummary(
  facilityFeatures: FeatureLike[],
  assignmentSource: VectorSource | null,
): ScenarioFacilityMetricSummary {
  const metrics = buildScenarioFacilityMetrics(facilityFeatures, assignmentSource);
  return {
    totalFacilities: metrics.totalFacilities,
    regions: [...metrics.facilitiesByRegion.entries()]
      .map(([regionName, facilityCount]) => ({
        regionName,
        facilityCount,
      }))
      .sort((a, b) => a.regionName.localeCompare(b.regionName)),
  };
}
