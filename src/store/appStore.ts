import { create } from 'zustand';
import type {
  BasemapProvider,
  BasemapScale,
  BasemapSettings,
  CombinedPracticeCatalogEntry,
  CombinedPracticeStyle,
  FacilitySymbolShape,
  LayerState,
  OverlayLayerStyle,
  OverlayFamily,
  RegionStyle,
  ScenarioWorkspaceId,
  ViewPresetId,
} from '../types';
import {
  BOARD_BOUNDARY_BASE_STYLE,
  getScenarioBoardLayerConfig,
  getScenarioOutlineLayerConfig,
  getScenarioPresetConfig,
  getScenarioWardSplitPath,
} from '../lib/config/viewPresets';
import { resolveRuntimeMapProductPath } from '../lib/config/runtimeMapProducts';
import { createFacilityFilterState } from '../lib/facilityFilters';
import {
  buildCombinedPracticeCatalog,
  buildDefaultCombinedPracticeStyles,
} from '../lib/combinedPractices';
import { createMapSessionState } from '../lib/savedViews';
import {
  createScenarioWorkspaceDraft,
  getScenarioWorkspaceIdForPreset,
} from '../lib/config/scenarioWorkspaces';
import { deriveScenarioWorkspaceFromDraft } from '../lib/scenarioWorkspaceDerived';
import { upsertScenarioWorkspaceAssignment } from '../lib/scenarioWorkspaceAssignments';
import {
  parseFacilityProperties,
  type FacilityFilterState,
} from '../lib/schemas/facilities';
import {
  type FacilityParRecord,
  formatParDisplayValue,
  summarizeFacilityParByRegion,
  summarizeFacilityParByPresetRegion,
} from '../lib/facilityPar';
import type {
  MapSessionState,
  MapViewportState,
  SelectionState,
} from '../lib/schemas/savedViews';
import type {
  DerivedScenarioWorkspace,
  ScenarioWorkspaceDraft,
  ScenarioWorkspaceEditorState,
} from '../lib/schemas/scenarioWorkspaces';
import { fetchLayerManifest } from '../lib/services/layers';

const V10_PATH = resolveRuntimeMapProductPath('data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson');
const V10_EDGES_PATH = resolveRuntimeMapProductPath('data/regions/UK_ICB_LHB_v10_topology_edges.geojson');
const BOARD_2026_EDGES_PATH = resolveRuntimeMapProductPath(
  'data/regions/UK_Health_Board_2026_topology_edges.geojson',
);
const WARD_SPLIT_PATH = resolveRuntimeMapProductPath('data/regions/UK_WardSplit_simplified.geojson');
const WARD_SPLIT_WARDS_PATH = resolveRuntimeMapProductPath(
  'data/regions/UK_WardSplit_Canonical_Current_exact.geojson',
);
const JMC_2026_OUTLINE_PATH = resolveRuntimeMapProductPath('data/regions/UK_JMC_Outline_arcs.geojson');
const NHS_ENGLAND_REGIONS_BSC_PATH =
  'data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson';
const SJC_JMC_OUTLINE_PATH = resolveRuntimeMapProductPath('data/regions/UK_JMC_Outline_arcs.geojson');

interface ViewPresetState {
  layers: LayerState[];
  regions: RegionStyle[];
  combinedPractices: CombinedPracticeStyle[];
  combinedPracticeCatalog: CombinedPracticeCatalogEntry[];
  overlayLayers: OverlayLayerStyle[];
  regionGlobalOpacity: number;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  facilityFilters?: FacilityFilterState;
  basemap: BasemapSettings;
}

interface PointTooltipDisplayState {
  facilityName: string | null;
  regionName: string | null;
  isCombinedPractice: boolean;
  combinedPracticeName: string | null;
  combinedPracticeMembers: Array<{
    facilityId: string;
    facilityName: string;
  }>;
  facilityPar: string | null;
  practicePar: string | null;
  regionPar: string | null;
  baseportPar: string | null;
  correctionParContext: string | null;
  correctionPar: string | null;
  totalPar: string | null;
  pageIndex: number;
  pageCount: number;
}

export type AppNoticeTone = 'info' | 'success' | 'warning';

export interface AppNotice {
  message: string;
  tone: AppNoticeTone;
}

interface AppState {
  layers: LayerState[];
  regions: RegionStyle[];
  combinedPracticeStyles: CombinedPracticeStyle[];
  combinedPracticeCatalog: CombinedPracticeCatalogEntry[];
  overlayLayers: OverlayLayerStyle[];
  /** Boundary codes (v10 boundary_code) that contain ≥1 facility. */
  populatedV10Codes: ReadonlySet<string>;
  /** Boundary codes (2026 boundary_code) that contain ≥1 facility. */
  populated2026Codes: ReadonlySet<string>;
  facilityParRecords: FacilityParRecord[];
  pmcRegionParDisplayByName: Record<string, string>;
  pmcTotalParDisplay: string;
  presetRegionParByPreset: Partial<Record<ViewPresetId, Record<string, number>>>;
  regionGlobalOpacity: number;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  facilityFilters: FacilityFilterState;
  basemap: BasemapSettings;
  activeViewPreset: ViewPresetId;
  activeStandardViewPreset: ViewPresetId;
  activeScenarioWorkspaceId: ScenarioWorkspaceId | null;
  currentViewPresetState: ViewPresetState | null;
  scenarioWorkspaceDrafts: Partial<
    Record<ScenarioWorkspaceId, ScenarioWorkspaceDraft>
  >;
  scenarioWorkspaceEditor: ScenarioWorkspaceEditorState;
  mapViewport: MapViewportState;
  selection: SelectionState;
  pointTooltipDisplay: PointTooltipDisplayState;
  pointTooltipPageRequestNonce: number;
  pointTooltipPageRequestDirection: -1 | 1 | null;
  facilitySelectionRequestId: string | null;
  facilitySelectionRequestNonce: number;
  savedViewsDialogMode: 'closed' | 'open' | 'save';
  isLoading: boolean;
  error: string | null;
  notice: AppNotice | null;
  loadLayers: () => Promise<void>;
  activateViewPreset: (preset: ViewPresetId) => void;
  activateInteractiveScenarioWorkspace: (
    preset: ViewPresetId,
    workspaceId: ScenarioWorkspaceId,
  ) => void;
  activateScenarioWorkspace: (workspaceId: ScenarioWorkspaceId | null) => void;
  resetActiveViewPreset: () => void;
  ensureScenarioWorkspaceDraft: (
    workspaceId: ScenarioWorkspaceId,
  ) => ScenarioWorkspaceDraft;
  selectScenarioWorkspaceBoundaryUnit: (
    boundaryUnitId: string | null,
    initialScenarioRegionId?: string | null,
  ) => void;
  setScenarioWorkspacePendingRegion: (scenarioRegionId: string | null) => void;
  assignScenarioWorkspaceBoundaryUnit: (
    workspaceId: ScenarioWorkspaceId,
    boundaryUnitId: string,
    scenarioRegionId: string,
  ) => void;
  resetScenarioWorkspaceDraft: (workspaceId: ScenarioWorkspaceId) => void;
  getDerivedScenarioWorkspace: (
    workspaceId: ScenarioWorkspaceId,
  ) => DerivedScenarioWorkspace | null;
  openSavedViewsDialog: (mode: 'open' | 'save') => void;
  closeSavedViewsDialog: () => void;
  toggleLayer: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  setBasemapProvider: (provider: BasemapProvider) => void;
  setBasemapScale: (scale: BasemapScale) => void;
  setBasemapElementColor: (
    key:
      | 'landFillColor'
      | 'countryBorderColor'
      | 'countryLabelColor'
      | 'countryLabelBorderColor'
      | 'majorCityColor'
      | 'majorCityBorderColor'
      | 'regionLabelColor'
      | 'regionLabelBorderColor'
      | 'networkLabelColor'
      | 'networkLabelBorderColor'
      | 'facilityLabelColor'
      | 'facilityLabelBorderColor'
      | 'seaFillColor'
      | 'seaLabelColor'
      | 'seaLabelBorderColor',
    color: string,
  ) => void;
  setBasemapElementOpacity: (
    key:
      | 'landFillOpacity'
      | 'countryBorderOpacity'
      | 'countryLabelOpacity'
      | 'countryLabelBorderOpacity'
      | 'majorCityOpacity'
      | 'majorCityBorderOpacity'
      | 'regionLabelOpacity'
      | 'regionLabelBorderOpacity'
      | 'networkLabelOpacity'
      | 'networkLabelBorderOpacity'
      | 'facilityLabelOpacity'
      | 'facilityLabelBorderOpacity'
      | 'seaFillOpacity'
      | 'seaLabelOpacity'
      | 'seaLabelBorderOpacity',
    opacity: number,
  ) => void;
  setBasemapNumericValue: (
    key:
      | 'countryLabelSize'
      | 'countryLabelBorderWidth'
      | 'majorCitySize'
      | 'majorCityBorderWidth'
      | 'regionLabelSize'
      | 'regionLabelBorderWidth'
      | 'networkLabelSize'
      | 'networkLabelBorderWidth'
      | 'facilityLabelSize'
      | 'facilityLabelBorderWidth'
      | 'seaLabelSize'
      | 'seaLabelBorderWidth',
    value: number,
  ) => void;
  setBasemapLayerVisibility: (
    key:
      | 'showLandFill'
      | 'showCountryBorders'
      | 'showCountryLabels'
      | 'showMajorCities'
      | 'showRegionLabels'
      | 'showNetworkLabels'
      | 'showFacilityLabels'
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
  setRegionBorderWidth: (name: string, width: number) => void;
  setRegionShape: (name: string, shape: FacilitySymbolShape) => void;
  setRegionSymbolSize: (name: string, size: number) => void;
  setRegionGlobalOpacity: (opacity: number) => void;
  setAllRegionVisibility: (visible: boolean) => void;
  setAllRegionColor: (color: string) => void;
  resetAllRegionColorsToDefault: () => void;
  setAllRegionBorderVisibility: (visible: boolean) => void;
  setAllRegionBorderColor: (color: string) => void;
  setAllRegionBorderOpacity: (opacity: number) => void;
  setAllRegionBorderWidth: (width: number) => void;
  copyFillToBorder: () => void;
  copyRegionFillToBorder: (name: string) => void;
  setAllRegionShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolSize: (size: number) => void;
  setCombinedPracticeBorderVisibility: (name: string, visible: boolean) => void;
  setCombinedPracticeBorderColor: (name: string, color: string) => void;
  resetCombinedPracticeBorderColor: (name: string) => void;
  setCombinedPracticeBorderOpacity: (name: string, opacity: number) => void;
  setCombinedPracticeBorderWidth: (name: string, width: number) => void;
  setAllCombinedPracticeBorderVisibility: (visible: boolean) => void;
  setAllCombinedPracticeBorderColor: (color: string) => void;
  resetAllCombinedPracticeColorsToDefault: () => void;
  setAllCombinedPracticeBorderOpacity: (opacity: number) => void;
  setAllCombinedPracticeBorderWidth: (width: number) => void;
  resetCombinedPracticeBorderOpacity: (name: string) => void;
  resetCombinedPracticeBorderWidth: (name: string) => void;
  resetAllCombinedPracticeBorderOpacity: () => void;
  resetAllCombinedPracticeBorderWidth: () => void;
  setFacilitySearchQuery: (query: string) => void;
  resetFacilityFilters: () => void;
  setMapViewport: (viewport: MapViewportState) => void;
  setSelection: (selection: Partial<SelectionState>) => void;
  setPointTooltipDisplay: (display: PointTooltipDisplayState) => void;
  requestPointTooltipPage: (direction: -1 | 1) => void;
  clearPointTooltipPageRequest: () => void;
  requestFacilitySelection: (facilityId: string) => void;
  clearFacilitySelectionRequest: () => void;
  setOverlayLayerVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerOpacity: (id: string, opacity: number) => void;
  setOverlayLayerBorderVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerBorderColor: (id: string, color: string) => void;
  setOverlayLayerBorderWidth: (id: string, width: number) => void;
  setOverlayLayerBorderOpacity: (id: string, opacity: number) => void;
  regionGroupOverrides: Record<string, import('../types').RegionGroupStyleOverride>;
  setRegionGroupVisible: (groupName: string, visible: boolean) => void;
  setRegionGroupPopulatedFillVisible: (groupName: string, visible: boolean) => void;
  setRegionGroupUnpopulatedFillVisible: (groupName: string, visible: boolean) => void;
  setRegionGroupPopulatedFillColor: (groupName: string, color: string | null) => void;
  setRegionGroupUnpopulatedFillColor: (groupName: string, color: string | null) => void;
  setRegionGroupPopulatedOpacity: (groupName: string, opacity: number) => void;
  setRegionGroupUnpopulatedOpacity: (groupName: string, opacity: number) => void;
  setRegionGroupBorderVisible: (groupName: string, visible: boolean) => void;
  setRegionGroupBorderColor: (groupName: string, color: string) => void;
  setRegionGroupBorderOpacity: (groupName: string, opacity: number) => void;
  setRegionGroupBorderWidth: (groupName: string, width: number) => void;
  setAllRegionGroupsPopulatedOpacity: (opacity: number) => void;
  setAllRegionGroupsUnpopulatedOpacity: (opacity: number) => void;
  setAllRegionGroupsBorderVisible: (visible: boolean) => void;
  setAllRegionGroupsBorderOpacity: (opacity: number) => void;
  setAllRegionGroupsBorderWidth: (width: number) => void;
  createMapSessionSnapshot: () => MapSessionState;
  applyMapSessionState: (session: MapSessionState) => void;
  setNotice: (notice: AppNotice | string | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  layers: [],
  regions: [],
  combinedPracticeStyles: [],
  combinedPracticeCatalog: [],
  overlayLayers: createDefaultOverlayLayers(),
  populatedV10Codes: new Set<string>(),
  populated2026Codes: new Set<string>(),
  facilityParRecords: [],
  pmcRegionParDisplayByName: {},
  pmcTotalParDisplay: '—',
  presetRegionParByPreset: {},
  regionGlobalOpacity: 1,
  facilitySymbolShape: 'circle',
  facilitySymbolSize: 3.5,
  facilityFilters: createFacilityFilterState(),
  basemap: createDefaultBasemapSettings(),
  activeViewPreset: 'current',
  activeStandardViewPreset: 'current',
  activeScenarioWorkspaceId: null,
  currentViewPresetState: null,
  scenarioWorkspaceDrafts: {},
  scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
  mapViewport: createDefaultMapViewport(),
  selection: createDefaultSelectionState(),
  pointTooltipDisplay: createDefaultPointTooltipDisplayState(),
  pointTooltipPageRequestNonce: 0,
  pointTooltipPageRequestDirection: null,
  facilitySelectionRequestId: null,
  facilitySelectionRequestNonce: 0,
  regionGroupOverrides: {},
  savedViewsDialogMode: 'closed',
  isLoading: false,
  error: null,
  notice: null,
  loadLayers: async () => {
    set({ isLoading: true, error: null });
    try {
      const manifestLayers = await fetchLayerManifest();
      const facilitiesLayer = manifestLayers.find((layer) => layer.id === 'facilities');
      const [
        regions,
        combinedPractices,
        combinedPracticeCatalog,
        populatedCodes,
        facilityParRecords,
        pmcParDisplay,
        presetRegionParByPreset,
      ] =
        facilitiesLayer
        ? await Promise.all([
            loadRegionStyles(facilitiesLayer.path, get().facilitySymbolSize),
            loadCombinedPracticeStyles(facilitiesLayer.path),
            loadCombinedPracticeCatalog(facilitiesLayer.path),
            loadPopulatedCodes(facilitiesLayer.path),
            loadFacilityParRecords(facilitiesLayer.path),
            loadPmcRegionParDisplay(facilitiesLayer.path),
            loadPresetRegionParByPreset(facilitiesLayer.path),
          ])
        : [
            [],
            [],
            [],
            { v10: new Set<string>(), v2026: new Set<string>() },
            [],
            { regionParDisplayByName: {}, totalParDisplay: '—' },
            {},
          ];
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
        combinedPractices,
        combinedPracticeCatalog,
      });
      set({
        layers,
        regions,
        combinedPracticeStyles: cloneCombinedPracticeStyles(
          currentViewPresetState.combinedPractices,
        ),
        combinedPracticeCatalog: cloneCombinedPracticeCatalog(
          currentViewPresetState.combinedPracticeCatalog,
        ),
        overlayLayers: cloneOverlayLayers(currentViewPresetState.overlayLayers),
        populatedV10Codes: populatedCodes.v10,
        populated2026Codes: populatedCodes.v2026,
        facilityParRecords,
        pmcRegionParDisplayByName: { ...pmcParDisplay.regionParDisplayByName },
        pmcTotalParDisplay: pmcParDisplay.totalParDisplay,
        presetRegionParByPreset,
        regionGlobalOpacity: currentViewPresetState.regionGlobalOpacity,
        facilitySymbolShape: currentViewPresetState.facilitySymbolShape,
        facilitySymbolSize: currentViewPresetState.facilitySymbolSize,
        basemap: { ...currentViewPresetState.basemap },
        currentViewPresetState,
        activeViewPreset: 'current',
        activeStandardViewPreset: 'current',
        activeScenarioWorkspaceId: null,
        isLoading: false,
        notice: null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load layers';
      set({ error: message, isLoading: false });
    }
  },
  activateViewPreset: (preset) =>
    set((state) => ({
      activeStandardViewPreset: preset,
      ...createActivatedPresetState({
        currentViewPresetState: state.currentViewPresetState,
        currentFacilityPresentationState: state,
        preserveFacilityPresentationState: true,
        scenarioWorkspaceDrafts: state.scenarioWorkspaceDrafts,
        preset,
        workspaceId: getScenarioWorkspaceIdForPreset(preset),
      }),
    })),
  activateInteractiveScenarioWorkspace: (preset, workspaceId) =>
    set((state) =>
      createActivatedPresetState({
        currentViewPresetState: state.currentViewPresetState,
        currentFacilityPresentationState: state,
        preserveFacilityPresentationState: true,
        scenarioWorkspaceDrafts: state.scenarioWorkspaceDrafts,
        preset,
        workspaceId,
      }),
    ),
  activateScenarioWorkspace: (workspaceId) =>
    set((state) => ({
      activeScenarioWorkspaceId: workspaceId,
      scenarioWorkspaceDrafts: workspaceId
        ? ensureScenarioWorkspaceDrafts(state.scenarioWorkspaceDrafts, workspaceId)
        : state.scenarioWorkspaceDrafts,
      scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
    })),
  resetActiveViewPreset: () =>
    set((state) => ({
      ...createActivatedPresetState({
        currentViewPresetState: state.currentViewPresetState,
        currentFacilityPresentationState: state,
        preserveFacilityPresentationState: false,
        scenarioWorkspaceDrafts: state.scenarioWorkspaceDrafts,
        preset: state.activeViewPreset,
        workspaceId: state.activeScenarioWorkspaceId,
      }),
      facilityFilters: createFacilityFilterState(),
      scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
      selection: createDefaultSelectionState(),
      notice: {
        message: 'Reset active view preset',
        tone: 'info',
      },
    })),
  ensureScenarioWorkspaceDraft: (workspaceId) => {
    const current = get().scenarioWorkspaceDrafts[workspaceId];
    if (current) {
      return current;
    }

    const nextDraft = createScenarioWorkspaceDraft(workspaceId);
    set((state) => ({
      scenarioWorkspaceDrafts: {
        ...state.scenarioWorkspaceDrafts,
        [workspaceId]: nextDraft,
      },
    }));
    return nextDraft;
  },
  selectScenarioWorkspaceBoundaryUnit: (
    boundaryUnitId,
    initialScenarioRegionId = null,
  ) =>
    set((state) => {
      const activeWorkspaceId = state.activeScenarioWorkspaceId;
      const activeDraft = activeWorkspaceId
        ? state.scenarioWorkspaceDrafts[activeWorkspaceId]
        : null;
      const assignment = boundaryUnitId
        ? activeDraft?.assignments.find(
            (entry) => entry.boundaryUnitId === boundaryUnitId,
          ) ?? null
        : null;

      return {
        scenarioWorkspaceEditor: createScenarioWorkspaceEditorState({
          selectedBoundaryUnitId: boundaryUnitId,
          selectedScenarioRegionId:
            assignment?.scenarioRegionId ?? initialScenarioRegionId,
          pendingScenarioRegionId:
            assignment?.scenarioRegionId ?? initialScenarioRegionId,
          isDirty: state.scenarioWorkspaceEditor.isDirty,
        }),
      };
    }),
  setScenarioWorkspacePendingRegion: (scenarioRegionId) =>
    set((state) => ({
      scenarioWorkspaceEditor: createScenarioWorkspaceEditorState({
        ...state.scenarioWorkspaceEditor,
        pendingScenarioRegionId: scenarioRegionId,
      }),
    })),
  assignScenarioWorkspaceBoundaryUnit: (
    workspaceId,
    boundaryUnitId,
    scenarioRegionId,
  ) =>
    set((state) => {
      const currentDraft =
        state.scenarioWorkspaceDrafts[workspaceId] ??
        createScenarioWorkspaceDraft(workspaceId);
      const nextDraft = upsertScenarioWorkspaceAssignment(
        currentDraft,
        boundaryUnitId,
        scenarioRegionId,
      );

      return {
        scenarioWorkspaceDrafts: {
          ...state.scenarioWorkspaceDrafts,
          [workspaceId]: nextDraft,
        },
        scenarioWorkspaceEditor:
          state.activeScenarioWorkspaceId === workspaceId
            ? createScenarioWorkspaceEditorState({
                selectedBoundaryUnitId: boundaryUnitId,
                selectedScenarioRegionId: scenarioRegionId,
                pendingScenarioRegionId: scenarioRegionId,
                isDirty: true,
              })
            : state.scenarioWorkspaceEditor,
      };
    }),
  resetScenarioWorkspaceDraft: (workspaceId) =>
    set((state) => ({
      scenarioWorkspaceDrafts: {
        ...state.scenarioWorkspaceDrafts,
        [workspaceId]: createScenarioWorkspaceDraft(workspaceId),
      },
      scenarioWorkspaceEditor:
        state.activeScenarioWorkspaceId === workspaceId
          ? createDefaultScenarioWorkspaceEditorState()
          : state.scenarioWorkspaceEditor,
    })),
  getDerivedScenarioWorkspace: (workspaceId) => {
    const draft =
      get().scenarioWorkspaceDrafts[workspaceId] ??
      createScenarioWorkspaceDraft(workspaceId);
    return deriveScenarioWorkspaceFromDraft(draft);
  },
  openSavedViewsDialog: (mode) => set({ savedViewsDialogMode: mode }),
  closeSavedViewsDialog: () => set({ savedViewsDialogMode: 'closed' }),
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
  setBasemapNumericValue: (key, value) =>
    set((state) => ({
      basemap: { ...state.basemap, [key]: value },
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
        region.name === name
          ? {
              ...region,
              borderVisible: visible,
              borderOpacity:
                visible && region.borderOpacity <= 0 ? 1 : region.borderOpacity,
              borderWidth:
                visible && region.borderWidth <= 0 ? 1 : region.borderWidth,
            }
          : region,
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
  setRegionBorderWidth: (name, width) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name
          ? { ...region, borderWidth: Math.max(0, Math.min(10, width)) }
          : region,
      ),
    })),
  setRegionShape: (name, shape) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name ? { ...region, shape } : region,
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
  setAllRegionColor: (color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        regions: state.regions.map((region) => ({
          ...region,
          color: normalized.color,
          opacity: normalized.forceOpaque ? 1 : region.opacity,
        })),
      };
    }),
  resetAllRegionColorsToDefault: () =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.regions ?? []).map((region) => [
          region.name,
          region.color,
        ]),
      );

      return {
        regions: state.regions.map((region) => ({
          ...region,
          color: defaultsByName.get(region.name) ?? region.color,
        })),
      };
    }),
  setAllRegionBorderVisibility: (visible) =>
    set((state) => ({
      regions: state.regions.map((region) => ({
        ...region,
        borderVisible: visible,
        borderOpacity:
          visible && region.borderOpacity <= 0 ? 1 : region.borderOpacity,
        borderWidth: visible && region.borderWidth <= 0 ? 1 : region.borderWidth,
      })),
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
  setAllRegionBorderWidth: (width) =>
    set((state) => ({
      regions: state.regions.map((region) => ({
        ...region,
        borderWidth: Math.max(0, Math.min(10, width)),
      })),
    })),
  copyFillToBorder: () =>
    set((state) => ({
      regions: state.regions.map((region) => ({
        ...region,
        borderColor: region.color,
        borderOpacity: region.opacity,
      })),
    })),
  copyRegionFillToBorder: (name) =>
    set((state) => ({
      regions: state.regions.map((region) =>
        region.name === name
          ? { ...region, borderColor: region.color, borderOpacity: region.opacity }
          : region,
      ),
    })),
  setAllRegionShape: (shape) =>
    set((state) => ({
      facilitySymbolShape: shape,
      regions: state.regions.map((region) => ({ ...region, shape })),
    })),
  setFacilitySymbolShape: (shape) =>
    set((state) => ({
      facilitySymbolShape: shape,
      regions: state.regions.map((region) => ({ ...region, shape })),
    })),
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
  setCombinedPracticeBorderVisibility: (name, visible) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
        practice.name === name ? { ...practice, visible } : practice,
      ),
    })),
  setCombinedPracticeBorderColor: (name, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
          practice.name === name
            ? {
                ...practice,
                borderColor: normalized.color,
                borderOpacity: normalized.forceOpaque ? 1 : practice.borderOpacity,
              }
            : practice,
        ),
      };
    }),
  resetCombinedPracticeBorderColor: (name) =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderColor,
        ]),
      );
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
          practice.name === name
            ? {
                ...practice,
                borderColor:
                  defaultsByName.get(practice.name) ?? practice.borderColor,
              }
            : practice,
        ),
      };
    }),
  setCombinedPracticeBorderOpacity: (name, opacity) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
        practice.name === name ? { ...practice, borderOpacity: opacity } : practice,
      ),
    })),
  setCombinedPracticeBorderWidth: (name, width) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
        practice.name === name
          ? { ...practice, borderWidth: Math.max(0, Math.min(10, width)) }
          : practice,
      ),
    })),
  setAllCombinedPracticeBorderVisibility: (visible) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
        ...practice,
        visible,
      })),
    })),
  setAllCombinedPracticeBorderColor: (color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
          ...practice,
          borderColor: normalized.color,
          borderOpacity: normalized.forceOpaque ? 1 : practice.borderOpacity,
        })),
      };
    }),
  resetAllCombinedPracticeColorsToDefault: () =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderColor,
        ]),
      );

      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
          ...practice,
          borderColor:
            defaultsByName.get(practice.name) ?? practice.borderColor,
        })),
      };
    }),
  setAllCombinedPracticeBorderOpacity: (opacity) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
        ...practice,
        borderOpacity: opacity,
      })),
    })),
  setAllCombinedPracticeBorderWidth: (width) =>
    set((state) => ({
      combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
        ...practice,
        borderWidth: Math.max(0, Math.min(10, width)),
      })),
    })),
  resetCombinedPracticeBorderOpacity: (name) =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderOpacity,
        ]),
      );
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
          practice.name === name
            ? {
                ...practice,
                borderOpacity:
                  defaultsByName.get(practice.name) ?? practice.borderOpacity,
              }
            : practice,
        ),
      };
    }),
  resetCombinedPracticeBorderWidth: (name) =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderWidth,
        ]),
      );
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) =>
          practice.name === name
            ? {
                ...practice,
                borderWidth:
                  defaultsByName.get(practice.name) ?? practice.borderWidth,
              }
            : practice,
        ),
      };
    }),
  resetAllCombinedPracticeBorderOpacity: () =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderOpacity,
        ]),
      );
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
          ...practice,
          borderOpacity:
            defaultsByName.get(practice.name) ?? practice.borderOpacity,
        })),
      };
    }),
  resetAllCombinedPracticeBorderWidth: () =>
    set((state) => {
      const defaultsByName = new Map(
        (state.currentViewPresetState?.combinedPractices ?? []).map((practice) => [
          practice.name,
          practice.borderWidth,
        ]),
      );
      return {
        combinedPracticeStyles: state.combinedPracticeStyles.map((practice) => ({
          ...practice,
          borderWidth:
            defaultsByName.get(practice.name) ?? practice.borderWidth,
        })),
      };
    }),
  setFacilitySearchQuery: (query) =>
    set((state) => ({
      facilityFilters: createFacilityFilterState({
        ...state.facilityFilters,
        searchQuery: query,
      }),
    })),
  resetFacilityFilters: () => set({ facilityFilters: createFacilityFilterState() }),
  setMapViewport: (viewport) => set({ mapViewport: viewport }),
  setSelection: (selection) =>
    set((state) => ({
      selection: {
        facilityIds: selection.facilityIds ?? state.selection.facilityIds,
        boundaryName:
          selection.boundaryName === undefined
            ? state.selection.boundaryName
            : selection.boundaryName,
        jmcName:
          selection.jmcName === undefined
            ? state.selection.jmcName
            : selection.jmcName,
        scenarioRegionId:
          selection.scenarioRegionId === undefined
            ? state.selection.scenarioRegionId
            : selection.scenarioRegionId,
      },
    })),
  setPointTooltipDisplay: (display) => set({ pointTooltipDisplay: display }),
  requestPointTooltipPage: (direction) =>
    set((state) => ({
      pointTooltipPageRequestNonce: state.pointTooltipPageRequestNonce + 1,
      pointTooltipPageRequestDirection: direction,
    })),
  clearPointTooltipPageRequest: () =>
    set({ pointTooltipPageRequestDirection: null }),
  requestFacilitySelection: (facilityId) =>
    set((state) => ({
      facilitySelectionRequestId: facilityId,
      facilitySelectionRequestNonce: state.facilitySelectionRequestNonce + 1,
    })),
  clearFacilitySelectionRequest: () =>
    set({ facilitySelectionRequestId: null }),
  setOverlayLayerVisibility: (id, visible) =>
    set((state) => ({
      overlayLayers: state.overlayLayers.map((layer) =>
        layer.id === id ? { ...layer, visible } : layer,
      ),
    })),
  setOverlayLayerOpacity: (id, opacity) =>
    set((state) => ({
      overlayLayers: state.overlayLayers.map((layer) =>
        layer.id === id
          ? { ...layer, opacity: Math.max(0, Math.min(1, opacity)) }
          : layer,
      ),
    })),
  setOverlayLayerBorderVisibility: (id, visible) =>
    set((state) => ({
      overlayLayers: state.overlayLayers.map((layer) =>
        layer.id === id ? { ...layer, borderVisible: visible } : layer,
      ),
    })),
  setOverlayLayerBorderColor: (id, color) =>
    set((state) => {
      const normalized = normalizeSolidColor(color);
      return {
        overlayLayers: state.overlayLayers.map((layer) =>
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
  setOverlayLayerBorderWidth: (id, width) =>
    set((state) => ({
      overlayLayers: state.overlayLayers.map((layer) =>
        layer.id === id
          ? { ...layer, borderWidth: Math.max(0, Math.min(10, width)) }
          : layer,
      ),
    })),
  setOverlayLayerBorderOpacity: (id, opacity) =>
    set((state) => ({
      overlayLayers: state.overlayLayers.map((layer) =>
        layer.id === id
          ? { ...layer, borderOpacity: Math.max(0, Math.min(1, opacity)) }
          : layer,
      ),
    })),
  setRegionGroupVisible: (groupName, visible) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), visible },
      },
    })),
  setRegionGroupPopulatedOpacity: (groupName, opacity) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), populatedOpacity: Math.max(0, Math.min(1, opacity)) },
      },
    })),
  setRegionGroupUnpopulatedOpacity: (groupName, opacity) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), unpopulatedOpacity: Math.max(0, Math.min(1, opacity)) },
      },
    })),
  setRegionGroupBorderVisible: (groupName, visible) =>
    set((state) => {
      const groupDefaults =
        getScenarioPresetConfig(state.activeViewPreset)?.regionGroups.find(
          (group) => group.name === groupName,
        ) ?? null;
      const currentOverride = getOrCreateGroupOverride(
        state.regionGroupOverrides,
        groupName,
      );
      const nextOverride = {
        ...currentOverride,
        borderVisible: visible,
      };
      if (groupDefaults && !state.regionGroupOverrides[groupName]) {
        nextOverride.borderColor = groupDefaults.borderColor;
        nextOverride.borderOpacity = groupDefaults.borderOpacity;
        nextOverride.borderWidth = groupDefaults.borderWidth;
      }
      return {
        regionGroupOverrides: {
          ...state.regionGroupOverrides,
          [groupName]: nextOverride,
        },
      };
    }),
  setRegionGroupBorderColor: (groupName, color) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), borderColor: color },
      },
    })),
  setRegionGroupBorderOpacity: (groupName, opacity) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), borderOpacity: Math.max(0, Math.min(1, opacity)) },
      },
    })),
  setRegionGroupBorderWidth: (groupName, width) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), borderWidth: Math.max(0.5, Math.min(4, width)) },
      },
    })),
  setRegionGroupPopulatedFillVisible: (groupName, visible) =>
    set((state) => {
      const current = getOrCreateGroupOverride(state.regionGroupOverrides, groupName);
      const newOverride = { ...current, populatedFillVisible: visible };
      // Sync the legacy visible flag: group is visible if either fill is on.
      newOverride.visible = visible || newOverride.unpopulatedFillVisible;
      return { regionGroupOverrides: { ...state.regionGroupOverrides, [groupName]: newOverride } };
    }),
  setRegionGroupUnpopulatedFillVisible: (groupName, visible) =>
    set((state) => {
      const current = getOrCreateGroupOverride(state.regionGroupOverrides, groupName);
      const newOverride = { ...current, unpopulatedFillVisible: visible };
      newOverride.visible = newOverride.populatedFillVisible || visible;
      return { regionGroupOverrides: { ...state.regionGroupOverrides, [groupName]: newOverride } };
    }),
  setRegionGroupPopulatedFillColor: (groupName, color) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), populatedFillColor: color },
      },
    })),
  setRegionGroupUnpopulatedFillColor: (groupName, color) =>
    set((state) => ({
      regionGroupOverrides: {
        ...state.regionGroupOverrides,
        [groupName]: { ...getOrCreateGroupOverride(state.regionGroupOverrides, groupName), unpopulatedFillColor: color },
      },
    })),
  setAllRegionGroupsPopulatedOpacity: (opacity) =>
    set((state) => {
      const groups = getScenarioPresetConfig(state.activeViewPreset)?.regionGroups ?? [];
      const clampedOpacity = Math.max(0, Math.min(1, opacity));
      const updatedOverrides = { ...state.regionGroupOverrides };
      for (const group of groups) {
        updatedOverrides[group.name] = {
          ...getOrCreateGroupOverride(updatedOverrides, group.name),
          populatedOpacity: clampedOpacity,
        };
      }
      return { regionGroupOverrides: updatedOverrides };
    }),
  setAllRegionGroupsUnpopulatedOpacity: (opacity) =>
    set((state) => {
      const groups = getScenarioPresetConfig(state.activeViewPreset)?.regionGroups ?? [];
      const clampedOpacity = Math.max(0, Math.min(1, opacity));
      const updatedOverrides = { ...state.regionGroupOverrides };
      for (const group of groups) {
        updatedOverrides[group.name] = {
          ...getOrCreateGroupOverride(updatedOverrides, group.name),
          unpopulatedOpacity: clampedOpacity,
        };
      }
      return { regionGroupOverrides: updatedOverrides };
    }),
  setAllRegionGroupsBorderVisible: (visible) =>
    set((state) => {
      const groups = getScenarioPresetConfig(state.activeViewPreset)?.regionGroups ?? [];
      const updatedOverrides = { ...state.regionGroupOverrides };
      for (const group of groups) {
        const hadExistingOverride = Boolean(updatedOverrides[group.name]);
        updatedOverrides[group.name] = {
          ...getOrCreateGroupOverride(updatedOverrides, group.name),
          borderVisible: visible,
          borderColor: hadExistingOverride
            ? getOrCreateGroupOverride(updatedOverrides, group.name).borderColor
            : group.borderColor,
          borderOpacity: hadExistingOverride
            ? getOrCreateGroupOverride(updatedOverrides, group.name).borderOpacity
            : group.borderOpacity,
          borderWidth: hadExistingOverride
            ? getOrCreateGroupOverride(updatedOverrides, group.name).borderWidth
            : group.borderWidth,
        };
      }
      return { regionGroupOverrides: updatedOverrides };
    }),
  setAllRegionGroupsBorderOpacity: (opacity) =>
    set((state) => {
      const groups = getScenarioPresetConfig(state.activeViewPreset)?.regionGroups ?? [];
      const clampedOpacity = Math.max(0, Math.min(1, opacity));
      const updatedOverrides = { ...state.regionGroupOverrides };
      for (const group of groups) {
        updatedOverrides[group.name] = {
          ...getOrCreateGroupOverride(updatedOverrides, group.name),
          borderOpacity: clampedOpacity,
        };
      }
      return { regionGroupOverrides: updatedOverrides };
    }),
  setAllRegionGroupsBorderWidth: (width) =>
    set((state) => {
      const groups = getScenarioPresetConfig(state.activeViewPreset)?.regionGroups ?? [];
      const clampedWidth = Math.max(0.5, Math.min(4, width));
      const updatedOverrides = { ...state.regionGroupOverrides };
      for (const group of groups) {
        updatedOverrides[group.name] = {
          ...getOrCreateGroupOverride(updatedOverrides, group.name),
          borderWidth: clampedWidth,
        };
      }
      return { regionGroupOverrides: updatedOverrides };
    }),
  createMapSessionSnapshot: () => {
    const state = get();
    return createMapSessionState({
      activeViewPreset: state.activeViewPreset,
      activeScenarioWorkspaceId: state.activeScenarioWorkspaceId,
      viewport: state.mapViewport,
      basemap: state.basemap,
      layers: state.layers,
      overlayLayers: state.overlayLayers,
      regions: state.regions,
      combinedPractices: state.combinedPracticeStyles,
      regionGlobalOpacity: state.regionGlobalOpacity,
      facilitySymbolShape: state.facilitySymbolShape,
      facilitySymbolSize: state.facilitySymbolSize,
      facilityFilters: state.facilityFilters,
      selection: state.selection,
    });
  },
  applyMapSessionState: (session) =>
    set((state) => ({
      activeViewPreset: session.activeViewPreset,
      activeStandardViewPreset: session.activeScenarioWorkspaceId
        ? state.activeStandardViewPreset
        : session.activeViewPreset,
      activeScenarioWorkspaceId: session.activeScenarioWorkspaceId,
      scenarioWorkspaceDrafts: session.activeScenarioWorkspaceId
        ? ensureScenarioWorkspaceDrafts(
            state.scenarioWorkspaceDrafts,
            session.activeScenarioWorkspaceId,
          )
        : state.scenarioWorkspaceDrafts,
      scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
      mapViewport: { ...session.viewport },
      basemap: { ...session.basemap },
      layers: cloneLayers(session.layers),
      overlayLayers: cloneOverlayLayers(session.overlayLayers),
      regions: cloneRegions(session.regions),
      combinedPracticeStyles: cloneCombinedPracticeStyles(
        session.combinedPractices,
      ),
      regionGlobalOpacity: session.regionGlobalOpacity,
      facilitySymbolShape: session.facilities.symbolShape,
      facilitySymbolSize: session.facilities.symbolSize,
      facilityFilters: createFacilityFilterState(session.facilities.filters),
      selection: {
        facilityIds: [...session.selection.facilityIds],
        boundaryName: session.selection.boundaryName,
        jmcName: session.selection.jmcName,
        scenarioRegionId: session.selection.scenarioRegionId,
      },
    })),
  setNotice: (notice) => set({ notice: normalizeAppNotice(notice) }),
}));

function normalizeAppNotice(notice: AppNotice | string | null): AppNotice | null {
  if (notice == null) {
    return null;
  }

  if (typeof notice === 'string') {
    return {
      message: notice,
      tone: 'info',
    };
  }

  return notice;
}

async function loadPopulatedCodes(
  facilitiesPath: string,
): Promise<{ v10: Set<string>; v2026: Set<string> }> {
  try {
    const response = await fetch(facilitiesPath);
    if (!response.ok) return { v10: new Set(), v2026: new Set() };
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const v10 = new Set<string>();
    const v2026 = new Set<string>();
    for (const feature of geojson.features ?? []) {
      const p = feature.properties ?? {};
      const code = typeof p.icb_hb_code === 'string' ? p.icb_hb_code.trim() : null;
      const code2026 = typeof p.icb_hb_code_2026 === 'string' ? p.icb_hb_code_2026.trim() : null;
      if (code) v10.add(code);
      if (code2026) v2026.add(code2026);
    }
    return { v10, v2026 };
  } catch {
    return { v10: new Set(), v2026: new Set() };
  }
}

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
        borderWidth: number;
        borderOpacity: number;
        shape: FacilitySymbolShape;
        symbolSize: number;
      }
    >();

    for (const feature of features) {
      const props = parseFacilityProperties(feature.properties ?? {});
      const region = props.region;
      const color = props.point_color_hex;
      const opacity = 1;
      const visible = props.default_visible !== 0;

      const existing = byRegion.get(region);
      if (existing) {
        existing.visible = existing.visible || visible;
      } else {
        byRegion.set(region, {
          visible,
          color,
          opacity,
          shape: 'circle',
          borderVisible: false,
          borderColor: '#ffffff',
          borderWidth: 1,
          borderOpacity: 1,
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

async function loadPmcRegionParDisplay(
  path: string,
): Promise<{
  regionParDisplayByName: Record<string, string>;
  totalParDisplay: string;
}> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return {
        regionParDisplayByName: {},
        totalParDisplay: '—',
      };
    }
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const { regionParByName, totalPar } = summarizeFacilityParByRegion(
      (geojson.features ?? []).map((feature) => {
        const rawProperties = feature.properties ?? {};
        const parsedProperties = parseFacilityProperties(rawProperties);

        return {
          regionName: parsedProperties.region,
          parValue: rawProperties.par,
        };
      }),
    );

    return {
      regionParDisplayByName: Object.fromEntries(
        Object.entries(regionParByName).map(([regionName, value]) => [
          regionName,
          formatParDisplayValue(value),
        ]),
      ),
      totalParDisplay: formatParDisplayValue(totalPar),
    };
  } catch {
    return {
      regionParDisplayByName: {},
      totalParDisplay: '—',
    };
  }
}

async function loadFacilityParRecords(
  path: string,
): Promise<FacilityParRecord[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return [];
    }
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    return (geojson.features ?? []).map((feature) => {
      const rawProperties = feature.properties ?? {};
      const parsedProperties = parseFacilityProperties(rawProperties);

      return {
        regionName: parsedProperties.region,
        legacyBoundaryCode: rawProperties.icb_hb_code,
        boundaryCode2026: rawProperties.icb_hb_code_2026,
        parValue: rawProperties.par,
      };
    });
  } catch {
    return [];
  }
}

async function loadPresetRegionParByPreset(
  path: string,
): Promise<Partial<Record<ViewPresetId, Record<string, number>>>> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      return {};
    }
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };
    const facilities = (geojson.features ?? []).map((feature) => {
      const rawProperties = feature.properties ?? {};
      const parsedProperties = parseFacilityProperties(rawProperties);

      return {
        regionName: parsedProperties.region,
        legacyBoundaryCode: rawProperties.icb_hb_code,
        boundaryCode2026: rawProperties.icb_hb_code_2026,
        parValue: rawProperties.par,
      };
    });

    return {
      coa3a: summarizeFacilityParByPresetRegion({
        facilities,
        preset: 'coa3a',
        preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
      }).regionParByName,
      coa3b: summarizeFacilityParByPresetRegion({
        facilities,
        preset: 'coa3b',
        preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
      }).regionParByName,
      coa3c: summarizeFacilityParByPresetRegion({
        facilities,
        preset: 'coa3c',
        preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
      }).regionParByName,
    };
  } catch {
    return {};
  }
}

async function loadCombinedPracticeStyles(
  path: string,
): Promise<CombinedPracticeStyle[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) return [];
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    return buildDefaultCombinedPracticeStyles(
      (geojson.features ?? []).map((feature) => feature.properties ?? {}),
    );
  } catch {
    return [];
  }
}

async function loadCombinedPracticeCatalog(
  path: string,
): Promise<CombinedPracticeCatalogEntry[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) return [];
    const geojson = (await response.json()) as {
      features?: Array<{ properties?: Record<string, unknown> }>;
    };

    return buildCombinedPracticeCatalog(
      (geojson.features ?? []).map((feature) => feature.properties ?? {}),
    );
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
    | 'countryLabelBorderColor'
    | 'majorCityColor'
    | 'majorCityBorderColor'
    | 'regionLabelColor'
    | 'regionLabelBorderColor'
    | 'networkLabelColor'
    | 'networkLabelBorderColor'
    | 'facilityLabelColor'
    | 'facilityLabelBorderColor'
    | 'seaFillColor'
    | 'seaLabelColor'
    | 'seaLabelBorderColor',
):
  | 'landFillOpacity'
  | 'countryBorderOpacity'
  | 'countryLabelOpacity'
  | 'countryLabelBorderOpacity'
  | 'majorCityOpacity'
  | 'majorCityBorderOpacity'
  | 'regionLabelOpacity'
  | 'regionLabelBorderOpacity'
  | 'networkLabelOpacity'
  | 'networkLabelBorderOpacity'
  | 'facilityLabelOpacity'
  | 'facilityLabelBorderOpacity'
  | 'seaFillOpacity'
  | 'seaLabelOpacity'
  | 'seaLabelBorderOpacity' {
  if (key === 'landFillColor') return 'landFillOpacity';
  if (key === 'countryBorderColor') return 'countryBorderOpacity';
  if (key === 'countryLabelColor') return 'countryLabelOpacity';
  if (key === 'countryLabelBorderColor') return 'countryLabelBorderOpacity';
  if (key === 'majorCityColor') return 'majorCityOpacity';
  if (key === 'majorCityBorderColor') return 'majorCityBorderOpacity';
  if (key === 'regionLabelColor') return 'regionLabelOpacity';
  if (key === 'regionLabelBorderColor') return 'regionLabelBorderOpacity';
  if (key === 'networkLabelColor') return 'networkLabelOpacity';
  if (key === 'networkLabelBorderColor') return 'networkLabelBorderOpacity';
  if (key === 'facilityLabelColor') return 'facilityLabelOpacity';
  if (key === 'facilityLabelBorderColor') return 'facilityLabelBorderOpacity';
  if (key === 'seaFillColor') return 'seaFillOpacity';
  if (key === 'seaLabelColor') return 'seaLabelOpacity';
  return 'seaLabelBorderOpacity';
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
    showCountryBorders: false,
    countryLabelColor: '#0f172a',
    countryLabelOpacity: 1,
    showCountryLabels: false,
    majorCityColor: '#1f2937',
    majorCityOpacity: 1,
    showMajorCities: false,
    regionLabelColor: '#334155',
    regionLabelOpacity: 0.5,
    showRegionLabels: false,
    networkLabelColor: '#475569',
    networkLabelOpacity: 0.55,
    showNetworkLabels: false,
    facilityLabelColor: '#111827',
    facilityLabelOpacity: 0.7,
    showFacilityLabels: true,
    seaFillColor: '#d9e7f5',
    seaFillOpacity: 1,
    showSeaFill: true,
    seaLabelColor: '#334155',
    seaLabelOpacity: 1,
    showSeaLabels: false,
  };
}

function createDefaultMapViewport(): MapViewportState {
  return {
    center: [0, 0],
    zoom: 0,
    rotation: 0,
  };
}

function createDefaultSelectionState(): SelectionState {
  return {
    facilityIds: [],
    boundaryName: null,
    jmcName: null,
    scenarioRegionId: null,
  };
}

function createDefaultPointTooltipDisplayState(): PointTooltipDisplayState {
  return {
    facilityName: null,
    regionName: null,
    isCombinedPractice: false,
    combinedPracticeName: null,
    combinedPracticeMembers: [],
    facilityPar: null,
    practicePar: null,
    regionPar: null,
    baseportPar: null,
    correctionParContext: null,
    correctionPar: null,
    totalPar: null,
    pageIndex: 0,
    pageCount: 0,
  };
}

function createDefaultScenarioWorkspaceEditorState(): ScenarioWorkspaceEditorState {
  return createScenarioWorkspaceEditorState({});
}

function createScenarioWorkspaceEditorState(
  input: Partial<ScenarioWorkspaceEditorState>,
): ScenarioWorkspaceEditorState {
  return {
    selectedBoundaryUnitId: input.selectedBoundaryUnitId ?? null,
    selectedScenarioRegionId: input.selectedScenarioRegionId ?? null,
    pendingScenarioRegionId: input.pendingScenarioRegionId ?? null,
    isDirty: input.isDirty ?? false,
  };
}

function ensureScenarioWorkspaceDrafts(
  drafts: Partial<Record<ScenarioWorkspaceId, ScenarioWorkspaceDraft>>,
  workspaceId: ScenarioWorkspaceId,
): Partial<Record<ScenarioWorkspaceId, ScenarioWorkspaceDraft>> {
  if (drafts[workspaceId]) {
    return drafts;
  }

  return {
    ...drafts,
    [workspaceId]: createScenarioWorkspaceDraft(workspaceId),
  };
}

function createActivatedPresetState({
  currentViewPresetState,
  currentFacilityPresentationState,
  preserveFacilityPresentationState,
  scenarioWorkspaceDrafts,
  preset,
  workspaceId,
}: {
  currentViewPresetState: ViewPresetState | null;
  currentFacilityPresentationState: Pick<
    AppState,
    | 'regions'
    | 'combinedPracticeStyles'
    | 'facilitySymbolShape'
    | 'facilitySymbolSize'
    | 'regionGlobalOpacity'
  >;
  preserveFacilityPresentationState: boolean;
  scenarioWorkspaceDrafts: Partial<Record<ScenarioWorkspaceId, ScenarioWorkspaceDraft>>;
  preset: ViewPresetId;
  workspaceId: ScenarioWorkspaceId | null;
}) {
  const nextDrafts = workspaceId
    ? ensureScenarioWorkspaceDrafts(scenarioWorkspaceDrafts, workspaceId)
    : scenarioWorkspaceDrafts;

  if (!currentViewPresetState) {
    return {
      activeViewPreset: preset,
      activeScenarioWorkspaceId: workspaceId,
      scenarioWorkspaceDrafts: nextDrafts,
      scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
      selection: createDefaultSelectionState(),
    };
  }

  const nextState =
    preset === 'current'
      ? {
          layers: cloneLayers(currentViewPresetState.layers),
          regions: cloneRegions(currentViewPresetState.regions),
          combinedPractices: cloneCombinedPracticeStyles(
            currentViewPresetState.combinedPractices,
          ),
          combinedPracticeCatalog: cloneCombinedPracticeCatalog(
            currentViewPresetState.combinedPracticeCatalog,
          ),
          overlayLayers: cloneOverlayLayers(currentViewPresetState.overlayLayers),
          regionGlobalOpacity: currentViewPresetState.regionGlobalOpacity,
          facilitySymbolShape: currentViewPresetState.facilitySymbolShape,
          facilitySymbolSize: currentViewPresetState.facilitySymbolSize,
          facilityFilters: createFacilityFilterState(
            currentViewPresetState.facilityFilters,
          ),
          basemap: { ...currentViewPresetState.basemap },
        }
      : createScenarioViewPresetState(currentViewPresetState, preset);

  const nextFacilityPresentationState = preserveFacilityPresentationState
    ? createPersistentFacilityPresentationState(currentFacilityPresentationState)
    : {
        regions: cloneRegions(nextState.regions),
        combinedPractices: cloneCombinedPracticeStyles(nextState.combinedPractices),
        facilitySymbolShape: nextState.facilitySymbolShape,
        facilitySymbolSize: nextState.facilitySymbolSize,
        regionGlobalOpacity: nextState.regionGlobalOpacity,
      };

  return {
    activeViewPreset: preset,
    activeScenarioWorkspaceId: workspaceId,
    layers: cloneLayers(nextState.layers),
    regions: cloneRegions(nextFacilityPresentationState.regions),
    combinedPracticeStyles: cloneCombinedPracticeStyles(
      nextFacilityPresentationState.combinedPractices,
    ),
    combinedPracticeCatalog: cloneCombinedPracticeCatalog(
      nextState.combinedPracticeCatalog,
    ),
    overlayLayers: cloneOverlayLayers(nextState.overlayLayers),
    regionGlobalOpacity: nextFacilityPresentationState.regionGlobalOpacity,
    facilitySymbolShape: nextFacilityPresentationState.facilitySymbolShape,
    facilitySymbolSize: nextFacilityPresentationState.facilitySymbolSize,
    facilityFilters: createFacilityFilterState(nextState.facilityFilters),
    basemap: { ...nextState.basemap },
    scenarioWorkspaceDrafts: nextDrafts,
    scenarioWorkspaceEditor: createDefaultScenarioWorkspaceEditorState(),
    selection: createDefaultSelectionState(),
  };
}

function createPersistentFacilityPresentationState(
  source: Pick<
    AppState,
    | 'regions'
    | 'combinedPracticeStyles'
    | 'facilitySymbolShape'
    | 'facilitySymbolSize'
    | 'regionGlobalOpacity'
  >,
): Pick<
  ViewPresetState,
  'regions' | 'combinedPractices' | 'facilitySymbolShape' | 'facilitySymbolSize' | 'regionGlobalOpacity'
> {
  return {
    regions: cloneRegions(source.regions),
    combinedPractices: cloneCombinedPracticeStyles(source.combinedPracticeStyles),
    facilitySymbolShape: source.facilitySymbolShape,
    facilitySymbolSize: source.facilitySymbolSize,
    regionGlobalOpacity: source.regionGlobalOpacity,
  };
}

function createDefaultOverlayLayers(): OverlayLayerStyle[] {
  return [
    // Class-coloured ICB/HB fill tiles (Regions pane).  Zero border by default.
    {
      id: 'regionFill',
      name: 'Region Fill',
      path: V10_PATH,
      family: 'regionFill' as OverlayFamily,
      visible: true,
      opacity: 0.7,
      borderVisible: false,
      borderColor: '#ffffff',
      borderWidth: 1,
      borderOpacity: 0,
      swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
    },
    // Ward-split fill for the 3 ICBs that cross DPHC region boundaries.
    {
      id: 'wardSplitFill',
      name: 'Ward split fill',
      path: WARD_SPLIT_PATH,
      family: 'wardSplitFill' as OverlayFamily,
      visible: true,
      opacity: 0.7,
      borderVisible: false,
      borderColor: '#ffffff',
      borderWidth: 1,
      borderOpacity: 0,
      swatchColor: '#8f8f8f',
    },
    {
      id: 'wardSplitWards',
      name: 'Split ICB wards',
      path: WARD_SPLIT_WARDS_PATH,
      family: 'wardSplitWards' as OverlayFamily,
      visible: false,
      opacity: 0,
      borderVisible: false,
      borderColor: BOARD_BOUNDARY_BASE_STYLE.borderColor,
      borderWidth: 1,
      borderOpacity: BOARD_BOUNDARY_BASE_STYLE.borderOpacity,
      swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
    },
    // England ICBs border overlay (Overlays pane) — topology internal edges.
    {
      id: 'englandIcb',
      name: 'Pre-2026 NHS England ICBs',
      path: V10_EDGES_PATH,
      family: 'englandIcb' as OverlayFamily,
      visible: false,
      opacity: 0,
      borderVisible: true,
      borderColor: BOARD_BOUNDARY_BASE_STYLE.borderColor,
      borderWidth: 1,
      borderOpacity: BOARD_BOUNDARY_BASE_STYLE.borderOpacity,
      swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
    },
    // Devolved administrations health boards (Overlays pane) — topology internal edges.
    {
      id: 'devolvedHb',
      name: 'Devolved Administrations Health Boards',
      path: V10_EDGES_PATH,
      family: 'devolvedHb' as OverlayFamily,
      visible: false,
      opacity: 0,
      borderVisible: true,
      borderColor: BOARD_BOUNDARY_BASE_STYLE.borderColor,
      borderWidth: 1,
      borderOpacity: BOARD_BOUNDARY_BASE_STYLE.borderOpacity,
      swatchColor: BOARD_BOUNDARY_BASE_STYLE.swatchColor,
    },
    // Official NHS England Regions overlay (January 2024 EN BSC), default off.
    {
      id: 'nhsEnglandRegionsBsc',
      name: 'NHS England Regions (2024 BSC)',
      path: NHS_ENGLAND_REGIONS_BSC_PATH,
      family: 'nhsRegions' as OverlayFamily,
      visible: false,
      opacity: 0,
      borderVisible: false,
      borderColor: '#7d93ab',
      borderWidth: 1.25,
      borderOpacity: 0.7,
      swatchColor: '#7d93ab',
    },
    // SJC JMC dissolved outline overlay, default off.
    {
      id: 'sjcJmcOutline',
      name: 'SJC JMC',
      path: SJC_JMC_OUTLINE_PATH,
      family: 'customRegions' as OverlayFamily,
      visible: false,
      opacity: 0,
      borderVisible: false,
      borderColor: '#6c8f3d',
      borderWidth: 1.25,
      borderOpacity: 0.7,
      swatchColor: '#6c8f3d',
    },
    // Scenario regional outline (JMC / COA 3a / COA 3b), hidden in Current mode.
    {
      id: 'scenarioOutline',
      name: 'Scenario outline',
      path: '',
      family: 'scenarioRegions' as OverlayFamily,
      visible: false,
      opacity: 0.5,
      borderVisible: true,
      borderColor: '#ffffff',
      borderWidth: 1,
      borderOpacity: 0.7,
      swatchColor: '#ffffff',
    },
  ];
}

function createViewPresetState({
  layers,
  regions,
  combinedPractices,
  combinedPracticeCatalog,
}: Pick<
  ViewPresetState,
  'layers' | 'regions' | 'combinedPractices' | 'combinedPracticeCatalog'
>): ViewPresetState {
  return {
    layers: cloneLayers(layers),
    regions: cloneRegions(regions),
    combinedPractices: cloneCombinedPracticeStyles(combinedPractices),
    combinedPracticeCatalog: cloneCombinedPracticeCatalog(combinedPracticeCatalog),
    overlayLayers: createDefaultOverlayLayers(),
    regionGlobalOpacity: 1,
    facilitySymbolShape: 'circle',
    facilitySymbolSize: 3.5,
    facilityFilters: createFacilityFilterState(),
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
    combinedPractices: cloneCombinedPracticeStyles(source.combinedPractices),
    combinedPracticeCatalog: cloneCombinedPracticeCatalog(
      source.combinedPracticeCatalog,
    ),
    overlayLayers: createScenarioOverlayLayers(source.overlayLayers, preset),
    regionGlobalOpacity: source.regionGlobalOpacity,
    facilitySymbolShape: source.facilitySymbolShape,
    facilitySymbolSize: source.facilitySymbolSize,
    facilityFilters: createFacilityFilterState(source.facilityFilters),
    basemap: { ...source.basemap },
  };
}

function createScenarioOverlayLayers(
  layers: OverlayLayerStyle[],
  preset: ViewPresetId,
): OverlayLayerStyle[] {
  const hiddenLayers = cloneOverlayLayers(layers)
    .filter((layer) => layer.id !== 'wardSplitWards')
    .map((layer) => ({
      ...layer,
      visible: false,
      borderVisible: false,
    }));

  const boardLayerConfig = getScenarioBoardLayerConfig(preset);
  const outlineLayerConfig = getScenarioOutlineLayerConfig(preset);
  if (!boardLayerConfig || !outlineLayerConfig) {
    return hiddenLayers;
  }

  const wardSplitPath = getScenarioWardSplitPath(preset);

  const mapped = hiddenLayers.map((layer): OverlayLayerStyle => {
    // Region fill: switch to 2026 boundary file for scenario presets.
    if (layer.id === 'regionFill') {
      return {
        ...layer,
        path: boardLayerConfig.path,
        family: 'regionFill' as OverlayFamily,
        visible: true,
        opacity: boardLayerConfig.opacity,
        borderVisible: false,
        borderOpacity: 0,
      };
    }
    // Scenario outline layer (reuses the pmcUnpopulated slot via outlineLayerConfig).
    if (layer.id === 'wardSplitFill') {
      return {
        ...layer,
        path: wardSplitPath ?? '',
        family: 'wardSplitFill' as OverlayFamily,
        visible: wardSplitPath != null,
      };
    }
    // England ICB border overlay: switch to 2026 topology edges.
    if (layer.id === 'englandIcb') {
      return {
        ...layer,
        name: '2026 NHS England ICBs',
        path: BOARD_2026_EDGES_PATH,
        family: 'englandIcb' as OverlayFamily,
        visible: false,
        borderVisible: true,
      };
    }
    // Devolved HB overlay: switch to 2026 topology edges.
    if (layer.id === 'devolvedHb') {
      return {
        ...layer,
        path: BOARD_2026_EDGES_PATH,
        family: 'devolvedHb' as OverlayFamily,
        visible: false,
        borderVisible: true,
      };
    }
    if (layer.id === 'sjcJmcOutline') {
      return {
        ...layer,
        name: 'SJC JMC',
        path: JMC_2026_OUTLINE_PATH,
        family: 'customRegions' as OverlayFamily,
        visible: false,
        borderVisible: false,
      };
    }
    // Scenario outline: use outlineLayerConfig.
    if (layer.family === 'scenarioRegions') {
      return {
        ...layer,
        name: outlineLayerConfig.name,
        path: outlineLayerConfig.path,
        visible: outlineLayerConfig.visible,
        opacity: outlineLayerConfig.opacity,
        borderColor: outlineLayerConfig.borderColor,
        borderOpacity: outlineLayerConfig.borderOpacity,
        swatchColor: outlineLayerConfig.swatchColor,
      };
    }
    return layer;
  });

  return mapped;
}

function getOrCreateGroupOverride(
  overrides: Record<string, import('../types').RegionGroupStyleOverride>,
  groupName: string,
): import('../types').RegionGroupStyleOverride {
  return overrides[groupName] ?? {
    visible: true,
    populatedFillVisible: true,
    unpopulatedFillVisible: true,
    populatedFillColor: null,
    unpopulatedFillColor: null,
    populatedOpacity: 0.35,
    unpopulatedOpacity: 0.25,
    borderVisible: false,
    borderColor: '#ffffff',
    borderOpacity: 0,
    borderWidth: 1,
  };
}

function cloneLayers(layers: LayerState[]): LayerState[] {
  return layers.map((layer) => ({ ...layer }));
}

function cloneRegions(regions: RegionStyle[]): RegionStyle[] {
  return regions.map((region) => ({ ...region }));
}

function cloneCombinedPracticeStyles(
  practices: CombinedPracticeStyle[] = [],
): CombinedPracticeStyle[] {
  return practices.map((practice) => ({ ...practice }));
}

function cloneCombinedPracticeCatalog(
  catalog: CombinedPracticeCatalogEntry[] = [],
): CombinedPracticeCatalogEntry[] {
  return catalog.map((entry) => ({
    ...entry,
    regions: [...entry.regions],
  }));
}

function cloneOverlayLayers(
  layers: OverlayLayerStyle[],
): OverlayLayerStyle[] {
  return layers.map((layer) => ({ ...layer }));
}
