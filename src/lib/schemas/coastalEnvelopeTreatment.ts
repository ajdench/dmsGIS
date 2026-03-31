import { z } from 'zod';

export const coastalEnvelopeProductIdSchema = z.enum(['legacy', 'bfe', 'bsc']);

export const coastalEnvelopeProductSchema = z.object({
  label: z.string().trim().min(1),
  landmaskPath: z.string().trim().min(1),
  currentExactGeoJsonPath: z.string().trim().min(1).optional(),
  currentExactGpkgPath: z.string().trim().min(1).optional(),
  y2026ExactGeoJsonPath: z.string().trim().min(1).optional(),
});

export const coastalEnvelopeTreatmentSchema = z.object({
  version: z.string().trim().min(1),
  status: z.enum(['draft-not-active', 'active-review', 'active']),
  activeProductId: coastalEnvelopeProductIdSchema,
  products: z.record(coastalEnvelopeProductIdSchema, coastalEnvelopeProductSchema),
});

export type CoastalEnvelopeProductId = z.infer<typeof coastalEnvelopeProductIdSchema>;
export type CoastalEnvelopeProduct = z.infer<typeof coastalEnvelopeProductSchema>;
export type CoastalEnvelopeTreatment = z.infer<typeof coastalEnvelopeTreatmentSchema>;

export function parseCoastalEnvelopeTreatment(input: unknown): CoastalEnvelopeTreatment {
  return coastalEnvelopeTreatmentSchema.parse(input);
}
