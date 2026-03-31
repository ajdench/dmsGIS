import {
  layersManifestSchema,
  type LayerManifestEntry,
  type LayersManifest,
} from '../schemas/layers';
import { resolveRuntimeMapProductPath } from '../config/runtimeMapProducts';

export function getRuntimeLayerManifestPath(): string {
  return resolveRuntimeMapProductPath('data/manifests/layers.manifest.json');
}

export function resolveRuntimeLayerPath(pathValue: string): string {
  return resolveRuntimeMapProductPath(pathValue);
}

export async function fetchLayerManifest(): Promise<LayerManifestEntry[]> {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const manifestUrl = new URL(getRuntimeLayerManifestPath(), baseUrl);
  const response = await fetch(manifestUrl.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch layer manifest: ${response.statusText}`);
  }

  const data = (await response.json()) as LayersManifest;
  const manifest = layersManifestSchema.parse(data);
  return manifest.layers.map((layer) => ({
    ...layer,
    path: new URL(resolveRuntimeLayerPath(layer.path).replace(/^\//, ''), baseUrl).toString(),
  }));
}
