import { z } from 'zod';

export const waterEdgeClassSchema = z.enum([
  'sea',
  'estuary',
  'inlandWater',
  'internal',
  'harbourDock',
  'canalCut',
  'lakeReservoir',
  'intertidal',
  'islandFragment',
]);

export const waterEdgeProfileIdSchema = z.enum(['coarse', 'standard', 'fine']);

export const waterEdgePreprocessingProfileSchema = z.object({
  minTrueCoastOpeningWidthM: z.number().positive(),
  maxInlandWaterProjectionWidthM: z.number().positive(),
  maxInlandProjectionDepthM: z.number().positive(),
  minIslandAreaM2: z.number().positive(),
  landfillClasses: z.array(waterEdgeClassSchema).min(1),
  coastalFacilityInsetM: z.number().nonnegative(),
  devolvedInternalArcSuppressionWidthM: z.number().nonnegative(),
});

export const waterEdgeVisualProfileSchema = z.object({
  inlandArcColorMode: z.enum(['regionBorder']),
  inlandWaterArcOpacity: z.number().min(0).max(1),
  estuaryArcOpacity: z.number().min(0).max(1),
  inlandArcSelectedOpacity: z.number().min(0).max(1),
  inlandArcDash: z.tuple([z.number().positive(), z.number().positive()]),
  zoomRange: z.object({
    min: z.number().min(0),
    max: z.number().min(0),
  }).refine((value) => value.max >= value.min, {
    message: 'zoomRange.max must be greater than or equal to zoomRange.min',
  }),
});

export const waterEdgeTreatmentSchema = z.object({
  version: z.string().trim().min(1),
  status: z.enum(['draft-not-active', 'active-review', 'active']),
  classes: z.array(waterEdgeClassSchema).min(4),
  preprocessing: z.object({
    activeProfileId: waterEdgeProfileIdSchema,
    profiles: z.record(waterEdgeProfileIdSchema, waterEdgePreprocessingProfileSchema),
  }),
  runtime: z.object({
    activeVisualProfileId: waterEdgeProfileIdSchema,
    visualProfiles: z.record(waterEdgeProfileIdSchema, waterEdgeVisualProfileSchema),
  }),
});

export type WaterEdgeClass = z.infer<typeof waterEdgeClassSchema>;
export type WaterEdgeProfileId = z.infer<typeof waterEdgeProfileIdSchema>;
export type WaterEdgePreprocessingProfile = z.infer<typeof waterEdgePreprocessingProfileSchema>;
export type WaterEdgeVisualProfile = z.infer<typeof waterEdgeVisualProfileSchema>;
export type WaterEdgeTreatment = z.infer<typeof waterEdgeTreatmentSchema>;

export function parseWaterEdgeTreatment(input: unknown): WaterEdgeTreatment {
  return waterEdgeTreatmentSchema.parse(input);
}
