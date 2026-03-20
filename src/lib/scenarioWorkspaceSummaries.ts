import type { DerivedScenarioWorkspace } from './schemas/scenarioWorkspaces';
import {
  parseScenarioWorkspaceSummary,
  type ScenarioFacilityMetricSummary,
  type ScenarioWorkspaceSummary,
} from './schemas/scenarioMetrics';

export function buildScenarioWorkspaceSummary(
  workspace: DerivedScenarioWorkspace,
  facilitySummary: ScenarioFacilityMetricSummary,
): ScenarioWorkspaceSummary {
  const facilityRegionLookup = new Map(
    facilitySummary.regions.map((region) => [region.regionName, region]),
  );

  return parseScenarioWorkspaceSummary({
    workspaceId: workspace.workspaceId,
    boundarySystemId: workspace.boundarySystemId,
    totalAssignedBoundaryUnits: workspace.totalAssignedBoundaryUnits,
    totalFacilities: facilitySummary.totalFacilities,
    regions: workspace.regions.map((region) => {
      const facilityRegion = facilityRegionLookup.get(region.label);
      return {
        regionId: region.regionId,
        label: region.label,
        assignmentCount: region.assignmentCount,
        facilityCount: facilityRegion?.facilityCount ?? 0,
        facilityTypes: facilityRegion?.facilityTypes ?? [],
      };
    }),
    facilityTypes: facilitySummary.facilityTypes,
  });
}
