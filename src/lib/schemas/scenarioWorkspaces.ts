import { z } from 'zod';
import { boundarySystemIdSchema } from './boundarySystems';
import { hexColorSchema, viewPresetIdSchema } from './shared';

export const scenarioWorkspaceIdSchema = z.enum([
  'coa3a',
  'coa3b',
  'coa3c',
  'dphcEstimateCoaPlayground',
]);

const scenarioRegionPaletteSchema = z.object({
  unpopulated: hexColorSchema,
  populated: hexColorSchema,
  outline: hexColorSchema,
});

export const scenarioRegionDefinitionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  assignmentCode: z.string().trim().min(1),
  sourceRegionNames: z.array(z.string().trim().min(1)).default([]),
  palette: scenarioRegionPaletteSchema,
  order: z.number().int().min(0),
});

const baselineDatasetSourceSchema = z.object({
  kind: z.enum(['static-dataset', 'derived-dataset', 'interactive-runtime']),
  path: z.string().trim().min(1).nullable().default(null),
});

export const scenarioWorkspaceBaselineSchema = z.object({
  id: scenarioWorkspaceIdSchema,
  label: z.string().trim().min(1),
  sourcePresetId: viewPresetIdSchema.optional(),
  boundarySystemId: boundarySystemIdSchema,
  assignmentSource: baselineDatasetSourceSchema,
  derivedOutlineSource: baselineDatasetSourceSchema,
  lookupBoundaryPath: z.string().trim().min(1).nullable().default(null),
  regions: z.array(scenarioRegionDefinitionSchema).min(1),
  boundaryNameRegionOverrides: z.record(z.string(), z.string()).default({}),
});

export const scenarioBoundaryAssignmentSchema = z.object({
  boundaryUnitId: z.string().trim().min(1),
  scenarioRegionId: z.string().trim().min(1),
});

export const scenarioWorkspaceDraftSchema = z.object({
  schemaVersion: z.literal(1),
  id: scenarioWorkspaceIdSchema,
  label: z.string().trim().min(1),
  boundarySystemId: boundarySystemIdSchema,
  baseWorkspaceId: scenarioWorkspaceIdSchema,
  assignments: z.array(scenarioBoundaryAssignmentSchema).default([]),
});

export type ScenarioWorkspaceId = z.infer<typeof scenarioWorkspaceIdSchema>;
export type ScenarioRegionDefinition = z.infer<typeof scenarioRegionDefinitionSchema>;
export type ScenarioWorkspaceBaseline = z.infer<
  typeof scenarioWorkspaceBaselineSchema
>;
export type ScenarioBoundaryAssignment = z.infer<
  typeof scenarioBoundaryAssignmentSchema
>;
export type ScenarioWorkspaceDraft = z.infer<typeof scenarioWorkspaceDraftSchema>;

export function parseScenarioWorkspaceBaseline(
  input: unknown,
): ScenarioWorkspaceBaseline {
  return scenarioWorkspaceBaselineSchema.parse(input);
}

export function parseScenarioWorkspaceDraft(
  input: unknown,
): ScenarioWorkspaceDraft {
  return scenarioWorkspaceDraftSchema.parse(input);
}
