import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../src/store/appStore';

describe('appStore region controls', () => {
  beforeEach(() => {
    useAppStore.setState({
      regionGlobalOpacity: 1,
      facilitySymbolSize: 3.5,
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
        {
          name: 'East',
          visible: true,
          color: '#fc921f',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
    });
  });

  it('broadcasts PMC global opacity to every region', () => {
    useAppStore.getState().setRegionGlobalOpacity(0.4);

    const { regionGlobalOpacity, regions } = useAppStore.getState();
    expect(regionGlobalOpacity).toBe(0.4);
    expect(regions.map((region) => region.opacity)).toEqual([0.4, 0.4]);
  });

  it('applies global PMC size changes to every region and still allows local overrides', () => {
    useAppStore.getState().setFacilitySymbolSize(5);
    useAppStore.getState().setRegionSymbolSize('East', 7.5);

    const { facilitySymbolSize, regions } = useAppStore.getState();
    expect(facilitySymbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'North')?.symbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'East')?.symbolSize).toBe(7.5);
  });

  it('clamps boundary layer opacity updates', () => {
    useAppStore.getState().setOverlayLayerOpacity(
      'pmcPopulatedCareBoardBoundaries',
      4,
    );

    const layer = useAppStore
      .getState()
      .overlayLayers.find(
        (entry) => entry.id === 'pmcPopulatedCareBoardBoundaries',
      );

    expect(layer?.opacity).toBe(1);
  });

  it('applies view presets from the pinned current baseline', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
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
        overlayLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.3,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#ed5151',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: false,
          opacity: 0.4,
        },
      ],
      regions: [
        {
          name: 'North',
          visible: false,
          color: '#000000',
          opacity: 0.25,
          borderVisible: false,
          borderColor: '#000000',
          borderOpacity: 1,
          symbolSize: 9,
        },
      ],
      facilitySymbolShape: 'square',
      facilitySymbolSize: 9,
      regionGlobalOpacity: 0.25,
      selection: {
        facilityIds: ['FAC-1'],
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
    });

    useAppStore.getState().activateViewPreset('coa3a');

    const state = useAppStore.getState();
    expect(state.activeViewPreset).toBe('coa3a');
    expect(state.layers[0]).toMatchObject({ visible: true, opacity: 1 });
    expect(state.regions[0]).toMatchObject({
      visible: true,
      color: '#a7c636',
      opacity: 1,
      symbolSize: 3.5,
    });
    expect(state.overlayLayers.every((layer) => !layer.visible)).toBe(true);
    expect(state.facilitySymbolShape).toBe('circle');
    expect(state.facilitySymbolSize).toBe(3.5);
    expect(state.regionGlobalOpacity).toBe(1);
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
    });
  });

  it('reset clears transient search and selection while restoring the active preset state', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
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
        overlayLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.3,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#ed5151',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        facilityFilters: {
          searchQuery: 'baseline',
          regions: [],
          types: [],
          defaultVisibility: 'all',
        },
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: false,
          opacity: 0.25,
        },
      ],
      regions: [
        {
          name: 'North',
          visible: false,
          color: '#000000',
          opacity: 0.2,
          borderVisible: false,
          borderColor: '#000000',
          borderOpacity: 1,
          symbolSize: 9,
        },
      ],
      overlayLayers: [
        {
          id: 'pmcPopulatedCareBoardBoundaries',
          name: 'PMC populated care board boundaries',
          path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
          family: 'boardBoundaries',
          visible: false,
          opacity: 1,
          borderVisible: false,
          borderColor: '#000000',
          borderOpacity: 1,
          swatchColor: '#000000',
        },
      ],
      facilityFilters: {
        searchQuery: 'temporary search',
        regions: [],
        types: [],
        defaultVisibility: 'all',
      },
      selection: {
        facilityIds: ['FAC-1'],
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
    });

    useAppStore.getState().resetActiveViewPreset();

    const state = useAppStore.getState();
    expect(state.layers[0]).toMatchObject({ visible: true, opacity: 1 });
    expect(state.regions[0]).toMatchObject({
      visible: true,
      color: '#a7c636',
      opacity: 1,
      symbolSize: 3.5,
    });
    expect(state.overlayLayers[0]).toMatchObject({
      visible: true,
      opacity: 0.3,
      borderVisible: true,
      borderColor: '#ffffff',
      borderOpacity: 0,
      swatchColor: '#ed5151',
    });
    expect(state.facilityFilters).toEqual({
      searchQuery: '',
      regions: [],
      types: [],
      defaultVisibility: 'all',
    });
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
    });
    expect(state.notice).toBe('Reset active view preset');
  });

  it('maps coa3a to the JMC boundary dataset', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        overlayLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.3,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#ed5151',
          },
          {
            id: 'careBoardBoundaries',
            name: 'Care board boundaries',
            path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0,
            borderVisible: true,
            borderColor: '#8f8f8f',
            borderOpacity: 0.14,
            swatchColor: '#8f8f8f',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
    });

    useAppStore.getState().activateViewPreset('coa3a');

    const layer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'careBoardBoundaries');

    expect(layer).toMatchObject({
      name: 'ICB / Health Board boundaries',
      path: 'data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson',
      family: 'boardBoundaries',
      visible: true,
      borderColor: '#8f8f8f',
      borderOpacity: 0.14,
    });
  });

  it('maps coa3b to the same board-assignment scenario dataset', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        overlayLayers: [
          {
            id: 'pmcUnpopulatedCareBoardBoundaries',
            name: 'PMC unpopulated care board boundaries',
            path: 'data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.2,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#fc921f',
          },
          {
            id: 'careBoardBoundaries',
            name: 'Care board boundaries',
            path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0,
            borderVisible: true,
            borderColor: '#8f8f8f',
            borderOpacity: 0.14,
            swatchColor: '#8f8f8f',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
    });

    useAppStore.getState().activateViewPreset('coa3b');

    const layer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'careBoardBoundaries');

    expect(layer).toMatchObject({
      name: 'ICB / Health Board boundaries',
      path: 'data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson',
      visible: true,
      borderColor: '#8f8f8f',
      borderOpacity: 0.14,
    });

    const scenarioOutlineLayer = useAppStore
      .getState()
      .overlayLayers.find(
        (entry) => entry.id === 'pmcUnpopulatedCareBoardBoundaries',
      );

    expect(scenarioOutlineLayer).toMatchObject({
      name: 'COA 3a boundaries',
      path: 'data/regions/UK_COA3A_Boundaries_Codex_v01_simplified_geojson.geojson',
      family: 'scenarioRegions',
      visible: false,
    });
  });

  it('maps coa3c to the COA 3b scenario datasets', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        overlayLayers: [
          {
            id: 'pmcUnpopulatedCareBoardBoundaries',
            name: 'PMC unpopulated care board boundaries',
            path: 'data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.2,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#fc921f',
          },
          {
            id: 'careBoardBoundaries',
            name: 'Care board boundaries',
            path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0,
            borderVisible: true,
            borderColor: '#8f8f8f',
            borderOpacity: 0.14,
            swatchColor: '#8f8f8f',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
    });

    useAppStore.getState().activateViewPreset('coa3c');

    const layer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'careBoardBoundaries');

    expect(layer).toMatchObject({
      name: 'ICB / Health Board boundaries',
      path: 'data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson',
      visible: true,
      borderColor: '#8f8f8f',
      borderOpacity: 0.14,
    });

    const scenarioOutlineLayer = useAppStore
      .getState()
      .overlayLayers.find(
        (entry) => entry.id === 'pmcUnpopulatedCareBoardBoundaries',
      );

    expect(scenarioOutlineLayer).toMatchObject({
      name: 'COA 3b boundaries',
      path: 'data/regions/UK_COA3B_Boundaries_Codex_v01_simplified_geojson.geojson',
      family: 'scenarioRegions',
      visible: false,
    });
  });

  it('classifies current and scenario overlays by family', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        overlayLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.3,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#ed5151',
          },
          {
            id: 'pmcUnpopulatedCareBoardBoundaries',
            name: 'PMC unpopulated care board boundaries',
            path: 'data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0.2,
            borderVisible: true,
            borderColor: '#ffffff',
            borderOpacity: 0,
            swatchColor: '#fc921f',
          },
          {
            id: 'careBoardBoundaries',
            name: 'Care board boundaries',
            path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
            family: 'boardBoundaries',
            visible: true,
            opacity: 0,
            borderVisible: true,
            borderColor: '#8f8f8f',
            borderOpacity: 0.14,
            swatchColor: '#8f8f8f',
          },
        ],
        regionGlobalOpacity: 1,
        facilitySymbolShape: 'circle',
        facilitySymbolSize: 3.5,
        basemap: {
          provider: 'localDetailed',
          scale: '10m',
          landFillColor: '#ecf0e6',
          landFillOpacity: 1,
          showLandFill: true,
          countryBorderColor: '#EBEBEB',
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
      },
    });

    useAppStore.getState().activateViewPreset('current');

    const currentFamilies = useAppStore
      .getState()
      .overlayLayers.map((layer) => [layer.id, layer.family]);

    expect(currentFamilies).toEqual([
      ['pmcPopulatedCareBoardBoundaries', 'boardBoundaries'],
      ['pmcUnpopulatedCareBoardBoundaries', 'boardBoundaries'],
      ['careBoardBoundaries', 'boardBoundaries'],
    ]);

    useAppStore.getState().activateViewPreset('coa3b');

    const scenarioFamilies = useAppStore
      .getState()
      .overlayLayers.map((layer) => [layer.id, layer.family]);

    expect(scenarioFamilies).toEqual([
      ['pmcPopulatedCareBoardBoundaries', 'boardBoundaries'],
      ['pmcUnpopulatedCareBoardBoundaries', 'scenarioRegions'],
      ['careBoardBoundaries', 'boardBoundaries'],
    ]);
  });

  it('creates and reapplies a map session snapshot from store state', () => {
    useAppStore.setState({
      activeViewPreset: 'coa3a',
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visible: true,
          opacity: 0.8,
        },
      ],
      overlayLayers: [
        {
          id: 'careBoardBoundaries',
          name: 'Care board boundaries',
          path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
          family: 'boardBoundaries',
          visible: true,
          opacity: 0.4,
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
          opacity: 0.6,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0.2,
          symbolSize: 4.5,
        },
      ],
      regionGlobalOpacity: 0.6,
      facilitySymbolShape: 'diamond',
      facilitySymbolSize: 4.5,
      facilityFilters: {
        searchQuery: 'north',
        regions: ['North'],
        types: ['pmc-facility'],
        defaultVisibility: 'default-visible',
      },
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#ecf0e6',
        landFillOpacity: 1,
        showLandFill: true,
        countryBorderColor: '#EBEBEB',
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
      mapViewport: {
        center: [100, 200],
        zoom: 5.5,
        rotation: 0.25,
      },
      selection: {
        facilityIds: ['ABC'],
        boundaryName: 'Boundary A',
        jmcName: 'JMC North',
      },
    });

    const snapshot = useAppStore.getState().createMapSessionSnapshot();

    useAppStore.setState({
      activeViewPreset: 'current',
      layers: [],
      overlayLayers: [],
      regions: [],
      regionGlobalOpacity: 1,
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      facilityFilters: {
        searchQuery: '',
        regions: [],
        types: [],
        defaultVisibility: 'all',
      },
      mapViewport: {
        center: [0, 0],
        zoom: 0,
        rotation: 0,
      },
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
      },
    });

    useAppStore.getState().applyMapSessionState(snapshot);

    const state = useAppStore.getState();
    expect(state.activeViewPreset).toBe('coa3a');
    expect(state.facilityFilters).toEqual({
      searchQuery: 'north',
      regions: ['North'],
      types: ['pmc-facility'],
      defaultVisibility: 'default-visible',
    });
    expect(state.mapViewport).toEqual({
      center: [100, 200],
      zoom: 5.5,
      rotation: 0.25,
    });
    expect(state.selection).toEqual({
      facilityIds: ['ABC'],
      boundaryName: 'Boundary A',
      jmcName: 'JMC North',
    });
    expect(state.facilitySymbolShape).toBe('diamond');
    expect(state.overlayLayers[0]).toMatchObject({
      id: 'careBoardBoundaries',
      opacity: 0.4,
    });
  });
});
