import { describe, expect, it, vi } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import {
  buildFeatureNameMap,
  loadOverlayAssignmentDataset,
  loadOverlayLookupDatasets,
} from '../src/features/map/overlayLookupBootstrap';

describe('overlayLookupBootstrap', () => {
  it('builds a lookup map from feature-derived key/value pairs', () => {
    const features = [
      new Feature({
        boundary_name: 'Boundary A',
        region_name: 'Region North',
      }),
      new Feature({
        boundary_name: 'Boundary B',
        region_name: 'Region South',
      }),
    ];

    expect(
      buildFeatureNameMap(
        features,
        (feature) => String(feature.get('boundary_name') ?? ''),
        (feature) => String(feature.get('region_name') ?? ''),
      ),
    ).toEqual(
      new Map([
        ['Boundary A', 'Region North'],
        ['Boundary B', 'Region South'],
      ]),
    );
  });

  it('loads generic lookup datasets into their registered sources', async () => {
    const currentSource = new VectorSource();
    const scenarioSource = new VectorSource();
    const geojson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: 'Lookup A' },
          geometry: {
            type: 'Point',
            coordinates: [1, 2],
          },
        },
      ],
    };
    const fetchJson = vi.fn(async () => geojson);

    await loadOverlayLookupDatasets({
      datasets: [
        {
          key: 'current',
          path: 'data/regions/current.geojson',
          source: currentSource,
          errorLabel: 'current failed',
        },
        {
          key: 'coa3a',
          path: 'data/regions/coa3a.geojson',
          source: scenarioSource,
          errorLabel: 'scenario failed',
        },
      ],
      resolveUrl: (path) => `https://example.test/${path}`,
      fetchJson,
    });

    expect(fetchJson).toHaveBeenCalledTimes(2);
    expect(currentSource.getFeatures()).toHaveLength(1);
    expect(scenarioSource.getFeatures()).toHaveLength(1);
  });

  it('loads assignment features and returns a boundary-name lookup map', async () => {
    const source = new VectorSource();
    const fetchJson = vi.fn(async () => ({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            boundary_name: 'Boundary A',
            region_name: 'North',
          },
          geometry: {
            type: 'Point',
            coordinates: [1, 2],
          },
        },
      ],
    }));

    const result = await loadOverlayAssignmentDataset({
      dataset: {
        path: 'data/regions/assignments.geojson',
        source,
        errorLabel: 'assignment failed',
      },
      resolveUrl: (path) => `https://example.test/${path}`,
      fetchJson,
      getBoundaryName: (feature) => String(feature.get('boundary_name') ?? ''),
      getAssignmentName: (feature) => String(feature.get('region_name') ?? ''),
    });

    expect(source.getFeatures()).toHaveLength(1);
    expect(source.getFeatures()[0].getGeometry()).toBeInstanceOf(Point);
    expect(result).toEqual(new Map([['Boundary A', 'North']]));
  });
});
