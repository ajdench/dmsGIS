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
    useAppStore.getState().setRegionBoundaryLayerOpacity(
      'pmcPopulatedCareBoardBoundaries',
      4,
    );

    const layer = useAppStore
      .getState()
      .regionBoundaryLayers.find(
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
        regionBoundaryLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
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
    expect(state.regionBoundaryLayers.every((layer) => !layer.visible)).toBe(true);
    expect(state.facilitySymbolShape).toBe('circle');
    expect(state.facilitySymbolSize).toBe(3.5);
    expect(state.regionGlobalOpacity).toBe(1);
  });

  it('maps coa3a to the JMC boundary dataset', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        regionBoundaryLayers: [
          {
            id: 'pmcPopulatedCareBoardBoundaries',
            name: 'PMC populated care board boundaries',
            path: 'data/regions/UK_Active_Components_Codex_v10_geojson.geojson',
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
            visible: true,
            opacity: 0,
            borderVisible: true,
            borderColor: '#999999',
            borderOpacity: 0.1,
            swatchColor: '#999999',
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
      .regionBoundaryLayers.find((entry) => entry.id === 'careBoardBoundaries');

    expect(layer).toMatchObject({
      name: 'ICB / Health Board boundaries',
      path: 'data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson',
      visible: true,
      borderColor: '#999999',
      borderOpacity: 0.1,
    });
  });
});
