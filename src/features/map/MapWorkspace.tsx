import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import OLMap from 'ol/Map';
import Feature from 'ol/Feature';
import VectorLayer from 'ol/layer/Vector';
import type { FeatureLike } from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import {
  Fill,
  Stroke,
  Style,
  Circle as CircleStyle,
  Text as TextStyle,
} from 'ol/style';
import type {
  BasemapSettings,
  BoundarySystemId,
  CombinedPracticeStyle,
  FacilitySymbolShape,
  RegionStyle,
  ScenarioWorkspaceId,
  ViewPresetId,
} from '../../types';
import {
  BOUNDARY_SYSTEMS,
  getBoundarySystem,
} from '../../lib/config/boundarySystems';
import { getUkBasemapAlignmentPathsForPreset } from '../../lib/config/basemapAlignment';
import { resolveRuntimeMapProductPath } from '../../lib/config/runtimeMapProducts';
import { resolveRuntimeAssetUrl } from '../../lib/runtimeAssetUrls';
import {
  getInteractiveScenarioWorkspaceIds,
  getScenarioWorkspaceAssignmentDatasetPath,
  getScenarioWorkspaceBaseline,
  getScenarioWorkspaceLookupBoundaryPath,
  getScenarioWorkspacePresetIds,
  isDphcEstimateCoaPlaygroundWorkspaceId,
  isScenarioWorkspaceCompatibleWithPreset,
} from '../../lib/config/scenarioWorkspaces';
import { getRegionGroup } from '../../lib/config/viewPresets';
import { getGroupInlandWaterOutlinePath } from '../../lib/config/viewPresets';
import { isWaterEdgeTreatmentActiveForBuild } from '../../lib/config/waterEdgeTreatment';
import {
  type PointTooltipEntry,
  getPointCoordinate,
  prioritizePointTooltipEntries,
} from './pointSelection';
import { renderDockedTooltip } from './tooltipController';
import {
  getActiveAssignmentLookupSource,
} from './lookupSources';
import { getActiveBoundarySystemLookupSource } from './workspaceLookupSources';
import {
  type PlaygroundRuntimeDiagnosticsSnapshot,
} from './scenarioWorkspaceRuntime';
import { buildPlaygroundRuntimeSession } from './playgroundRuntimeSession';
import {
  getScenarioBoundaryUnitId,
  resolveScenarioWorkspaceRegionIdForRecord,
} from '../../lib/scenarioWorkspaceAssignments';
import {
  loadOverlayAssignmentDataset,
  loadOverlayLookupDatasets,
  resolveDataUrl,
  type OverlayLookupDatasetDefinition,
} from './overlayLookupBootstrap';
import {
  attachZoomStatusControl,
  fitMapToUkExtentOnLoad,
  getUnitedKingdomExtentFromCountrySource,
  loadUnitedKingdomExtentFromCountriesUrl,
  cleanupMapWorkspaceRefs,
  initializeMapWorkspaceShell,
  resetTransientMapSelectionState,
  type BasemapLayerSet,
} from './mapWorkspaceLifecycle';
import { reconcileRuntimeLayers } from './runtimeLayerReconciliation';
import { reconcileOverlayBoundaryLayers } from './overlayBoundaryReconciliation';
import { getViewportFromMap, syncViewportToMap } from './viewportSync';
import {
  syncBoundaryHighlightForPoint,
  syncSelectedRegionHighlightFromAvailableSources,
  syncSelectedRegionHighlightFromDerivedSource,
} from './selectionHighlights';
import {
  createRegionBoundaryLayer,
  createRegionBoundaryStyle,
  createSelectedWaterEdgeModifierStyle,
  createSplitInternalArcStyle,
  createWaterEdgeBorderModifierStyle,
} from './boundaryLayerStyles';
import { getStyleForLayer } from './facilityLayerStyles';
import {
  createPointSymbol,
  withOpacity,
} from './mapStyleUtils';
import {
  getPointPresentationOuterDistance,
  resolvePointPresentation,
  type ResolvedPointPresentation,
} from './pointPresentation';
import { resolveSingleClickSelection } from './singleClickSelection';
import { buildEffectivePopulatedCodes } from './populatedCodes';
import {
  applyBoundarySelection,
  findCareBoardBoundaryAtCoordinate,
  findJmcNameAtCoordinate,
  findJmcNameForBoundarySelection,
  loadGroupOutlineFeatures,
  loadGroupOutlineFeature,
} from './boundarySelection';
import {
  getFacilityFilterDefinitions,
} from '../../lib/facilityFilters';
import { stripScenarioRegionPrefix } from '../../lib/regions/regionOrder';
import { getFacilityFeatureProperties } from '../../lib/facilities';
import {
  buildSelectedFacilityParSummary,
  formatParDisplayValue,
} from './facilityPar';
import { buildSelectedFacilityPracticeSummary } from './facilityPracticeSummary';
import { useAppStore } from '../../store/appStore';
import { ScenarioAssignmentPopover } from './ScenarioAssignmentPopover';
import {
  resolvePlaygroundEditorRegionId,
  resolvePlaygroundSelectedRegion,
} from './playgroundSelection';
import { getScenarioPresetConfig } from '../../lib/config/viewPresets';

interface ScenarioAssignmentPopoverState {
  boundaryUnitId: string;
  boundaryName: string;
  coordinate: [number, number];
  selectedRegionId: string | null;
}

declare global {
  interface Window {
    __dmsGISPlaygroundDiagnostics?: PlaygroundRuntimeDiagnosticsSnapshot | null;
    __dmsGISPlaygroundDiagnosticsHistory?: PlaygroundRuntimeDiagnosticsSnapshot[];
  }
}

export function MapWorkspace() {
  const layers = useAppStore((state) => state.layers);
  const regions = useAppStore((state) => state.regions);
  const combinedPracticeStyles = useAppStore(
    (state) => state.combinedPracticeStyles,
  );
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activeScenarioWorkspaceId = useAppStore(
    (state) => state.activeScenarioWorkspaceId,
  );
  const scenarioWorkspaceEditor = useAppStore(
    (state) => state.scenarioWorkspaceEditor,
  );
  const activeScenarioWorkspaceDraft = useAppStore((state) =>
    state.activeScenarioWorkspaceId
      ? state.scenarioWorkspaceDrafts[state.activeScenarioWorkspaceId] ?? null
      : null,
  );
  const facilitySymbolShape = useAppStore((state) => state.facilitySymbolShape);
  const facilitySymbolSize = useAppStore((state) => state.facilitySymbolSize);
  const facilityFilters = useAppStore((state) => state.facilityFilters);
  const mapViewport = useAppStore((state) => state.mapViewport);
  const facilityFilterDefinitions = getFacilityFilterDefinitions(facilityFilters);
  const loadLayers = useAppStore((state) => state.loadLayers);
  const selectScenarioWorkspaceBoundaryUnit = useAppStore(
    (state) => state.selectScenarioWorkspaceBoundaryUnit,
  );
  const assignScenarioWorkspaceBoundaryUnit = useAppStore(
    (state) => state.assignScenarioWorkspaceBoundaryUnit,
  );
  const basemap = useAppStore((state) => state.basemap);
  const overlayLayers = useAppStore((state) => state.overlayLayers);
  const selection = useAppStore((state) => state.selection);
  const populatedV10Codes = useAppStore((state) => state.populatedV10Codes);
  const populated2026Codes = useAppStore((state) => state.populated2026Codes);
  const regionGroupOverrides = useAppStore((state) => state.regionGroupOverrides);
  const setMapViewport = useAppStore((state) => state.setMapViewport);
  const setSelection = useAppStore((state) => state.setSelection);
  const setPointTooltipDisplay = useAppStore((state) => state.setPointTooltipDisplay);
  const pointTooltipPageRequestNonce = useAppStore(
    (state) => state.pointTooltipPageRequestNonce,
  );
  const pointTooltipPageRequestDirection = useAppStore(
    (state) => state.pointTooltipPageRequestDirection,
  );
  const clearPointTooltipPageRequest = useAppStore(
    (state) => state.clearPointTooltipPageRequest,
  );
  const facilitySelectionRequestId = useAppStore(
    (state) => state.facilitySelectionRequestId,
  );
  const facilitySelectionRequestNonce = useAppStore(
    (state) => state.facilitySelectionRequestNonce,
  );
  const clearFacilitySelectionRequest = useAppStore(
    (state) => state.clearFacilitySelectionRequest,
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const initialViewPresetRef = useRef(activeViewPreset);
  const initialViewportReadyRef = useRef(false);
  const initialMapRevealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [initialMapReady, setInitialMapReady] = useState(false);
  const [scenarioAssignmentPopover, setScenarioAssignmentPopover] =
    useState<ScenarioAssignmentPopoverState | null>(null);
  const mapRef = useRef<OLMap | null>(null);
  const basemapRef = useRef<BasemapLayerSet | null>(null);
  const regionBoundaryRefs = useRef<
    globalThis.Map<string, VectorLayer<VectorSource>>
  >(new globalThis.Map());
  const regionBoundaryPathRefs = useRef<globalThis.Map<string, string>>(
    new globalThis.Map(),
  );
  const splitInternalArcLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const englandWaterEdgeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const devolvedWaterEdgeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedWaterEdgeLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedBoundaryRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedJmcBoundaryRef = useRef<VectorLayer<VectorSource> | null>(null);
  const selectedPointRef = useRef<VectorLayer<VectorSource> | null>(null);
  const boundarySystemLookupSourcesRef = useRef<
    Map<BoundarySystemId, VectorSource>
  >(new Map());
  const jmcBoundaryLookupSourceRef = useRef<VectorSource | null>(null);
  const scenarioBoundaryLookupSourcesRef = useRef<
    Map<ViewPresetId, VectorSource>
  >(new Map());
  const jmcAssignmentLookupSourceRef = useRef<VectorSource | null>(null);
  const scenarioWorkspaceAssignmentSourceRef = useRef<VectorSource | null>(null);
  const scenarioWorkspaceBaselineAssignmentSourceRef = useRef<VectorSource | null>(
    null,
  );
  const scenarioWorkspaceBaselineDatasetSourcesRef = useRef<
    Map<string, VectorSource>
  >(new Map());
  const scenarioTopologyEdgeSourceRef = useRef<VectorSource | null>(null);
  const scenarioWorkspaceDerivedOutlineSourceRef = useRef<VectorSource | null>(null);
  const presetGroupOutlineSourceRef = useRef<VectorSource | null>(null);
  const jmcAssignmentByBoundaryNameRef = useRef<Map<string, string>>(new Map());
  const scenarioWorkspaceAssignmentByBoundaryNameRef = useRef<Map<string, string>>(
    new Map(),
  );
  const pointTooltipRootRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipHeaderRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipNameRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipSubnameRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipContextRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipFooterRef = useRef<HTMLDivElement | null>(null);
  const pointTooltipPageRef = useRef<HTMLSpanElement | null>(null);
  const pointTooltipPrevRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipNextRef = useRef<HTMLButtonElement | null>(null);
  const pointTooltipEntriesRef = useRef<PointTooltipEntry[]>([]);
  const pointTooltipIndexRef = useRef(0);
  const selectedBoundaryNameRef = useRef<string | null>(null);
  const selectedJmcNameRef = useRef<string | null>(null);
  const selectedJmcOutlineRequestRef = useRef(0);
  const layerRefs = useRef<globalThis.Map<string, VectorLayer<VectorSource>>>(
    new globalThis.Map(),
  );
  const [scenarioWorkspaceBaselineSourcesVersion, setScenarioWorkspaceBaselineSourcesVersion] =
    useState(0);
  const [presetGroupOutlineSourceVersion, setPresetGroupOutlineSourceVersion] =
    useState(0);
  const scenarioWorkspaceRuntimeActive =
    !!activeScenarioWorkspaceId &&
    isScenarioWorkspaceCompatibleWithPreset(
      activeScenarioWorkspaceId,
      activeViewPreset,
    );
  const playgroundModeActive =
    isDphcEstimateCoaPlaygroundWorkspaceId(activeScenarioWorkspaceId) &&
    scenarioWorkspaceRuntimeActive;
  const activeScenarioWorkspaceBaseline = activeScenarioWorkspaceId
      ? getScenarioWorkspaceBaseline(activeScenarioWorkspaceId)
      : null;
  const activeScenarioWorkspaceBaselineAssignmentKind =
    activeScenarioWorkspaceBaseline?.assignmentSource.kind ?? null;
  const waterEdgeTreatmentActive = isWaterEdgeTreatmentActiveForBuild();
  const mapSeaFillBackground = resolveMapSeaFillBackground(basemap);
  const mapShellStyle = {
    '--map-sea-fill-bg': mapSeaFillBackground,
  } as CSSProperties;

  const getEditableBoundaryFeature = useCallback((boundaryUnitId: string): Feature | null => {
    const editableSource =
      scenarioWorkspaceAssignmentSourceRef.current ??
      regionBoundaryRefs.current.get('regionFill')?.getSource() ??
      null;
    if (!editableSource) {
      return null;
    }

    return (
      editableSource.getFeatures().find((feature) => {
        const boundaryProperties = feature.getProperties() as Record<string, unknown>;
        return getScenarioBoundaryUnitId(boundaryProperties) === boundaryUnitId;
      }) ?? null
    );
  }, []);

  const selectBoundary = useCallback((
    feature: Feature | null,
    coordinate?: [number, number],
    regionOverride?: {
      scenarioRegionId: string | null;
      regionName: string | null;
    },
  ) => {
    const selectedBoundaryLayer = selectedBoundaryRef.current;
    const selectedJmcBoundaryLayer = selectedJmcBoundaryRef.current;
    if (!selectedBoundaryLayer || !selectedJmcBoundaryLayer) {
      return;
    }

    const appliedSelection = applyBoundarySelection({
      feature,
      coordinate,
      selectedBoundaryLayer,
      selectedJmcBoundaryLayer,
      assignmentByBoundaryName:
        scenarioWorkspaceAssignmentByBoundaryNameRef.current.size > 0
          ? scenarioWorkspaceAssignmentByBoundaryNameRef.current
          : jmcAssignmentByBoundaryNameRef.current,
      assignmentSource:
        scenarioWorkspaceAssignmentSourceRef.current ??
        getActiveAssignmentLookupSource(
          regionBoundaryRefs.current,
          jmcAssignmentLookupSourceRef.current,
        ),
      boundarySource: getActiveBoundarySystemLookupSource(
        boundarySystemLookupSourcesRef.current,
        activeViewPreset,
      ),
      activeViewPreset,
    });
    selectedBoundaryNameRef.current = appliedSelection.boundaryName;
    const selectedScenarioRegionId =
      regionOverride?.scenarioRegionId ?? appliedSelection.scenarioRegionId;
    const selectedRegionName =
      regionOverride?.regionName ?? appliedSelection.jmcName;
    selectedJmcNameRef.current = selectedRegionName;
    setSelection({
      ...appliedSelection.selection,
      jmcName: selectedRegionName,
      scenarioRegionId: selectedScenarioRegionId,
    });

    const selectedJmcSource = selectedJmcBoundaryLayer.getSource();
    if (!selectedJmcSource) {
      return;
    }
    selectedJmcSource.clear();
    const jmcName = selectedRegionName;
    if (!jmcName) {
      return;
    }

    const selectionColor =
      getRegionGroup(activeViewPreset, jmcName)?.colors.outline ?? '#419632';
    if (
      syncSelectedRegionHighlightFromAvailableSources({
        activeViewPreset,
        preferDerivedOutlineSource: playgroundModeActive,
        selectedRegionId: selectedScenarioRegionId,
        selectedRegionName: jmcName,
        selectionColor,
        currentOutlineFeature: null,
        derivedOutlineSource: scenarioWorkspaceDerivedOutlineSourceRef.current,
        selectedJmcBoundaryLayer,
      })
    ) {
      return;
    }

    const outlineRequestId = selectedJmcOutlineRequestRef.current + 1;
    selectedJmcOutlineRequestRef.current = outlineRequestId;
    void loadGroupOutlineFeature(activeViewPreset, jmcName, resolveDataUrl).then(
      (outlineFeature) => {
        if (
          !outlineFeature ||
          selectedJmcOutlineRequestRef.current !== outlineRequestId ||
          selectedJmcNameRef.current !== jmcName
        ) {
          return;
        }
        selectedJmcSource.clear();
        selectedJmcSource.addFeature(outlineFeature);
      },
    );
  }, [activeViewPreset, playgroundModeActive, setSelection]);

  const createSelectedPointStyle = useCallback((entry: PointTooltipEntry | null) => {
    if (!entry) {
      return createEmptySelectedPointStyle();
    }

    const activeAssignmentSource =
      scenarioWorkspaceAssignmentSourceRef.current ??
      getActiveAssignmentLookupSource(
        regionBoundaryRefs.current,
        jmcAssignmentLookupSourceRef.current,
      );
    const regionsByName = new Map(regions.map((region) => [region.name, region]));
    const combinedPracticeStylesByName = new Map(
      combinedPracticeStyles.map((practice) => [practice.name, practice]),
    );
    const selectedFeature = layers
      .filter((layer) => layer.type === 'point' && layer.visible)
      .flatMap((layer) => layerRefs.current.get(layer.id)?.getSource()?.getFeatures() ?? [])
      .find((feature) => getFacilityFeatureProperties(feature).id === entry.facilityId);

    if (!selectedFeature) {
      return createEstimatedSelectedPointStyle(entry);
    }

    return createSelectedPointStylesFromPresentation(
      resolvePointPresentation({
        feature: selectedFeature,
        regions: regionsByName,
        combinedPracticeStyles: combinedPracticeStylesByName,
        symbolShape: facilitySymbolShape,
        symbolSize: facilitySymbolSize,
        assignmentSource: activeAssignmentSource,
      }),
    );
  }, [
    combinedPracticeStyles,
    facilitySymbolShape,
    facilitySymbolSize,
    layers,
    regions,
  ]);

  const renderPointTooltip = useCallback(() => {
    const formatTooltipRegionName = (name: string | null) =>
      playgroundModeActive ? (name ? stripScenarioRegionPrefix(name) : name) : name;

    pointTooltipIndexRef.current = renderDockedTooltip({
      dom: {
        root: pointTooltipRootRef.current,
        header: pointTooltipHeaderRef.current,
        name: pointTooltipNameRef.current,
        subname: pointTooltipSubnameRef.current,
        context: pointTooltipContextRef.current,
        footer: pointTooltipFooterRef.current,
        page: pointTooltipPageRef.current,
        prev: pointTooltipPrevRef.current,
        next: pointTooltipNextRef.current,
      },
      state: {
        entries: pointTooltipEntriesRef.current,
        index: pointTooltipIndexRef.current,
        boundaryName: selectedBoundaryNameRef.current,
        jmcName: selectedJmcNameRef.current,
      },
      formatRegionLabel: formatTooltipRegionName,
      selectedPointLayer: selectedPointRef.current,
      selectedJmcBoundaryLayer: selectedJmcBoundaryRef.current,
      setSelectedBoundaryForPoint: (entry) => {
        const nextState = syncBoundaryHighlightForPoint({
          entry,
          overlayLayers,
          regionBoundaryRefs: regionBoundaryRefs.current,
          selectedBoundaryLayer: selectedBoundaryRef.current,
        });
        selectedBoundaryNameRef.current = nextState.boundaryName;
        selectedJmcNameRef.current = nextState.jmcName;
      },
      syncSelectedJmcBoundaries: (entry) => {
        const selectedJmcSource = selectedJmcBoundaryRef.current?.getSource();
        if (!selectedJmcSource) return;
        selectedJmcSource.clear();
        const jmcName = entry.jmcName;
        if (jmcName) {
          const selectionColor =
            getRegionGroup(activeViewPreset, jmcName)?.colors.outline ?? '#419632';
          if (
            syncSelectedRegionHighlightFromAvailableSources({
              activeViewPreset,
              preferDerivedOutlineSource: playgroundModeActive,
              selectedRegionId: entry.scenarioRegionId,
              selectedRegionName: jmcName,
              selectionColor,
              currentOutlineFeature: null,
              derivedOutlineSource: scenarioWorkspaceDerivedOutlineSourceRef.current,
              selectedJmcBoundaryLayer: selectedJmcBoundaryRef.current,
            })
          ) {
            return;
          }
          void loadGroupOutlineFeature(activeViewPreset, jmcName, resolveDataUrl).then(
            (outlineFeature) => {
              if (outlineFeature) selectedJmcSource.addFeature(outlineFeature);
            },
          );
        }
      },
      setSelectedBoundaryState: (boundaryName, jmcName) => {
        selectedBoundaryNameRef.current = boundaryName;
        selectedJmcNameRef.current = jmcName;
      },
      createSelectedPointStyle,
    });

    const currentEntry = pointTooltipEntriesRef.current[pointTooltipIndexRef.current];
    if (currentEntry) {
      const rawRegionName =
        selectedJmcNameRef.current ??
        currentEntry.jmcName ??
        layers
          .filter((layer) => layer.type === 'point' && layer.visible)
          .flatMap((layer) => layerRefs.current.get(layer.id)?.getSource()?.getFeatures() ?? [])
          .find((feature) => getFacilityFeatureProperties(feature).id === currentEntry.facilityId)
          ?.get('region') ??
        null;
      const regionName = formatTooltipRegionName(rawRegionName);
      const visiblePointFeatures = layers
        .filter((layer) => layer.type === 'point' && layer.visible)
        .flatMap((layer) => layerRefs.current.get(layer.id)?.getSource()?.getFeatures() ?? []);
      const practiceSummary = buildSelectedFacilityPracticeSummary({
        facilityFeatures: visiblePointFeatures,
        selectedFacilityId: currentEntry.facilityId || null,
      });
      const { facilityPar, practicePar, regionPar, baseportPar, totalPar } =
        buildSelectedFacilityParSummary({
        facilityFeatures: visiblePointFeatures,
        selectedFacilityId: currentEntry.facilityId || null,
        selectedRegionName: rawRegionName,
        activeViewPreset,
        assignmentSource:
          scenarioWorkspaceAssignmentSourceRef.current ??
          getActiveAssignmentLookupSource(
            regionBoundaryRefs.current,
            jmcAssignmentLookupSourceRef.current,
          ),
        });
      setSelection({
        facilityIds: currentEntry.facilityId ? [currentEntry.facilityId] : [],
        boundaryName: selectedBoundaryNameRef.current ?? currentEntry.boundaryName,
        jmcName: selectedJmcNameRef.current ?? currentEntry.jmcName,
        scenarioRegionId: currentEntry.scenarioRegionId,
      });
      setPointTooltipDisplay({
        facilityName: currentEntry.facilityName,
        regionName,
        isCombinedPractice: practiceSummary.isCombinedPractice,
        combinedPracticeName: practiceSummary.combinedPracticeName,
        combinedPracticeMembers: practiceSummary.memberFacilities,
        facilityPar: formatParDisplayValue(facilityPar),
        practicePar: formatParDisplayValue(practicePar),
        regionPar: formatParDisplayValue(regionPar),
        baseportPar: formatParDisplayValue(baseportPar),
        totalPar: formatParDisplayValue(totalPar),
        pageIndex: pointTooltipIndexRef.current,
        pageCount: pointTooltipEntriesRef.current.length,
      });
    } else {
      const rawRegionName = selectedJmcNameRef.current;
      const regionName = formatTooltipRegionName(rawRegionName);
      const visiblePointFeatures = layers
        .filter((layer) => layer.type === 'point' && layer.visible)
        .flatMap((layer) => layerRefs.current.get(layer.id)?.getSource()?.getFeatures() ?? []);
      const { regionPar, baseportPar, totalPar } = buildSelectedFacilityParSummary({
        facilityFeatures: visiblePointFeatures,
        selectedFacilityId: null,
        selectedRegionName: rawRegionName,
        activeViewPreset,
        assignmentSource:
          scenarioWorkspaceAssignmentSourceRef.current ??
          getActiveAssignmentLookupSource(
            regionBoundaryRefs.current,
            jmcAssignmentLookupSourceRef.current,
          ),
      });
      setSelection({
        facilityIds: [],
        boundaryName: selectedBoundaryNameRef.current,
        jmcName: selectedJmcNameRef.current,
        scenarioRegionId: null,
      });
      setPointTooltipDisplay({
        facilityName: null,
        regionName,
        isCombinedPractice: false,
        combinedPracticeName: null,
        combinedPracticeMembers: [],
        facilityPar: null,
        practicePar: null,
        regionPar: formatParDisplayValue(regionPar),
        baseportPar: formatParDisplayValue(baseportPar),
        totalPar: formatParDisplayValue(totalPar),
        pageIndex: 0,
        pageCount: 0,
      });
    }
  }, [
    activeViewPreset,
    facilitySymbolShape,
    facilitySymbolSize,
    layers,
    overlayLayers,
    playgroundModeActive,
    setPointTooltipDisplay,
    setSelection,
  ]);

  const resolveLiveJmcNameAtCoordinate = useCallback(
    (coordinate: [number, number], preset: ViewPresetId) => {
      const assignmentSource =
        scenarioWorkspaceAssignmentSourceRef.current ??
        getActiveAssignmentLookupSource(
          regionBoundaryRefs.current,
          jmcAssignmentLookupSourceRef.current,
        );
      const boundarySource = getActiveBoundarySystemLookupSource(
        boundarySystemLookupSourcesRef.current,
        preset,
      );
      const liveBoundaryFeature = findCareBoardBoundaryAtCoordinate(
        coordinate,
        overlayLayers,
        regionBoundaryRefs.current,
      );
      if (liveBoundaryFeature) {
        const liveBoundaryJmcName = findJmcNameForBoundarySelection(
          liveBoundaryFeature,
          coordinate,
          jmcAssignmentByBoundaryNameRef.current,
          assignmentSource,
          boundarySource,
          preset,
        );
        if (liveBoundaryJmcName) {
          return liveBoundaryJmcName;
        }
      }

      return findJmcNameAtCoordinate(
        coordinate,
        assignmentSource,
        boundarySource,
        preset,
      );
    },
    [overlayLayers],
  );

  useEffect(() => {
    if (!ref.current || mapRef.current) {
      return;
    }

    const shell = initializeMapWorkspaceShell({
      target: ref.current,
      createBasemapLayers,
      setBasemapSources: (layers) =>
        setBasemapSources(layers, initialViewPresetRef.current),
      createSelectedBoundaryLayer,
      createSelectedJmcBoundaryLayer,
      createSelectedPointLayer,
    });
    mapRef.current = shell.map;
    basemapRef.current = shell.basemapLayers;
    selectedBoundaryRef.current = shell.selectedBoundaryLayer;
    selectedJmcBoundaryRef.current = shell.selectedJmcBoundaryLayer;
    selectedPointRef.current = shell.selectedPointLayer;
    const detachZoomStatusControl = attachZoomStatusControl({
      map: shell.map,
      target: ref.current,
      source: shell.basemapLayers.oceanFill.getSource(),
      showDiagnostics: false,
      onViewportChange: setMapViewport,
    });
    const stopInitialUkFit = fitMapToUkExtentOnLoad({
      map: shell.map,
      source: shell.basemapLayers.countryBorders.getSource(),
      target: ref.current,
      getExtent: getUnitedKingdomExtentFromCountrySource,
      loadExtent: () =>
        loadUnitedKingdomExtentFromCountriesUrl(
          getBasemapUrls(initialViewPresetRef.current).countries,
        ),
      onViewportChange: (viewport) => {
        initialViewportReadyRef.current = true;
        setMapViewport(viewport);
      },
      onSettled: () => {
        if (initialMapRevealTimeoutRef.current) {
          clearTimeout(initialMapRevealTimeoutRef.current);
        }
        initialMapRevealTimeoutRef.current = setTimeout(() => {
          setInitialMapReady(true);
          initialMapRevealTimeoutRef.current = null;
        }, 300);
      },
    });

    const boundarySystemLookupDatasets: OverlayLookupDatasetDefinition<BoundarySystemId>[] =
      (Object.keys(BOUNDARY_SYSTEMS) as BoundarySystemId[]).map((boundarySystemId) => {
        const boundarySystem = getBoundarySystem(boundarySystemId);
        const source = new VectorSource({ wrapX: false });
        boundarySystemLookupSourcesRef.current.set(boundarySystem.id, source);
        return {
          key: boundarySystem.id,
          path: boundarySystem.interactionBoundaryPath,
          source,
          errorLabel: `Failed to load ${boundarySystem.id} interaction boundaries`,
        };
      });
    jmcBoundaryLookupSourceRef.current =
      boundarySystemLookupSourcesRef.current.get('legacyIcbHb') ?? null;
    const overlayAssignmentSource = new VectorSource();
    jmcAssignmentLookupSourceRef.current = overlayAssignmentSource;
    const scenarioTopologyEdgeSource = new VectorSource();
    scenarioTopologyEdgeSourceRef.current = scenarioTopologyEdgeSource;
    const scenarioLookupDatasets: OverlayLookupDatasetDefinition<ViewPresetId>[] = [];
    for (const preset of getScenarioWorkspacePresetIds()) {
      const path = getScenarioWorkspaceLookupBoundaryPath(preset);
      if (!path) continue;
      const scenarioLookupSource = new VectorSource();
      scenarioBoundaryLookupSourcesRef.current.set(preset, scenarioLookupSource);
      scenarioLookupDatasets.push({
        key: preset,
        path,
        source: scenarioLookupSource,
        errorLabel: `Failed to load ${preset} scenario outline lookup`,
      });
    }
    const scenarioWorkspaceAssignmentDatasets: OverlayLookupDatasetDefinition<ScenarioWorkspaceId>[] = [];
    const scenarioWorkspaceAssignmentIds: ScenarioWorkspaceId[] = [
      ...getInteractiveScenarioWorkspaceIds(),
      ...getScenarioWorkspacePresetIds(),
    ];
    for (const workspaceId of scenarioWorkspaceAssignmentIds) {
      const path = getScenarioWorkspaceAssignmentDatasetPath(workspaceId);
      if (!path) continue;
      const source = new VectorSource();
      scenarioWorkspaceBaselineDatasetSourcesRef.current.set(workspaceId, source);
      scenarioWorkspaceAssignmentDatasets.push({
        key: workspaceId,
        path,
        source,
        errorLabel: `Failed to load ${workspaceId} scenario assignment source`,
      });
    }
    void loadOverlayLookupDatasets({
      datasets: [
        ...boundarySystemLookupDatasets,
        {
          key: 'scenarioTopologyEdges',
          path: resolveRuntimeMapProductPath(
            'data/regions/UK_Health_Board_2026_topology_edges.geojson',
          ),
          source: scenarioTopologyEdgeSource,
          errorLabel: 'Failed to load 2026 topology edges for Playground outlines',
        },
        ...scenarioLookupDatasets,
        ...scenarioWorkspaceAssignmentDatasets,
      ],
      resolveUrl: resolveDataUrl,
      onError: (message, error) => {
        console.error(message, error);
      },
    }).then(() => {
      setScenarioWorkspaceBaselineSourcesVersion((version) => version + 1);
    });
    void loadOverlayAssignmentDataset({
      dataset: {
        path: resolveRuntimeMapProductPath('data/regions/UK_JMC_Board_simplified.geojson'),
        source: overlayAssignmentSource,
        errorLabel: 'Failed to load JMC assignment lookup',
      },
      resolveUrl: resolveDataUrl,
      getBoundaryName: (feature) => String(feature.get('boundary_name') ?? ''),
      getAssignmentName: (feature) =>
        String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim(),
      onError: (message, error) => {
        console.error(message, error);
      },
    }).then((assignmentMap) => {
      jmcAssignmentByBoundaryNameRef.current = assignmentMap;
    });
    const baselineDatasetSources = scenarioWorkspaceBaselineDatasetSourcesRef.current;

    return () => {
      stopInitialUkFit();
      detachZoomStatusControl();
      cleanupMapWorkspaceRefs({
        mapRef,
        basemapRef,
        regionBoundaryRefs,
        regionBoundaryPathRefs,
        selectedBoundaryRef,
        selectedJmcBoundaryRef,
        selectedPointRef,
        boundarySystemLookupSourcesRef,
        jmcBoundaryLookupSourceRef,
        scenarioBoundaryLookupSourcesRef,
        jmcAssignmentLookupSourceRef,
        scenarioWorkspaceAssignmentSourceRef,
        scenarioWorkspaceBaselineAssignmentSourceRef,
        scenarioTopologyEdgeSourceRef,
        scenarioWorkspaceDerivedOutlineSourceRef,
        presetGroupOutlineSourceRef,
        jmcAssignmentByBoundaryNameRef,
        scenarioWorkspaceAssignmentByBoundaryNameRef,
        pointTooltipRootRef,
        pointTooltipHeaderRef,
        pointTooltipNameRef,
        pointTooltipSubnameRef,
        pointTooltipContextRef,
        pointTooltipFooterRef,
        pointTooltipPageRef,
        pointTooltipPrevRef,
        pointTooltipNextRef,
        pointTooltipEntriesRef,
        pointTooltipIndexRef,
        selectedBoundaryNameRef,
        selectedJmcNameRef,
        layerRefs,
      });
      initialViewportReadyRef.current = false;
      if (initialMapRevealTimeoutRef.current) {
        clearTimeout(initialMapRevealTimeoutRef.current);
        initialMapRevealTimeoutRef.current = null;
      }
      setInitialMapReady(false);
      baselineDatasetSources.clear();
    };
  }, [setMapViewport]);

  useEffect(() => {
    const mapCanvas = ref.current;
    const brandPane = document.querySelector<HTMLElement>('.topbar__pane--brand');
    if (!mapCanvas || !brandPane) {
      return;
    }

    const rootStyle = window.getComputedStyle(document.documentElement);
    const rootFontSizePx = Number.parseFloat(rootStyle.fontSize) || 16;
    const defaultSpaceRem =
      Number.parseFloat(rootStyle.getPropertyValue('--space-1')) || 0.75;
    const defaultGapPx = defaultSpaceRem * rootFontSizePx;

    const applyZoomControlWidth = () => {
      const brandPaneWidth = brandPane.getBoundingClientRect().width;
      const nextWidth = Math.max(
        rootFontSizePx * 2.5,
        brandPaneWidth - (defaultGapPx * 2),
      );
      mapCanvas.style.setProperty('--map-zoom-control-width', `${nextWidth}px`);
    };

    applyZoomControlWidth();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        mapCanvas.style.removeProperty('--map-zoom-control-width');
      };
    }

    const resizeObserver = new ResizeObserver(() => {
      applyZoomControlWidth();
    });
    resizeObserver.observe(brandPane);

    return () => {
      resizeObserver.disconnect();
      mapCanvas.style.removeProperty('--map-zoom-control-width');
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || splitInternalArcLayerRef.current) {
      return;
    }

    const layer = new VectorLayer({
      source: new VectorSource({
        url: resolveDataUrl(resolveRuntimeMapProductPath('data/regions/UK_WardSplit_internal_arcs.geojson')),
        format: new GeoJSON(),
        wrapX: false,
      }),
      style: createSplitInternalArcStyle(
        overlayLayers.find((layer) => layer.id === 'englandIcb') ?? {
          id: 'englandIcb',
          name: 'Pre-2026 NHS England ICBs',
          path: '',
          family: 'englandIcb',
          visible: false,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0.14,
          swatchColor: '#8f8f8f',
        },
        regionGroupOverrides,
      ),
      zIndex: 6.1,
    });
    splitInternalArcLayerRef.current = layer;
    map.addLayer(layer);

    return () => {
      if (splitInternalArcLayerRef.current) {
        map.removeLayer(splitInternalArcLayerRef.current);
        splitInternalArcLayerRef.current = null;
      }
    };
  }, [overlayLayers, regionGroupOverrides]);

  useEffect(() => {
    const map = mapRef.current;
    if (
      !map ||
      !waterEdgeTreatmentActive ||
      englandWaterEdgeLayerRef.current ||
      devolvedWaterEdgeLayerRef.current ||
      selectedWaterEdgeLayerRef.current
    ) {
      return;
    }

    const initialPath =
      activeViewPreset === 'current'
        ? resolveRuntimeMapProductPath('data/regions/UK_ICB_LHB_v10_water_edge_classes.geojson')
        : resolveRuntimeMapProductPath('data/regions/UK_Health_Board_2026_water_edge_classes.geojson');

    const seaMaskColor = basemap.showSeaFill
      ? withOpacity(basemap.seaFillColor, basemap.seaFillOpacity)
      : 'rgba(0, 0, 0, 0)';
    const englandLayer = new VectorLayer({
      source: new VectorSource({
        url: resolveDataUrl(initialPath),
        format: new GeoJSON(),
        wrapX: false,
      }),
      style: createWaterEdgeBorderModifierStyle(
        activeViewPreset,
        'englandIcb',
        regionBoundaryRefs.current,
        regionGroupOverrides,
        seaMaskColor,
      ),
      zIndex: 6.05,
    });
    const devolvedLayer = new VectorLayer({
      source: new VectorSource({
        url: resolveDataUrl(initialPath),
        format: new GeoJSON(),
        wrapX: false,
      }),
      style: createWaterEdgeBorderModifierStyle(
        activeViewPreset,
        'devolvedHb',
        regionBoundaryRefs.current,
        regionGroupOverrides,
        seaMaskColor,
      ),
      zIndex: 6.04,
    });
    const selectedLayer = new VectorLayer({
      source: new VectorSource({
        url: resolveDataUrl(initialPath),
        format: new GeoJSON(),
        wrapX: false,
      }),
      style: createSelectedWaterEdgeModifierStyle(
        null,
        seaMaskColor,
      ),
      zIndex: 25.1,
    });

    englandWaterEdgeLayerRef.current = englandLayer;
    devolvedWaterEdgeLayerRef.current = devolvedLayer;
    selectedWaterEdgeLayerRef.current = selectedLayer;
    map.addLayer(englandLayer);
    map.addLayer(devolvedLayer);
    map.addLayer(selectedLayer);

    return () => {
      if (englandWaterEdgeLayerRef.current) {
        map.removeLayer(englandWaterEdgeLayerRef.current);
        englandWaterEdgeLayerRef.current = null;
      }
      if (devolvedWaterEdgeLayerRef.current) {
        map.removeLayer(devolvedWaterEdgeLayerRef.current);
        devolvedWaterEdgeLayerRef.current = null;
      }
      if (selectedWaterEdgeLayerRef.current) {
        map.removeLayer(selectedWaterEdgeLayerRef.current);
        selectedWaterEdgeLayerRef.current = null;
      }
    };
  }, [
    activeViewPreset,
    overlayLayers,
    basemap.seaFillColor,
    basemap.seaFillOpacity,
    basemap.showSeaFill,
    regionGroupOverrides,
    waterEdgeTreatmentActive,
  ]);

  useEffect(() => {
    loadLayers().catch((error) => {
      console.error('Failed to load layers', error);
    });
  }, [loadLayers]);

  useLayoutEffect(() => {
    if (!mapRef.current) {
      return;
    }

    resetTransientMapSelectionState({
      selectedBoundaryRef,
      selectedJmcBoundaryRef,
      selectedPointRef,
      pointTooltipRootRef,
      pointTooltipNameRef,
      pointTooltipSubnameRef,
      pointTooltipContextRef,
      pointTooltipFooterRef,
      pointTooltipPageRef,
      pointTooltipPrevRef,
      pointTooltipNextRef,
      pointTooltipEntriesRef,
      pointTooltipIndexRef,
      selectedBoundaryNameRef,
      selectedJmcNameRef,
    });
    selectedJmcOutlineRequestRef.current += 1;
    setScenarioAssignmentPopover(null);
    selectScenarioWorkspaceBoundaryUnit(null);
    setSelection({
      facilityIds: [],
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
    });
    setPointTooltipDisplay({
      facilityName: null,
      regionName: null,
      isCombinedPractice: false,
      combinedPracticeName: null,
      combinedPracticeMembers: [],
      facilityPar: null,
      practicePar: null,
      regionPar: null,
      baseportPar: null,
      totalPar: null,
      pageIndex: 0,
      pageCount: 0,
    });
  }, [
    activeViewPreset,
    activeScenarioWorkspaceId,
    selectScenarioWorkspaceBoundaryUnit,
    setPointTooltipDisplay,
    setSelection,
  ]);

  useEffect(() => {
    if (!pointTooltipPageRequestDirection) {
      return;
    }

    if (pointTooltipPageRequestDirection < 0) {
      if (pointTooltipIndexRef.current > 0) {
        pointTooltipIndexRef.current -= 1;
        renderPointTooltip();
      }
    } else if (pointTooltipIndexRef.current < pointTooltipEntriesRef.current.length - 1) {
      pointTooltipIndexRef.current += 1;
      renderPointTooltip();
    }

    clearPointTooltipPageRequest();
  }, [
    clearPointTooltipPageRequest,
    pointTooltipPageRequestDirection,
    pointTooltipPageRequestNonce,
    renderPointTooltip,
  ]);

  useEffect(() => {
    if (!facilitySelectionRequestId) {
      return;
    }

    const map = mapRef.current;
    if (!map) {
      clearFacilitySelectionRequest();
      return;
    }

    const pointLayers = new Set<VectorLayer<VectorSource>>();

    for (const layer of layers) {
      if (layer.type !== 'point' || !layer.visible) {
        continue;
      }

      const pointLayer = layerRefs.current.get(layer.id);
      if (pointLayer) {
        pointLayers.add(pointLayer);
      }
    }

    let targetCoordinate: [number, number] | null = null;

    for (const pointLayer of pointLayers) {
      const feature = pointLayer
        .getSource()
        ?.getFeatures()
        .find(
          (candidate) =>
            getFacilityFeatureProperties(candidate).id === facilitySelectionRequestId,
        );

      if (!feature) {
        continue;
      }

      targetCoordinate = getPointCoordinate(feature);
      if (targetCoordinate) {
        break;
      }
    }

    if (!targetCoordinate) {
      clearFacilitySelectionRequest();
      return;
    }

    const selectionResult = resolveSingleClickSelection({
      map,
      pixel: map.getPixelFromCoordinate(targetCoordinate),
      coordinate: targetCoordinate,
      layers,
      regions,
      overlayLayers,
      layerRefs: layerRefs.current,
      regionBoundaryRefs: regionBoundaryRefs.current,
      combinedPracticeStylesByName: new Map(
        combinedPracticeStyles.map((practice) => [practice.name, practice]),
      ),
      facilitySymbolShape,
      facilitySymbolSize,
      facilityFilters,
      assignmentSource: playgroundModeActive
        ? null
        : scenarioWorkspaceAssignmentSourceRef.current,
      scenarioAssignmentSource:
        scenarioWorkspaceAssignmentSourceRef.current ??
        getActiveAssignmentLookupSource(
          regionBoundaryRefs.current,
          jmcAssignmentLookupSourceRef.current,
        ),
      activeViewPreset,
      getJmcNameAtCoordinate: resolveLiveJmcNameAtCoordinate,
    });

    if (selectionResult.pointEntries.length > 0) {
      setScenarioAssignmentPopover(null);
      if (playgroundModeActive) {
        selectScenarioWorkspaceBoundaryUnit(null);
      }
      pointTooltipEntriesRef.current = prioritizePointTooltipEntries(
        selectionResult.pointEntries,
        facilitySelectionRequestId,
      );
      pointTooltipIndexRef.current = 0;
      renderPointTooltip();
    }

    clearFacilitySelectionRequest();
  }, [
    activeViewPreset,
    clearFacilitySelectionRequest,
    facilityFilters,
    facilitySelectionRequestId,
    facilitySelectionRequestNonce,
    facilitySymbolShape,
    facilitySymbolSize,
    layers,
    overlayLayers,
    playgroundModeActive,
    regionBoundaryRefs,
    regions,
    renderPointTooltip,
    resolveLiveJmcNameAtCoordinate,
    selectScenarioWorkspaceBoundaryUnit,
  ]);

  useEffect(() => {
    let cancelled = false;
    const presetConfig = getScenarioPresetConfig(activeViewPreset);
    const groupNames = presetConfig?.regionGroups.map((group) => group.name) ?? [];
    if (groupNames.length === 0) {
      presetGroupOutlineSourceRef.current = null;
      setPresetGroupOutlineSourceVersion((version) => version + 1);
      return;
    }

    void loadGroupOutlineFeatures(activeViewPreset, groupNames, resolveDataUrl).then(
      (features) => {
        if (cancelled) {
          return;
        }
        const source = new VectorSource();
        source.addFeatures(features);
        presetGroupOutlineSourceRef.current = source;
        setPresetGroupOutlineSourceVersion((version) => version + 1);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [activeViewPreset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !initialViewportReadyRef.current) return;
    syncViewportToMap(map, mapViewport);
  }, [mapViewport]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const moveKey: EventsKey = map.on('moveend', () => {
      setMapViewport(getViewportFromMap(map));
    });

    return () => {
      unByKey(moveKey);
    };
  }, [setMapViewport]);

  useEffect(() => {
    const basemapLayers = basemapRef.current;
    if (!basemapLayers) return;
    const urls = getBasemapUrls(activeViewPreset);
    if (basemap.showSeaLabels) {
      ensureVectorSource(basemapLayers.seaLabels, urls.marineLabels);
    }
    if (basemap.showMajorCities) {
      ensureVectorSource(basemapLayers.majorCities, urls.populatedPlaces);
    }

    basemapLayers.oceanFill.setStyle(
      createFillStyle(
        withOpacity(basemap.seaFillColor, basemap.seaFillOpacity),
      ),
    );
    const ukSeaColor = basemap.showSeaFill
      ? withOpacity(basemap.seaFillColor, basemap.seaFillOpacity)
      : 'rgba(0, 0, 0, 0)';
    basemapLayers.landFill.setStyle(
      createLandFillStyle(
        withOpacity(basemap.landFillColor, basemap.landFillOpacity),
      ),
    );
    basemapLayers.ukAlignmentMask.setStyle(createSeaPatchStyle(ukSeaColor));
    basemapLayers.ukAlignedLandFill.setStyle(
      createLandFillStyle(
        withOpacity(basemap.landFillColor, basemap.landFillOpacity),
      ),
    );
    basemapLayers.oceanFill.setVisible(basemap.showSeaFill);
    basemapLayers.landFill.setVisible(basemap.showLandFill);
    const ukAlignedLandVisible =
      basemap.showLandFill && basemap.landFillOpacity > 0;
    basemapLayers.ukAlignmentMask.setVisible(
      basemap.showSeaFill && basemap.seaFillOpacity > 0,
    );
    basemapLayers.ukAlignedLandFill.setVisible(ukAlignedLandVisible);
    const bordersVisible = false;
    basemapLayers.countryBorders.setVisible(bordersVisible);
    basemapLayers.ukInternalBorders.setVisible(bordersVisible);
    basemapLayers.countryLabels.setVisible(basemap.showCountryLabels);
    basemapLayers.majorCities.setVisible(basemap.showMajorCities);
    basemapLayers.seaLabels.setVisible(basemap.showSeaLabels);
    basemapLayers.countryBorders.setStyle(createCountryBorderStyle(basemap));
    basemapLayers.ukInternalBorders.setStyle(createCountryBorderStyle(basemap));
    basemapLayers.countryLabels.setStyle(createCountryLabelStyle(basemap));
    basemapLayers.seaLabels.setStyle(createSeaLabelStyle(basemap));
    basemapLayers.majorCities.setStyle(createMajorCityStyle(basemap));
  }, [activeViewPreset, basemap]);

  useEffect(() => {
    const basemapLayers = basemapRef.current;
    if (!basemapLayers) return;

    setUkAlignmentSources(basemapLayers, activeViewPreset);
  }, [activeViewPreset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const preloadedWorkspaceAssignmentSource = activeScenarioWorkspaceId
      ? scenarioWorkspaceBaselineDatasetSourcesRef.current.get(
          activeScenarioWorkspaceId,
        ) ?? null
      : null;
    const liveAssignmentSource = getActiveAssignmentLookupSource(
      regionBoundaryRefs.current,
      jmcAssignmentLookupSourceRef.current,
    );
    const liveAssignmentPath = regionBoundaryPathRefs.current.get('regionFill') ?? null;
    const scenarioTopologyEdgeSource =
      activeViewPreset === 'current'
        ? null
        : scenarioTopologyEdgeSourceRef.current;
    const runtimeSession = buildPlaygroundRuntimeSession({
      workspaceId: activeScenarioWorkspaceId,
      runtimeActive: scenarioWorkspaceRuntimeActive,
      baselineAssignmentKind: activeScenarioWorkspaceBaselineAssignmentKind,
      preloadedAssignmentSource: preloadedWorkspaceAssignmentSource,
      liveAssignmentSource,
      liveAssignmentPath,
      currentBaselineAssignmentSource:
        scenarioWorkspaceBaselineAssignmentSourceRef.current,
      draft: activeScenarioWorkspaceDraft,
      topologyEdgeSource: scenarioTopologyEdgeSource,
      presetGroupOutlineSource: presetGroupOutlineSourceRef.current,
    });

    scenarioWorkspaceBaselineAssignmentSourceRef.current =
      runtimeSession.baselineAssignmentSource;
    scenarioWorkspaceAssignmentSourceRef.current =
      runtimeSession.runtimeState.assignmentSource;
    scenarioWorkspaceDerivedOutlineSourceRef.current =
      runtimeSession.derivedOutlineSource;
    scenarioWorkspaceAssignmentByBoundaryNameRef.current =
      runtimeSession.runtimeState.assignmentByBoundaryName;

    if (typeof window !== 'undefined') {
      const diagnosticsSnapshot = runtimeSession.diagnosticsSnapshot;
      if (diagnosticsSnapshot) {
        window.__dmsGISPlaygroundDiagnostics = diagnosticsSnapshot;
        const history = window.__dmsGISPlaygroundDiagnosticsHistory ?? [];
        window.__dmsGISPlaygroundDiagnosticsHistory = [
          ...history.slice(-9),
          diagnosticsSnapshot,
        ];
      } else {
        window.__dmsGISPlaygroundDiagnostics = null;
      }
    }

    const populatedCodes = buildEffectivePopulatedCodes(
      populatedV10Codes,
      populated2026Codes,
    );
    reconcileOverlayBoundaryLayers({
      map,
      overlayLayers,
      activeViewPreset,
      regionBoundaryRefs: regionBoundaryRefs.current,
      regionBoundaryPathRefs: regionBoundaryPathRefs.current,
      runtimeSourceOverrides: runtimeSession.runtimeSourceOverrides,
      populatedCodes,
      groupOverrides: regionGroupOverrides,
      createBoundaryLayer: createRegionBoundaryLayer,
      getBoundaryLayerStyle: createRegionBoundaryStyle,
    });
  }, [
    overlayLayers,
    activeViewPreset,
    activeScenarioWorkspaceId,
    activeScenarioWorkspaceDraft,
    scenarioWorkspaceRuntimeActive,
    activeScenarioWorkspaceBaselineAssignmentKind,
    scenarioWorkspaceBaselineSourcesVersion,
    presetGroupOutlineSourceVersion,
    populatedV10Codes,
    populated2026Codes,
    regionGroupOverrides,
  ]);

  useEffect(() => {
    const splitInternalArcLayer = splitInternalArcLayerRef.current;
    const englandWaterEdgeLayer = englandWaterEdgeLayerRef.current;
    const devolvedWaterEdgeLayer = devolvedWaterEdgeLayerRef.current;
    const selectedWaterEdgeLayer = selectedWaterEdgeLayerRef.current;
    if (!splitInternalArcLayer) {
      return;
    }

    const englandIcbLayer = overlayLayers.find((layer) => layer.id === 'englandIcb');
    const devolvedHbLayer = overlayLayers.find((layer) => layer.id === 'devolvedHb');
    const englandIcbVisible = englandIcbLayer
      ? (englandIcbLayer.visible || englandIcbLayer.borderVisible)
      : false;
    const devolvedHbVisible = devolvedHbLayer
      ? (devolvedHbLayer.visible || devolvedHbLayer.borderVisible)
      : false;
    splitInternalArcLayer.setVisible(activeViewPreset === 'current' && englandIcbVisible);
    if (englandIcbLayer) {
      splitInternalArcLayer.setStyle(
        createSplitInternalArcStyle(englandIcbLayer, regionGroupOverrides),
      );
    }

    if (!waterEdgeTreatmentActive) {
      englandWaterEdgeLayer?.setVisible(false);
      devolvedWaterEdgeLayer?.setVisible(false);
      selectedWaterEdgeLayer?.setVisible(false);
      return;
    }

    const waterEdgePath =
      activeViewPreset === 'current'
        ? resolveRuntimeMapProductPath('data/regions/UK_ICB_LHB_v10_water_edge_classes.geojson')
        : resolveRuntimeMapProductPath('data/regions/UK_Health_Board_2026_water_edge_classes.geojson');
    const seaMaskColor = basemap.showSeaFill
      ? withOpacity(basemap.seaFillColor, basemap.seaFillOpacity)
      : 'rgba(0, 0, 0, 0)';

    if (englandWaterEdgeLayer) {
      englandWaterEdgeLayer.setVisible(englandIcbVisible);
      englandWaterEdgeLayer.setSource(
        new VectorSource({
          url: resolveDataUrl(waterEdgePath),
          format: new GeoJSON(),
          wrapX: false,
        }),
      );
      if (englandIcbLayer) {
        englandWaterEdgeLayer.setStyle(
          createWaterEdgeBorderModifierStyle(
            activeViewPreset,
            'englandIcb',
            regionBoundaryRefs.current,
            regionGroupOverrides,
            seaMaskColor,
          ),
        );
      }
    }

    if (devolvedWaterEdgeLayer) {
      devolvedWaterEdgeLayer.setVisible(devolvedHbVisible);
      devolvedWaterEdgeLayer.setSource(
        new VectorSource({
          url: resolveDataUrl(waterEdgePath),
          format: new GeoJSON(),
          wrapX: false,
        }),
      );
      if (devolvedHbLayer) {
        devolvedWaterEdgeLayer.setStyle(
          createWaterEdgeBorderModifierStyle(
            activeViewPreset,
            'devolvedHb',
            regionBoundaryRefs.current,
            regionGroupOverrides,
            seaMaskColor,
          ),
        );
      }
    }

    if (selectedWaterEdgeLayer) {
      selectedWaterEdgeLayer.setVisible(!!selectedJmcNameRef.current);
      selectedWaterEdgeLayer.setSource(
        selectedJmcNameRef.current
          ? new VectorSource({
              url: resolveDataUrl(
                getGroupInlandWaterOutlinePath(activeViewPreset, selectedJmcNameRef.current),
              ),
              format: new GeoJSON(),
              wrapX: false,
            })
          : new VectorSource({ wrapX: false }),
      );
      selectedWaterEdgeLayer.setStyle(
        createSelectedWaterEdgeModifierStyle(
          selectedJmcNameRef.current
            ? getRegionGroup(activeViewPreset, selectedJmcNameRef.current)?.colors.outline ??
                '#419632'
            : null,
          seaMaskColor,
        ),
      );
    }
  }, [
    activeViewPreset,
    overlayLayers,
    regionGroupOverrides,
    basemap.seaFillColor,
    basemap.seaFillOpacity,
    basemap.showSeaFill,
    selection.jmcName,
    waterEdgeTreatmentActive,
  ]);

  useEffect(() => {
    renderPointTooltip();
  }, [renderPointTooltip]);

  useEffect(() => {
    if (!playgroundModeActive) {
      setScenarioAssignmentPopover(null);
      return;
    }

    if (!scenarioAssignmentPopover) {
      return;
    }

    const liveFeature = getEditableBoundaryFeature(
      scenarioAssignmentPopover.boundaryUnitId,
    );
    if (!liveFeature) {
      return;
    }

    const selectedRegionName =
      activeScenarioWorkspaceBaseline?.regions.find(
        (region) =>
          region.id ===
          resolvePlaygroundEditorRegionId({
            scenarioWorkspaceEditor,
            scenarioAssignmentPopover,
          }),
      )?.label ?? null;
    const selectedRegionId = resolvePlaygroundEditorRegionId({
      scenarioWorkspaceEditor,
      scenarioAssignmentPopover,
    });

    selectBoundary(liveFeature, scenarioAssignmentPopover.coordinate, {
      scenarioRegionId: selectedRegionId,
      regionName: selectedRegionName,
    });
  }, [
    playgroundModeActive,
    activeScenarioWorkspaceBaseline,
    getEditableBoundaryFeature,
    scenarioAssignmentPopover,
    scenarioWorkspaceEditor,
    selectBoundary,
  ]);

  useEffect(() => {
    if (!playgroundModeActive) {
      return;
    }

    const { selectedRegionId, selectedRegionName } = resolvePlaygroundSelectedRegion({
      selection,
      scenarioWorkspaceEditor,
      scenarioAssignmentPopover,
      regions: activeScenarioWorkspaceBaseline?.regions ?? null,
    });
    const selectionColor = selectedRegionName
      ? getRegionGroup(activeViewPreset, selectedRegionName)?.colors.outline ?? '#419632'
      : null;

    syncSelectedRegionHighlightFromDerivedSource({
      selectedRegionId,
      selectedRegionName,
      selectionColor,
      derivedOutlineSource: scenarioWorkspaceDerivedOutlineSourceRef.current,
      selectedJmcBoundaryLayer: selectedJmcBoundaryRef.current,
    });
  }, [
    playgroundModeActive,
    activeViewPreset,
    activeScenarioWorkspaceBaseline,
    selection,
    scenarioAssignmentPopover,
    scenarioWorkspaceEditor,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const clickKey: EventsKey = map.on('singleclick', (event) => {
      const selectionResult = resolveSingleClickSelection({
        map,
        pixel: event.pixel,
        coordinate: event.coordinate as [number, number],
        layers,
        regions,
        overlayLayers,
        layerRefs: layerRefs.current,
        regionBoundaryRefs: regionBoundaryRefs.current,
        combinedPracticeStylesByName: new Map(
          combinedPracticeStyles.map((practice) => [practice.name, practice]),
        ),
        facilitySymbolShape,
        facilitySymbolSize,
        facilityFilters,
        assignmentSource: playgroundModeActive
          ? null
          : scenarioWorkspaceAssignmentSourceRef.current,
        scenarioAssignmentSource:
          scenarioWorkspaceAssignmentSourceRef.current ??
          getActiveAssignmentLookupSource(
            regionBoundaryRefs.current,
            jmcAssignmentLookupSourceRef.current,
          ),
        activeViewPreset,
        getJmcNameAtCoordinate: resolveLiveJmcNameAtCoordinate,
      });

      if (selectionResult.pointEntries.length > 0) {
        setScenarioAssignmentPopover(null);
        if (playgroundModeActive) {
          selectScenarioWorkspaceBoundaryUnit(null);
        }
        pointTooltipEntriesRef.current = selectionResult.pointEntries;
        pointTooltipIndexRef.current = 0;
        renderPointTooltip();
        return;
      }

      selectBoundary(
        selectionResult.boundaryFeature,
        event.coordinate as [number, number],
      );
      if (
        playgroundModeActive &&
        isDphcEstimateCoaPlaygroundWorkspaceId(activeScenarioWorkspaceId) &&
        selectionResult.boundaryFeature
      ) {
        const boundaryProperties =
          selectionResult.boundaryFeature.getProperties() as Record<string, unknown>;
        const boundaryUnitId = getScenarioBoundaryUnitId(boundaryProperties);
        if (boundaryUnitId) {
          const selectedRegionId = resolveScenarioWorkspaceRegionIdForRecord(
            activeScenarioWorkspaceId,
            boundaryProperties,
          );
          selectScenarioWorkspaceBoundaryUnit(boundaryUnitId, selectedRegionId);
          setScenarioAssignmentPopover({
            boundaryUnitId,
            boundaryName:
              String(boundaryProperties.boundary_name ?? '').trim() ||
              'Selected boundary',
            coordinate: event.coordinate as [number, number],
            selectedRegionId,
          });
        } else {
          setScenarioAssignmentPopover(null);
        }
      } else {
        setScenarioAssignmentPopover(null);
      }
      pointTooltipEntriesRef.current = [];
      pointTooltipIndexRef.current = 0;
      renderPointTooltip();
    });

    return () => {
      unByKey(clickKey);
    };
  }, [
    overlayLayers,
    layers,
    regions,
    facilitySymbolShape,
    facilitySymbolSize,
    facilityFilters,
    activeScenarioWorkspaceDraft,
    activeScenarioWorkspaceId,
    activeViewPreset,
    playgroundModeActive,
    renderPointTooltip,
    resolveLiveJmcNameAtCoordinate,
    selectScenarioWorkspaceBoundaryUnit,
    selectBoundary,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const regionByName = new Map<string, RegionStyle>(
      regions.map((region) => [region.name, region]),
    );
    const combinedPracticeStylesByName = new Map<string, CombinedPracticeStyle>(
      combinedPracticeStyles.map((practice) => [practice.name, practice]),
    );
    reconcileRuntimeLayers({
      map,
      layers,
      layerRefs: layerRefs.current,
        getLayerStyle: (layer) =>
        getStyleForLayer(
          layer,
          regionByName,
          combinedPracticeStylesByName,
          facilitySymbolShape,
          facilitySymbolSize,
          facilityFilterDefinitions,
          playgroundModeActive ? null : scenarioWorkspaceAssignmentSourceRef.current,
        ),
    });
  }, [
    layers,
    regions,
    combinedPracticeStyles,
    facilitySymbolShape,
    facilitySymbolSize,
    facilityFilterDefinitions,
    playgroundModeActive,
  ]);

  return (
    <main className="map-panel">
      <div
        className={`map-panel__inner${initialMapReady ? '' : ' map-panel__inner--initializing'}`}
        style={mapShellStyle}
      >
        <div
          className="map-tooltip-card map-tooltip-card--dock map-tooltip-card--hidden"
          ref={pointTooltipRootRef}
        >
          <div className="map-tooltip-card__header" ref={pointTooltipHeaderRef}>
            <div className="map-tooltip-card__name" ref={pointTooltipNameRef} />
            <div
              className="map-tooltip-card__footer map-tooltip-card__footer--hidden"
              ref={pointTooltipFooterRef}
            >
              <button
                type="button"
                className="map-tooltip-card__nav"
                ref={pointTooltipPrevRef}
                aria-label="Previous facility"
                onClick={() => {
                  if (pointTooltipIndexRef.current <= 0) return;
                  pointTooltipIndexRef.current -= 1;
                  renderPointTooltip();
                }}
              >
                {'<'}
              </button>
              <span className="map-tooltip-card__page" ref={pointTooltipPageRef} />
              <button
                type="button"
                className="map-tooltip-card__nav"
                ref={pointTooltipNextRef}
                aria-label="Next facility"
                onClick={() => {
                  if (
                    pointTooltipIndexRef.current >=
                    pointTooltipEntriesRef.current.length - 1
                  ) {
                    return;
                  }
                  pointTooltipIndexRef.current += 1;
                  renderPointTooltip();
                }}
              >
                {'>'}
              </button>
            </div>
          </div>
          <div
            className="map-tooltip-card__context map-tooltip-card__context--hidden"
            ref={pointTooltipContextRef}
          />
          <div
            className="map-tooltip-card__subname map-tooltip-card__subname--hidden"
            ref={pointTooltipSubnameRef}
          />
        </div>
        {playgroundModeActive &&
        activeScenarioWorkspaceBaseline &&
        scenarioAssignmentPopover ? (
          <ScenarioAssignmentPopover
            boundaryName={scenarioAssignmentPopover.boundaryName}
            regions={activeScenarioWorkspaceBaseline.regions}
            selectedRegionId={
              scenarioWorkspaceEditor.pendingScenarioRegionId ??
              scenarioAssignmentPopover.selectedRegionId
            }
            onSelectRegion={(scenarioRegionId) => {
              if (!activeScenarioWorkspaceId) {
                return;
              }
              assignScenarioWorkspaceBoundaryUnit(
                activeScenarioWorkspaceId,
                scenarioAssignmentPopover.boundaryUnitId,
                scenarioRegionId,
              );
              setScenarioAssignmentPopover(null);
              selectScenarioWorkspaceBoundaryUnit(null);
            }}
            onClose={() => {
              setScenarioAssignmentPopover(null);
              selectScenarioWorkspaceBoundaryUnit(null);
            }}
          />
        ) : null}
        <div
          className={`map-canvas${initialMapReady ? '' : ' map-canvas--initializing'}`}
          ref={ref}
          style={mapShellStyle}
        />
      </div>
    </main>
  );
}
function createSelectedBoundaryLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: new Style({
      stroke: new Stroke({
        color: '#fffb00',
        width: 2,
        lineDash: [10, 8],
        lineCap: 'round',
        lineJoin: 'round',
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0)',
      }),
    }),
    zIndex: 30,
  });
}

function createSelectedJmcBoundaryLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: (feature) =>
      new Style({
        stroke: new Stroke({
          color: String(feature.get('selectionColor') ?? '#419632'),
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0)',
        }),
      }),
    zIndex: 25,
  });
}

function createSelectedPointLayer(): VectorLayer<VectorSource> {
  return new VectorLayer({
    source: new VectorSource({ wrapX: false }),
    style: createEmptySelectedPointStyle(),
    zIndex: 40,
  });
}

function createEmptySelectedPointStyle(): Style {
  return new Style({
    image: createPointSymbol('circle', 6, 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 0),
  });
}

function createEstimatedSelectedPointStyle(entry: PointTooltipEntry): Style[] {
  const estimatedPresentation: ResolvedPointPresentation = {
    shape: entry.symbolShape,
    size: entry.symbolSize,
    fillColor: 'rgba(0, 0, 0, 0)',
    borderColor: 'rgba(0, 0, 0, 0)',
    borderWidth: entry.hasVisibleBorder ? 1 : 0,
    baseShapeInset: 0,
    outerRingColor: entry.hasCombinedPracticeRing ? '#000000' : undefined,
    outerRingGap: 0,
    outerRingWidth: entry.hasCombinedPracticeRing ? 1 : 0,
    outerRingPlacement: entry.hasVisibleBorder ? 'inside' : 'outside',
  };

  return createSelectedPointStylesFromPresentation(estimatedPresentation);
}

function createSelectedPointStylesFromPresentation(
  presentation: ResolvedPointPresentation,
): Style[] {
  const highlightStyle = new Style({
    image: createPointSymbol(
      presentation.shape,
      presentation.size,
      'rgba(0, 0, 0, 0)',
      'rgba(0, 0, 0, 0)',
      0,
      {
        outerRingColor: '#fffb00',
        outerRingGap: getPointPresentationOuterDistance(presentation),
        outerRingWidth: 2,
        baseShapeInset: presentation.baseShapeInset,
      },
    ),
    zIndex: 0,
  });
  const pointStyle = new Style({
    image: createPointSymbol(
      presentation.shape,
      presentation.size,
      presentation.fillColor,
      presentation.borderColor,
      presentation.borderWidth,
      {
        outerRingColor: presentation.outerRingColor,
        outerRingGap: presentation.outerRingGap,
        outerRingWidth: presentation.outerRingWidth,
        outerRingPlacement: presentation.outerRingPlacement,
        baseShapeInset: presentation.baseShapeInset,
      },
    ),
    zIndex: 1,
  });

  return [highlightStyle, pointStyle];
}

export function createBasemapLayers(): BasemapLayerSet {
  return {
    oceanFill: new VectorLayer({
      style: createFillStyle('#d9e7f5'),
      zIndex: -10,
    }),
    landFill: new VectorLayer({
      style: createLandFillStyle('#ecf0e6'),
      zIndex: -9,
    }),
    ukAlignmentMask: new VectorLayer({
      style: createSeaPatchStyle('#d9e7f5'),
      // The local sea patch must sit above the global land layer so the UK
      // land/sea split can be fully reset from the app-product coastline.
      zIndex: -8.75,
    }),
    ukAlignedLandFill: new VectorLayer({
      style: createLandFillStyle('#ecf0e6'),
      zIndex: -8.5,
    }),
    countryBorders: new VectorLayer({
      style: createCountryBorderStyle(undefined),
      zIndex: -8,
    }),
    ukInternalBorders: new VectorLayer({
      style: createCountryBorderStyle(undefined),
      zIndex: -7.7,
    }),
    countryLabels: new VectorLayer({
      declutter: true,
      style: createCountryLabelStyle(undefined),
      zIndex: -7,
    }),
    majorCities: new VectorLayer({
      declutter: false,
      style: createMajorCityStyle(undefined),
      zIndex: -6,
    }),
    seaLabels: new VectorLayer({
      declutter: true,
      style: createSeaLabelStyle(undefined),
      zIndex: -7,
    }),
  };
}

function setBasemapSources(
  layers: BasemapLayerSet,
  activeViewPreset: ViewPresetId,
): void {
  const urls = getBasemapUrls(activeViewPreset);

  layers.oceanFill.setSource(
    new VectorSource({
      url: urls.ocean,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
  layers.landFill.setSource(
    new VectorSource({
      url: urls.land,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
  const countriesSource = new VectorSource({
    url: urls.countries,
    format: new GeoJSON(),
    wrapX: false,
  });
  layers.countryBorders.setSource(countriesSource);
  setUkAlignmentSources(layers, activeViewPreset);
  layers.ukInternalBorders.setSource(
    new VectorSource({
      url: urls.ukInternalBorders,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
  layers.countryLabels.setSource(countriesSource);
  // Delay large/optional label sources until explicitly enabled.
}

function ensureVectorSource(layer: VectorLayer<VectorSource>, url: string): void {
  if (layer.getSource()) return;
  layer.setSource(
    new VectorSource({
      url,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
}

function setUkAlignmentSources(
  layers: BasemapLayerSet,
  activeViewPreset: ViewPresetId,
): void {
  const urls = getBasemapUrls(activeViewPreset);

  layers.ukAlignmentMask.setSource(
    new VectorSource({
      url: urls.ukAlignedSea,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
  layers.ukAlignedLandFill.setSource(
    new VectorSource({
      url: urls.ukAlignedLand,
      format: new GeoJSON(),
      wrapX: false,
    }),
  );
}

function getBasemapUrls(activeViewPreset: ViewPresetId): {
  ocean: string;
  land: string;
  countries: string;
  ukAlignedSea: string;
  ukAlignedLand: string;
  ukInternalBorders: string;
  marineLabels: string;
  populatedPlaces: string;
} {
  const ukAlignmentPaths = getUkBasemapAlignmentPathsForPreset(activeViewPreset);

  return {
    ocean: resolveRuntimeAssetUrl('data/basemaps/ne_10m_ocean.geojson'),
    land: resolveRuntimeAssetUrl('data/basemaps/ne_10m_land.geojson'),
    countries: resolveRuntimeAssetUrl('data/basemaps/ne_10m_admin_0_countries.geojson'),
    ukAlignedSea: resolveRuntimeAssetUrl(ukAlignmentPaths.seaPath),
    ukAlignedLand: resolveRuntimeAssetUrl(ukAlignmentPaths.landPath),
    ukInternalBorders: resolveRuntimeAssetUrl('data/basemaps/uk_internal_borders.geojson'),
    marineLabels: resolveRuntimeAssetUrl('data/basemaps/ne_110m_geography_marine_polys.geojson'),
    populatedPlaces: resolveRuntimeAssetUrl('data/basemaps/ne_110m_populated_places_simple.geojson'),
  };
}

function createFillStyle(color: string, seamStroke = true) {
  return new Style({
    fill: new Fill({
      color,
    }),
    // A same-color stroke closes 1px anti-aliased seams at wrap joins.
    // Disabled for land fill — the seam stroke leaves a visible border when
    // opacity is reduced to 0%.
    stroke: seamStroke
      ? new Stroke({
          color,
          width: 1,
        })
      : undefined,
  });
}

export function createLandFillStyle(color: string) {
  return createFillStyle(color, false);
}

export function resolveMapSeaFillBackground(basemap: Pick<BasemapSettings, 'showSeaFill' | 'seaFillColor' | 'seaFillOpacity'>): string {
  return basemap.showSeaFill && basemap.seaFillOpacity > 0
    ? withOpacity(basemap.seaFillColor, basemap.seaFillOpacity)
    : 'transparent';
}

function createSeaPatchStyle(color: string) {
  return new Style({
    fill: new Fill({
      color,
    }),
  });
}

function createCountryBorderStyle(basemap?: BasemapSettings) {
  return new Style({
    stroke: new Stroke({
      color: withOpacity(
        basemap?.countryBorderColor ?? '#EBEBEB',
        basemap?.countryBorderOpacity ?? 1,
      ),
      width: 1.2,
    }),
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0)',
    }),
  });
}

function createCountryLabelStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.countryLabelColor ?? '#0f172a',
    basemap?.countryLabelOpacity ?? 1,
  );
  const size = basemap?.countryLabelSize ?? 8;
  const borderColor = withOpacity(
    basemap?.countryLabelBorderColor ?? '#f8fafc',
    basemap?.countryLabelBorderOpacity ?? 0.3,
  );
  const borderWidth = basemap?.countryLabelBorderWidth ?? 0.5;
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const name = feature.get('NAME_LONG') ?? feature.get('NAME');
    if (!name) return undefined;
    const label = String(name);
    const existing = cache.get(label);
    if (existing) return existing;

    const style = new Style({
      text: new TextStyle({
        text: label,
        font: `${size}px Manrope, sans-serif`,
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: borderColor,
          width: borderWidth,
        }),
      }),
    });
    cache.set(label, style);
    return style;
  };
}

function createMajorCityStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.majorCityColor ?? '#1f2937',
    basemap?.majorCityOpacity ?? 1,
  );
  const size = basemap?.majorCitySize ?? 6;
  const borderColor = withOpacity(
    basemap?.majorCityBorderColor ?? '#f8fafc',
    basemap?.majorCityBorderOpacity ?? 0.35,
  );
  const borderWidth = basemap?.majorCityBorderWidth ?? 0.5;
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const isCapital = Number(getFeatureValue(feature, ['adm0cap', 'ADM0CAP']) ?? 0) === 1;
    const isWorldCity =
      Number(getFeatureValue(feature, ['worldcity', 'WORLDCITY']) ?? 0) === 1;
    const popMax = Number(
      getFeatureValue(feature, ['pop_max', 'POP_MAX', 'MAX_POP50']) ?? 0,
    );
    const labelRank = Number(
      getFeatureValue(feature, ['labelrank', 'LABELRANK', 'rank_max', 'RANK_MAX']) ?? 99,
    );
    const isMajorCity =
      isCapital || isWorldCity || popMax >= 1000000 || labelRank <= 2;
    if (!isMajorCity) return undefined;

    const name = getFeatureValue(feature, ['name', 'NAME', 'name_en', 'NAME_EN']);
    if (!name) return undefined;

    const label = String(name);
    const key = `${label}:${isCapital ? 1 : 0}`;
    const existing = cache.get(key);
    if (existing) return existing;

    const style = new Style({
      image: new CircleStyle({
        radius: isCapital ? 3 : 2.5,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#ffffff', width: 1 }),
      }),
      text: new TextStyle({
        text: label,
        font: `${size}px Manrope, sans-serif`,
        offsetY: -(size + 4),
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: borderColor,
          width: borderWidth,
        }),
      }),
    });
    cache.set(key, style);
    return style;
  };
}

function getFeatureValue(feature: FeatureLike, keys: string[]): unknown {
  for (const key of keys) {
    const value = feature.get(key);
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return undefined;
}

function createSeaLabelStyle(basemap?: BasemapSettings) {
  const color = withOpacity(
    basemap?.seaLabelColor ?? '#334155',
    basemap?.seaLabelOpacity ?? 1,
  );
  const size = basemap?.seaLabelSize ?? 7;
  const borderColor = withOpacity(
    basemap?.seaLabelBorderColor ?? '#f8fafc',
    basemap?.seaLabelBorderOpacity ?? 0.3,
  );
  const borderWidth = basemap?.seaLabelBorderWidth ?? 0.5;
  const cache = new Map<string, Style>();
  return (feature: FeatureLike) => {
    const name = feature.get('name_en') ?? feature.get('name');
    if (!name) return undefined;
    const label = String(name);
    const existing = cache.get(label);
    if (existing) return existing;

    const style = new Style({
      text: new TextStyle({
        text: label,
        font: `italic ${size}px Manrope, sans-serif`,
        fill: new Fill({ color }),
        stroke: new Stroke({
          color: borderColor,
          width: borderWidth,
        }),
      }),
    });
    cache.set(label, style);
    return style;
  };
}
