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
const CURRENT_SPLIT_PATH = path.join(
  ROOT,
  'public',
  'data',
  'compare',
  'shared-foundation-review',
  'regions',
  'UK_WardSplit_simplified.geojson',
);
const SPLIT_AWARE_GROUPS = new Set([
  'Central & Wessex',
  'East',
  'London & South',
  'North',
  'South West',
  'Wales & West Midlands',
]);
const DISSOLVE_REFERENCE_EPSILON = 1e-5;
const BLACKWATER_EXCLUDED_SEGMENTS: number[][][] = [
  [[-1.606092162566745, 50.97475763424615], [-1.619751051433103, 50.958566891040576]],
  [[-1.603075106296357, 50.97833219637941], [-1.604904704594691, 50.976164593318344]],
  [[-1.619432546227886, 50.98472207898823], [-1.619723714983771, 50.9830762720422]],
  [[-1.618980577516788, 50.98727655271801], [-1.619070856398087, 50.98676632991061]],
  [[-1.618958720929101, 50.98740007635013], [-1.618962474656326, 50.98737886201456]],
  [[-1.619540020579129, 50.987672484289455], [-1.618958720929101, 50.98740007635013]],
  [[-1.624749670665667, 50.99011354877915], [-1.6242391470279, 50.989874356702266]],
  [[-1.625364068031521, 50.99069896274061], [-1.625345427072826, 50.99065347042919]],
  [[-1.628132351616869, 50.99745378639705], [-1.628107876483447, 50.99739407413407]],
  [[-1.628305726212586, 50.99787676583073], [-1.628193158782532, 50.99760213764673]],
  [[-1.628523215864711, 50.99840736083645], [-1.628433534147071, 50.998188571849006]],
  [[-1.628804844036594, 50.999094411665354], [-1.628712749058782, 50.998869742100936]],
];
const BLACKWATER_ENDPOINT_REMAPS: Record<string, { tip: number[]; root: number[] }> = {
  'Central & Wessex': {
    tip: [-1.602934, 50.978524],
    root: [-1.619751051433103, 50.958566891040576],
  },
  'South West': {
    tip: [-1.6049213, 50.9762065],
    root: [-1.619751051433103, 50.958566891040576],
  },
};
const BLACKWATER_SPUR_BBOX = {
  minX: -1.63,
  minY: 50.95,
  maxX: -1.6,
  maxY: 50.98,
};

function slug(groupName: string): string {
  return groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
}

function getLineComponents(geometry: { type?: string; coordinates?: unknown[] } | undefined) {
  if (!geometry) return [] as number[][][];
  if (geometry.type === 'LineString') return [geometry.coordinates as number[][]];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as number[][][];
  return [] as number[][][];
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

function pointNearReferenceComponents(
  point: number[],
  referenceComponents: number[][][],
  epsilon = DISSOLVE_REFERENCE_EPSILON,
) {
  return referenceComponents.some((component) => {
    for (let index = 1; index < component.length; index += 1) {
      if (pointToSegmentDistance(point, component[index - 1], component[index]) <= epsilon) {
        return true;
      }
    }
    return false;
  });
}

function loadCurrentGroupFeatures() {
  const boards = JSON.parse(fs.readFileSync(CURRENT_BOARDS_PATH, 'utf8')) as {
    features?: Array<{
      properties?: { boundary_code?: string };
      geometry?: { type?: 'Polygon' | 'MultiPolygon'; coordinates?: unknown };
    }>;
  };
  const wards = JSON.parse(fs.readFileSync(CURRENT_SPLIT_PATH, 'utf8')) as {
    features?: Array<{
      properties?: { region_ref?: string };
      geometry?: { type?: 'Polygon' | 'MultiPolygon'; coordinates?: unknown };
    }>;
  };
  const currentPreset = getScenarioPresetConfig('current');
  const hidden = new Set(currentPreset?.wardSplitParentCodes ?? []);
  const byGroup = new Map<string, Array<{ type: 'Feature'; properties: Record<string, unknown>; geometry: Record<string, unknown> }>>();

  for (const feature of boards.features ?? []) {
    const code = String(feature.properties?.boundary_code ?? '');
    if (!code || hidden.has(code)) continue;
    const groupName = currentPreset?.codeGroupings?.[code];
    if (!groupName || !feature.geometry) continue;
    if (!byGroup.has(groupName)) byGroup.set(groupName, []);
    byGroup.get(groupName)?.push({
      type: 'Feature',
      properties: { group: groupName },
      geometry: feature.geometry as Record<string, unknown>,
    });
  }

  for (const feature of wards.features ?? []) {
    const groupName = String(feature.properties?.region_ref ?? '');
    if (!groupName || !feature.geometry) continue;
    if (!byGroup.has(groupName)) byGroup.set(groupName, []);
    byGroup.get(groupName)?.push({
      type: 'Feature',
      properties: { group: groupName },
      geometry: feature.geometry as Record<string, unknown>,
    });
  }

  return byGroup;
}

function flattenPolygonFeatures(
  features: Array<{ type: 'Feature'; properties: Record<string, unknown>; geometry: Record<string, unknown> }>,
) {
  const flattened: Array<{
    type: 'Feature';
    properties: Record<string, unknown>;
    geometry: { type: 'Polygon'; coordinates: number[][][] };
  }> = [];

  for (const feature of features) {
    const geometry = feature.geometry as
      | { type: 'Polygon'; coordinates: number[][][] }
      | { type: 'MultiPolygon'; coordinates: number[][][][] };
    if (geometry.type === 'Polygon') {
      flattened.push({
        ...feature,
        geometry,
      });
      continue;
    }
    if (geometry.type === 'MultiPolygon') {
      for (const polygonCoordinates of geometry.coordinates) {
        flattened.push({
          ...feature,
          geometry: {
            type: 'Polygon',
            coordinates: polygonCoordinates,
          },
        });
      }
    }
  }

  return flattened;
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

  it('keeps split-aware Current outline components aligned to the true dissolved exterior', async () => {
    const byGroup = loadCurrentGroupFeatures();
    const dissolve = (await import('@turf/dissolve')).default;

    for (const groupName of SPLIT_AWARE_GROUPS) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const sourceFeatures = flattenPolygonFeatures(byGroup.get(groupName) ?? []);
      const dissolved = dissolve({
        type: 'FeatureCollection',
        features: sourceFeatures,
      }, { propertyName: 'group' });

      const referenceComponents: number[][][] = [];
      for (const feature of dissolved.features ?? []) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        if (geometry.type === 'Polygon') {
          referenceComponents.push(geometry.coordinates[0]);
          continue;
        }
        if (geometry.type === 'MultiPolygon') {
          for (const polygon of geometry.coordinates) {
            referenceComponents.push(polygon[0]);
          }
        }
      }

      const components = getLineComponents(geojson.features?.[0]?.geometry);
      const detachedComponents = components.filter((component) => {
        const nearReferenceCount = component.filter((point) =>
          pointNearReferenceComponents(point, referenceComponents)).length;
        return nearReferenceCount < Math.min(2, component.length);
      });

      expect(detachedComponents.length, filePath).toBe(0);
    }
  });

  it('does not ship Current outline components that have zero dissolved-exterior coverage', async () => {
    const byGroup = loadCurrentGroupFeatures();
    const dissolve = (await import('@turf/dissolve')).default;

    for (const groupName of getScenarioPresetConfig('current')?.regionGroups.map((group) => group.name) ?? []) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const sourceFeatures = flattenPolygonFeatures(byGroup.get(groupName) ?? []);
      const dissolved = dissolve({
        type: 'FeatureCollection',
        features: sourceFeatures,
      }, { propertyName: 'group' });

      const referenceComponents: number[][][] = [];
      for (const feature of dissolved.features ?? []) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        if (geometry.type === 'Polygon') {
          referenceComponents.push(geometry.coordinates[0]);
          continue;
        }
        if (geometry.type === 'MultiPolygon') {
          for (const polygon of geometry.coordinates) {
            referenceComponents.push(polygon[0]);
          }
        }
      }

      const components = getLineComponents(geojson.features?.[0]?.geometry);
      const zeroCoverageComponents = components.filter((component) => {
        const nearReferenceCount = component.filter((point) =>
          pointNearReferenceComponents(point, referenceComponents)).length;
        return nearReferenceCount === 0;
      });

      expect(zeroCoverageComponents.length, filePath).toBe(0);
    }
  });

  it('retains every dissolved-exterior component for split-aware Current outlines', async () => {
    const byGroup = loadCurrentGroupFeatures();
    const dissolve = (await import('@turf/dissolve')).default;

    for (const groupName of SPLIT_AWARE_GROUPS) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const sourceFeatures = flattenPolygonFeatures(byGroup.get(groupName) ?? []);
      const dissolved = dissolve({
        type: 'FeatureCollection',
        features: sourceFeatures,
      }, { propertyName: 'group' });

      const exportedComponents = getLineComponents(geojson.features?.[0]?.geometry);
      const uncoveredReferenceComponents: number[][][] = [];

      for (const feature of dissolved.features ?? []) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        const polygons = geometry.type === 'Polygon'
          ? [geometry.coordinates]
          : geometry.type === 'MultiPolygon'
            ? geometry.coordinates
            : [];

        for (const polygon of polygons) {
          const component = polygon[0];
          if (!component?.length) continue;
          const nearExportCount = component.filter((point) =>
            pointNearReferenceComponents(point, exportedComponents)).length;
          if (nearExportCount === 0) {
            uncoveredReferenceComponents.push(component);
          }
        }
      }

      expect(uncoveredReferenceComponents.length, filePath).toBe(0);
    }
  });

  it('keeps split-aware Current outline endpoints on the dissolved exterior', async () => {
    const byGroup = loadCurrentGroupFeatures();
    const dissolve = (await import('@turf/dissolve')).default;

    for (const groupName of SPLIT_AWARE_GROUPS) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const sourceFeatures = flattenPolygonFeatures(byGroup.get(groupName) ?? []);
      const dissolved = dissolve({
        type: 'FeatureCollection',
        features: sourceFeatures,
      }, { propertyName: 'group' });

      const referenceComponents: number[][][] = [];
      for (const feature of dissolved.features ?? []) {
        const geometry = feature.geometry;
        if (!geometry) continue;
        if (geometry.type === 'Polygon') {
          referenceComponents.push(geometry.coordinates[0]);
          continue;
        }
        if (geometry.type === 'MultiPolygon') {
          for (const polygon of geometry.coordinates) {
            referenceComponents.push(polygon[0]);
          }
        }
      }

      const badEndpoints = getLineComponents(geojson.features?.[0]?.geometry).filter((component) => {
        const first = component[0];
        const last = component[component.length - 1];
        return !pointNearReferenceComponents(first, referenceComponents)
          || !pointNearReferenceComponents(last, referenceComponents);
      });

      expect(badEndpoints.length, filePath).toBe(0);
    }
  });

  it('excludes the known Blackwater spur segment family from Current split-aware outlines', () => {
    for (const groupName of ['Central & Wessex', 'South West']) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const offendingSegments: number[][][] = [];
      for (const component of getLineComponents(geojson.features?.[0]?.geometry)) {
        for (let index = 1; index < component.length; index += 1) {
          const start = component[index - 1];
          const end = component[index];
          const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
          const matchesExcluded = BLACKWATER_EXCLUDED_SEGMENTS.some(([left, right]) => (
            pointToSegmentDistance(midpoint, left, right) <= DISSOLVE_REFERENCE_EPSILON
            || (
              pointToSegmentDistance(start, left, right) <= DISSOLVE_REFERENCE_EPSILON
              && pointToSegmentDistance(end, left, right) <= DISSOLVE_REFERENCE_EPSILON
            )
          ));
          if (matchesExcluded) {
            offendingSegments.push([start, end]);
          }
        }
      }

      expect(offendingSegments.length, filePath).toBe(0);
    }
  });

  it('remaps the known Blackwater spur tips back to the shared root on Current split-aware outlines', () => {
    for (const groupName of ['Central & Wessex', 'South West']) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const badEndpoints: number[][] = [];
      let rootSeen = false;
      for (const component of getLineComponents(geojson.features?.[0]?.geometry)) {
        const first = component[0];
        const last = component[component.length - 1];
        const { tip, root } = BLACKWATER_ENDPOINT_REMAPS[groupName];
        if (
          pointToSegmentDistance(first, root, root) <= DISSOLVE_REFERENCE_EPSILON
          || pointToSegmentDistance(last, root, root) <= DISSOLVE_REFERENCE_EPSILON
        ) {
          rootSeen = true;
        }
        for (const endpoint of [tip]) {
          if (
            pointToSegmentDistance(first, endpoint, endpoint) <= DISSOLVE_REFERENCE_EPSILON
            || pointToSegmentDistance(last, endpoint, endpoint) <= DISSOLVE_REFERENCE_EPSILON
          ) {
            badEndpoints.push(endpoint);
          }
        }
      }

      expect(badEndpoints.length, filePath).toBe(0);
      expect(rootSeen, filePath).toBe(true);
    }
  });

  it('does not leave a local Blackwater spur-only component after remapping', () => {
    for (const groupName of ['Central & Wessex', 'South West']) {
      const filePath = path.join(OUTLINES_DIR, `current_${slug(groupName)}.geojson`);
      const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
        features?: Array<{
          geometry?: { type?: string; coordinates?: unknown[] };
        }>;
      };

      const localComponents = getLineComponents(geojson.features?.[0]?.geometry).filter((component) => {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const [x, y] of component) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
        return (
          minX >= BLACKWATER_SPUR_BBOX.minX
          && maxX <= BLACKWATER_SPUR_BBOX.maxX
          && minY >= BLACKWATER_SPUR_BBOX.minY
          && maxY <= BLACKWATER_SPUR_BBOX.maxY
        );
      });

      expect(localComponents.length, filePath).toBe(0);
    }
  });
});
