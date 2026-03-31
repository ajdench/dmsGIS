import { describe, expect, it } from 'vitest';
import {
  createHoleFreeLandmaskGeoJson,
  getActiveCoastalEnvelopeExactPaths,
  getActiveCoastalEnvelopeLandmaskPath,
  getActivePreprocessLandmaskPath,
  stripInteriorRingsFromGeoJson,
} from '../scripts/preprocess-boundaries.mjs';

type PolygonCoords = number[][][];
type MultiPolygonCoords = number[][][][];

type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoords }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords }
  | { type: 'GeometryCollection'; geometries: Geometry[] };

type Feature = {
  geometry: Geometry;
};

type FeatureCollection = {
  type: 'FeatureCollection';
  features: Feature[];
};

function countInteriorRings(geometry: Geometry): number {
  switch (geometry.type) {
    case 'Polygon':
      return Math.max(0, geometry.coordinates.length - 1);
    case 'MultiPolygon':
      return geometry.coordinates.reduce(
        (sum, polygon) => sum + Math.max(0, polygon.length - 1),
        0,
      );
    case 'GeometryCollection':
      return geometry.geometries.reduce(
        (sum, member) => sum + countInteriorRings(member),
        0,
      );
  }
}

describe('preprocess landmask', () => {
  it('removes inland-water holes while preserving polygon shells', () => {
    const source = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [0, 0],
                  [4, 0],
                  [4, 4],
                  [0, 4],
                  [0, 0],
                ],
                [
                  [1, 1],
                  [2, 1],
                  [2, 2],
                  [1, 2],
                  [1, 1],
                ],
              ],
              [
                [
                  [10, 10],
                  [12, 10],
                  [12, 12],
                  [10, 12],
                  [10, 10],
                ],
              ],
            ],
          },
        },
      ],
    } satisfies FeatureCollection;
    const fc = createHoleFreeLandmaskGeoJson(source) as FeatureCollection;

    expect(fc.features).toHaveLength(1);
    expect(countInteriorRings(fc.features[0].geometry)).toBe(0);
    expect(fc.features[0].geometry.type).toBe('MultiPolygon');
    const geometry = fc.features[0].geometry as { type: 'MultiPolygon'; coordinates: MultiPolygonCoords };
    expect(geometry.coordinates).toHaveLength(2);
  });

  it('strips interior rings from shipped polygon products while preserving shells and feature count', () => {
    const source = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { boundary_code: 'A' },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [4, 0],
                [4, 4],
                [0, 4],
                [0, 0],
              ],
              [
                [1, 1],
                [2, 1],
                [2, 2],
                [1, 2],
                [1, 1],
              ],
            ],
          },
        },
      ],
    } satisfies FeatureCollection;

    const stripped = stripInteriorRingsFromGeoJson(source) as FeatureCollection;

    expect(stripped.features).toHaveLength(1);
    expect(countInteriorRings(stripped.features[0].geometry)).toBe(0);
    expect(stripped.features[0].geometry.type).toBe('Polygon');
    const geometry = stripped.features[0].geometry as { type: 'Polygon'; coordinates: PolygonCoords };
    expect(geometry.coordinates).toHaveLength(1);
    expect(geometry.coordinates[0]).toEqual(source.features[0].geometry.coordinates[0]);
  });

  it('switches to the active hydro-normalized landmask when review treatment is active', () => {
    const landmaskPath = getActivePreprocessLandmaskPath({
      status: 'active-review',
      preprocessing: {
        activeProfileId: 'standard',
      },
    });

    expect(landmaskPath).toContain(
      'UK_Landmask_OSM_simplified_v01_hydronormalized_standard.geojson',
    );
  });

  it('switches to the active BFE coastal-envelope landmask when coastal-envelope treatment is active', () => {
    const landmaskPath = getActiveCoastalEnvelopeLandmaskPath({
      status: 'active-review',
      activeProductId: 'bfe',
      products: {
        legacy: {
          label: 'Legacy',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson',
        },
        bfe: {
          label: 'BFE',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_v37_bfe_coastal_envelope.geojson',
        },
        bsc: {
          label: 'BSC',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_v37_bsc_coastal_envelope.geojson',
        },
      },
    });

    expect(landmaskPath).toContain('UK_Landmask_v37_bfe_coastal_envelope.geojson');
  });

  it('switches to the active BFE coastalized exact board inputs when present', () => {
    const paths = getActiveCoastalEnvelopeExactPaths({
      status: 'active-review',
      activeProductId: 'bfe',
      products: {
        legacy: {
          label: 'Legacy',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_dissolved_noholes.geojson',
        },
        bfe: {
          label: 'BFE',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_v37_bfe_coastal_envelope.geojson',
          currentExactGeoJsonPath:
            'geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_v37_bfe_exact.geojson',
          y2026ExactGeoJsonPath:
            'geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_v37_bfe_exact_geojson.geojson',
        },
        bsc: {
          label: 'BSC',
          landmaskPath: 'geopackages/outputs/uk_landmask/UK_Landmask_v37_bsc_coastal_envelope.geojson',
          currentExactGeoJsonPath:
            'geopackages/outputs/full_uk_current_boards/UK_ICB_LHB_Boundaries_Canonical_Current_v37_bsc_exact.geojson',
          y2026ExactGeoJsonPath:
            'geopackages/ICB 2026/outputs/full_uk_2026_boards/UK_Health_Board_Boundaries_Codex_2026_v37_bsc_exact_geojson.geojson',
        },
      },
    });

    expect(paths?.currentExactGeoJsonPath).toContain(
      'UK_ICB_LHB_Boundaries_Canonical_Current_v37_bfe_exact.geojson',
    );
    expect(paths?.y2026ExactGeoJsonPath).toContain(
      'UK_Health_Board_Boundaries_Codex_2026_v37_bfe_exact_geojson.geojson',
    );
  });
});
