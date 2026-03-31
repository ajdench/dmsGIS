import { describe, expect, it } from 'vitest';
import {
  BOUNDARY_SNAP_INSET_METERS,
  NEAREST_BOUNDARY_FALLBACK_METERS,
  applyAssignedBoundarySnaps,
  distanceBetweenPointsMeters,
  findBoundaryCode,
  pointInFeature,
  snapPointIntoBoundary,
} from '../scripts/enrich-facilities.mjs';

function polygonFeature(boundaryCode: string, coordinates: number[][]) {
  return {
    type: 'Feature' as const,
    properties: { boundary_code: boundaryCode },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [coordinates],
    },
  };
}

describe('findBoundaryCode', () => {
  it('returns the containing boundary code when the point is inside a polygon', () => {
    const boundaries = [
      polygonFeature('W11000028', [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ]),
    ];

    expect(findBoundaryCode(0.5, 0.5, boundaries)).toBe('W11000028');
  });

  it('falls back to the nearest boundary when the point is just outside the edge', () => {
    const boundaries = [
      polygonFeature('W11000028', [
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ]),
    ];

    expect(findBoundaryCode(0.0011, 0.0005, boundaries)).toBe('W11000028');
  });

  it('does not force an assignment when the nearest boundary is beyond the fallback threshold', () => {
    const boundaries = [
      polygonFeature('W11000028', [
        [0, 0],
        [0.001, 0],
        [0.001, 0.001],
        [0, 0.001],
        [0, 0],
      ]),
    ];

    expect(NEAREST_BOUNDARY_FALLBACK_METERS).toBe(50);
    expect(findBoundaryCode(0.005, 0.005, boundaries)).toBeNull();
  });
});

describe('snapPointIntoBoundary', () => {
  it('keeps a point unchanged when it is already inside the assigned polygon', () => {
    const boundary = polygonFeature('W11000028', [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
      [0, 0],
    ]);

    const snapped = snapPointIntoBoundary(0.5, 0.5, boundary);

    expect(snapped.snapped).toBe(false);
    expect(snapped.x).toBe(0.5);
    expect(snapped.y).toBe(0.5);
    expect(snapped.snapDistanceMeters).toBe(0);
  });

  it('moves an outside point inside the assigned polygon with a small inset', () => {
    const boundary = polygonFeature('W11000028', [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0.001],
      [0, 0],
    ]);

    const snapped = snapPointIntoBoundary(0.0011, 0.0005, boundary);

    expect(snapped.snapped).toBe(true);
    expect(pointInFeature(snapped.x, snapped.y, boundary)).toBe(true);
    expect(snapped.x).toBeLessThan(0.001);
    expect(snapped.snapDistanceMeters).toBeGreaterThan(0);
  });

  it('insets the snapped point rather than leaving it on the edge', () => {
    const boundary = polygonFeature('W11000028', [
      [0, 0],
      [0.01, 0],
      [0.01, 0.01],
      [0, 0.01],
      [0, 0],
    ]);

    const snapped = snapPointIntoBoundary(0.0102, 0.005, boundary);
    const edgeDistanceMeters = distanceBetweenPointsMeters(snapped.x, snapped.y, 0.01, 0.005);

    expect(pointInFeature(snapped.x, snapped.y, boundary)).toBe(true);
    expect(edgeDistanceMeters).toBeGreaterThan(BOUNDARY_SNAP_INSET_METERS * 0.5);
  });
});

describe('applyAssignedBoundarySnaps', () => {
  it('can snap a point first into the assigned current boundary and then into the assigned 2026 boundary', () => {
    const currentBoundary = polygonFeature('current', [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0.001],
      [0, 0],
    ]);
    const y2026Boundary = polygonFeature('future', [
      [0, 0],
      [0.00075, 0],
      [0.00075, 0.001],
      [0, 0.001],
      [0, 0],
    ]);

    const result = applyAssignedBoundarySnaps(0.0011, 0.0005, currentBoundary, y2026Boundary);

    expect(result.anySnapApplied).toBe(true);
    expect(result.snapBasis).toBe('assigned_current_boundary_then_assigned_2026_boundary');
    expect(pointInFeature(result.x, result.y, currentBoundary)).toBe(true);
    expect(pointInFeature(result.x, result.y, y2026Boundary)).toBe(true);
    expect(result.snapDistanceMeters).toBeGreaterThan(0);
  });

  it('records a 2026-only snap when the current boundary already contains the point', () => {
    const currentBoundary = polygonFeature('current', [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0.001],
      [0, 0],
    ]);
    const y2026Boundary = polygonFeature('future', [
      [0, 0],
      [0.0008, 0],
      [0.0008, 0.001],
      [0, 0.001],
      [0, 0],
    ]);

    const result = applyAssignedBoundarySnaps(0.0009, 0.0005, currentBoundary, y2026Boundary);

    expect(result.anySnapApplied).toBe(true);
    expect(result.snapBasis).toBe('assigned_2026_boundary');
    expect(result.snappedCurrentPoint.snapped).toBe(false);
    expect(result.snapped2026Point.snapped).toBe(true);
    expect(pointInFeature(result.x, result.y, y2026Boundary)).toBe(true);
  });
});
