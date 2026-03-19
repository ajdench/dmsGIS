import { describe, expect, it } from 'vitest';
import { createNamedSavedView } from '../src/lib/savedViews';
import { createLocalSavedViewStore } from '../src/lib/services/savedViewStore';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function createTestSavedView(id: string, name: string) {
  return createNamedSavedView({
    metadata: {
      id,
      name,
      description: '',
      createdAt: '2026-03-19T00:00:00.000Z',
      updatedAt: '2026-03-19T00:00:00.000Z',
    },
    session: {
      schemaVersion: 1,
      activeViewPreset: 'current',
      viewport: {
        center: [100, 200],
        zoom: 4,
        rotation: 0,
      },
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#ecf0e6',
        landFillOpacity: 1,
        showLandFill: true,
        countryBorderColor: '#ebebeb',
        countryBorderOpacity: 1,
        showCountryBorders: true,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 1,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 1,
        showMajorCities: false,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 1,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 1,
        showSeaLabels: false,
      },
      layers: [],
      overlayLayers: [],
      regions: [],
      regionGlobalOpacity: 1,
      facilities: {
        symbolShape: 'circle',
        symbolSize: 3.5,
        filters: {
          searchQuery: '',
          regions: [],
          types: [],
          defaultVisibility: 'all',
        },
      },
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
      },
    },
  });
}

describe('savedViewStore', () => {
  it('round-trips schema-backed saved views through local storage', async () => {
    const storage = new MemoryStorage();
    const store = createLocalSavedViewStore(storage);
    const savedView = createTestSavedView('view-1', 'Operational view');

    await store.save(savedView);

    await expect(store.get('view-1')).resolves.toEqual(savedView);
    await expect(store.list()).resolves.toEqual([savedView]);
  });

  it('replaces an existing saved view with the same id', async () => {
    const storage = new MemoryStorage();
    const store = createLocalSavedViewStore(storage);

    await store.save(createTestSavedView('view-1', 'Original'));

    const updated = createTestSavedView('view-1', 'Updated');
    await store.save(updated);

    await expect(store.list()).resolves.toEqual([updated]);
  });
});
