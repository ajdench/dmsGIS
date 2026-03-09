import {
  layersManifestSchema,
  type LayerManifestEntry,
  type LayersManifest,
} from '../schemas/layers';

export async function fetchLayerManifest(): Promise<LayerManifestEntry[]> {
  const baseUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  const manifestUrl = new URL('data/manifests/layers.manifest.json', baseUrl);
  const response = await fetch(manifestUrl.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch layer manifest: ${response.statusText}`);
  }

  const data = (await response.json()) as LayersManifest;
  const manifest = layersManifestSchema.parse(data);
  return manifest.layers.map((layer) => ({
    ...layer,
    path: new URL(layer.path.replace(/^\//, ''), baseUrl).toString(),
  }));
}
