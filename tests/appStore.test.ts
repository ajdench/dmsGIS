import { beforeEach, describe, expect, it } from 'vitest';
import { resolveRuntimeMapProductPath } from '../src/lib/config/runtimeMapProducts';
import { useAppStore } from '../src/store/appStore';
import type { OverlayLayerStyle, OverlayFamily } from '../src/types';

const V10 = 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson';
const CURRENT_JMC_OUTLINE_PATH = 'data/regions/UK_JMC_Outline_arcs.geojson';
const JMC_OUTLINE_PATH = resolveRuntimeMapProductPath('data/regions/UK_JMC_Outline_arcs.geojson');
const MINIMAL_BASEMAP = {
  provider: 'localDetailed' as const,
  scale: '10m' as const,
  landFillColor: '#ecf0e6', landFillOpacity: 1, showLandFill: true,
  countryBorderColor: '#EBEBEB', countryBorderOpacity: 1, showCountryBorders: true,
  countryLabelColor: '#0f172a', countryLabelOpacity: 1, showCountryLabels: false,
  majorCityColor: '#1f2937', majorCityOpacity: 1, showMajorCities: false,
  seaFillColor: '#d9e7f5', seaFillOpacity: 1, showSeaFill: true,
  seaLabelColor: '#334155', seaLabelOpacity: 1, showSeaLabels: false,
};

function makeLayer(id: string, family: OverlayFamily, path: string): OverlayLayerStyle {
  return { id, name: id, path, family, visible: true, opacity: 0.5,
    borderVisible: true, borderColor: '#8f8f8f', borderWidth: 1, borderOpacity: 0.14, swatchColor: '#8f8f8f' };
}

function makeCurrentPresetState() {
  return {
    layers: [],
    regions: [],
    combinedPractices: [
      {
        name: 'Portsmouth Combined Medical Practice',
        displayName: 'Portsmouth',
        visible: true,
        borderColor: '#0f766e',
        borderWidth: 1,
        borderOpacity: 1,
      },
    ],
    combinedPracticeCatalog: [
      {
        name: 'Portsmouth Combined Medical Practice',
        displayName: 'Portsmouth',
        regions: ['London & South'],
      },
    ],
    overlayLayers: [
      makeLayer('regionFill', 'regionFill', V10),
      makeLayer('wardSplitFill', 'wardSplitFill', 'data/regions/UK_WardSplit_simplified.geojson'),
      makeLayer(
        'wardSplitWards',
        'wardSplitWards',
        'data/regions/UK_WardSplit_Canonical_Current_exact.geojson',
      ),
      makeLayer('englandIcb', 'englandIcb', V10),
      makeLayer('devolvedHb', 'devolvedHb', V10),
      {
        ...makeLayer(
          'nhsEnglandRegionsBsc',
          'nhsRegions',
          'data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson',
        ),
        visible: false,
        borderVisible: false,
      },
      {
        ...makeLayer(
          'sjcJmcOutline',
          'customRegions',
          'data/regions/UK_JMC_Outline_arcs.geojson',
        ),
        visible: false,
        borderVisible: false,
      },
      makeLayer('scenarioOutline', 'scenarioRegions', ''),
    ],
    regionGlobalOpacity: 1,
    facilitySymbolShape: 'circle' as const,
    facilitySymbolSize: 3.5,
    basemap: MINIMAL_BASEMAP,
  };
}

describe('appStore region controls', () => {
  beforeEach(() => {
    useAppStore.setState({
      regionGlobalOpacity: 1,
      facilitySymbolSize: 3.5,
      combinedPracticeStyles: [
        {
          name: 'Portsmouth Combined Medical Practice',
          displayName: 'Portsmouth',
          visible: true,
          borderColor: '#0f766e',
          borderWidth: 1,
          borderOpacity: 1,
        },
        {
          name: 'Stonehouse Combined Medical Practice',
          displayName: 'Stonehouse',
          visible: true,
          borderColor: '#b45309',
          borderWidth: 1,
          borderOpacity: 1,
        },
      ],
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#ffffff',
          borderWidth: 1,
          borderOpacity: 0,
          symbolSize: 3.5,
        },
        {
          name: 'East',
          visible: true,
          color: '#fc921f',
          opacity: 1,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#ffffff',
          borderWidth: 1,
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

  it('updates the facility search filter state through store setters', () => {
    useAppStore.getState().setFacilitySearchQuery('north');

    expect(useAppStore.getState().facilityFilters).toEqual({
      searchQuery: 'north',
    });

    useAppStore.getState().resetFacilityFilters();

    expect(useAppStore.getState().facilityFilters).toEqual({
      searchQuery: '',
    });
  });

  it('tracks a facility selection request for map-driven selection', () => {
    useAppStore.getState().requestFacilitySelection('FAC-123');

    expect(useAppStore.getState().facilitySelectionRequestId).toBe('FAC-123');
    expect(useAppStore.getState().facilitySelectionRequestNonce).toBe(1);

    useAppStore.getState().clearFacilitySelectionRequest();

    expect(useAppStore.getState().facilitySelectionRequestId).toBeNull();
    expect(useAppStore.getState().facilitySelectionRequestNonce).toBe(1);
  });

  it('normalizes string notices to the info tone', () => {
    useAppStore.getState().setNotice('Operational message');

    expect(useAppStore.getState().notice).toEqual({
      message: 'Operational message',
      tone: 'info',
    });

    useAppStore.getState().setNotice(null);

    expect(useAppStore.getState().notice).toBeNull();
  });

  it('applies global PMC size changes to every region and still allows local overrides', () => {
    useAppStore.getState().setFacilitySymbolSize(5);
    useAppStore.getState().setRegionSymbolSize('East', 7.5);

    const { facilitySymbolSize, regions } = useAppStore.getState();
    expect(facilitySymbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'North')?.symbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'East')?.symbolSize).toBe(7.5);
  });

  it('resets global PMC region colours back to the active preset defaults', () => {
    useAppStore.setState({
      currentViewPresetState: {
        ...makeCurrentPresetState(),
        regions: [
          {
            name: 'North',
            visible: true,
            color: '#0f766e',
            opacity: 1,
            shape: 'circle',
            borderVisible: true,
            borderColor: '#ffffff',
            borderWidth: 1,
            borderOpacity: 0,
            symbolSize: 3.5,
          },
          {
            name: 'East',
            visible: true,
            color: '#7c3aed',
            opacity: 1,
            shape: 'circle',
            borderVisible: true,
            borderColor: '#ffffff',
            borderWidth: 1,
            borderOpacity: 0,
            symbolSize: 3.5,
          },
        ],
      },
    });

    useAppStore.getState().setAllRegionColor('#111111');
    useAppStore.getState().resetAllRegionColorsToDefault();

    const { regions } = useAppStore.getState();
    expect(regions.find((region) => region.name === 'North')?.color).toBe('#0f766e');
    expect(regions.find((region) => region.name === 'East')?.color).toBe('#7c3aed');
  });

  it('applies global PMC shape changes to every region and still allows local overrides', () => {
    useAppStore.getState().setFacilitySymbolShape('diamond');
    useAppStore.getState().setRegionShape('East', 'triangle');

    const { facilitySymbolShape, regions } = useAppStore.getState();
    expect(facilitySymbolShape).toBe('diamond');
    expect(regions.find((region) => region.name === 'North')?.shape).toBe('diamond');
    expect(regions.find((region) => region.name === 'East')?.shape).toBe('triangle');
  });

  it('allows global and local PMC border thickness updates', () => {
    useAppStore.getState().setAllRegionBorderWidth(2);
    useAppStore.getState().setRegionBorderWidth('East', 3.25);

    const { regions } = useAppStore.getState();
    expect(regions.find((region) => region.name === 'North')?.borderWidth).toBe(2);
    expect(regions.find((region) => region.name === 'East')?.borderWidth).toBe(
      3.25,
    );
  });

  it('makes point borders immediately visible when turning them on from the default-off state', () => {
    useAppStore.setState({
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          shape: 'circle',
          borderVisible: false,
          borderColor: '#ffffff',
          borderWidth: 1,
          borderOpacity: 0,
          symbolSize: 3.5,
        },
        {
          name: 'East',
          visible: true,
          color: '#fc921f',
          opacity: 1,
          shape: 'circle',
          borderVisible: false,
          borderColor: '#ffffff',
          borderWidth: 1,
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
    });

    useAppStore.getState().setAllRegionBorderVisibility(true);

    const { regions } = useAppStore.getState();
    expect(regions.every((region) => region.borderVisible)).toBe(true);
    expect(regions.every((region) => region.borderOpacity === 1)).toBe(true);
    expect(regions.every((region) => region.borderWidth === 1)).toBe(true);
  });

  it('resets global combined-practice colours back to the active preset defaults', () => {
    useAppStore.getState().setAllCombinedPracticeBorderColor('#111111');
    useAppStore.getState().resetAllCombinedPracticeColorsToDefault();

    const { combinedPracticeStyles } = useAppStore.getState();
    expect(
      combinedPracticeStyles.find(
        (practice) => practice.name === 'Portsmouth Combined Medical Practice',
      )?.borderColor,
    ).toBe('#0f766e');
  });

  it('allows global and local combined-practice border thickness updates', () => {
    useAppStore.getState().setAllCombinedPracticeBorderWidth(2);
    useAppStore
      .getState()
      .setCombinedPracticeBorderWidth('Stonehouse Combined Medical Practice', 3.25);

    const { combinedPracticeStyles } = useAppStore.getState();
    expect(
      combinedPracticeStyles.find(
        (practice) => practice.name === 'Portsmouth Combined Medical Practice',
      )?.borderWidth,
    ).toBe(2);
    expect(
      combinedPracticeStyles.find(
        (practice) => practice.name === 'Stonehouse Combined Medical Practice',
      )?.borderWidth,
    ).toBe(3.25);
  });

  it('clamps boundary layer opacity updates', () => {
    useAppStore.getState().setOverlayLayerOpacity('regionFill', 4);

    const layer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'regionFill');

    expect(layer?.opacity).toBe(1);
  });

  it('allows overlay border thickness updates and clamps them', () => {
    useAppStore.getState().setOverlayLayerBorderWidth('englandIcb', 2.25);
    useAppStore.getState().setOverlayLayerBorderWidth('devolvedHb', 99);

    const englandLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'englandIcb');
    const devolvedLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'devolvedHb');

    expect(englandLayer?.borderWidth).toBe(2.25);
    expect(devolvedLayer?.borderWidth).toBe(10);
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
        combinedPractices: [],
        combinedPracticeCatalog: [],
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
      visible: false,
      color: '#000000',
      opacity: 0.25,
      symbolSize: 9,
    });
    expect(state.overlayLayers.every((layer) => !layer.visible)).toBe(true);
    expect(state.facilitySymbolShape).toBe('square');
    expect(state.facilitySymbolSize).toBe(9);
    expect(state.regionGlobalOpacity).toBe(0.25);
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
    });
  });

  it('preserves point presentation state when returning to current while clearing transient selection', () => {
    useAppStore.setState({
      activeViewPreset: 'coa3a',
      currentViewPresetState: makeCurrentPresetState(),
      regions: [
        {
          name: 'North',
          visible: false,
          color: '#13579b',
          opacity: 0.45,
          borderVisible: true,
          borderColor: '#2468ac',
          borderOpacity: 0.8,
          symbolSize: 8.25,
        },
      ],
      combinedPracticeStyles: [
        {
          name: 'Portsmouth Combined Medical Practice',
          displayName: 'Portsmouth',
          visible: true,
          borderColor: '#112233',
          borderWidth: 2.5,
          borderOpacity: 0.9,
        },
      ],
      facilitySymbolShape: 'triangle',
      facilitySymbolSize: 8.25,
      regionGlobalOpacity: 0.45,
      selection: {
        facilityIds: ['FAC-2'],
        boundaryName: 'Boundary B',
        jmcName: null,
        scenarioRegionId: 'coa3a_north',
      },
    });

    useAppStore.getState().activateViewPreset('current');

    const state = useAppStore.getState();
    expect(state.activeViewPreset).toBe('current');
    expect(state.regions[0]).toMatchObject({
      visible: false,
      color: '#13579b',
      opacity: 0.45,
      symbolSize: 8.25,
    });
    expect(state.combinedPracticeStyles[0]).toMatchObject({
      name: 'Portsmouth Combined Medical Practice',
      borderColor: '#112233',
      borderWidth: 2.5,
      borderOpacity: 0.9,
    });
    expect(state.facilitySymbolShape).toBe('triangle');
    expect(state.facilitySymbolSize).toBe(8.25);
    expect(state.regionGlobalOpacity).toBe(0.45);
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
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
        combinedPractices: [],
        combinedPracticeCatalog: [],
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
    });
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
    });
    expect(state.notice).toEqual({
      message: 'Reset active view preset',
      tone: 'info',
    });
  });

  it('maps coa3a to the JMC boundary dataset', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('coa3a');

    const layer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'englandIcb');

    expect(layer).toMatchObject({
      name: '2026 NHS England ICBs',
      family: 'englandIcb',
      visible: false,
      borderVisible: true,
    });
    expect(layer?.path).toContain('UK_Health_Board_2026_topology_edges.geojson');

    const scenarioOutlineLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'scenarioOutline');

    expect(scenarioOutlineLayer).toMatchObject({
      name: 'JMC boundary',
      family: 'scenarioRegions',
      visible: false,
    });
    expect(scenarioOutlineLayer?.path).toContain('UK_JMC_Outline_arcs.geojson');
  });

  it('maps coa3b to the same board-assignment scenario dataset', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('coa3b');

    const englandLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'englandIcb');

    expect(englandLayer).toMatchObject({
      name: '2026 NHS England ICBs',
      family: 'englandIcb',
      visible: false,
      borderVisible: true,
    });
    expect(englandLayer?.path).toContain('UK_Health_Board_2026_topology_edges.geojson');

    const scenarioOutlineLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'scenarioOutline');

    expect(scenarioOutlineLayer).toMatchObject({
      name: 'COA 3a boundaries',
      family: 'scenarioRegions',
      visible: false,
    });
    expect(scenarioOutlineLayer?.path).toContain('UK_COA3A_Outline_arcs.geojson');
  });

  it('maps coa3c to the COA 3b scenario datasets', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('coa3c');

    const englandLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'englandIcb');

    expect(englandLayer).toMatchObject({
      name: '2026 NHS England ICBs',
      family: 'englandIcb',
      visible: false,
      borderVisible: true,
    });
    expect(englandLayer?.path).toContain('UK_Health_Board_2026_topology_edges.geojson');

    const scenarioOutlineLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'scenarioOutline');

    expect(scenarioOutlineLayer).toMatchObject({
      name: 'COA 3b boundaries',
      family: 'scenarioRegions',
      visible: false,
    });
    expect(scenarioOutlineLayer?.path).toContain('UK_COA3B_Outline_arcs.geojson');
  });

  it('classifies current and scenario overlays by family', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('current');

    const currentFamilies = useAppStore
      .getState()
      .overlayLayers.map((layer) => [layer.id, layer.family]);

    expect(currentFamilies).toEqual([
      ['regionFill', 'regionFill'],
      ['wardSplitFill', 'wardSplitFill'],
      ['wardSplitWards', 'wardSplitWards'],
      ['englandIcb', 'englandIcb'],
      ['devolvedHb', 'devolvedHb'],
      ['nhsEnglandRegionsBsc', 'nhsRegions'],
      ['sjcJmcOutline', 'customRegions'],
      ['scenarioOutline', 'scenarioRegions'],
    ]);

    useAppStore.getState().activateViewPreset('coa3b');

    const scenarioFamilies = useAppStore
      .getState()
      .overlayLayers.map((layer) => [layer.id, layer.family]);

    expect(scenarioFamilies).toEqual([
      ['regionFill', 'regionFill'],
      ['wardSplitFill', 'wardSplitFill'],
      ['englandIcb', 'englandIcb'],
      ['devolvedHb', 'devolvedHb'],
      ['nhsEnglandRegionsBsc', 'nhsRegions'],
      ['sjcJmcOutline', 'customRegions'],
      ['scenarioOutline', 'scenarioRegions'],
    ]);
  });

  it('adds the NHS England Regions BSC and SJC JMC overlays as default-off current overlays', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('current');

    const nhsRegionsLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'nhsEnglandRegionsBsc');
    const sjcJmcLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'sjcJmcOutline');

    expect(nhsRegionsLayer).toMatchObject({
      family: 'nhsRegions',
      path: 'data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson',
      visible: false,
      borderVisible: false,
    });
    expect(sjcJmcLayer).toMatchObject({
      family: 'customRegions',
      path: CURRENT_JMC_OUTLINE_PATH,
      visible: false,
      borderVisible: false,
    });
  });

  it('retargets the SJC JMC overlay to the 2026 JMC runtime outline in scenario presets', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
    });

    useAppStore.getState().activateViewPreset('coa3a');

    const sjcJmcLayer = useAppStore
      .getState()
      .overlayLayers.find((entry) => entry.id === 'sjcJmcOutline');

    expect(sjcJmcLayer).toMatchObject({
      family: 'customRegions',
      name: 'SJC JMC',
      path: JMC_OUTLINE_PATH,
      visible: false,
      borderVisible: false,
    });
  });

  it('seeds region-group border defaults from the active preset when first enabled', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      regionGroupOverrides: {},
    });

    useAppStore.getState().setRegionGroupBorderVisible('North', true);

    expect(useAppStore.getState().regionGroupOverrides.North).toMatchObject({
      borderVisible: true,
      borderColor: '#a7c636',
      borderOpacity: 0.5,
      borderWidth: 1,
    });
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
      scenarioRegionId: null,
    });
    expect(state.facilitySymbolShape).toBe('diamond');
    expect(state.overlayLayers[0]).toMatchObject({
      id: 'careBoardBoundaries',
      opacity: 0.4,
    });
  });

  it('tracks an active scenario workspace draft alongside scenario presets', () => {
    useAppStore.setState({
      activeViewPreset: 'current',
      currentViewPresetState: {
        layers: [],
        regions: [],
        combinedPractices: [],
        combinedPracticeCatalog: [],
        overlayLayers: [],
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

    const state = useAppStore.getState();
    expect(state.activeScenarioWorkspaceId).toBe('coa3b');
    expect(state.scenarioWorkspaceDrafts.coa3b).toMatchObject({
      id: 'coa3b',
      boundarySystemId: 'icbHb2026',
      assignments: [],
    });
  });

  it('keeps the standard preset indicator stable when entering playground mode', () => {
    useAppStore.setState({
      activeStandardViewPreset: 'current',
      activeViewPreset: 'current',
      currentViewPresetState: makeCurrentPresetState(),
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#556677',
          opacity: 0.6,
          borderVisible: true,
          borderColor: '#99aabb',
          borderOpacity: 0.5,
          symbolSize: 6.5,
        },
      ],
      facilitySymbolShape: 'diamond',
      facilitySymbolSize: 6.5,
      regionGlobalOpacity: 0.6,
      selection: {
        facilityIds: ['FAC-9'],
        boundaryName: 'Boundary Playground',
        jmcName: 'JMC East',
        scenarioRegionId: 'coa3c_east',
      },
    });

    useAppStore
      .getState()
      .activateInteractiveScenarioWorkspace('coa3c', 'dphcEstimateCoaPlayground');

    const state = useAppStore.getState();
    expect(state.activeStandardViewPreset).toBe('current');
    expect(state.activeViewPreset).toBe('coa3c');
    expect(state.activeScenarioWorkspaceId).toBe('dphcEstimateCoaPlayground');
    expect(state.facilitySymbolShape).toBe('diamond');
    expect(state.facilitySymbolSize).toBe(6.5);
    expect(state.regionGlobalOpacity).toBe(0.6);
    expect(state.regions[0]).toMatchObject({
      color: '#556677',
      opacity: 0.6,
      symbolSize: 6.5,
    });
    expect(state.selection).toEqual({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
    });
  });

  it('restores the active playground workspace token from a saved session snapshot', () => {
    useAppStore.getState().applyMapSessionState({
      schemaVersion: 1,
      activeViewPreset: 'coa3b',
      activeScenarioWorkspaceId: 'dphcEstimateCoa3aPlayground',
      viewport: {
        center: [0, 0],
        zoom: 4,
        rotation: 0,
      },
      basemap: MINIMAL_BASEMAP,
      layers: [],
      overlayLayers: [],
      regions: [],
      regionGlobalOpacity: 1,
      facilities: {
        symbolShape: 'circle',
        symbolSize: 3.5,
        filters: {
          searchQuery: '',
        },
      },
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
        scenarioRegionId: null,
      },
    });

    const state = useAppStore.getState();
    expect(state.activeViewPreset).toBe('coa3b');
    expect(state.activeScenarioWorkspaceId).toBe('dphcEstimateCoa3aPlayground');
    expect(state.scenarioWorkspaceDrafts.dphcEstimateCoa3aPlayground).toMatchObject({
      id: 'dphcEstimateCoa3aPlayground',
      boundarySystemId: 'icbHb2026',
      assignments: [],
    });
  });

  it('stores boundary reassignment drafts and exposes derived region counts', () => {
    useAppStore.getState().activateScenarioWorkspace('dphcEstimateCoaPlayground');
    useAppStore.getState().assignScenarioWorkspaceBoundaryUnit(
      'dphcEstimateCoaPlayground',
      'UNIT-123',
      'coa3b_london_east',
    );
    useAppStore.getState().selectScenarioWorkspaceBoundaryUnit('UNIT-123');

    const state = useAppStore.getState();
    expect(
      state.scenarioWorkspaceDrafts.dphcEstimateCoaPlayground?.assignments,
    ).toEqual([
      {
        boundaryUnitId: 'UNIT-123',
        scenarioRegionId: 'coa3b_london_east',
      },
    ]);
    expect(state.scenarioWorkspaceEditor).toEqual({
      selectedBoundaryUnitId: 'UNIT-123',
      selectedScenarioRegionId: 'coa3b_london_east',
      pendingScenarioRegionId: 'coa3b_london_east',
      isDirty: true,
    });
    expect(
      useAppStore
        .getState()
        .getDerivedScenarioWorkspace('dphcEstimateCoaPlayground')
        ?.regions.find((region) => region.regionId === 'coa3b_london_east'),
    ).toEqual({
      regionId: 'coa3b_london_east',
      label: 'COA 3b London and East',
      assignmentCount: 1,
    });
  });

  it('can seed the editor selection from a currently assigned baseline region before any draft override exists', () => {
    useAppStore.getState().activateScenarioWorkspace('dphcEstimateCoaPlayground');
    useAppStore.getState().selectScenarioWorkspaceBoundaryUnit(
      'UNIT-456',
      'coa3b_midlands',
    );

    expect(useAppStore.getState().scenarioWorkspaceEditor).toEqual({
      selectedBoundaryUnitId: 'UNIT-456',
      selectedScenarioRegionId: 'coa3b_midlands',
      pendingScenarioRegionId: 'coa3b_midlands',
      isDirty: false,
    });
  });

  it('can clear the transient editor selection after applying a reassignment', () => {
    useAppStore.getState().activateScenarioWorkspace('dphcEstimateCoaPlayground');
    useAppStore.getState().assignScenarioWorkspaceBoundaryUnit(
      'dphcEstimateCoaPlayground',
      'UNIT-123',
      'coa3b_london_east',
    );
    useAppStore.getState().selectScenarioWorkspaceBoundaryUnit('UNIT-123');

    useAppStore.getState().selectScenarioWorkspaceBoundaryUnit(null);

    expect(useAppStore.getState().scenarioWorkspaceEditor).toEqual({
      selectedBoundaryUnitId: null,
      selectedScenarioRegionId: null,
      pendingScenarioRegionId: null,
      isDirty: true,
    });
  });

  it('resets a scenario workspace draft back to an empty editable baseline', () => {
    useAppStore.getState().activateScenarioWorkspace('dphcEstimateCoaPlayground');
    useAppStore.getState().assignScenarioWorkspaceBoundaryUnit(
      'dphcEstimateCoaPlayground',
      'UNIT-123',
      'coa3b_london_east',
    );

    useAppStore
      .getState()
      .resetScenarioWorkspaceDraft('dphcEstimateCoaPlayground');

    const state = useAppStore.getState();
    expect(
      state.scenarioWorkspaceDrafts.dphcEstimateCoaPlayground?.assignments,
    ).toEqual([]);
    expect(state.scenarioWorkspaceEditor).toEqual({
      selectedBoundaryUnitId: null,
      selectedScenarioRegionId: null,
      pendingScenarioRegionId: null,
      isDirty: false,
    });
  });
});
