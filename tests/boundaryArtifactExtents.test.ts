import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

type PolygonCoords = number[][][];
type MultiPolygonCoords = number[][][][];

type Feature = {
  geometry:
    | { type: 'Polygon'; coordinates: PolygonCoords }
    | { type: 'MultiPolygon'; coordinates: MultiPolygonCoords }
    | { type: 'LineString'; coordinates: number[][] }
    | { type: 'MultiLineString'; coordinates: number[][][] };
};

type FeatureCollection = {
  features: Feature[];
};

function readFeatureCollection(filePath: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), 'utf8')) as FeatureCollection;
}

function getExtent(fc: FeatureCollection) {
  let minLon = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const feature of fc.features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    for (const polygon of polygons) {
      for (const ring of polygon) {
        for (const [lon, lat] of ring) {
          minLon = Math.min(minLon, lon);
          minLat = Math.min(minLat, lat);
          maxLon = Math.max(maxLon, lon);
          maxLat = Math.max(maxLat, lat);
        }
      }
    }
  }

  return { minLon, minLat, maxLon, maxLat };
}

function countInteriorRings(fc: FeatureCollection) {
  let holes = 0;

  for (const feature of fc.features) {
    const polygons =
      feature.geometry.type === 'Polygon'
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;

    for (const polygon of polygons) {
      holes += Math.max(0, polygon.length - 1);
    }
  }

  return holes;
}

function countLineParts(fc: FeatureCollection) {
  let parts = 0;

  for (const feature of fc.features) {
    const geometry = feature.geometry;
    if (geometry.type === 'LineString') {
      parts += 1;
      continue;
    }

    if (geometry.type === 'MultiLineString') {
      parts += geometry.coordinates.length;
    }
  }

  return parts;
}

describe('boundary artifact extents', () => {
  it.each([
    {
      filePath: 'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
      expectedCount: 68,
    },
    {
      filePath: 'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
      expectedCount: 62,
    },
  ])('keeps %s within the clipped UK extent', ({ filePath, expectedCount }) => {
    const fc = readFeatureCollection(filePath);
    expect(fc.features).toHaveLength(expectedCount);

    const extent = getExtent(fc);
    expect(extent.minLon).toBeGreaterThan(-9);
    expect(extent.minLon).toBeLessThan(-8);
    expect(extent.maxLon).toBeGreaterThan(1.7);
    expect(extent.maxLon).toBeLessThan(1.9);
    expect(extent.minLat).toBeGreaterThan(49.8);
    expect(extent.minLat).toBeLessThan(50);
    expect(extent.maxLat).toBeGreaterThan(60.8);
    expect(extent.maxLat).toBeLessThan(60.9);
  }, 20000);

  it.each([
    'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
    'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
  ])('keeps %s hole-free so board fills remain solid and do not expose the basemap beneath', (filePath) => {
    const fc = readFeatureCollection(filePath);
    expect(countInteriorRings(fc)).toBe(0);
  });

  it.each([
    {
      boardsPath: 'public/data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
      landmaskPath: 'public/data/basemaps/uk_landmask_current_v01.geojson',
    },
    {
      boardsPath: 'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
      landmaskPath: 'public/data/basemaps/uk_landmask_2026_v01.geojson',
    },
  ])(
    'keeps %s aligned landmask as a local regional replacement patch that still contains its board coast',
    ({ boardsPath, landmaskPath }) => {
      const boards = readFeatureCollection(boardsPath);
      const fc = readFeatureCollection(landmaskPath);
      expect(fc.features).toHaveLength(1);

      const extent = getExtent(fc);
      const boardExtent = getExtent(boards);

      expect(extent.minLon).toBeGreaterThan(-10.6);
      expect(extent.minLon).toBeLessThan(-10.3);
      expect(extent.maxLon).toBe(4);
      expect(extent.minLat).toBe(48);
      expect(extent.maxLat).toBe(62);
      expect(extent.minLon).toBeLessThanOrEqual(boardExtent.minLon);
      expect(extent.maxLon).toBeGreaterThanOrEqual(boardExtent.maxLon);
      expect(extent.minLat).toBeLessThanOrEqual(boardExtent.minLat);
      expect(extent.maxLat).toBeGreaterThanOrEqual(boardExtent.maxLat);
    },
  );

  it.each([
    'public/data/basemaps/uk_landmask_current_v01.geojson',
    'public/data/basemaps/uk_landmask_2026_v01.geojson',
  ])('keeps %s hole-free so the visible land patch does not expose local sea through inland rings', (filePath) => {
    const fc = readFeatureCollection(filePath);
    expect(fc.features).toHaveLength(1);
    expect(countInteriorRings(fc)).toBe(0);
  });

  it.each([
    'public/data/basemaps/uk_seapatch_current_v01.geojson',
    'public/data/basemaps/uk_seapatch_2026_v01.geojson',
  ])('keeps %s visible UK basemap sea patch local to the UK neighborhood', (filePath) => {
    const fc = readFeatureCollection(filePath);
    expect(fc.features).toHaveLength(1);

    const extent = getExtent(fc);
    expect(extent.minLon).toBe(-12);
    expect(extent.maxLon).toBe(4);
    expect(extent.minLat).toBe(48);
    expect(extent.maxLat).toBe(62);
    expect(countInteriorRings(fc)).toBe(0);
  });

  it.each([
    {
      filePath: 'public/data/regions/outlines/current_wales_west_midlands.geojson',
      maxLineParts: 140,
    },
    {
      filePath: 'public/data/regions/outlines/current_london_south.geojson',
      maxLineParts: 100,
    },
    {
      filePath: 'public/data/regions/outlines/current_central_wessex.geojson',
      maxLineParts: 10,
    },
    {
      filePath: 'public/data/regions/outlines/current_north.geojson',
      maxLineParts: 60,
    },
  ])('keeps %s as a dissolved exterior outline for Current split-region selection', ({ filePath, maxLineParts }) => {
    const fc = readFeatureCollection(filePath);
    expect(fc.features).toHaveLength(1);
    expect(countLineParts(fc)).toBeLessThanOrEqual(maxLineParts);
  });

  it('keeps Current split internal arcs as a small dedicated helper product', () => {
    const fc = readFeatureCollection('public/data/regions/UK_WardSplit_internal_arcs.geojson');
    expect(fc.features).toHaveLength(5);
    expect(countLineParts(fc)).toBeLessThanOrEqual(16);
  });
});
