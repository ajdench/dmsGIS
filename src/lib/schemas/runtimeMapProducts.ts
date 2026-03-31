import { z } from 'zod';

export const runtimeMapProductIdSchema = z.enum([
  'baseline',
  'bfe',
  'currentEastBsc',
  'acceptedV38',
]);

export const runtimeMapProductSchema = z.object({
  label: z.string().trim().min(1),
  dataRoot: z.string().trim().min(1),
});

export const runtimeMapProductsSchema = z.object({
  version: z.string().trim().min(1),
  activeProductId: runtimeMapProductIdSchema,
  products: z.record(runtimeMapProductIdSchema, runtimeMapProductSchema),
});

export type RuntimeMapProductId = z.infer<typeof runtimeMapProductIdSchema>;
export type RuntimeMapProduct = z.infer<typeof runtimeMapProductSchema>;
export type RuntimeMapProducts = z.infer<typeof runtimeMapProductsSchema>;

export function parseRuntimeMapProducts(input: unknown): RuntimeMapProducts {
  return runtimeMapProductsSchema.parse(input);
}
