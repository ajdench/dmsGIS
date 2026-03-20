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
  const facilityRegionLookupById = new Map(
    facilitySummary.regions
      .filter((region) => region.regionId)
      .map((region) => [region.regionId as string, region]),
  );
  const facilityRegionLookupByLabel = new Map(
    facilitySummary.regions.map((region) => [region.regionName, region]),
  );

  return parseScenarioWorkspaceSummary({
    workspaceId: workspace.workspaceId,
    boundarySystemId: workspace.boundarySystemId,
    totalAssignedBoundaryUnits: workspace.totalAssignedBoundaryUnits,
    totalFacilities: facilitySummary.totalFacilities,
    regions: workspace.regions.map((region) => {
      const facilityRegion =
        facilityRegionLookupById.get(region.regionId) ??
        facilityRegionLookupByLabel.get(region.label);
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
