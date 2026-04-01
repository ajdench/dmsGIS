import {
  layersManifestSchema,
  type LayerManifestEntry,
  type LayersManifest,
} from '../schemas/layers';
import { resolveRuntimeMapProductPath } from '../config/runtimeMapProducts';
import { resolveRuntimeAssetUrl } from '../runtimeAssetUrls';

export function getRuntimeLayerManifestPath(): string {
  // The manifest is a stable index file at the public root; only the layer
  // entries inside it are remapped into the active runtime family.
  return 'data/manifests/layers.manifest.json';
}

export function resolveRuntimeLayerPath(pathValue: string): string {
  return resolveRuntimeMapProductPath(pathValue);
}

export async function fetchLayerManifest(): Promise<LayerManifestEntry[]> {
  const response = await fetch(resolveRuntimeAssetUrl(getRuntimeLayerManifestPath()));

  if (!response.ok) {
    throw new Error(`Failed to fetch layer manifest: ${response.statusText}`);
  }

  const data = (await response.json()) as LayersManifest;
  const manifest = layersManifestSchema.parse(data);
  return manifest.layers.map((layer) => ({
    ...layer,
    path: resolveRuntimeAssetUrl(resolveRuntimeLayerPath(layer.path)),
  }));
}
