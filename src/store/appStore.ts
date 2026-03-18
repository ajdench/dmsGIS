import { create } from 'zustand';
import type {
  BasemapProvider,
  BasemapScale,
  BasemapSettings,
  FacilitySymbolShape,
  LayerState,
  RegionBoundaryLayerStyle,
  RegionStyle,
  ViewPresetId,
} from '../types';
import {
  BOARD_BOUNDARY_BASE_STYLE,
  getScenarioBoardLayerConfig,
  getScenarioOutlineLayerConfig,
  isScenarioPreset,
} from '../lib/config/viewPresets';
import { fetchLayerManifest } from '../lib/services/layers';

interface ViewPresetState {
  layers: LayerState[];
  regions: RegionStyle[];
  regionBoundaryLayers: RegionBoundaryLayerStyle[];
  regionGlobalOpacity: number;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  basemap: BasemapSettings;
}

interface AppState {
  layers: LayerState[];
  regions: RegionStyle[];
  regionBoundaryLayers: RegionBoundaryLayerStyle[];
  regionGlobalOpacity: number;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  basemap: BasemapSettings;
  activeViewPreset: ViewPresetId;
  currentViewPresetState: ViewPresetState | null;
  isLoading: boolean;
  error: string | null;
  loadLayers: () => Promise<void>;
  activateViewPreset: (preset: ViewPresetId) => void;
  toggleLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setBasemapProvider: (provider: BasemapProvider) => void;
  setBasemapScale: (scale: BasemapScale) => void;
  setBasemapElementColor: (
    key:
      | 'landFillColor'
      | 'countryBorderColor'
      | 'countryLabelColor'
      | 'majorCityColor'
      | 'seaFillColor'
      | 'seaLabelColor',
    color: string,
  ) => void;
  setBasemapElementOpacity: (
    key:
      | 'landFillOpacity'
      | 'countryBorderOpacity'
      | 'countryLabelOpacity'
      | 'majorCityOpacity'
      | 'seaFillOpacity'
      | 'seaLabelOpacity',
    opacity: number,
  ) => void;
  setBasemapLayerVisibility: (
    key:
      | 'showLandFill'
      | 'showCountryBorders'
      | 'showCountryLabels'
      | 'showMajorCities'
      | 'showSeaFill'
      | 'showSeaLabels',
    visible: boolean,
  ) => void;
  setRegionVisibility: (name: string, visible: boolean) => void;
  setRegionColor: (name: string, color: string) => void;
  setRegionOpacity: (name: string, opacity: number) => void;
  setRegionBorderVisibility: (name: string, visible: boolean) => void;
  setRegionBorderColor: (name: string, color: string) => void;
  setRegionBorderOpacity: (name: string, opacity: number) => void;
  setRegionSymbolSize: (name: string, size: number) => void;
  setRegionGlobalOpacity: (opacity: number) => void;
  setAllRegionVisibility: (visible: boolean) => void;
  setAllRegionBorderColor: (color: string) => void;
  setAllRegionBorderOpacity: (opacity: number) => void;
  setFacilitySymbolShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolSize: (size: number) => void;
  setRegionBoundaryLayerVisibility: (id: string, visible: boolean) => void;
  setRegionBoundaryLayerOpacity: (id: string, opacity: number) => void;
  setRegionBoundaryLayerBorderVisibility: (id: string, visible: boolean) => void;
  setRegionBoundaryLayerBorderColor: (id: string, color: string) => void;
  setRegionBoundaryLayerBorderOpacity: (id: string, opacity: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  layers: [],
  regions: [],
  regionBoundaryLayers: createDefaultRegionBoundaryLayers(),
  regionGlobalOpacity: 1,
  facilitySymbolShape: 'circle',
  facilitySymbolSize: 3.5,
  basemap: createDefaultBasemapSettings(),
  activeViewPreset: 'current',
  currentViewPresetState: null,
  isLoading: false,
  error: null,
  loadLayers: async () => {
    set({ isLoading: true, error: null });
    try {
      const manifestLayers = await fetchLayerManifest();
      const facilitiesLayer = manifestLayers.find((layer) => layer.id === 'facilities');
      const regions = facilitiesLayer
        ? await loadRegionStyles(facilitiesLayer.path, get().facilitySymbolSize)
        : [];
      const layers = manifestLayers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        path: layer.path,
        visible: layer.visibleByDefault,
        opacity: 1,
      }));
      const currentViewPresetState = createViewPresetState({
        layers,
        regions,
      });
      set({
        layers,
        regions,
        regionBoundaryLayers: cloneRegionBoundaryLayers(
          currentViewPresetState.regionBoundaryLayers,
        ),
        regionGlobalOpacity: currentViewPresetState.regionGlobalOpacity,
        facilitySymbolShape: currentViewPresetState.facilitySymbolShape,
        facilitySymbolSize: currentViewPresetState.facilitySymbolSize,
        basemap: { ...currentViewPresetState.basemap },
        currentViewPresetState,
        activeViewPreset: 'current',
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load layers';
      set({ error: message, isLoading: false });
    }
  },
  activateViewPreset: (preset) => {
    const currentViewPresetState = get().currentViewPresetState;
    if (!currentViewPresetState) {
      set({ activeViewPreset: preset });
      return;
    }

    const nextState =
      preset === 'current'
        ? {
            layers: cloneLayers(currentViewPresetState.layers),
            regions: cloneRegions(currentViewPresetState.regions),
            regionBoundaryLayers: cloneRegionBoundaryLayers(
              currentViewPresetState.regionBoundaryLayers,
            ),
            regionGlobalOpacity: currentViewPresetState.regionGlobalOpacity,
            facilitySymbolShape: currentViewPresetState.facilitySymbolShape,
            facilitySymbolSize: currentViewPresetState.facilitySymbolSize,
            basemap: { ...currentViewPresetState.basemap },
          }
        : createScenarioViewPresetState(currentViewPresetState, preset);

    set({
      activeViewPreset: preset,
      layers: cloneLayers(nextState.layers),
      regions: cloneRegions(nextState.regions),
      regionBoundaryLayers: cloneRegionBoundaryLayers(nextState.regionBoundaryLayers),
      regionGlobalOpacity: nextState.regionGlobalOpacity,
      facilitySymbolShape: nextState.facilitySymbolShape,
      facilitySymbolSize: nextState.facilitySymbolSize,
      basemap: { ...nextState.basemap },
    });
  },
  toggleLayer: (id) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      ),
    })),
  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? { ...layer, opacity } : layer,
      ),
    })),
  setBasemapProvider: (provider) =>
    set((state) => ({
      basemap: { ...state.basemap, provider },
    })),
  setBasemapScale: (scale) =>
    set((state) => ({
      basemap: { ...state.basemap, scale },
    })),
  setBasemapElementColor: (key, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      const nextBasemap = {
        ...state.basemap,
        [key]: normalized.color,
      } as BasemapSettings;
      if (normalized.forceOpaque) {
        const opacityKey = getBasemapOpacityKeyForColor(key);
        nextBasemap[opacityKey] = 1;
      }
      return { basemap: nextBasemap };
    }),
  setBasemapElementOpacity: (key, opacity) =>
    set((state) => ({
      basemap: { ...state.basemap, [key]: opacity },
    })),
  setBasemapLayerVisibility: (key, visible) =>
    set((state) => ({
      basemap: { ...state.basemap, [key]: visible },
    })),
  setRegionVisibility: (name, visible) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name ? { ...region, visible } : region,
      ),
    })),
  setRegionColor: (name, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        regions: state.regions.map((region) =>
          region.name === name
            ? {
                ...region,
                color: normalized.color,
                opacity: normalized.forceOpaque ? 1 : region.opacity,
              }
            : region,
        ),
      };
    }),
  setRegionOpacity: (name, opacity) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name ? { ...region, opacity } : region,
      ),
    })),
  setRegionBorderVisibility: (name, visible) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name ? { ...region, borderVisible: visible } : region,
      ),
    })),
  setRegionBorderColor: (name, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        regions: state.regions.map((region) =>
          region.name === name
            ? {
                ...region,
                borderColor: normalized.color,
                borderOpacity: normalized.forceOpaque ? 1 : region.borderOpacity,
              }
            : region,
        ),
      };
    }),
  setRegionBorderOpacity: (name, opacity) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name ? { ...region, borderOpacity: opacity } : region,
      ),
    })),
  setRegionSymbolSize: (name, size) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name
          ? { ...region, symbolSize: Math.max(1, Math.min(12, size)) }
          : region,
      ),
    })),
  setRegionGlobalOpacity: (opacity) => {
    const value = Math.max(0, Math.min(1, opacity));
    return set((state) => ({
      regionGlobalOpacity: value,
      regions: state.regions.map((region) => ({ ...region, opacity: value })),
    }));
  },
  setAllRegionVisibility: (visible) =>
    set((state) => ({
      regions: state.regions.map((region) => ({ ...region, visible })),
    })),
  setAllRegionBorderColor: (color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        regions: state.regions.map((region) => ({
          ...region,
          borderColor: normalized.color,
          borderOpacity: normalized.forceOpaque ? 1 : region.borderOpacity,
        })),
      };
    }),
  setAllRegionBorderOpacity: (opacity) =>
    set((state) => ({
      regions: state.regions.map((region) => ({ ...region, borderOpacity: opacity })),
    })),
  setFacilitySymbolShape: (shape) => set({ facilitySymbolShape: shape }),
  setFacilitySymbolSize: (size) =>
    set((state) => {
      const normalized = Math.max(1, Math.min(12, size));
      return {
        facilitySymbolSize: normalized,
        regions: state.regions.map((region) => ({
          ...region,
          symbolSize: normalized,
        })),
      };
    }),
  setRegionBoundaryLayerVisibility: (id, visible) =>
    set((state) => ({
      regionBoundaryLayers: state.regionBoundaryLayers.map((layer) =>
        layer.id === id ? { ...layer, visible } : layer,
      ),
    })),
  setRegionBoundaryLayerOpacity: (id, opacity) =>
    set((state) => ({
      regionBoundaryLayers: state.regionBoundaryLayers.map((layer) =>
        layer.id === id
          ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) }
          : layer,
      ),
    })),
  setRegionBoundaryLayerBorderVisibility: (id, visible) =>
    set((state) => ({
      regionBoundaryLayers: state.regionBoundaryLayers.map((layer) =>
        layer.id === id ? { ...layer, borderVisible: visible } : layer,
      ),
    })),
  setRegionBoundaryLayerBorderColor: (id, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        regionBoundaryLayers: state.regionBoundaryLayers.map((layer) =>
          layer.id === id
            ? {
                ...layer,
                borderColor: normalized.color,
                borderOpacity: normalized.forceOpaque ? 1 : layer.borderOpacity,
              }
            : layer,
        ),
      };
    }),
  setRegionBoundaryLayerBorderOpacity: (id, opacity) =>
    set((state) => ({
      regionBoundaryLayers: state.regionBoundaryLayers.map((layer) =>
        layer.id === id
          ? { ...layer, borderOpacity: Math.max(0, Math.min(1, opacity)) }
          : layer,
      ),
    })),
}));

async function loadRegionStyles(
  path: string,
  defaultSymbolSize: number,
): Promise<RegionStyle[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) return [];
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const features = geojson.features ?? [];
    const byRegion = new Map<
      string,
      {
        visible: boolean;
        color: string;
        opacity: number;
        borderVisible: boolean;
        borderColor: string;
        borderOpacity: number;
        symbolSize: number;
      }
    >();

    for (const feature of features) {
      const props = feature.properties ?? {};
      const region = String(props.region ?? 'Unassigned');
      const colorRaw = String(props.point_color_hex ?? '#64748b');
      const color = colorRaw.startsWith('#') ? colorRaw : `#${colorRaw}`;
      const opacity = 1;
      const visible = Number(props.default_visible ?? 1) !== 0;

      const existing = byRegion.get(region);
      if (existing) {
        existing.visible = existing.visible || visible;
      } else {
        byRegion.set(region, {
          visible,
          color,
          opacity,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: Math.max(1, Math.min(12, defaultSymbolSize)),
        });
      }
    }

    return [...byRegion.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({
        name,
        ...value,
      }));
  } catch {
    return [];
  }
}

function normalizeSolidColor(input: string): {
  color: string;
  forceOpaque: boolean;
} {
  const value = input.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return { color: value, forceOpaque: false };
  }
  if (/^#[0-9a-fA-F]{8}$/.test(value)) {
    const alpha = value.slice(7, 9);
    if (alpha.toLowerCase() !== 'ff') {
      return { color: '#ffffff', forceOpaque: true };
    }
    return { color: `#${value.slice(1, 7)}`, forceOpaque: false };
  }
  return { color: '#ffffff', forceOpaque: true };
}

function getBasemapOpacityKeyForColor(
  key:
    | 'landFillColor'
    | 'countryBorderColor'
    | 'countryLabelColor'
    | 'majorCityColor'
    | 'seaFillColor'
    | 'seaLabelColor',
):
  | 'landFillOpacity'
  | 'countryBorderOpacity'
  | 'countryLabelOpacity'
  | 'majorCityOpacity'
  | 'seaFillOpacity'
  | 'seaLabelOpacity' {
  if (key === 'landFillColor') return 'landFillOpacity';
  if (key === 'countryBorderColor') return 'countryBorderOpacity';
  if (key === 'countryLabelColor') return 'countryLabelOpacity';
  if (key === 'majorCityColor') return 'majorCityOpacity';
  if (key === 'seaFillColor') return 'seaFillOpacity';
  return 'seaLabelOpacity';
}

function createDefaultBasemapSettings(): BasemapSettings {
  return {
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
  };
}

function createDefaultRegionBoundaryLayers(): RegionBoundaryLayerStyle[] {
  return [
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
      id: 'pmcUnpopulatedCareBoardBoundaries',
      name: 'PMC unpopulated care board boundaries',
      path: 'data/regions/UK_Inactive_Remainder_Codex_v10_geojson.geojson',
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
      visible: true,
      opacity: 0,
      borderVisible: true,
      borderColor: BOARD_BOUNDARY_BASE_STYLE.borderColor,
      borderOpacity: BOARD_BOUNDARY_BASE_STYLE.borderOpacity,
      swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
    },
  ];
}

function createViewPresetState({
  layers,
  regions,
}: Pick<ViewPresetState, 'layers' | 'regions'>): ViewPresetState {
  return {
    layers: cloneLayers(layers),
    regions: cloneRegions(regions),
    regionBoundaryLayers: createDefaultRegionBoundaryLayers(),
    regionGlobalOpacity: 1,
    facilitySymbolShape: 'circle',
    facilitySymbolSize: 3.5,
    basemap: createDefaultBasemapSettings(),
  };
}

function createScenarioViewPresetState(
  source: ViewPresetState,
  preset: ViewPresetId,
): ViewPresetState {
  return {
    layers: cloneLayers(source.layers),
    regions: cloneRegions(source.regions),
    regionBoundaryLayers: createScenarioRegionBoundaryLayers(
      source.regionBoundaryLayers,
      preset,
    ),
    regionGlobalOpacity: source.regionGlobalOpacity,
    facilitySymbolShape: source.facilitySymbolShape,
    facilitySymbolSize: source.facilitySymbolSize,
    basemap: { ...source.basemap },
  };
}

function createScenarioRegionBoundaryLayers(
  layers: RegionBoundaryLayerStyle[],
  preset: ViewPresetId,
): RegionBoundaryLayerStyle[] {
  const hiddenLayers = cloneRegionBoundaryLayers(layers).map((layer) => ({
    ...layer,
    visible: false,
  }));

  if (!isScenarioPreset(preset)) {
    return hiddenLayers;
  }

  const boardLayer = getScenarioBoardLayerConfig(preset);
  const outlineLayer = getScenarioOutlineLayerConfig(preset);
  if (!boardLayer || !outlineLayer) {
    return hiddenLayers;
  }

  return hiddenLayers.map((layer) =>
    layer.id === 'careBoardBoundaries'
      ? {
          ...layer,
          name: BOARD_BOUNDARY_BASE_STYLE.name,
          path: boardLayer.path,
          visible: true,
          opacity: boardLayer.opacity,
          borderVisible: true,
          borderColor: BOARD_BOUNDARY_BASE_STYLE.borderColor,
          borderOpacity: BOARD_BOUNDARY_BASE_STYLE.borderOpacity,
          swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
        }
      : layer.id === 'pmcUnpopulatedCareBoardBoundaries'
          ? {
              ...layer,
              name: outlineLayer.name,
              path: outlineLayer.path,
              visible: outlineLayer.visible,
              opacity: outlineLayer.opacity,
              borderVisible: true,
              borderColor: outlineLayer.borderColor,
              borderOpacity: outlineLayer.borderOpacity,
              swatchColor: outlineLayer.swatchColor,
            }
      : layer,
  );
}

function cloneLayers(layers: LayerState[]): LayerState[] {
  return layers.map((layer) => ({ ...layer }));
}

function cloneRegions(regions: RegionStyle[]): RegionStyle[] {
  return regions.map((region) => ({ ...region }));
}

function cloneRegionBoundaryLayers(
  layers: RegionBoundaryLayerStyle[],
): RegionBoundaryLayerStyle[] {
  return layers.map((layer) => ({ ...layer }));
}
