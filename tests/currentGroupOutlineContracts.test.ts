import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getScenarioPresetConfig } from '../src/lib/config/viewPresets';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUTLINES_DIR = path.join(
  ROOT,
  'public',
  'data',
  'compare',
  'shared-foundation-review',
  'regions',
  'outlines',
);
const CURRENT_BOARDS_PATH = path.join(
  ROOT,
  'public',
  'data',
  'compare',
  'shared-foundation-review',
  'regions',
  'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
);
const CURRENT_SPLIT_PARENT_CODES = new Set(['E54000025', 'E54000042', 'E54000048']);
const SPLIT_AWARE_GROUPS = new Set([
  'Central & Wessex',
  'East',
  'London & South',
  'North',
  'South West',
  'Wales & West Midlands',
]);
const SHELL_EPSILON = 1e-6;

function slug(groupName: string): string {
  return groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
}

function getLineComponents(geometry: { type?: string; coordinates?: unknown[] } | undefined) {
  if (!geometry) return [] as number[][][];
  if (geometry.type === 'LineString') return [geometry.coordinates as number[][]];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as number[][][];
  return [] as number[][][];
}

function pointInRing(point: number[], ring: number[][]) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = ((yi > y) !== (yj > y))
      && (x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point: number[], polygonCoordinates: number[][][]) {
  if (!polygonCoordinates.length) return false;
  if (!pointInRing(point, polygonCoordinates[0])) return false;
  for (const hole of polygonCoordinates.slice(1)) {
    if (pointInRing(point, hole)) return false;
  }
  return true;
}

function pointInGeometry(
  point: number[],
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] },
) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates);
  }
  return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
}

function pointToSegmentDistance(point: number[], start: number[], end: number[]) {
  const [px, py] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return Math.hypot(px - x1, py - y1);
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function pointNearGeometryBoundary(
  point: number[],
  geometry:
    | { type: 'Polygon'; coordinates: number[][][] }
    | { type: 'MultiPolygon'; coordinates: number[][][][] },
  epsilon = SHELL_EPSILON,
) {
  const polygons = geometry.type === 'Polygon'
    ? [geometry.coordinates]
    : geometry.coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index += 1) {
        if (pointToSegmentDistance(point, ring[index - 1], ring[index]) <= epsilon) {
          return true;
        }
      }
    }
  }
  return false;
}

function loadSplitParentShells() {
  const geojson = JSON.parse(fs.readFileSync(CURRENT_BOARDS_PATH, 'utf8')) as {
    features?: Array<{
      properties?: { boundary_code?: string };
      geometry?: { type?: 'Polygon' | 'MultiPolygon'; coordinates?: unknown };
    }>;
  };

  return (geojson.features ?? [])
    .filter((feature) => CURRENT_SPLIT_PARENT_CODES.has(String(feature.properties?.boundary_code ?? '')))
    .map((feature) => feature.geometry)
    .filter(
      (
        geometry,
      ): geometry is
        | { type: 'Polygon'; coordinates: number[][][] }
        | { type: 'MultiPolygon'; coordinates: number[][][][] } =>
        geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon',
    );
}

describe('Current group outline contracts', () => {
  it('ships a prepared outline file for every Current region group', () => {
    const currentPreset = getScenarioPresetConfig('current');
    expect(currentPreset).not.toBeNull();

    for (const group of currentPreset?.regionGroups ?? []) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(group.name)}.geojson`);
      expect(fs.existsSync(filePath), filePath).toBe(true);

      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
          properties?: { group?: string };
        }>;
      };

      expect(geojson.features?.length ?? 0, filePath).toBeGreaterThan(0);
      expect(geojson.features?.[0]?.properties?.group, filePath).toBe(group.name);
      expect(
        ['LineString', 'MultiLineString'].includes(
          geojson.features?.[0]?.geometry?.type ?? '',
        ),
        filePath,
      ).toBe(true);
      expect(geojson.features?.[0]?.geometry?.coordinates?.length ?? 0, filePath).toBeGreaterThan(0);
    }
  });

  it('does not ship detached interior orphan components for split-aware Current outlines', () => {
    const splitParentShells = loadSplitParentShells();
    expect(splitParentShells.length).toBe(3);

    for (const groupName of SPLIT_AWARE_GROUPS) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const components = getLineComponents(geojson.features?.[0]?.geometry);
      expect(components.length, filePath).toBeGreaterThan(0);

      const orphanComponents = components.filter((component) =>
        splitParentShells.some((shell) => {
          const allInside = component.every((point) => pointInGeometry(point, shell));
          if (!allInside) return false;
          const touchesShell = component.some((point) => pointNearGeometryBoundary(point, shell));
          return !touchesShell;
        }));

      expect(orphanComponents.length, filePath).toBe(0);
    }
  });
});
