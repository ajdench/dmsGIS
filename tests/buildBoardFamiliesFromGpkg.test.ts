import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildBoardFamiliesFromGpkg,
  normalizeBoardCollection,
  normalizeBoardGeometry,
} from '../scripts/buildBoardFamiliesFromGpkg.mjs';

const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('buildBoardFamiliesFromGpkg', () => {
  it('normalizes board exports to the stable public GeoJSON contract', () => {
    const normalized = normalizeBoardCollection({
      collection: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { boundary_code: 'E1' },
          geometry: {
            type: 'MultiPolygon',
            coordinates: [[[
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 1],
              [0, 0],
            ]]],
          },
        }],
      },
      collectionName: 'UK_ICB_LHB_Boundaries_Codex_v10_geojson',
    });

    expect(normalized).toEqual({
      type: 'FeatureCollection',
      name: 'UK_ICB_LHB_Boundaries_Codex_v10_geojson',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        },
      },
      features: [{
        type: 'Feature',
        properties: { boundary_code: 'E1' },
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
      }],
    });
  });

  it('collapses single-part board multipolygons to polygons but leaves multipart geometry intact', () => {
    expect(normalizeBoardGeometry({
      type: 'MultiPolygon',
      coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]],
    })).toEqual({
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    });
    expect(normalizeBoardGeometry({
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 0]]],
        [[[2, 2], [3, 2], [3, 3], [2, 2]]],
      ],
    })).toEqual({
      type: 'MultiPolygon',
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 0]]],
        [[[2, 2], [3, 2], [3, 3], [2, 2]]],
      ],
    });
  });

  it('writes normalized Current and 2026 board outputs from exported temporary GeoJSON', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'board-families-'));
    tempDirs.push(root);

    const currentOutputPath = path.join(root, 'current.geojson');
    const y2026OutputPath = path.join(root, 'y2026.geojson');
    const mockOgr2ogr = path.join(root, 'mock-ogr2ogr');
    fs.writeFileSync(
      mockOgr2ogr,
      `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
const outputPath = args[2];
const layerName = args[4];
const payload = layerName === 'icb_wales_boundaries'
  ? { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { boundary_code: 'C1' }, geometry: { type: 'MultiPolygon', coordinates: [[[[0,0],[1,0],[1,1],[0,0]]]] } }] }
  : { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { boundary_code: 'Y1' }, geometry: { type: 'Polygon', coordinates: [[[0,0],[1,0],[1,1],[0,0]]] } }] };
fs.writeFileSync(outputPath, JSON.stringify(payload));
`,
      { mode: 0o755 },
    );

    const result = buildBoardFamiliesFromGpkg({
      currentSourcePath: path.join(root, 'current.gpkg'),
      currentOutputPath,
      y2026SourcePath: path.join(root, 'y2026.gpkg'),
      y2026OutputPath,
      ogr2ogrBin: mockOgr2ogr,
    });

    expect(result.current.name).toBe('UK_ICB_LHB_Boundaries_Codex_v10_geojson');
    expect(result.y2026.name).toBe('UK_Health_Board_Boundaries_Codex_2026_exact_geojson');
    expect(JSON.parse(fs.readFileSync(currentOutputPath, 'utf8')).features[0].geometry.type).toBe('Polygon');
    expect(JSON.parse(fs.readFileSync(y2026OutputPath, 'utf8')).features[0].properties.boundary_code).toBe('Y1');
  });
});
