import type Feature from 'ol/Feature';
import type OLMap from 'ol/Map';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { findCareBoardBoundaryAtCoordinate, getBoundaryName } from './boundarySelection';
import {
  collectPointTooltipEntries,
  expandPointHitCluster,
  getDirectPointHitsAtPixel,
  type PointTooltipEntry,
} from './pointSelection';
import type {
  CombinedPracticeStyle,
  FacilitySymbolShape,
  LayerState,
  OverlayLayerStyle,
  RegionStyle,
  ViewPresetId,
} from '../../types';
import type { FacilityFilterState } from '../../lib/schemas/facilities';

interface ResolveSingleClickSelectionParams {
  map: OLMap;
  pixel: number[];
  coordinate: [number, number];
  layers: LayerState[];
  regions: RegionStyle[];
  overlayLayers: OverlayLayerStyle[];
  layerRefs: Map<string, VectorLayer<VectorSource>>;
  regionBoundaryRefs: Map<string, VectorLayer<VectorSource>>;
  combinedPracticeStylesByName?: Map<string, CombinedPracticeStyle>;
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  facilityFilters: FacilityFilterState;
  assignmentSource?: VectorSource | null;
  activeViewPreset: ViewPresetId;
  getJmcNameAtCoordinate: (
    coordinate: [number, number],
    activeViewPreset: ViewPresetId,
  ) => string | null;
}

export interface SingleClickSelectionResult {
  pointEntries: PointTooltipEntry[];
  boundaryFeature: Feature | null;
}

export function resolveSingleClickSelection(
  params: ResolveSingleClickSelectionParams,
): SingleClickSelectionResult {
  const {
    map,
    pixel,
    coordinate,
    layers,
    regions,
    overlayLayers,
    layerRefs,
    regionBoundaryRefs,
    combinedPracticeStylesByName = new Map<string, CombinedPracticeStyle>(),
    facilitySymbolShape,
    facilitySymbolSize,
    facilityFilters,
    assignmentSource = null,
    activeViewPreset,
    getJmcNameAtCoordinate,
  } = params;
  const visibleRegions = new Map(regions.map((region) => [region.name, region]));
  const pointLayers = getVisiblePointLayers(layers, layerRefs);
  const hitFeatures = getDirectPointHitsAtPixel(
    map,
    pixel,
    pointLayers,
    visibleRegions,
    combinedPracticeStylesByName,
    facilitySymbolShape,
    facilitySymbolSize,
    facilityFilters,
    assignmentSource,
  );

  if (hitFeatures.length > 0) {
    const clusteredHitFeatures = expandPointHitCluster(
      map,
      hitFeatures,
      pointLayers,
      visibleRegions,
      combinedPracticeStylesByName,
      facilitySymbolShape,
      facilitySymbolSize,
      pixel,
      facilityFilters,
      assignmentSource,
    );

    return {
      pointEntries: collectPointTooltipEntries({
        features: clusteredHitFeatures,
        fallbackCoordinate: coordinate,
        regions,
        activeViewPreset,
        getBoundaryNameAtCoordinate: (entryCoordinate) => {
          const boundaryFeature = findCareBoardBoundaryAtCoordinate(
            entryCoordinate,
            overlayLayers,
            regionBoundaryRefs,
          );
          return boundaryFeature ? getBoundaryName(boundaryFeature) : null;
        },
        getJmcNameAtCoordinate,
        facilityFilters,
        combinedPracticeStylesByName,
        assignmentSource,
      }),
      boundaryFeature: null,
    };
  }

  return {
    pointEntries: [],
    boundaryFeature: findCareBoardBoundaryAtCoordinate(
      coordinate,
      overlayLayers,
      regionBoundaryRefs,
    ),
  };
}

function getVisiblePointLayers(
  layers: LayerState[],
  layerRefs: Map<string, VectorLayer<VectorSource>>,
): Set<VectorLayer<VectorSource>> {
  const pointLayers = new Set<VectorLayer<VectorSource>>();

  for (const layer of layers) {
    if (layer.type !== 'point' || !layer.visible) continue;
    const mapLayer = layerRefs.get(layer.id);
    if (mapLayer) {
      pointLayers.add(mapLayer);
    }
  }

  return pointLayers;
}
