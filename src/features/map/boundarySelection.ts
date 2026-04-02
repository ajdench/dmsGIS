import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import dissolve from '@turf/dissolve';
import union from '@turf/union';
import type {
  Feature as GeoJsonFeature,
  FeatureCollection as GeoJsonFeatureCollection,
  LineString as GeoJsonLineString,
  MultiLineString as GeoJsonMultiLineString,
  Polygon as GeoJsonPolygon,
} from 'geojson';
import {
  getGroupNameForCode,
  getGroupOutlinePath,
  getRegionGroup,
  getScenarioWardSplitParentCodes,
  isScenarioPreset,
} from '../../lib/config/viewPresets';
import type { OverlayLayerStyle, SelectionState, ViewPresetId } from '../../types';
import {
  resolvePlaygroundBoundaryAssignment,
  type ScenarioBoundaryUnitAssignment,
} from './scenarioAssignmentAuthority';
import { findFeatureContainingCoordinate } from './featureSpatialLookup';

interface ApplyBoundarySelectionParams {
  feature: Feature | null;
  coordinate?: [number, number];
  selectedBoundaryLayer: VectorLayer<VectorSource>;
  selectedJmcBoundaryLayer: VectorLayer<VectorSource>;
  assignmentByBoundaryName: Map<string, string>;
  assignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
  assignmentSource: VectorSource | null;
  boundarySource: VectorSource | null;
  activeViewPreset: ViewPresetId;
}

export interface AppliedBoundarySelectionState {
  boundaryName: string | null;
  jmcName: string | null;
  scenarioRegionId: string | null;
  selection: SelectionState;
}

export function getBoundaryName(feature: Feature): string {
  const value =
    feature.get('ward_name') ??
    feature.get('boundary_name') ??
    feature.get('parent_name') ??
    feature.get('region_name') ??
    feature.get('region_ref') ??
    feature.get('name') ??
    feature.get('NAME') ??
    feature.get('component_name');
  if (value === undefined || value === null || String(value).trim() === '') {
    return 'Boundary';
  }
  return String(value);
}

export function findCareBoardBoundaryAtCoordinate(
  coordinate: [number, number],
  overlayLayers: OverlayLayerStyle[],
  overlayLayerRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): Feature | null {
  const regionFillSource = overlayLayerRefs.get('regionFill')?.getSource() ?? null;
  const orderedOverlayLayers = [...overlayLayers].sort((a, b) => {
    const getPriority = (family: string) => {
      if (family === 'wardSplitWards') return 0;
      if (family === 'wardSplitFill') return 1;
      return 2;
    };
    const aPriority = getPriority(a.family);
    const bPriority = getPriority(b.family);
    return aPriority - bPriority;
  });

  for (const config of orderedOverlayLayers) {
    if (
      config.family !== 'regionFill' &&
      config.family !== 'wardSplitFill' &&
      config.family !== 'wardSplitWards'
    ) continue;
    if (!config.visible) continue;
    const layer = overlayLayerRefs.get(config.id);
    const source = layer?.getSource();
    if (!source) continue;
    const hit = findFeatureContainingCoordinate(source, coordinate);
    if (hit) {
      if (config.family === 'wardSplitWards') {
        return hit as Feature;
      }
      return resolveSplitBoundaryParentFeature(hit as Feature, regionFillSource) ?? (hit as Feature);
    }
  }

  return null;
}

export function findBoundaryHighlightFeatureForPointCoordinate(
  coordinate: [number, number],
  overlayLayers: OverlayLayerStyle[],
  overlayLayerRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): Feature | null {
  const matchedBoundary = findCareBoardBoundaryAtCoordinate(
    coordinate,
    overlayLayers,
    overlayLayerRefs,
  );
  if (!matchedBoundary) return null;
  return matchedBoundary;
}

const _geoJsonFormat = new GeoJSON({ featureProjection: 'EPSG:3857' });
const CURRENT_OUTLINE_SNAP_DECIMALS = 5;

function resolveSplitBoundaryParentFeature(
  feature: Feature,
  regionFillSource: VectorSource | null,
): Feature | null {
  const parentCode = String(feature.get('parent_code') ?? '').trim();
  if (!parentCode || !regionFillSource) {
    return null;
  }

  const parentFeature =
    regionFillSource
      .getFeatures()
      .find((candidate) => String(candidate.get('boundary_code') ?? '').trim() === parentCode) ??
    null;
  if (!parentFeature) {
    return null;
  }

  const splitRegionRef = String(feature.get('region_ref') ?? '').trim();
  const clonedParent = parentFeature.clone();
  if (splitRegionRef) {
    clonedParent.set('selection_region_ref', splitRegionRef);
    clonedParent.set('region_ref', splitRegionRef);
  }
  clonedParent.set('selection_parent_code', parentCode);
  clonedParent.set('selected_split_boundary_code', String(feature.get('boundary_code') ?? '').trim());
  return clonedParent;
}

/**
 * Async-loads the pre-computed exterior arc GeoJSON for a group and returns
 * a feature tagged with `selectionColor` for the selectedJmcBoundaryLayer.
 */
export async function loadGroupOutlineFeature(
  preset: ViewPresetId,
  groupName: string,
  resolveUrl: (path: string) => string,
): Promise<Feature | null> {
  const path = getGroupOutlinePath(preset, groupName);
  const url = resolveUrl(path);
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const geojson = await response.json() as unknown;
    const features = _geoJsonFormat.readFeatures(geojson);
    if (!features.length) return null;
    const group = getRegionGroup(preset, groupName);
    features[0].set('selectionColor', group?.colors.outline ?? '#419632');
    return features[0] as Feature;
  } catch {
    return null;
  }
}

export async function loadGroupOutlineFeatures(
  preset: ViewPresetId,
  groupNames: string[],
  resolveUrl: (path: string) => string,
): Promise<Feature[]> {
  const features = await Promise.all(
    groupNames.map((groupName) => loadGroupOutlineFeature(preset, groupName, resolveUrl)),
  );
  return features.filter((feature): feature is Feature => feature instanceof Feature);
}

export function deriveCurrentGroupOutlineFeature(
  groupName: string,
  overlayLayerRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): Feature | null {
  const regionFillSource = overlayLayerRefs.get('regionFill')?.getSource();
  const wardSplitSource = overlayLayerRefs.get('wardSplitFill')?.getSource();
  if (!regionFillSource && !wardSplitSource) {
    return null;
  }

  const hiddenParentCodes = getScenarioWardSplitParentCodes('current');
  const regularGroupFeatures =
    regionFillSource?.getFeatures().filter((feature) => {
      const boundaryCode = String(feature.get('boundary_code') ?? '').trim();
      if (!boundaryCode || hiddenParentCodes.has(boundaryCode)) {
        return false;
      }
      return getGroupNameForCode('current', boundaryCode) === groupName;
    }) ?? [];

  const splitGroupFeatures =
    wardSplitSource?.getFeatures().filter(
      (feature) => String(feature.get('region_ref') ?? '').trim() === groupName,
    ) ?? [];

  const features = [...regularGroupFeatures, ...splitGroupFeatures];
  if (features.length === 0) {
    return null;
  }

  try {
    return createDerivedOutlineFeature(groupName, features);
  } catch {
    return null;
  }
}

export function findJmcNameAtCoordinate(
  coordinate: [number, number],
  assignmentSource: VectorSource | null,
  boundarySource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string | null {
  const assignmentFeature =
    assignmentSource
      ?.getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate)) ?? null;
  if (assignmentFeature) {
    const jmcName = getScenarioJmcName(assignmentFeature, activeViewPreset);
    return jmcName || null;
  }

  const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, boundarySource);
  if (!boundaryFeature) return null;

  const jmcName = getScenarioJmcName(boundaryFeature, activeViewPreset);
  return jmcName || null;
}

export function findJmcNameForBoundarySelection(
  feature: Feature,
  coordinate: [number, number] | undefined,
  assignmentByBoundaryName: Map<string, string>,
  assignmentSource: VectorSource | null,
  boundarySource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string | null {
  const directJmcName = getScenarioJmcName(feature, activeViewPreset);
  if (directJmcName) {
    return directJmcName;
  }

  const boundaryName = getBoundaryName(feature);
  const mappedJmcName = assignmentByBoundaryName.get(boundaryName);
  if (mappedJmcName) {
    return getScenarioJmcName(
      new Feature({
        boundary_name: boundaryName,
        jmc_name: mappedJmcName,
      }),
      activeViewPreset,
    );
  }

  if (!coordinate) {
    return null;
  }

  return findJmcNameAtCoordinate(
    coordinate,
    assignmentSource,
    boundarySource,
    activeViewPreset,
  );
}

export function applyBoundarySelection(
  params: ApplyBoundarySelectionParams,
): AppliedBoundarySelectionState {
  const {
    feature,
    coordinate,
    selectedBoundaryLayer,
    selectedJmcBoundaryLayer,
    assignmentByBoundaryName,
    assignmentByBoundaryUnitId,
    assignmentSource,
    boundarySource,
    activeViewPreset,
  } = params;
  const selectedSource = selectedBoundaryLayer.getSource();
  const selectedJmcSource = selectedJmcBoundaryLayer.getSource();

  if (!selectedSource) {
    return {
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
        scenarioRegionId: null,
      },
    };
  }

  selectedSource.clear();
  selectedJmcSource?.clear();

  if (!feature) {
    return {
      boundaryName: null,
      jmcName: null,
      scenarioRegionId: null,
      selection: {
        facilityIds: [],
        boundaryName: null,
        jmcName: null,
        scenarioRegionId: null,
      },
    };
  }

  selectedSource.addFeature(feature.clone());
  const boundaryName = getBoundaryName(feature);
  const jmcName = findJmcNameForBoundarySelection(
    feature,
    coordinate,
    assignmentByBoundaryName,
    assignmentSource,
    boundarySource,
    activeViewPreset,
  );
  const scenarioRegionId =
    resolvePlaygroundBoundaryAssignment({
      boundaryProperties: feature.getProperties() as Record<string, unknown>,
      workspaceId: null,
      assignmentByBoundaryUnitId,
    })?.scenarioRegionId ??
    (String(feature.get('scenario_region_id') ?? '').trim() || null);

  return {
    boundaryName,
    jmcName,
    scenarioRegionId,
    selection: {
      facilityIds: [],
      boundaryName,
      jmcName,
      scenarioRegionId,
    },
  };
}

export function getSelectedJmcOutlineFeatures(
  coordinate: [number, number],
  jmcName: string | null,
  activeViewPreset: ViewPresetId,
  scenarioBoundarySource: VectorSource | null,
  boundarySource: VectorSource | null,
): Feature[] {
  if (isScenarioPreset(activeViewPreset) && scenarioBoundarySource) {
    if (jmcName) {
      const matchedFeatures = scenarioBoundarySource
        .getFeatures()
        .filter((feature) => getScenarioJmcName(feature, activeViewPreset) === jmcName);
      if (matchedFeatures.length > 0) {
        return matchedFeatures;
      }
    }

    const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, scenarioBoundarySource);
    return boundaryFeature ? [boundaryFeature] : [];
  }

  const boundaryFeature = findJmcBoundaryAtCoordinate(coordinate, boundarySource);
  return boundaryFeature ? [boundaryFeature] : [];
}

function findJmcBoundaryAtCoordinate(
  coordinate: [number, number],
  source: VectorSource | null,
): Feature | null {
  if (!source) return null;
  return findFeatureContainingCoordinate(source, coordinate) as Feature | null;
}

function getScenarioJmcName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string {
  const runtimeScenarioRegionId = String(feature.get('scenario_region_id') ?? '').trim();
  if (runtimeScenarioRegionId) {
    const runtimeRegionName = String(
      feature.get('region_name') ?? feature.get('jmc_name') ?? '',
    ).trim();
    if (runtimeRegionName) {
      return runtimeRegionName;
    }
  }
  const selectedRegionRef = String(
    feature.get('selection_region_ref') ?? '',
  ).trim();
  if (selectedRegionRef) {
    return selectedRegionRef;
  }
  // Ward-split sub-polygons carry region_ref as the direct DPHC group name and
  // should override the hidden parent-board default mapping.
  const regionRef = String(feature.get('region_ref') ?? '').trim();
  if (regionRef) return regionRef;
  // Primary: boundary_code → codeGroupings lookup (main GeoJSON features).
  const boundaryCode = String(feature.get('boundary_code') ?? '').trim();
  if (boundaryCode) {
    const mappedGroupName = getGroupNameForCode(activeViewPreset, boundaryCode);
    if (mappedGroupName) {
      return mappedGroupName;
    }
  }
  // Legacy fallback: read pre-baked group name directly from feature properties.
  return String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim();
}

function createDerivedOutlineFeature(
  groupName: string,
  features: Feature[],
): Feature | null {
  const polygonFeatures = features.flatMap((feature) => getFeaturePolygonFeatures(groupName, feature));
  if (polygonFeatures.length === 0) {
    return null;
  }

  const firstFeature = polygonFeatures.length === 1
    ? polygonFeatures[0]
    : (
        union(
          {
            type: 'FeatureCollection',
            features: polygonFeatures,
          } satisfies GeoJsonFeatureCollection<GeoJsonPolygon>,
          { properties: { region_name: groupName } },
        ) ??
        dissolve(
          {
            type: 'FeatureCollection',
            features: polygonFeatures,
          } satisfies GeoJsonFeatureCollection<GeoJsonPolygon>,
          { propertyName: 'region_name' },
        ).features[0]
      );
  if (!firstFeature) {
    return null;
  }

  const outlineFeatureObject = convertPolygonFeatureToExteriorOutline(
    snapPolygonFeatureCoordinates(firstFeature, CURRENT_OUTLINE_SNAP_DECIMALS),
  );
  const [derivedFeature] = _geoJsonFormat.readFeatures(
    {
      type: 'FeatureCollection',
      features: [outlineFeatureObject],
    },
    {
      featureProjection: 'EPSG:3857',
    },
  );
  if (!derivedFeature) {
    return null;
  }
  derivedFeature.set('region_name', groupName);
  derivedFeature.set('jmc_name', groupName);
  derivedFeature.set('boundary_name', groupName);
  derivedFeature.set('selectionColor', getRegionGroup('current', groupName)?.colors.outline ?? '#419632');
  return derivedFeature as Feature;
}

function getFeaturePolygonFeatures(
  groupName: string,
  feature: Feature,
): GeoJsonFeature<GeoJsonPolygon>[] {
  const geoJsonFeature = snapPolygonFeatureCoordinates(
    _geoJsonFormat.writeFeatureObject(feature, {
      featureProjection: 'EPSG:3857',
    }) as GeoJsonFeature,
    CURRENT_OUTLINE_SNAP_DECIMALS,
  );
  const geometry = geoJsonFeature.geometry;
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    return [
      {
        type: 'Feature',
        properties: { region_name: groupName },
        geometry,
      },
    ];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coordinates) => ({
      type: 'Feature',
      properties: { region_name: groupName },
      geometry: {
        type: 'Polygon',
        coordinates,
      },
    }));
  }

  return [];
}

function snapPolygonFeatureCoordinates(
  feature: GeoJsonFeature,
  decimals: number,
): GeoJsonFeature {
  const geometry = feature.geometry;
  if (!geometry) {
    return feature;
  }

  const factor = 10 ** decimals;
  const snapValue = (value: number) => Math.round(value * factor) / factor;
  const snapRing = (ring: number[][]) => ring.map(([x, y]) => [snapValue(x), snapValue(y)]);

  if (geometry.type === 'Polygon') {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: geometry.coordinates.map(snapRing),
      },
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) => polygon.map(snapRing)),
      },
    };
  }

  return feature;
}

function convertPolygonFeatureToExteriorOutline(
  feature: GeoJsonFeature,
): GeoJsonFeature<GeoJsonLineString | GeoJsonMultiLineString> {
  const geometry = feature.geometry;
  if (!geometry) {
    return {
      type: 'Feature',
      properties: { ...feature.properties },
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    };
  }

  if (geometry.type === 'Polygon') {
    return {
      type: 'Feature',
      properties: { ...feature.properties },
      geometry: {
        type: 'LineString',
        coordinates: geometry.coordinates[0] ?? [],
      },
    };
  }

  if (geometry.type === 'MultiPolygon') {
    return {
      type: 'Feature',
      properties: { ...feature.properties },
      geometry: {
        type: 'MultiLineString',
        coordinates: geometry.coordinates
          .map((polygon) => polygon[0] ?? [])
          .filter((coords) => coords.length > 0),
      },
    };
  }

  return {
    type: 'Feature',
    properties: { ...feature.properties },
    geometry: {
      type: 'LineString',
      coordinates: [],
    },
  };
}
