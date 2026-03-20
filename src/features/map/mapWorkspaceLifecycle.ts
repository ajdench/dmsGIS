import OLMap from 'ol/Map';
import View from 'ol/View';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import type { PointTooltipEntry, } from './pointSelection';
import type { BoundarySystemId, ViewPresetId } from '../../types';

export interface BasemapLayerSet {
  oceanFill: VectorLayer<VectorSource>;
  landFill: VectorLayer<VectorSource>;
  countryBorders: VectorLayer<VectorSource>;
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
  jmcAssignmentByBoundaryNameRef: MutableRefLike<Map<string, string>>;
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
    }),
    layers: [],
  });
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
  refs.jmcAssignmentByBoundaryNameRef.current.clear();
  refs.pointTooltipRootRef.current = null;
  refs.pointTooltipHeaderRef.current = null;
  refs.pointTooltipNameRef.current = null;
  refs.pointTooltipSubnameRef.current = null;
  refs.pointTooltipContextRef.current = null;
  refs.pointTooltipFooterRef.current = null;
  refs.pointTooltipPageRef.current = null;
  refs.pointTooltipPrevRef.current = null;
  refs.pointTooltipNextRef.current = null;
  refs.pointTooltipEntriesRef.current = [];
  refs.pointTooltipIndexRef.current = 0;
  refs.selectedBoundaryNameRef.current = null;
  refs.selectedJmcNameRef.current = null;
  refs.layerRefs.current.clear();
}
