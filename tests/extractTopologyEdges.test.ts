import { describe, expect, it } from 'vitest';
import {
  decodeArc,
  mergeConnectedEdgeFeatures,
  reconcileMirroredExternalEdges,
} from '../scripts/extract-topology-edges.mjs';

function feature(coords: number[][], overrides: Record<string, unknown> = {}) {
  return {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: coords,
    },
    properties: {
      left_code: 'W11000023',
      right_code: 'W11000024',
      left_type: 'LHB',
      right_type: 'LHB',
      internal: true,
      ...overrides,
    },
  };
}

describe('mergeConnectedEdgeFeatures', () => {
  it('merges contiguous internal segments for the same boundary pair', () => {
    const merged = mergeConnectedEdgeFeatures([
      feature([[0, 0], [1, 0]]),
      feature([[1, 0], [2, 0]]),
      feature([[2, 0], [3, 0]]),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].geometry.coordinates).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ]);
  });

  it('keeps disconnected or different-pair segments separate', () => {
    const merged = mergeConnectedEdgeFeatures([
      feature([[0, 0], [1, 0]]),
      feature([[10, 0], [11, 0]]),
      feature([[1, 0], [2, 0]], { right_code: 'W11000025' }),
      feature([[20, 0], [21, 0]], { internal: false, right_code: null, right_type: null }),
    ]);

    expect(merged).toHaveLength(4);
  });

  it('bridges small gaps for Welsh LHB-LHB segments that almost touch', () => {
    const merged = mergeConnectedEdgeFeatures([
      feature([[0, 0], [1, 0]]),
      feature([[1.02, 0.01], [2, 0.02]]),
      feature([[2.03, 0.01], [3, 0]]),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].geometry.coordinates).toEqual([
      [0, 0],
      [1, 0],
      [1.02, 0.01],
      [2, 0.02],
      [2.03, 0.01],
      [3, 0],
    ]);
  });

  it('also bridges small gaps for Welsh ICB-LHB segments', () => {
    const merged = mergeConnectedEdgeFeatures([
      feature([[0, 0], [1, 0]], {
        left_code: 'E54000011',
        right_code: 'W11000024',
        left_type: 'ICB',
        right_type: 'LHB',
      }),
      feature([[1.03, 0.01], [2, 0.02]], {
        left_code: 'E54000011',
        right_code: 'W11000024',
        left_type: 'ICB',
        right_type: 'LHB',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].geometry.coordinates).toEqual([
      [0, 0],
      [1, 0],
      [1.03, 0.01],
      [2, 0.02],
    ]);
  });
});

describe('decodeArc', () => {
  it('decodes transformed topojson delta arcs into lon/lat coordinates', () => {
    const decoded = decodeArc(
      [
        [100, 200],
        [5, -10],
        [-2, 4],
      ],
      {
        scale: [0.1, 0.01],
        translate: [-10, 50],
      },
    );

    expect(decoded).toEqual([
      [0, 52],
      [0.5, 51.9],
      [0.3000000000000007, 51.94],
    ]);
  });
});

describe('reconcileMirroredExternalEdges', () => {
  it('promotes mirrored external segments into one internal edge using the richer geometry', () => {
    const reconciled = reconcileMirroredExternalEdges([
      feature([[0, 0], [2, 0]], {
        left_code: 'E54000011',
        right_code: null,
        left_type: 'ICB',
        right_type: null,
        internal: false,
      }),
      feature([[0, 0], [1, 0.2], [2, 0]], {
        left_code: 'W11000024',
        right_code: null,
        left_type: 'LHB',
        right_type: null,
        internal: false,
      }),
    ]);

    expect(reconciled).toHaveLength(1);
    expect(reconciled[0]).toMatchObject({
      properties: {
        left_code: 'E54000011',
        right_code: 'W11000024',
        left_type: 'ICB',
        right_type: 'LHB',
        internal: true,
      },
      geometry: {
        coordinates: [
          [0, 0],
          [1, 0.2],
          [2, 0],
        ],
      },
    });
  });
});
