import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type { FacilitySymbolShape, OverlayLayerStyle, ViewPresetId } from '../../types';
import {
  findBoundaryHighlightFeatureForPointCoordinate,
  getBoundaryName,
  getSelectedJmcOutlineFeatures,
} from './boundarySelection';
import type { PointTooltipEntry } from './pointSelection';

interface SyncBoundaryHighlightForPointParams {
  entry: PointTooltipEntry;
  overlayLayers: OverlayLayerStyle[];
  regionBoundaryRefs: Map<string, VectorLayer<VectorSource>>;
  selectedBoundaryLayer: VectorLayer<VectorSource> | null;
}

interface SyncJmcOutlineHighlightParams {
  entry: PointTooltipEntry;
  activeViewPreset: ViewPresetId;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource> | null;
  scenarioBoundarySource: VectorSource | null;
  jmcBoundaryLookupSource: VectorSource | null;
  getSelectedOutlineColor: (feature: Feature, activeViewPreset: ViewPresetId) => string | null;
}

interface SyncSelectedPointHighlightParams {
  entry: PointTooltipEntry;
  selectedPointLayer: VectorLayer<VectorSource> | null;
  createSelectedPointStyle: (
    shape: FacilitySymbolShape,
    size: number,
    hasVisibleBorder: boolean,
    hasCombinedPracticeRing: boolean,
  ) => unknown;
}

interface SyncSelectedRegionHighlightFromDerivedSourceParams {
  selectedRegionId: string | null;
  selectedRegionName: string | null;
  selectionColor: string | null;
  derivedOutlineSource: VectorSource | null;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource> | null;
}

interface SyncSelectedRegionHighlightFromAvailableSourcesParams {
  activeViewPreset: ViewPresetId;
  preferDerivedOutlineSource: boolean;
  selectedRegionId: string | null;
  selectedRegionName: string | null;
  selectionColor: string | null;
  currentOutlineFeature: Feature | null;
  derivedOutlineSource: VectorSource | null;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource> | null;
}

export function syncBoundaryHighlightForPoint(
  params: SyncBoundaryHighlightForPointParams,
): { boundaryName: string | null; jmcName: string | null } {
  const { entry, overlayLayers, regionBoundaryRefs, selectedBoundaryLayer } = params;
  const selectedBoundarySource = selectedBoundaryLayer?.getSource();
  if (!selectedBoundarySource) {
    return {
      boundaryName: null,
      jmcName: entry.jmcName,
    };
  }

  selectedBoundarySource.clear();
  const matchedBoundary = findBoundaryHighlightFeatureForPointCoordinate(
    entry.coordinate,
    overlayLayers,
    regionBoundaryRefs,
  );
  if (matchedBoundary) {
    selectedBoundarySource.addFeature(matchedBoundary.clone());
    return {
      boundaryName: getBoundaryName(matchedBoundary),
      jmcName: entry.jmcName,
    };
  }

  return {
    boundaryName: null,
    jmcName: entry.jmcName,
  };
}

export function syncJmcOutlineHighlight(
  params: SyncJmcOutlineHighlightParams,
): void {
  const {
    entry,
    activeViewPreset,
    selectedJmcBoundaryLayer,
    scenarioBoundarySource,
    jmcBoundaryLookupSource,
    getSelectedOutlineColor,
  } = params;
  const selectedJmcSource = selectedJmcBoundaryLayer?.getSource();
  if (!selectedJmcSource) {
    return;
  }

  selectedJmcSource.clear();
  const matchedJmcBoundaries = getSelectedJmcOutlineFeatures(
    entry.coordinate,
    entry.jmcName,
    activeViewPreset,
    scenarioBoundarySource,
    jmcBoundaryLookupSource,
  );
  for (const boundary of matchedJmcBoundaries) {
    const outline = boundary.clone();
    outline.set('selectionColor', getSelectedOutlineColor(boundary, activeViewPreset));
    selectedJmcSource.addFeature(outline);
  }
}

export function syncSelectedPointHighlight(
  params: SyncSelectedPointHighlightParams,
): void {
  const {
    entry,
    selectedPointLayer,
    createSelectedPointStyle,
  } = params;
  const selectedPointSource = selectedPointLayer?.getSource();
  if (selectedPointSource) {
    selectedPointSource.clear();
    selectedPointSource.addFeature(
      new Feature({
        geometry: new Point(entry.coordinate),
      }),
    );
  }

  if (selectedPointLayer) {
    selectedPointLayer.setStyle(
      createSelectedPointStyle(
        entry.symbolShape,
        entry.symbolSize,
        entry.hasVisibleBorder,
        entry.hasCombinedPracticeRing,
      ) as never,
    );
  }
}

export function syncSelectedRegionHighlightFromDerivedSource(
  params: SyncSelectedRegionHighlightFromDerivedSourceParams,
): boolean {
  const {
    selectedRegionId,
    selectedRegionName,
    selectionColor,
    derivedOutlineSource,
    selectedJmcBoundaryLayer,
  } = params;
  const selectedJmcSource = selectedJmcBoundaryLayer?.getSource();
  if (!selectedJmcSource) {
    return false;
  }

  selectedJmcSource.clear();
  if (!derivedOutlineSource) {
    return false;
  }

  const matchedOutlines = derivedOutlineSource.getFeatures().filter((feature) => {
    const outlineScenarioRegionId = String(
      feature.get('scenario_region_id') ?? '',
    ).trim();
    if (selectedRegionId && outlineScenarioRegionId) {
      return outlineScenarioRegionId === selectedRegionId;
    }

    if (!selectedRegionName) {
      return false;
    }

    return (
      String(
        feature.get('region_name') ??
          feature.get('jmc_name') ??
          feature.get('boundary_name') ??
          '',
      ).trim() === selectedRegionName
    );
  });

  if (matchedOutlines.length === 0) {
    return false;
  }

  for (const outlineFeature of matchedOutlines) {
    const clone = outlineFeature.clone();
    clone.set('selectionColor', selectionColor);
    selectedJmcSource.addFeature(clone);
  }

  return true;
}

export function syncSelectedRegionHighlightFromAvailableSources(
  params: SyncSelectedRegionHighlightFromAvailableSourcesParams,
): boolean {
  const {
    activeViewPreset,
    preferDerivedOutlineSource,
    selectedRegionId,
    selectedRegionName,
    selectionColor,
    currentOutlineFeature,
    derivedOutlineSource,
    selectedJmcBoundaryLayer,
  } = params;
  const selectedJmcSource = selectedJmcBoundaryLayer?.getSource();
  if (!selectedJmcSource) {
    return false;
  }

  selectedJmcSource.clear();

  if (activeViewPreset === 'current' && currentOutlineFeature) {
    selectedJmcSource.addFeature(currentOutlineFeature);
    return true;
  }

  if (!preferDerivedOutlineSource) {
    return false;
  }

  return syncSelectedRegionHighlightFromDerivedSource({
    selectedRegionId,
    selectedRegionName,
    selectionColor,
    derivedOutlineSource,
    selectedJmcBoundaryLayer,
  });
}
