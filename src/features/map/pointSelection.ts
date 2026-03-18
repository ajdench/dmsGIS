import type OLMap from 'ol/Map';
import type Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import type {
  FacilitySymbolShape,
  RegionBoundaryLayerStyle,
  RegionStyle,
  ViewPresetId,
} from '../../types';

export interface PointTooltipEntry {
  facilityName: string;
  coordinate: [number, number];
  boundaryName: string | null;
  hasVisibleBorder: boolean;
  symbolSize: number;
  jmcName: string | null;
}

interface PointSelectionCandidate {
  key: string;
  feature: FeatureLike;
  pixel: [number, number];
  radius: number;
}

export function getPointCoordinate(feature: FeatureLike): [number, number] | null {
  if (typeof (feature as Feature).getGeometry === 'function') {
    const geometry = (feature as Feature).getGeometry();
    if (
      geometry &&
      geometry.getType() === 'Point' &&
      typeof
        (geometry as unknown as { getCoordinates?: () => number[] })
          .getCoordinates === 'function'
    ) {
      const coordinates = (
        geometry as unknown as { getCoordinates: () => number[] }
      ).getCoordinates();
      if (coordinates.length >= 2) {
        return [coordinates[0], coordinates[1]];
      }
    }
  }

  const renderFeature = feature as unknown as {
    getType?: () => string;
    getFlatCoordinates?: () => number[];
  };
  if (
    typeof renderFeature.getType === 'function' &&
    renderFeature.getType() === 'Point' &&
    typeof renderFeature.getFlatCoordinates === 'function'
  ) {
    const flatCoordinates = renderFeature.getFlatCoordinates();
    if (flatCoordinates.length >= 2) {
      return [flatCoordinates[0], flatCoordinates[1]];
    }
  }

  return null;
}

export function getDirectPointHitsAtPixel(
  map: OLMap,
  pixel: number[],
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): FeatureLike[] {
  const hits = map.getFeaturesAtPixel(pixel, {
    hitTolerance: 0,
    layerFilter: (layerCandidate) =>
      pointLayers.has(layerCandidate as VectorLayer<VectorSource>),
  });

  return hits.filter((feature) => {
    const coordinate = getPointCoordinate(feature);
    if (!coordinate) return false;
    const featurePixel = map.getPixelFromCoordinate(coordinate);
    const dx = featurePixel[0] - pixel[0];
    const dy = featurePixel[1] - pixel[1];
    const distance = Math.hypot(dx, dy);
    const radius = getPointSelectionRadius(
      feature,
      regionsByName,
      facilitySymbolShape,
      facilitySymbolSize,
    );
    return distance <= radius + 0.75;
  });
}

export function expandPointHitCluster(
  map: OLMap,
  seedFeatures: FeatureLike[],
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
  clickPixel: number[],
): FeatureLike[] {
  const candidates = collectVisiblePointCandidates(
    map,
    pointLayers,
    regionsByName,
    facilitySymbolShape,
    facilitySymbolSize,
  );
  const candidatesByKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const seeds: PointSelectionCandidate[] = [];
  const selected = new Set<string>();

  for (const feature of seedFeatures) {
    const candidate = getPointSelectionCandidate(
      map,
      feature,
      regionsByName,
      facilitySymbolShape,
      facilitySymbolSize,
    );
    if (!candidate || selected.has(candidate.key)) continue;
    seeds.push(candidate);
    selected.add(candidate.key);
  }

  for (const candidate of candidates) {
    if (selected.has(candidate.key)) continue;
    if (seeds.some((seed) => pointCandidatesOverlap(seed, candidate))) {
      selected.add(candidate.key);
    }
  }

  return [...selected]
    .map((key) => candidatesByKey.get(key))
    .filter((candidate): candidate is PointSelectionCandidate => candidate !== undefined)
    .map((candidate) => candidate.feature)
    .sort((a, b) => {
      const aCoordinate = getPointCoordinate(a);
      const bCoordinate = getPointCoordinate(b);
      if (aCoordinate && bCoordinate) {
        const aPixel = map.getPixelFromCoordinate(aCoordinate);
        const bPixel = map.getPixelFromCoordinate(bCoordinate);
        const aDistance = Math.hypot(
          aPixel[0] - clickPixel[0],
          aPixel[1] - clickPixel[1],
        );
        const bDistance = Math.hypot(
          bPixel[0] - clickPixel[0],
          bPixel[1] - clickPixel[1],
        );
        if (aDistance !== bDistance) {
          return aDistance - bDistance;
        }
      }

      const aName = String(a.get('name') ?? '');
      const bName = String(b.get('name') ?? '');
      return aName.localeCompare(bName);
    });
}

export function collectPointTooltipEntries(params: {
  features: FeatureLike[];
  fallbackCoordinate: [number, number];
  regions: RegionStyle[];
  activeViewPreset: ViewPresetId;
  getBoundaryNameAtCoordinate: (coordinate: [number, number]) => string | null;
  getJmcNameAtCoordinate: (
    coordinate: [number, number],
    activeViewPreset: ViewPresetId,
  ) => string | null;
}): PointTooltipEntry[] {
  const {
    features,
    fallbackCoordinate,
    regions,
    activeViewPreset,
    getBoundaryNameAtCoordinate,
    getJmcNameAtCoordinate,
  } = params;
  const entries: PointTooltipEntry[] = [];
  const seen = new Set<string>();
  const regionsByName = new Map(regions.map((region) => [region.name, region]));

  for (const feature of features) {
    const rawName = feature.get('name');
    if (rawName === undefined || rawName === null) continue;
    const name = String(rawName).trim();
    if (!name) continue;

    const coordinate = getPointCoordinate(feature) ?? fallbackCoordinate;
    const boundaryName = getBoundaryNameAtCoordinate(coordinate);
    const jmcName = getJmcNameAtCoordinate(coordinate, activeViewPreset);
    const regionName = String(feature.get('region') ?? 'Unassigned');
    const regionStyle = regionsByName.get(regionName);
    const hasVisibleBorder =
      (regionStyle?.borderVisible ?? true) &&
      (regionStyle?.borderOpacity ?? 1) > 0.01;
    const symbolSize = regionStyle?.symbolSize ?? 3.5;
    const key = `${name}:${coordinate[0].toFixed(3)}:${coordinate[1].toFixed(3)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    entries.push({
      facilityName: name,
      coordinate,
      boundaryName,
      hasVisibleBorder,
      symbolSize,
      jmcName,
    });
  }

  return entries;
}

function collectVisiblePointCandidates(
  map: OLMap,
  pointLayers: Set<VectorLayer<VectorSource>>,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): PointSelectionCandidate[] {
  const candidates: PointSelectionCandidate[] = [];

  for (const layer of pointLayers) {
    const source = layer.getSource();
    if (!source) continue;

    for (const feature of source.getFeatures()) {
      if (!isPointFeatureSelectable(feature, regionsByName)) continue;
      const candidate = getPointSelectionCandidate(
        map,
        feature,
        regionsByName,
        facilitySymbolShape,
        facilitySymbolSize,
      );
      if (candidate) {
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

function getPointSelectionCandidate(
  map: OLMap,
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): PointSelectionCandidate | null {
  const coordinate = getPointCoordinate(feature);
  if (!coordinate) return null;

  const name = String(feature.get('name') ?? '').trim();
  const pixel = map.getPixelFromCoordinate(coordinate);
  const radius = getPointSelectionRadius(
    feature,
    regionsByName,
    facilitySymbolShape,
    facilitySymbolSize,
  );

  return {
    key: `${name}:${coordinate[0].toFixed(6)}:${coordinate[1].toFixed(6)}`,
    feature,
    pixel: [pixel[0], pixel[1]],
    radius,
  };
}

function isPointFeatureSelectable(
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
): boolean {
  const regionName = String(feature.get('region') ?? 'Unassigned');
  const regionStyle = regionsByName.get(regionName);
  const defaultVisible = Number(feature.get('default_visible') ?? 1) !== 0;

  if (regionStyle) {
    return regionStyle.visible;
  }

  return defaultVisible;
}

function getPointSelectionRadius(
  feature: FeatureLike,
  regionsByName: Map<string, RegionStyle>,
  facilitySymbolShape: FacilitySymbolShape,
  facilitySymbolSize: number,
): number {
  const regionName = String(feature.get('region') ?? 'Unassigned');
  const regionStyle = regionsByName.get(regionName);
  const symbolSize = regionStyle?.symbolSize ?? facilitySymbolSize;
  const borderVisible = regionStyle?.borderVisible ?? true;
  const borderOpacity = regionStyle?.borderOpacity ?? 1;
  const borderWidth = borderVisible && borderOpacity > 0.01 ? 1 : 0;

  return getRenderedPointPixelRadius(facilitySymbolShape, symbolSize, borderWidth);
}

function pointCandidatesOverlap(
  a: PointSelectionCandidate,
  b: PointSelectionCandidate,
): boolean {
  const dx = a.pixel[0] - b.pixel[0];
  const dy = a.pixel[1] - b.pixel[1];
  const distance = Math.hypot(dx, dy);
  return distance <= a.radius + b.radius + 0.75;
}

function getRenderedPointPixelRadius(
  shape: FacilitySymbolShape,
  size: number,
  borderWidth: number,
): number {
  if (shape === 'circle') {
    return size + borderWidth;
  }

  if (shape === 'square' || shape === 'diamond') {
    return size * 1.05 + borderWidth;
  }

  return size * 1.15 + borderWidth;
}
