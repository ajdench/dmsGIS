import { describe, expect, it } from 'vitest';
import {
  createMapSessionState,
  createNamedSavedView,
  createShareableSavedView,
  createUserSavedView,
} from '../src/lib/savedViews';

describe('savedViews', () => {
  it('creates a schema-backed map session snapshot from production state slices', () => {
    const session = createMapSessionState({
      activeViewPreset: 'coa3a',
      viewport: {
        center: [100, 200],
        zoom: 5.5,
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
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: true,
          opacity: 1,
        },
      ],
      overlayLayers: [
        {
          id: 'careBoardBoundaries',
          name: 'Care board boundaries',
          path: 'data/regions/boards.geojson',
          family: 'boardBoundaries',
          visible: true,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderOpacity: 0.14,
          swatchColor: '#8f8f8f',
        },
      ],
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
      regionGlobalOpacity: 1,
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityFilters: {
        searchQuery: 'north',
      },
      selection: {
        facilityIds: ['ABC'],
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
    });

    expect(session).toMatchObject({
      schemaVersion: 1,
      activeViewPreset: 'coa3a',
      viewport: {
        center: [100, 200],
        zoom: 5.5,
        rotation: 0,
      },
      facilities: {
        symbolShape: 'circle',
        symbolSize: 3.5,
        filters: {
          searchQuery: 'north',
        },
      },
      selection: {
        facilityIds: ['ABC'],
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
    });
  });

  it('creates named and user-owned saved views on top of a session snapshot', () => {
    const session = createMapSessionState({
      activeViewPreset: 'current',
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
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
    });

    const named = createNamedSavedView({
      metadata: {
        id: 'view-1',
        name: 'Operational view',
        description: 'Main review view',
        createdAt: '2026-03-18T12:00:00.000Z',
        updatedAt: '2026-03-18T12:00:00.000Z',
      },
      session,
    });

    const userView = createUserSavedView({
      metadata: named.metadata,
      session: named.session,
      owner: {
        userId: 'user-1',
        displayName: 'Andrew',
      },
    });

    expect(named.metadata.schemaVersion).toBe(1);
    expect(userView.owner).toEqual({
      userId: 'user-1',
      displayName: 'Andrew',
    });
  });

  it('creates a shareable saved view with explicit share policy defaults', () => {
    const session = createMapSessionState({
      activeViewPreset: 'current',
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
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
    });

    const shareable = createShareableSavedView({
      metadata: {
        id: 'view-2',
        name: 'Shared view',
        description: '',
        createdAt: '2026-03-18T12:00:00.000Z',
        updatedAt: '2026-03-18T12:00:00.000Z',
      },
      session,
      owner: {
        userId: 'user-1',
        displayName: 'Andrew',
      },
      share: {
        scope: 'users',
        sharedWithUserIds: ['user-2', 'user-3'],
      },
    });

    expect(shareable.share).toEqual({
      scope: 'users',
      canEdit: false,
      sharedWithUserIds: ['user-2', 'user-3'],
    });
  });
});
