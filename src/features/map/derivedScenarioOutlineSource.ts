import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import VectorSource from 'ol/source/Vector';
import dissolve from '@turf/dissolve';
import type {
  Feature as GeoJsonFeature,
  FeatureCollection as GeoJsonFeatureCollection,
  Polygon as GeoJsonPolygon,
} from 'geojson';
import { getScenarioBoundaryUnitId } from '../../lib/scenarioWorkspaceAssignments';

const geoJsonFormat = new GeoJSON();

interface RegionAssignment {
  regionId: string | null;
  regionName: string;
  features: Feature[];
}

interface BoundaryRegionAssignment {
  regionId: string | null;
  regionName: string;
}

export function buildDerivedScenarioOutlineSource(
  assignmentSource: VectorSource | null,
  topologyEdgeSource: VectorSource | null = null,
): VectorSource | null {
  if (!assignmentSource) {
    return null;
  }

  const topologyDerivedFeatures =
    topologyEdgeSource && topologyEdgeSource.getFeatures().length > 0
      ? createDerivedTopologyOutlineFeatures(assignmentSource, topologyEdgeSource)
      : [];
  if (topologyDerivedFeatures.length > 0) {
    const topologySource = new VectorSource();
    topologySource.addFeatures(topologyDerivedFeatures);
    return topologySource;
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

function createDerivedTopologyOutlineFeatures(
  assignmentSource: VectorSource,
  topologyEdgeSource: VectorSource,
): Feature<Geometry>[] {
  const assignmentsByBoundaryCode = new Map<string, BoundaryRegionAssignment>();

  for (const feature of assignmentSource.getFeatures()) {
    const boundaryCode = getFeatureBoundaryCode(feature);
    const regionName = getFeatureRegionName(feature);
    if (!boundaryCode || !regionName) {
      continue;
    }

    assignmentsByBoundaryCode.set(boundaryCode, {
      regionId: getFeatureScenarioRegionId(feature),
      regionName,
    });
  }

  if (assignmentsByBoundaryCode.size === 0) {
    return [];
  }

  const derivedFeatures: Feature<Geometry>[] = [];

  for (const edgeFeature of topologyEdgeSource.getFeatures()) {
    const leftCode = String(edgeFeature.get('left_code') ?? '').trim();
    const rightCode = String(edgeFeature.get('right_code') ?? '').trim();
    const leftAssignment = leftCode
      ? assignmentsByBoundaryCode.get(leftCode) ?? null
      : null;
    const rightAssignment = rightCode
      ? assignmentsByBoundaryCode.get(rightCode) ?? null
      : null;

    if (!leftAssignment && !rightAssignment) {
      continue;
    }

    if (leftAssignment && rightAssignment) {
      const sameRegion =
        leftAssignment.regionId && rightAssignment.regionId
          ? leftAssignment.regionId === rightAssignment.regionId
          : leftAssignment.regionName === rightAssignment.regionName;
      if (sameRegion) {
        continue;
      }
    }

    if (leftAssignment) {
      derivedFeatures.push(
        createDerivedTopologyEdgeFeature(edgeFeature, leftAssignment),
      );
    }

    if (
      rightAssignment &&
      (!leftAssignment ||
        rightAssignment.regionId !== leftAssignment.regionId ||
        rightAssignment.regionName !== leftAssignment.regionName)
    ) {
      derivedFeatures.push(
        createDerivedTopologyEdgeFeature(edgeFeature, rightAssignment),
      );
    }
  }

  return derivedFeatures;
}

function createDerivedTopologyEdgeFeature(
  edgeFeature: Feature,
  assignment: BoundaryRegionAssignment,
): Feature<Geometry> {
  const clone = edgeFeature.clone() as Feature<Geometry>;
  clone.set('region_name', assignment.regionName);
  clone.set('jmc_name', assignment.regionName);
  clone.set('boundary_name', assignment.regionName);
  if (assignment.regionId) {
    clone.set('scenario_region_id', assignment.regionId);
  } else {
    clone.unset('scenario_region_id', true);
  }
  return clone;
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

function getFeatureBoundaryCode(feature: Feature): string | null {
  return getScenarioBoundaryUnitId(
    feature.getProperties() as Record<string, unknown>,
  );
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
