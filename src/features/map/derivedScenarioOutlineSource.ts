import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import VectorSource from 'ol/source/Vector';
import dissolve from '@turf/dissolve';
import type {
  Feature as GeoJsonFeature,
  FeatureCollection as GeoJsonFeatureCollection,
  Polygon as GeoJsonPolygon,
} from 'geojson';

const geoJsonFormat = new GeoJSON();

export function buildDerivedScenarioOutlineSource(
  assignmentSource: VectorSource | null,
): VectorSource | null {
  if (!assignmentSource) {
    return null;
  }

  const featuresByRegion = new Map<string, Feature[]>();
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
  features: Feature[],
): Feature | null {
  const polygonFeatures = features.flatMap((feature) =>
    getFeaturePolygonFeatures(regionName, feature),
  );
  if (polygonFeatures.length === 0) {
    return null;
  }

  const dissolved = dissolve(
    {
      type: 'FeatureCollection',
      features: polygonFeatures,
    } satisfies GeoJsonFeatureCollection<GeoJsonPolygon>,
    { propertyName: 'region_name' },
  );
  const firstFeature = dissolved.features[0];
  if (!firstFeature) {
    return null;
  }

  const [derivedFeature] = geoJsonFormat.readFeatures(
    {
      type: 'FeatureCollection',
      features: [firstFeature],
    },
    {
      featureProjection: 'EPSG:3857',
    },
  );
  if (!derivedFeature) {
    return null;
  }
  derivedFeature.set('region_name', regionName);
  derivedFeature.set('jmc_name', regionName);
  derivedFeature.set('boundary_name', regionName);
  return derivedFeature;
}

function getFeaturePolygonFeatures(
  regionName: string,
  feature: Feature,
): GeoJsonFeature<GeoJsonPolygon>[] {
  const geoJsonFeature = geoJsonFormat.writeFeatureObject(feature, {
    featureProjection: 'EPSG:3857',
  }) as GeoJsonFeature;
  const geometry = geoJsonFeature.geometry;
  if (!geometry) {
    return [];
  }

  if (geometry.type === 'Polygon') {
    return [
      {
        type: 'Feature',
        properties: { region_name: regionName },
        geometry,
      },
    ];
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((coordinates) => ({
      type: 'Feature',
      properties: { region_name: regionName },
      geometry: {
        type: 'Polygon',
        coordinates,
      },
    }));
  }

  return [];
}
