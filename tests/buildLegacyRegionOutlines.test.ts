import { describe, expect, it } from 'vitest';
import {
  buildLegacyRegionOutlineCollection,
  buildLegacyRegionSourceCollections,
  LEGACY_REGION_CLEAN_FRAGMENT_MIN_AREA_SQ_METERS,
  LEGACY_REGION_CLEAN_SIMPLIFY_TOLERANCE_METERS,
  LEGACY_REGION_FRAGMENT_MIN_AREA_SQ_METERS,
} from '../scripts/buildLegacyRegionOutlines.mjs';

describe('buildLegacyRegionOutlineCollection', () => {
  it('builds one output feature per legacy Region with external boundary linework only', () => {
    const collection = buildLegacyRegionOutlineCollection([
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              region_ref: 'North',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-3, 54],
                [-2, 54],
                [-2, 55],
                [-3, 55],
                [-3, 54],
              ]],
            },
          },
          {
            type: 'Feature',
            properties: {
              region_ref: 'North',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-2, 54],
                [-1, 54],
                [-1, 55],
                [-2, 55],
                [-2, 54],
              ]],
            },
          },
        ],
      },
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties.boundary_name).toBe('North');
    expect(collection.features[0].geometry.type).toBe('LineString');
    expect(collection.features[0].geometry.coordinates).toHaveLength(5);
    expect(collection.features[0].geometry.coordinates[0]).toEqual(
      collection.features[0].geometry.coordinates.at(-1),
    );
    expect(
      new Set(
        collection.features[0].geometry.coordinates
          .slice(0, -1)
          .map(([x, y]) => `${x},${y}`),
      ).size,
    ).toBe(4);
  });

  it('drops only microscopic fragments below the cleanup threshold', () => {
    const collection = buildLegacyRegionOutlineCollection(
      [
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                region_ref: 'East',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0],
                ]],
              },
            },
            {
              type: 'Feature',
              properties: {
                region_ref: 'East',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [2, 2],
                  [2.00001, 2],
                  [2.00001, 2.00001],
                  [2, 2.00001],
                  [2, 2],
                ]],
              },
            },
          ],
        },
      ],
      {
        minFragmentAreaSqMeters: LEGACY_REGION_FRAGMENT_MIN_AREA_SQ_METERS,
      },
    );

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties.fragment_count_total).toBe(2);
    expect(collection.features[0].properties.fragment_count_retained).toBe(1);
    expect(collection.features[0].geometry.type).toBe('LineString');
  });

  it('supports a stronger cleanup pass without collapsing the output geometry', () => {
    const collection = buildLegacyRegionOutlineCollection(
      [
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                region_ref: 'North',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [-3, 54],
                  [-2, 54],
                  [-2, 55],
                  [-3, 55],
                  [-3, 54],
                ]],
              },
            },
            {
              type: 'Feature',
              properties: {
                region_ref: 'North',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [10, 10],
                  [10.01, 10],
                  [10.01, 10.01],
                  [10, 10.01],
                  [10, 10],
                ]],
              },
            },
          ],
        },
      ],
      {
        minFragmentAreaSqMeters: LEGACY_REGION_CLEAN_FRAGMENT_MIN_AREA_SQ_METERS,
        simplifyToleranceMeters: LEGACY_REGION_CLEAN_SIMPLIFY_TOLERANCE_METERS,
      },
    );

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties.min_fragment_area_sq_m).toBe(
      LEGACY_REGION_CLEAN_FRAGMENT_MIN_AREA_SQ_METERS,
    );
    expect(collection.features[0].properties.simplify_tolerance_m).toBe(
      LEGACY_REGION_CLEAN_SIMPLIFY_TOLERANCE_METERS,
    );
    expect(collection.features[0].geometry.type).toBe('LineString');
    expect(collection.features[0].geometry.coordinates.length).toBeGreaterThan(3);
    expect(collection.features[0].geometry.coordinates[0]).toEqual(
      collection.features[0].geometry.coordinates.at(-1),
    );
  });

  it('keeps disjoint region fragments as separate boundary lines', () => {
    const collection = buildLegacyRegionOutlineCollection([
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              region_ref: 'North',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-3, 54],
                [-2, 54],
                [-2, 55],
                [-3, 55],
                [-3, 54],
              ]],
            },
          },
          {
            type: 'Feature',
            properties: {
              region_ref: 'North',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [-6, 57],
                [-5.5, 57],
                [-5.5, 57.5],
                [-6, 57.5],
                [-6, 57],
              ]],
            },
          },
        ],
      },
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.type).toBe('MultiLineString');
    expect(collection.features[0].geometry.coordinates).toHaveLength(2);
  });

  it('keeps only exterior rings when a dissolved region polygon contains holes', () => {
    const collection = buildLegacyRegionOutlineCollection([
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              region_ref: 'East',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [10, 0],
                  [10, 10],
                  [0, 10],
                  [0, 0],
                ],
                [
                  [3, 3],
                  [7, 3],
                  [7, 7],
                  [3, 7],
                  [3, 3],
                ],
              ],
            },
          },
        ],
      },
    ]);

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].geometry.type).toBe('LineString');
    expect(collection.features[0].geometry.coordinates).toHaveLength(5);
    expect(collection.features[0].geometry.coordinates).toEqual([
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ]);
  });
});

describe('buildLegacyRegionSourceCollections', () => {
  it('uses whole boards for single-region parents and split runtime units for split parents', () => {
    const collections = buildLegacyRegionSourceCollections({
      componentCollections: [
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {
                parent_code: 'E1',
                region_ref: 'North',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                  [0, 0],
                ]],
              },
            },
            {
              type: 'Feature',
              properties: {
                parent_code: 'E2',
                region_ref: 'East',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [2, 0],
                  [3, 0],
                  [3, 1],
                  [2, 1],
                  [2, 0],
                ]],
              },
            },
            {
              type: 'Feature',
              properties: {
                parent_code: 'E2',
                region_ref: 'South',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [[
                  [3, 0],
                  [4, 0],
                  [4, 1],
                  [3, 1],
                  [3, 0],
                ]],
              },
            },
          ],
        },
      ],
      boardCollection: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              boundary_code: 'E1',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
              ]],
            },
          },
          {
            type: 'Feature',
            properties: {
              boundary_code: 'E2',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [2, 0],
                [4, 0],
                [4, 1],
                [2, 1],
                [2, 0],
              ]],
            },
          },
        ],
      },
      splitCollection: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              parent_code: 'E2',
              boundary_code: 'E2',
              region_ref: 'East',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [2, 0],
                [3, 0],
                [3, 1],
                [2, 1],
                [2, 0],
              ]],
            },
          },
          {
            type: 'Feature',
            properties: {
              parent_code: 'E2',
              boundary_code: 'E2',
              region_ref: 'South',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [3, 0],
                [4, 0],
                [4, 1],
                [3, 1],
                [3, 0],
              ]],
            },
          },
        ],
      },
    });

    expect(collections).toHaveLength(2);
    expect(collections[0].features).toHaveLength(1);
    expect(collections[0].features[0].properties).toMatchObject({
      region_ref: 'North',
      parent_code: 'E1',
      source_type: 'whole_current_board_region',
    });
    expect(collections[1].features).toHaveLength(2);
    expect(collections[1].features.map((feature) => feature.properties.region_ref)).toEqual([
      'East',
      'South',
    ]);
  });
});
