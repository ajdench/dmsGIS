import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import type VectorLayer from 'ol/layer/Vector';
import type VectorSource from 'ol/source/Vector';
import { getScenarioRegionName, isScenarioPreset } from '../../lib/config/viewPresets';
import type { RegionBoundaryLayerStyle, ViewPresetId } from '../../types';

export function getBoundaryName(feature: Feature): string {
  const value =
    feature.get('region_name') ??
    feature.get('region_ref') ??
    feature.get('boundary_name') ??
    feature.get('parent_name') ??
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
  regionBoundaryLayers: RegionBoundaryLayerStyle[],
  regionBoundaryRefs: globalThis.Map<string, VectorLayer<VectorSource>>,
): Feature | null {
  for (const config of regionBoundaryLayers) {
    if (config.id !== 'careBoardBoundaries') continue;
    if (!config.visible) continue;
    const layer = regionBoundaryRefs.get(config.id);
    const source = layer?.getSource();
    if (!source) continue;
    const hit = source
      .getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate));
    if (hit) {
      return hit;
    }
  }

  return null;
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

  return (
    source
      .getFeatures()
      .find((feature) => feature.getGeometry()?.intersectsCoordinate(coordinate)) ?? null
  );
}

function getJmcRegionName(feature: FeatureLike): string {
  return String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim();
}

function getScenarioJmcName(
  feature: FeatureLike,
  activeViewPreset: ViewPresetId = 'current',
): string {
  const regionName = getJmcRegionName(feature);
  const boundaryName = String(feature.get('boundary_name') ?? '').trim();
  return getScenarioRegionName(activeViewPreset, regionName, boundaryName);
}
