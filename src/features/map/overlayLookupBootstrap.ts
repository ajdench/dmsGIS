import type Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';
import type { FeatureLike } from 'ol/Feature';
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssetUrls';

export interface OverlayLookupDatasetDefinition<Key extends string = string> {
  key: Key;
  path: string;
  source: VectorSource;
  errorLabel: string;
}

export interface OverlayAssignmentDatasetDefinition {
  path: string;
  source: VectorSource;
  errorLabel: string;
}

interface LoadOverlayLookupDatasetsParams<Key extends string> {
  datasets: OverlayLookupDatasetDefinition<Key>[];
  resolveUrl: (path: string) => string;
  fetchJson?: (url: string) => Promise<unknown>;
  onError?: (message: string, error: unknown) => void;
}

interface LoadOverlayAssignmentDatasetParams {
  dataset: OverlayAssignmentDatasetDefinition;
  resolveUrl: (path: string) => string;
  getBoundaryName: (feature: FeatureLike) => string;
  getAssignmentName: (feature: FeatureLike) => string;
  fetchJson?: (url: string) => Promise<unknown>;
  onError?: (message: string, error: unknown) => void;
}

export async function loadOverlayLookupDatasets<Key extends string>(
  params: LoadOverlayLookupDatasetsParams<Key>,
): Promise<void> {
  const { datasets, resolveUrl, fetchJson = fetchGeoJson, onError = console.error } = params;

  await Promise.all(
    datasets.map(async (dataset) => {
      try {
        const geojson = await fetchJson(resolveUrl(dataset.path));
        loadGeoJsonIntoSource(dataset.source, geojson);
      } catch (error) {
        onError(dataset.errorLabel, error);
      }
    }),
  );
}

export async function loadOverlayAssignmentDataset(
  params: LoadOverlayAssignmentDatasetParams,
): Promise<Map<string, string>> {
  const {
    dataset,
    resolveUrl,
    getBoundaryName,
    getAssignmentName,
    fetchJson = fetchGeoJson,
    onError = console.error,
  } = params;

  try {
    const geojson = await fetchJson(resolveUrl(dataset.path));
    const features = readGeoJsonFeatures(geojson);
    dataset.source.clear();
    dataset.source.addFeatures(features);
    return buildFeatureNameMap(features, getBoundaryName, getAssignmentName);
  } catch (error) {
    onError(dataset.errorLabel, error);
    return new Map();
  }
}

export function buildFeatureNameMap(
  features: FeatureLike[],
  getKey: (feature: FeatureLike) => string,
  getValue: (feature: FeatureLike) => string,
): Map<string, string> {
  return new Map(
    features.flatMap((feature) => {
      const key = getKey(feature).trim();
      const value = getValue(feature).trim();
      if (!key || !value) {
        return [];
      }
      return [[key, value] as const];
    }),
  );
}

export function readGeoJsonFeatures(geojson: unknown): Feature[] {
  return new GeoJSON().readFeatures(geojson, {
    featureProjection: 'EPSG:3857',
  });
}

export function loadGeoJsonIntoSource(
  source: VectorSource,
  geojson: unknown,
): void {
  source.clear();
  source.addFeatures(readGeoJsonFeatures(geojson));
}

export function resolveDataUrl(path: string): string {
  return resolveRuntimeAssetUrl(path);
}

async function fetchGeoJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}
