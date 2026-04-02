import OLMap from 'ol/Map';
import type Feature from 'ol/Feature';
import type { Geometry } from 'geojson';
import View from 'ol/View';
import { unByKey } from 'ol/Observable';
import type { EventsKey } from 'ol/events';
import type { Extent } from 'ol/extent';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { fromLonLat, transformExtent } from 'ol/proj';
import { getViewportFromMap } from './viewportSync';
import type { PointTooltipEntry, } from './pointSelection';
import type { BoundarySystemId, ViewPresetId } from '../../types';
import type { ScenarioBoundaryUnitAssignment } from './scenarioAssignmentAuthority';
import {
  WHOLE_WORLD_RENDER_EXTENT_3857,
} from './worldExtent';

export interface BasemapLayerSet {
  oceanFill: VectorLayer<VectorSource>;
  landFill: VectorLayer<VectorSource>;
  countryBorders: VectorLayer<VectorSource>;
  ukAlignmentMask: VectorLayer<VectorSource>;
  ukAlignedLandFill: VectorLayer<VectorSource>;
  ukInternalBorders: VectorLayer<VectorSource>;
  countryLabels: VectorLayer<VectorSource>;
  majorCities: VectorLayer<VectorSource>;
  seaLabels: VectorLayer<VectorSource>;
}

export interface MutableRefLike<T> {
  current: T;
}

interface InitializeMapWorkspaceShellParams {
  target: HTMLDivElement;
  createBasemapLayers: () => BasemapLayerSet;
  setBasemapSources: (layers: BasemapLayerSet) => void;
  createSelectedBoundaryLayer: () => VectorLayer<VectorSource>;
  createSelectedJmcBoundaryLayer: () => VectorLayer<VectorSource>;
  createSelectedPointLayer: () => VectorLayer<VectorSource>;
  createMap?: (target: HTMLDivElement) => OLMap;
}

export interface InitializedMapWorkspaceShell {
  map: OLMap;
  basemapLayers: BasemapLayerSet;
  selectedBoundaryLayer: VectorLayer<VectorSource>;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource>;
  selectedPointLayer: VectorLayer<VectorSource>;
  initialViewport: {
    center: [number, number];
    zoom: number;
    rotation: number;
  };
}

export interface CleanupMapWorkspaceRefsParams {
  mapRef: MutableRefLike<OLMap | null>;
  basemapRef: MutableRefLike<BasemapLayerSet | null>;
  regionBoundaryRefs: MutableRefLike<Map<string, VectorLayer<VectorSource>>>;
  regionBoundaryPathRefs: MutableRefLike<Map<string, string>>;
  selectedBoundaryRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  selectedJmcBoundaryRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  selectedPointRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  boundarySystemLookupSourcesRef: MutableRefLike<Map<BoundarySystemId, VectorSource>>;
  jmcBoundaryLookupSourceRef: MutableRefLike<VectorSource | null>;
  scenarioBoundaryLookupSourcesRef: MutableRefLike<Map<ViewPresetId, VectorSource>>;
  jmcAssignmentLookupSourceRef: MutableRefLike<VectorSource | null>;
  scenarioAssignmentSourceRef: MutableRefLike<VectorSource | null>;
  scenarioWorkspaceBaselineAssignmentSourceRef: MutableRefLike<VectorSource | null>;
  scenarioTopologyEdgeSourceRef: MutableRefLike<VectorSource | null>;
  scenarioWorkspaceDerivedOutlineSourceRef: MutableRefLike<VectorSource | null>;
  presetGroupOutlineSourceRef: MutableRefLike<VectorSource | null>;
  jmcAssignmentByBoundaryNameRef: MutableRefLike<Map<string, string>>;
  jmcAssignmentByBoundaryUnitIdRef: MutableRefLike<
    Map<string, ScenarioBoundaryUnitAssignment>
  >;
  scenarioAssignmentByBoundaryNameRef: MutableRefLike<Map<string, string>>;
  scenarioAssignmentByBoundaryUnitIdRef: MutableRefLike<
    Map<string, ScenarioBoundaryUnitAssignment>
  >;
  pointTooltipRootRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipHeaderRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipNameRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipSubnameRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipContextRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipFooterRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipPageRef: MutableRefLike<HTMLSpanElement | null>;
  pointTooltipPrevRef: MutableRefLike<HTMLButtonElement | null>;
  pointTooltipNextRef: MutableRefLike<HTMLButtonElement | null>;
  pointTooltipEntriesRef: MutableRefLike<PointTooltipEntry[]>;
  pointTooltipIndexRef: MutableRefLike<number>;
  selectedBoundaryNameRef: MutableRefLike<string | null>;
  selectedJmcNameRef: MutableRefLike<string | null>;
  layerRefs: MutableRefLike<Map<string, VectorLayer<VectorSource>>>;
}

export interface ResetTransientMapSelectionStateParams {
  selectedBoundaryRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  selectedJmcBoundaryRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  selectedPointRef: MutableRefLike<VectorLayer<VectorSource> | null>;
  pointTooltipRootRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipNameRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipSubnameRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipContextRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipFooterRef: MutableRefLike<HTMLDivElement | null>;
  pointTooltipPageRef: MutableRefLike<HTMLSpanElement | null>;
  pointTooltipPrevRef: MutableRefLike<HTMLButtonElement | null>;
  pointTooltipNextRef: MutableRefLike<HTMLButtonElement | null>;
  pointTooltipEntriesRef: MutableRefLike<PointTooltipEntry[]>;
  pointTooltipIndexRef: MutableRefLike<number>;
  selectedBoundaryNameRef: MutableRefLike<string | null>;
  selectedJmcNameRef: MutableRefLike<string | null>;
}

interface FitMapToUkExtentParams {
  map: OLMap;
  source: VectorSource | null | undefined;
  target?: HTMLElement | null;
  getExtent?: (source: VectorSource) => Extent | null;
  loadExtent?: () => Promise<Extent | null>;
  onViewportChange?: (viewport: {
    center: [number, number];
    zoom: number;
    rotation: number;
  }) => void;
  onSettled?: () => void;
}

interface AttachZoomStatusControlParams {
  map: OLMap;
  target: HTMLElement;
  source?: VectorSource | null;
  showDiagnostics?: boolean;
  onViewportChange?: (viewport: {
    center: [number, number];
    zoom: number;
    rotation: number;
  }) => void;
}

interface AttachCrosshairGuideControlParams {
  target: HTMLElement;
}

export interface MapViewportDiagnostics {
  projectedExtent3857: Extent;
  geographicExtent4326: Extent;
  horizontalCoveragePercentage: number;
  verticalCoveragePercentage: number;
  geographicWidthDegrees: number;
  geographicHeightDegrees: number;
  geographicCenterLongitudeDegrees: number;
  geographicCenterLatitudeDegrees: number;
  northLatitudeDegrees: number;
  southLatitudeDegrees: number;
  viewportWidthPx: number;
  viewportHeightPx: number;
  currentResolution3857: number;
  floorResolution3857: number;
}

export function initializeMapWorkspaceShell(
  params: InitializeMapWorkspaceShellParams,
): InitializedMapWorkspaceShell {
  const {
    target,
    createBasemapLayers,
    setBasemapSources,
    createSelectedBoundaryLayer,
    createSelectedJmcBoundaryLayer,
    createSelectedPointLayer,
    createMap = createDefaultMap,
  } = params;

  const map = createMap(target);
  const initialView = map.getView();
  const basemapLayers = createBasemapLayers();
  setBasemapSources(basemapLayers);
  map.addLayer(basemapLayers.oceanFill);
  map.addLayer(basemapLayers.landFill);
  map.addLayer(basemapLayers.countryBorders);
  map.addLayer(basemapLayers.ukAlignmentMask);
  map.addLayer(basemapLayers.ukAlignedLandFill);
  map.addLayer(basemapLayers.ukInternalBorders);
  map.addLayer(basemapLayers.seaLabels);
  map.addLayer(basemapLayers.countryLabels);
  map.addLayer(basemapLayers.majorCities);

  const selectedBoundaryLayer = createSelectedBoundaryLayer();
  map.addLayer(selectedBoundaryLayer);
  const selectedJmcBoundaryLayer = createSelectedJmcBoundaryLayer();
  map.addLayer(selectedJmcBoundaryLayer);
  const selectedPointLayer = createSelectedPointLayer();
  map.addLayer(selectedPointLayer);

  return {
    map,
    basemapLayers,
    selectedBoundaryLayer,
    selectedJmcBoundaryLayer,
    selectedPointLayer,
    initialViewport: {
      center: (initialView.getCenter() as [number, number]) ?? [0, 0],
      zoom: initialView.getZoom() ?? 0,
      rotation: initialView.getRotation() ?? 0,
    },
  };
}

function createDefaultMap(target: HTMLDivElement): OLMap {
  return new OLMap({
    target,
    view: new View({
      center: fromLonLat([-2.5, 54.5]),
      zoom: 5.6,
      extent: WHOLE_WORLD_RENDER_EXTENT_3857,
      multiWorld: false,
      showFullExtent: true,
    }),
    layers: [],
  });
}

export function getInitialUkFitPaddingPx(
  target?: HTMLElement | null,
): [number, number, number, number] {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    !target
  ) {
    return [24, 12, 24, 12];
  }

  const rootStyle = window.getComputedStyle(document.documentElement);
  const rootFontSizePx = Number.parseFloat(rootStyle.fontSize) || 16;
  const defaultSpaceRem =
    Number.parseFloat(rootStyle.getPropertyValue('--space-1')) || 0.75;
  const defaultSpacePx = defaultSpaceRem * rootFontSizePx;

  return [
    defaultSpacePx * 2,
    defaultSpacePx,
    defaultSpacePx * 2,
    defaultSpacePx,
  ];
}

export function fitMapToUkExtentOnLoad(
  params: FitMapToUkExtentParams,
): () => void {
  const {
    map,
    source,
    target,
    getExtent,
    loadExtent,
    onViewportChange,
    onSettled,
  } = params;
  if (!source) {
    return () => {};
  }

  let animationFrameId: number | null = null;
  let retryTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let changeKey: EventsKey | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let disposed = false;
  let settled = false;
  let loadedExtent: Extent | null = null;
  let loadAttempted = false;
  let retryAttempts = 0;
  const maxRetryAttempts = 80;

  const fitToExtent = (): boolean => {
    const targetRect = target?.getBoundingClientRect() ?? null;
    if (targetRect && (targetRect.width <= 0 || targetRect.height <= 0)) {
      return false;
    }
    if (source.getFeatures().length === 0) {
      if (loadedExtent) {
        return fitExtent(loadedExtent, targetRect);
      }
      return false;
    }
    const extent = getExtent ? getExtent(source) : source.getExtent();
    if (!extent) {
      return false;
    }

    return fitExtent(extent, targetRect);
  };

  const fitExtent = (
    extent: Extent,
    targetRect: DOMRect | null,
  ): boolean => {
    (map as OLMap & { updateSize?: () => void }).updateSize?.();
    map.getView().fit(extent, {
      padding: getInitialUkFitPaddingPx(target),
      duration: 0,
      nearest: true,
      size:
        map.getSize() ??
        (targetRect
          ? [Math.round(targetRect.width), Math.round(targetRect.height)]
          : undefined),
    });
    onViewportChange?.(getViewportFromMap(map));
    settle();
    return true;
  };

  const settle = () => {
    if (settled) {
      return;
    }
    settled = true;
    onSettled?.();
  };

  const clearScheduledFit = () => {
    if (animationFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    if (retryTimeoutId !== null) {
      clearTimeout(retryTimeoutId);
      retryTimeoutId = null;
    }
  };

  const stopWatching = () => {
    if (changeKey) {
      unByKey(changeKey);
      changeKey = null;
    }
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const scheduleFit = () => {
    if (animationFrameId !== null) {
      return;
    }
    if (typeof requestAnimationFrame !== 'function') {
      if (fitToExtent()) {
        stopWatching();
      }
      return;
    }

    animationFrameId = requestAnimationFrame(() => {
      animationFrameId = null;
      if (fitToExtent()) {
        stopWatching();
        return;
      }
      scheduleRetry();
    });
  };

  const scheduleRetry = () => {
    if (retryTimeoutId !== null) {
      return;
    }
    if (retryAttempts >= maxRetryAttempts) {
      settle();
      return;
    }
    retryAttempts += 1;
    retryTimeoutId = setTimeout(() => {
      retryTimeoutId = null;
      scheduleFit();
    }, 50);
  };

  if (fitToExtent()) {
    return () => {};
  }

  if (loadExtent && !loadAttempted) {
    loadAttempted = true;
    void loadExtent().then((extent) => {
      if (disposed) {
        return;
      }
      if (!extent) {
        settle();
        return;
      }
      loadedExtent = extent;
      scheduleFit();
    });
  }

  changeKey = source.on('change', () => {
    scheduleFit();
  });
  if (target && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      scheduleFit();
    });
    resizeObserver.observe(target);
  }
  scheduleFit();
  scheduleRetry();

  return () => {
    disposed = true;
    clearScheduledFit();
    stopWatching();
    settle();
  };
}

export function getWholeWorldZoomForTarget(
  map: OLMap,
  extent: Extent,
  target?: HTMLElement | null,
): number | null {
  const view = map.getView();
  const targetRect = target?.getBoundingClientRect() ?? null;
  const size =
    map.getSize() ??
    (targetRect
      ? [Math.round(targetRect.width), Math.round(targetRect.height)]
      : undefined);

  if (!size || size[0] <= 0 || size[1] <= 0) {
    return null;
  }

  const resolution = view.getResolutionForExtent(extent, size);
  if (!Number.isFinite(resolution)) {
    return null;
  }

  const zoom = view.getZoomForResolution(resolution);
  return Number.isFinite(zoom ?? Number.NaN) ? (zoom ?? null) : null;
}

export function getResolutionForExtentHeightTarget(
  map: OLMap,
  extent: Extent,
  target?: HTMLElement | null,
): number | null {
  const targetRect = target?.getBoundingClientRect() ?? null;
  const size =
    map.getSize() ??
    (targetRect
      ? [Math.round(targetRect.width), Math.round(targetRect.height)]
      : undefined);

  if (!size || size[1] <= 0) {
    return null;
  }

  const extentHeight = extent[3] - extent[1];
  if (!Number.isFinite(extentHeight) || extentHeight <= 0) {
    return null;
  }

  return extentHeight / size[1];
}

export function getMapZoomPercentage(
  zoom: number,
  minimumZoom: number,
  maximumZoom: number,
): number {
  if (
    !Number.isFinite(zoom) ||
    !Number.isFinite(minimumZoom) ||
    !Number.isFinite(maximumZoom) ||
    maximumZoom <= minimumZoom
  ) {
    return 0;
  }

  const ratio = (zoom - minimumZoom) / (maximumZoom - minimumZoom);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

export function getMapViewportDiagnostics(
  projectedExtent3857: Extent,
  worldExtent3857: Extent,
  viewportWidthPx: number,
  viewportHeightPx: number,
  currentResolution3857: number,
  floorResolution3857: number,
): MapViewportDiagnostics {
  const geographicExtent4326 = transformExtent(
    projectedExtent3857,
    'EPSG:3857',
    'EPSG:4326',
  );
  const projectedWidth = projectedExtent3857[2] - projectedExtent3857[0];
  const projectedHeight = projectedExtent3857[3] - projectedExtent3857[1];
  const worldWidth = worldExtent3857[2] - worldExtent3857[0];
  const worldHeight = worldExtent3857[3] - worldExtent3857[1];
  const geographicWidthDegrees = geographicExtent4326[2] - geographicExtent4326[0];
  const geographicHeightDegrees = geographicExtent4326[3] - geographicExtent4326[1];
  const geographicCenterLongitudeDegrees =
    (geographicExtent4326[0] + geographicExtent4326[2]) / 2;
  const geographicCenterLatitudeDegrees =
    (geographicExtent4326[1] + geographicExtent4326[3]) / 2;

  return {
    projectedExtent3857,
    geographicExtent4326,
    horizontalCoveragePercentage:
      worldWidth > 0 ? Math.max(0, (projectedWidth / worldWidth) * 100) : 0,
    verticalCoveragePercentage:
      worldHeight > 0 ? Math.max(0, (projectedHeight / worldHeight) * 100) : 0,
    geographicWidthDegrees,
    geographicHeightDegrees,
    geographicCenterLongitudeDegrees,
    geographicCenterLatitudeDegrees,
    northLatitudeDegrees: geographicExtent4326[3],
    southLatitudeDegrees: geographicExtent4326[1],
    viewportWidthPx,
    viewportHeightPx,
    currentResolution3857,
    floorResolution3857,
  };
}

export function attachZoomStatusControl(
  params: AttachZoomStatusControlParams,
): () => void {
  const { map, target, source, showDiagnostics = false, onViewportChange } = params;
  const zoomControl = target.querySelector<HTMLElement>('.ol-zoom');
  if (!zoomControl) {
    return () => {};
  }

  const statusRoot = document.createElement('div');
  statusRoot.className = 'map-zoom__status';

  const statusValue = document.createElement('span');
  statusValue.className = 'map-zoom__status-value';
  statusValue.textContent = '0%';

  statusRoot.append(statusValue);
  zoomControl.appendChild(statusRoot);
  const diagnosticsRoot = showDiagnostics
    ? document.createElement('div')
    : null;
  const diagnosticsVertical = showDiagnostics
    ? document.createElement('span')
    : null;
  const diagnosticsArea = showDiagnostics
    ? document.createElement('span')
    : null;
  const diagnosticsCenter = showDiagnostics
    ? document.createElement('span')
    : null;
  if (
    diagnosticsRoot &&
    diagnosticsVertical &&
    diagnosticsArea &&
    diagnosticsCenter
  ) {
    diagnosticsRoot.className = 'map-zoom__diagnostics';
    diagnosticsVertical.className = 'map-zoom__diagnostics-line';
    diagnosticsArea.className = 'map-zoom__diagnostics-line';
    diagnosticsCenter.className = 'map-zoom__diagnostics-line';
    diagnosticsRoot.append(
      diagnosticsVertical,
      diagnosticsArea,
      diagnosticsCenter,
    );
    zoomControl.appendChild(diagnosticsRoot);
  }
  const view = map.getView();
  let disposed = false;
  let resizeObserver: ResizeObserver | null = null;
  let rafId: number | null = null;

  const getDiagnosticsExtent = () => {
    const projectionExtent = view.getProjection().getExtent();
    if (projectionExtent) {
      return projectionExtent;
    }

    const sourceExtent =
      source && source.getFeatures().length > 0 ? source.getExtent() : null;
    return sourceExtent ?? WHOLE_WORLD_RENDER_EXTENT_3857;
  };

  const update = () => {
    if (disposed) {
      return;
    }

    const diagnosticsExtent = getDiagnosticsExtent();
    const currentSize =
      map.getSize() ?? [
        Math.round(target.getBoundingClientRect().width),
        Math.round(target.getBoundingClientRect().height),
      ];
    const currentExtent = view.calculateExtent(currentSize);
    const worldResolution = getResolutionForExtentHeightTarget(
      map,
      WHOLE_WORLD_RENDER_EXTENT_3857,
      target,
    );
    if (worldResolution === null) {
      return;
    }
    const currentResolution = view.getResolution() ?? worldResolution;
    const diagnostics = getMapViewportDiagnostics(
      currentExtent,
      diagnosticsExtent,
      currentSize[0],
      currentSize[1],
      currentResolution,
      worldResolution,
    );
    const minZoom = view.getMinZoom();
    const maxZoom = view.getMaxZoom();
    const effectiveZoom = view.getZoom() ?? minZoom;
    statusValue.textContent = `${getMapZoomPercentage(
      effectiveZoom,
      minZoom,
      maxZoom,
    )}%`;
    if (typeof window !== 'undefined') {
      (
        window as Window & {
          __dmsGISMapDiagnostics?: MapViewportDiagnostics;
        }
      ).__dmsGISMapDiagnostics = diagnostics;
    }
    if (
      showDiagnostics &&
      diagnosticsVertical &&
      diagnosticsArea &&
      diagnosticsCenter
    ) {
      diagnosticsVertical.textContent = `V ${Math.round(diagnostics.verticalCoveragePercentage)}%`;
      diagnosticsArea.textContent = `${Math.round(diagnostics.geographicWidthDegrees)}°×${Math.round(diagnostics.geographicHeightDegrees)}°`;
      diagnosticsCenter.textContent = `C ${Math.round(diagnostics.geographicCenterLongitudeDegrees)}°`;
    }
    onViewportChange?.(getViewportFromMap(map));
  };

  const scheduleUpdate = () => {
    if (rafId !== null) {
      return;
    }
    if (typeof requestAnimationFrame !== 'function') {
      update();
      return;
    }
    rafId = requestAnimationFrame(() => {
      rafId = null;
      update();
    });
  };

  const resolutionKey = view.on('change:resolution', () => {
    scheduleUpdate();
  });

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      scheduleUpdate();
    });
    resizeObserver.observe(target);
  }

  scheduleUpdate();

  return () => {
    disposed = true;
    if (rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (resolutionKey) {
      unByKey(resolutionKey);
    }
    resizeObserver?.disconnect();
    statusRoot.remove();
    diagnosticsRoot?.remove();
  };
}

export function attachCrosshairGuideControl(
  params: AttachCrosshairGuideControlParams,
): () => void {
  const { target } = params;

  const controlRoot = document.createElement('div');
  controlRoot.className = 'map-crosshair-control ol-unselectable ol-control';
  controlRoot.dataset.active = 'false';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'map-crosshair-control__button';
  button.setAttribute('aria-label', 'Toggle centre guide lines');
  button.setAttribute('aria-pressed', 'false');
  button.title = 'Toggle centre guide lines';

  const icon = document.createElement('span');
  icon.className = 'map-crosshair-control__icon';
  icon.setAttribute('aria-hidden', 'true');
  button.append(icon);
  controlRoot.append(button);

  const guidesRoot = document.createElement('div');
  guidesRoot.className = 'map-crosshair-guides';
  guidesRoot.hidden = true;
  guidesRoot.setAttribute('aria-hidden', 'true');

  const horizontalGuide = document.createElement('span');
  horizontalGuide.className =
    'map-crosshair-guides__line map-crosshair-guides__line--horizontal';
  const verticalGuide = document.createElement('span');
  verticalGuide.className =
    'map-crosshair-guides__line map-crosshair-guides__line--vertical';
  guidesRoot.append(horizontalGuide, verticalGuide);

  target.append(controlRoot, guidesRoot);

  let isActive = false;

  const applyState = () => {
    controlRoot.dataset.active = isActive ? 'true' : 'false';
    button.setAttribute('aria-pressed', String(isActive));
    guidesRoot.hidden = !isActive;
  };

  const handleButtonClick = (event: MouseEvent) => {
    event.preventDefault();
    isActive = !isActive;
    applyState();
  };

  button.addEventListener('click', handleButtonClick);
  applyState();

  return () => {
    button.removeEventListener('click', handleButtonClick);
    controlRoot.remove();
    guidesRoot.remove();
  };
}

export function getUnitedKingdomExtentFromCountrySource(
  source: VectorSource,
): Extent | null {
  const ukFeature = source
    .getFeatures()
    .find((feature) => isUnitedKingdomFeature(feature));
  const geometry = ukFeature?.getGeometry();
  return geometry ? geometry.getExtent() : null;
}

export async function loadUnitedKingdomExtentFromCountriesUrl(
  url: string,
): Promise<Extent | null> {
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const collection = (await response.json()) as {
    features?: Array<{
      properties?: Record<string, unknown>;
      geometry?: Geometry;
    }>;
  };
  const features = collection.features ?? [];
  const ukFeature = features.find((feature) =>
    isUnitedKingdomProperties(feature.properties ?? {}),
  );
  if (!ukFeature?.geometry) {
    return null;
  }

  const extent = getExtentFromGeometry(ukFeature.geometry);
  return extent ? transformExtent(extent, 'EPSG:4326', 'EPSG:3857') : null;
}

function isUnitedKingdomFeature(feature: Feature): boolean {
  return isUnitedKingdomProperties(feature.getProperties() as Record<string, unknown>);
}

function isUnitedKingdomProperties(properties: Record<string, unknown>): boolean {
  const admin = String(properties.ADMIN ?? '').trim();
  const name = String(properties.NAME ?? '').trim();
  const nameLong = String(properties.NAME_LONG ?? '').trim();

  return (
    admin === 'United Kingdom' ||
    name === 'United Kingdom' ||
    nameLong === 'United Kingdom'
  );
}

function getExtentFromGeometry(
  geometry: Geometry,
): Extent | null {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  const visit = (value: unknown): void => {
    if (!Array.isArray(value) || value.length === 0) {
      return;
    }
    if (
      typeof value[0] === 'number' &&
      typeof value[1] === 'number'
    ) {
      const x = value[0];
      const y = value[1];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return;
    }
    value.forEach(visit);
  };

  const visitGeometry = (value: Geometry): void => {
    if (value.type === 'GeometryCollection') {
      value.geometries.forEach(visitGeometry);
      return;
    }
    visit(value.coordinates);
  };

  visitGeometry(geometry);
  return Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)
    ? [minX, minY, maxX, maxY]
    : null;
}

export function resetTransientMapSelectionState(
  refs: ResetTransientMapSelectionStateParams,
): void {
  refs.selectedBoundaryRef.current?.getSource()?.clear();
  refs.selectedJmcBoundaryRef.current?.getSource()?.clear();
  refs.selectedPointRef.current?.getSource()?.clear();
  refs.pointTooltipEntriesRef.current = [];
  refs.pointTooltipIndexRef.current = 0;
  refs.selectedBoundaryNameRef.current = null;
  refs.selectedJmcNameRef.current = null;

  if (refs.pointTooltipNameRef.current) {
    refs.pointTooltipNameRef.current.textContent = '';
  }
  if (refs.pointTooltipSubnameRef.current) {
    refs.pointTooltipSubnameRef.current.textContent = '';
  }
  if (refs.pointTooltipContextRef.current) {
    refs.pointTooltipContextRef.current.textContent = '';
  }
  if (refs.pointTooltipPageRef.current) {
    refs.pointTooltipPageRef.current.textContent = '';
  }
  if (refs.pointTooltipPrevRef.current) {
    refs.pointTooltipPrevRef.current.disabled = true;
  }
  if (refs.pointTooltipNextRef.current) {
    refs.pointTooltipNextRef.current.disabled = true;
  }
  refs.pointTooltipFooterRef.current?.classList.add(
    'map-tooltip-card__footer--hidden',
  );
  refs.pointTooltipSubnameRef.current?.classList.add(
    'map-tooltip-card__subname--hidden',
  );
  refs.pointTooltipContextRef.current?.classList.add(
    'map-tooltip-card__context--hidden',
  );
  refs.pointTooltipRootRef.current?.classList.remove('map-tooltip-card--name-right');
  refs.pointTooltipRootRef.current?.classList.add('map-tooltip-card--hidden');
}

export function cleanupMapWorkspaceRefs(
  refs: CleanupMapWorkspaceRefsParams,
): void {
  refs.mapRef.current?.setTarget(undefined);
  refs.mapRef.current = null;
  refs.basemapRef.current = null;
  refs.regionBoundaryRefs.current.clear();
  refs.regionBoundaryPathRefs.current.clear();
  refs.selectedBoundaryRef.current = null;
  refs.selectedJmcBoundaryRef.current = null;
  refs.selectedPointRef.current = null;
  refs.boundarySystemLookupSourcesRef.current.clear();
  refs.jmcBoundaryLookupSourceRef.current = null;
  refs.scenarioBoundaryLookupSourcesRef.current.clear();
  refs.jmcAssignmentLookupSourceRef.current = null;
  refs.scenarioAssignmentSourceRef.current = null;
  refs.scenarioWorkspaceBaselineAssignmentSourceRef.current = null;
  refs.scenarioTopologyEdgeSourceRef.current = null;
  refs.scenarioWorkspaceDerivedOutlineSourceRef.current = null;
  refs.presetGroupOutlineSourceRef.current = null;
  refs.jmcAssignmentByBoundaryNameRef.current.clear();
  refs.jmcAssignmentByBoundaryUnitIdRef.current.clear();
  refs.scenarioAssignmentByBoundaryNameRef.current.clear();
  refs.scenarioAssignmentByBoundaryUnitIdRef.current.clear();
  refs.pointTooltipRootRef.current = null;
  refs.pointTooltipHeaderRef.current = null;
  refs.pointTooltipNameRef.current = null;
  refs.pointTooltipSubnameRef.current = null;
  refs.pointTooltipContextRef.current = null;
  refs.pointTooltipFooterRef.current = null;
  refs.pointTooltipPageRef.current = null;
  refs.pointTooltipPrevRef.current = null;
  refs.pointTooltipNextRef.current = null;
  resetTransientMapSelectionState(refs);
  refs.layerRefs.current.clear();
}
