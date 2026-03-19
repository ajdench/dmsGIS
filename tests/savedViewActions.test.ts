import { describe, expect, it, vi } from 'vitest';
import type { MapSessionState } from '../src/lib/schemas/savedViews';
import {
  deleteSavedViewById,
  listSavedViews,
  openSavedViewById,
  saveCurrentViewAs,
  type SavedViewActionState,
} from '../src/lib/browser/savedViewActions';
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

function createSession(): MapSessionState {
  return {
    schemaVersion: 1,
    activeViewPreset: 'coa3a',
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
        searchQuery: 'north',
        regions: ['North'],
        types: ['pmc-facility'],
        defaultVisibility: 'default-visible',
      },
    },
    selection: {
      facilityIds: ['ABC'],
      boundaryName: 'Boundary A',
      jmcName: 'JMC North',
    },
  };
}

function createState(session = createSession()) {
  const notices: Array<string | null> = [];
  const applyMapSessionState = vi.fn();
  const state: SavedViewActionState = {
    createMapSessionSnapshot: () => session,
    applyMapSessionState,
    setNotice: (notice) => notices.push(notice),
  };

  return {
    state,
    notices,
    applyMapSessionState,
  };
}

describe('savedViewActions', () => {
  it('saves the current view through the storage boundary', async () => {
    const store = createLocalSavedViewStore(new MemoryStorage());
    const { state, notices } = createState();

    const saved = await saveCurrentViewAs(state, 'Operational view', store);

    expect(saved?.metadata.name).toBe('Operational view');
    expect(saved?.session.selection.facilityIds).toEqual(['ABC']);
    await expect(listSavedViews(store)).resolves.toHaveLength(1);
    expect(notices.at(-1)).toBe('Saved view "Operational view"');
  });

  it('opens a saved view by id and applies its session', async () => {
    const store = createLocalSavedViewStore(new MemoryStorage());
    const session = createSession();
    const { state, applyMapSessionState, notices } = createState(session);
    const saved = await saveCurrentViewAs(state, 'Review view', store);

    const opened = await openSavedViewById(state, saved?.metadata.id ?? '', store);

    expect(opened?.metadata.name).toBe('Review view');
    expect(applyMapSessionState).toHaveBeenCalledWith(session);
    expect(notices.at(-1)).toBe('Opened saved view "Review view"');
  });

  it('deletes an existing saved view by id', async () => {
    const store = createLocalSavedViewStore(new MemoryStorage());
    const { state, notices } = createState();
    const saved = await saveCurrentViewAs(state, 'Delete me', store);

    const deleted = await deleteSavedViewById(state, saved?.metadata.id ?? '', store);

    expect(deleted).toBe(true);
    await expect(listSavedViews(store)).resolves.toEqual([]);
    expect(notices.at(-1)).toBe('Deleted saved view "Delete me"');
  });
});
