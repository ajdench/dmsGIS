import { z } from 'zod';
import { boundarySystemIdSchema } from './boundarySystems';
import { hexColorSchema, viewPresetIdSchema } from './shared';

export const scenarioWorkspaceIdSchema = z.enum([
  'coa3a',
  'coa3b',
  'coa3c',
  'dphcEstimateCoa3aPlayground',
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

export const scenarioWorkspaceEditorStateSchema = z.object({
  selectedBoundaryUnitId: z.string().trim().min(1).nullable().default(null),
  selectedScenarioRegionId: z.string().trim().min(1).nullable().default(null),
  pendingScenarioRegionId: z.string().trim().min(1).nullable().default(null),
  isDirty: z.boolean().default(false),
});

export const derivedScenarioWorkspaceRegionSchema = z.object({
  regionId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  assignmentCount: z.number().int().min(0),
});

export const derivedScenarioWorkspaceSchema = z.object({
  workspaceId: scenarioWorkspaceIdSchema,
  boundarySystemId: boundarySystemIdSchema,
  totalAssignedBoundaryUnits: z.number().int().min(0),
  assignmentLookup: z.record(z.string(), z.string()),
  regions: z.array(derivedScenarioWorkspaceRegionSchema),
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
export type ScenarioWorkspaceEditorState = z.infer<
  typeof scenarioWorkspaceEditorStateSchema
>;
export type DerivedScenarioWorkspaceRegion = z.infer<
  typeof derivedScenarioWorkspaceRegionSchema
>;
export type DerivedScenarioWorkspace = z.infer<
  typeof derivedScenarioWorkspaceSchema
>;

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

export function parseScenarioWorkspaceEditorState(
  input: unknown,
): ScenarioWorkspaceEditorState {
  return scenarioWorkspaceEditorStateSchema.parse(input);
}

export function parseDerivedScenarioWorkspace(
  input: unknown,
): DerivedScenarioWorkspace {
  return derivedScenarioWorkspaceSchema.parse(input);
}
