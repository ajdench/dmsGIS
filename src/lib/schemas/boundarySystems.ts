import { z } from 'zod';

export const boundarySystemIdSchema = z.enum(['legacyIcbHb', 'icbHb2026']);

export const boundarySystemSchema = z.object({
  id: boundarySystemIdSchema,
  label: z.string().trim().min(1),
  description: z.string().trim().min(1),
  interactionBoundaryPath: z.string().trim().min(1),
  displayBoundaryPath: z.string().trim().min(1),
});

export type BoundarySystemId = z.infer<typeof boundarySystemIdSchema>;
export type BoundarySystem = z.infer<typeof boundarySystemSchema>;

export function parseBoundarySystem(input: unknown): BoundarySystem {
  return boundarySystemSchema.parse(input);
}
