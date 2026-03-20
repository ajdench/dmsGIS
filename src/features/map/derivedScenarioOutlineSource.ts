import Feature from 'ol/Feature';
import type { FeatureLike } from 'ol/Feature';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';

export function buildDerivedScenarioOutlineSource(
  assignmentSource: VectorSource | null,
): VectorSource | null {
  if (!assignmentSource) {
    return null;
  }

  const featuresByRegion = new Map<string, FeatureLike[]>();
  for (const feature of assignmentSource.getFeatures()) {
    const regionName = String(
      feature.get('region_name') ?? feature.get('jmc_name') ?? '',
    ).trim();
    if (!regionName) {
      continue;
    }
    const existing = featuresByRegion.get(regionName);
    if (existing) {
      existing.push(feature);
    } else {
      featuresByRegion.set(regionName, [feature]);
    }
  }

  const derivedFeatures = [...featuresByRegion.entries()]
    .map(([regionName, features]) => createDerivedRegionFeature(regionName, features))
    .filter((feature): feature is Feature => feature !== null);

  const source = new VectorSource();
  source.addFeatures(derivedFeatures);
  return source;
}

function createDerivedRegionFeature(
  regionName: string,
  features: FeatureLike[],
): Feature | null {
  const coordinates = features.flatMap((feature) =>
    getFeaturePolygonCoordinates(feature),
  );
  if (coordinates.length === 0) {
    return null;
  }

  return new Feature({
    geometry: new MultiPolygon(coordinates),
    region_name: regionName,
    jmc_name: regionName,
    boundary_name: regionName,
  });
}

function getFeaturePolygonCoordinates(feature: FeatureLike): number[][][][] {
  const geometry = feature.getGeometry();
  if (!geometry) {
    return [];
  }

  if (geometry instanceof Polygon) {
    return [geometry.getCoordinates()];
  }

  if (geometry instanceof MultiPolygon) {
    return geometry.getCoordinates();
  }

  return [];
}
