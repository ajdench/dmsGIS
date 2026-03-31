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

interface RegionAssignment {
  regionId: string | null;
  regionName: string;
  features: Feature[];
}

export function buildDerivedScenarioOutlineSource(
  assignmentSource: VectorSource | null,
): VectorSource | null {
  if (!assignmentSource) {
    return null;
  }

  const featuresByRegion = new Map<string, RegionAssignment>();
  for (const feature of assignmentSource.getFeatures()) {
    const regionName = getFeatureRegionName(feature);
    if (!regionName) {
      continue;
    }

    const regionId = getFeatureScenarioRegionId(feature);
    const regionKey = regionId ?? regionName;
    const existing = featuresByRegion.get(regionKey);
    if (existing) {
      existing.features.push(feature);
      continue;
    }

    featuresByRegion.set(regionKey, {
      regionId,
      regionName,
      features: [feature],
    });
  }

  const derivedFeatures = [...featuresByRegion.values()].flatMap(
    ({ regionId, regionName, features }) =>
      createDerivedRegionFeatures(regionName, regionId, features),
  );
  if (derivedFeatures.length === 0) {
    return null;
  }

  const source = new VectorSource();
  source.addFeatures(derivedFeatures);
  return source;
}

function createDerivedRegionFeatures(
  regionName: string,
  regionId: string | null,
  features: Feature[],
): Feature[] {
  const polygonFeatures = features.flatMap((feature) =>
    getFeaturePolygonFeatures(regionName, feature),
  );
  if (polygonFeatures.length === 0) {
    return [];
  }

  const dissolved = dissolve(
    {
      type: 'FeatureCollection',
      features: polygonFeatures,
    } satisfies GeoJsonFeatureCollection<GeoJsonPolygon>,
    { propertyName: 'region_name' },
  );

  return geoJsonFormat
    .readFeatures(dissolved, {
      featureProjection: 'EPSG:3857',
    })
    .map((derivedFeature) => {
      derivedFeature.set('region_name', regionName);
      derivedFeature.set('jmc_name', regionName);
      derivedFeature.set('boundary_name', regionName);
      if (regionId) {
        derivedFeature.set('scenario_region_id', regionId);
      }
      return derivedFeature;
    });
}

function getFeatureScenarioRegionId(feature: Feature): string | null {
  return String(feature.get('scenario_region_id') ?? '').trim() || null;
}

function getFeatureRegionName(feature: Feature): string {
  return String(
    feature.get('region_name') ?? feature.get('jmc_name') ?? '',
  ).trim();
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
    return geometry.coordinates.map(
      (coordinates): GeoJsonFeature<GeoJsonPolygon> => ({
        type: 'Feature',
        properties: { region_name: regionName },
        geometry: {
          type: 'Polygon',
          coordinates,
        },
      }),
    );
  }

  return [];
}
