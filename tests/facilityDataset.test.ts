import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearFacilityDatasetCache,
  getRuntimeFacilitiesDatasetPath,
  loadFacilityDataset,
} from '../src/lib/services/facilityDataset';

describe('facilityDataset service', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    clearFacilityDatasetCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    clearFacilityDatasetCache();
  });

  it('resolves the facilities dataset through the active runtime family', () => {
    expect(getRuntimeFacilitiesDatasetPath()).toBe(
      'data/compare/shared-foundation-review/facilities/facilities.geojson',
    );
  });

  it('caches facility dataset fetches by resolved url', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              id: 'FAC-1',
              name: 'Alpha Clinic',
              region: 'North',
              type: 'pmc-facility',
              default_visible: 1,
              point_color_hex: '#a7c636',
              point_alpha: 1,
            },
          },
        ],
      }),
    });
    global.fetch = fetchMock as typeof fetch;

    const first = await loadFacilityDataset('/runtime/facilities.geojson');
    const second = await loadFacilityDataset('/runtime/facilities.geojson');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.properties[0]?.name).toBe('Alpha Clinic');
    expect(second.properties[0]?.name).toBe('Alpha Clinic');
  });
});
