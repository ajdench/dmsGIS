import type VectorSource from 'ol/source/Vector';
import VectorSourceImpl from 'ol/source/Vector';
import { buildFeatureNameMap } from './overlayLookupBootstrap';
import { buildDerivedScenarioOutlineSource } from './derivedScenarioOutlineSource';

export interface CurrentRegionRuntimeState {
  outlineSource: VectorSource | null;
  regionByBoundaryCode: Map<string, string>;
}

export function buildCurrentRegionRuntimeState(
  componentSources: Array<VectorSource | null>,
  prebuiltOutlineSource: VectorSource | null = null,
): CurrentRegionRuntimeState {
  const features = componentSources.flatMap((source) => source?.getFeatures() ?? []);
  const prebuiltFeatures = prebuiltOutlineSource?.getFeatures() ?? [];
  const normalizedFeatures = features
    .filter((feature) => String(feature.get('region_ref') ?? '').trim().length > 0)
    .map((feature) => {
      const clone = feature.clone();
      const regionName = String(feature.get('region_ref') ?? '').trim();
      clone.set('region_name', regionName);
      clone.set('jmc_name', regionName);
      clone.set('boundary_name', regionName);
      return clone;
    });

  return {
    outlineSource:
      prebuiltFeatures.length > 0
        ? prebuiltOutlineSource
        : buildDerivedScenarioOutlineSource(
            new VectorSourceImpl({
              features: normalizedFeatures,
            }),
          ),
    regionByBoundaryCode: buildFeatureNameMap(
      features,
      (feature) => String(feature.get('parent_code') ?? ''),
      (feature) => String(feature.get('region_ref') ?? ''),
    ),
  };
}
