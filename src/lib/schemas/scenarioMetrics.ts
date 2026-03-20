import { z } from 'zod';
import { boundarySystemIdSchema } from './boundarySystems';
import { scenarioWorkspaceIdSchema } from './scenarioWorkspaces';

export const scenarioFacilityTypeMetricSchema = z.object({
  typeName: z.string().trim().min(1),
  facilityCount: z.number().int().min(0),
});

export const scenarioFacilityRegionMetricSchema = z.object({
  regionId: z.string().trim().min(1).nullable(),
  regionName: z.string().trim().min(1),
  facilityCount: z.number().int().min(0),
  facilityTypes: z.array(scenarioFacilityTypeMetricSchema),
});

export const scenarioFacilityMetricSummarySchema = z.object({
  totalFacilities: z.number().int().min(0),
  regions: z.array(scenarioFacilityRegionMetricSchema),
  facilityTypes: z.array(scenarioFacilityTypeMetricSchema),
});

export const scenarioWorkspaceRegionSummarySchema = z.object({
  regionId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  assignmentCount: z.number().int().min(0),
  facilityCount: z.number().int().min(0),
  facilityTypes: z.array(scenarioFacilityTypeMetricSchema),
});

export const scenarioWorkspaceSummarySchema = z.object({
  workspaceId: scenarioWorkspaceIdSchema,
  boundarySystemId: boundarySystemIdSchema,
  totalAssignedBoundaryUnits: z.number().int().min(0),
  totalFacilities: z.number().int().min(0),
  regions: z.array(scenarioWorkspaceRegionSummarySchema),
  facilityTypes: z.array(scenarioFacilityTypeMetricSchema),
});

export type ScenarioFacilityTypeMetric = z.infer<
  typeof scenarioFacilityTypeMetricSchema
>;
export type ScenarioFacilityRegionMetric = z.infer<
  typeof scenarioFacilityRegionMetricSchema
>;
export type ScenarioFacilityMetricSummary = z.infer<
  typeof scenarioFacilityMetricSummarySchema
>;
export type ScenarioWorkspaceRegionSummary = z.infer<
  typeof scenarioWorkspaceRegionSummarySchema
>;
export type ScenarioWorkspaceSummary = z.infer<
  typeof scenarioWorkspaceSummarySchema
>;

export function parseScenarioFacilityMetricSummary(
  input: unknown,
): ScenarioFacilityMetricSummary {
  return scenarioFacilityMetricSummarySchema.parse(input);
}

export function parseScenarioWorkspaceSummary(
  input: unknown,
): ScenarioWorkspaceSummary {
  return scenarioWorkspaceSummarySchema.parse(input);
}
