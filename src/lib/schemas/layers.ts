import { z } from 'zod';

export const layerManifestEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['polygon', 'point']),
  path: z.string(),
  visibleByDefault: z.boolean(),
});

export const layersManifestSchema = z.object({
  layers: z.array(layerManifestEntrySchema),
});

export type LayerManifestEntry = z.infer<typeof layerManifestEntrySchema>;
export type LayersManifest = z.infer<typeof layersManifestSchema>;
