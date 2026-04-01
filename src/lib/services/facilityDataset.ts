import { resolveRuntimeMapProductPath } from '../config/runtimeMapProducts';
import { resolveRuntimeAssetUrl } from '../runtimeAssetUrls';
import {
  parseFacilityProperties,
  type FacilityProperties,
} from '../schemas/facilities';

interface FacilityDatasetFeature {
  properties?: Record<string, unknown>;
}

interface FacilityDatasetCollection {
  features?: FacilityDatasetFeature[];
}

export interface FacilityDatasetSnapshot {
  features: FacilityDatasetFeature[];
  properties: FacilityProperties[];
}

const facilityDatasetCache = new Map<string, Promise<FacilityDatasetSnapshot>>();

export function getRuntimeFacilitiesDatasetPath(): string {
  return resolveRuntimeMapProductPath('data/facilities/facilities.geojson');
}

export function getRuntimeFacilitiesDatasetUrl(): string {
  return resolveRuntimeAssetUrl(getRuntimeFacilitiesDatasetPath());
}

export async function loadFacilityDataset(
  url = getRuntimeFacilitiesDatasetUrl(),
): Promise<FacilityDatasetSnapshot> {
  const cached = facilityDatasetCache.get(url);
  if (cached) {
    return cached;
  }

  const request = (async () => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load facilities: ${response.status}`);
    }

    const data = (await response.json()) as FacilityDatasetCollection;
    const features = data.features ?? [];

    return {
      features,
      properties: features.map((feature) =>
        parseFacilityProperties(feature.properties ?? {}),
      ),
    };
  })();

  facilityDatasetCache.set(url, request);

  try {
    return await request;
  } catch (error) {
    facilityDatasetCache.delete(url);
    throw error;
  }
}

export function clearFacilityDatasetCache(): void {
  facilityDatasetCache.clear();
}
