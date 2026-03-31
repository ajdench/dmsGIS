import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCurrentComponentLookupsFromGpkg,
  normalizeCurrentComponentGeometry,
  normalizeCurrentComponentCollection,
} from '../scripts/buildCurrentComponentLookupsFromGpkg.mjs';

const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('buildCurrentComponentLookupsFromGpkg', () => {
  it('normalizes exported component collections to the stable public GeoJSON contract', () => {
    const normalized = normalizeCurrentComponentCollection({
      collection: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { component_id: 'a' },
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
      collectionName: 'UK_Active_Components_Codex_v10_geojson',
    });

    expect(normalized).toEqual({
      type: 'FeatureCollection',
      name: 'UK_Active_Components_Codex_v10_geojson',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
        },
      },
      features: [{
        type: 'Feature',
        properties: { component_id: 'a' },
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

  it('collapses single-part multipolygons to polygons but leaves other geometries alone', () => {
    expect(normalizeCurrentComponentGeometry(null)).toBeNull();
    expect(normalizeCurrentComponentGeometry({
      type: 'MultiPolygon',
      coordinates: [[[[0, 0], [1, 0], [1, 1], [0, 0]]]],
    })).toEqual({
      type: 'Polygon',
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    });
    expect(normalizeCurrentComponentGeometry({
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

  it('writes normalized active and inactive outputs from exported temporary GeoJSON', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'current-components-'));
    tempDirs.push(root);

    const activeOutputPath = path.join(root, 'active.geojson');
    const inactiveOutputPath = path.join(root, 'inactive.geojson');
    const mockOgr2ogr = path.join(root, 'mock-ogr2ogr');
    fs.writeFileSync(
      mockOgr2ogr,
      `#!/usr/bin/env node
const fs = require('fs');
const args = process.argv.slice(2);
const outputPath = args[2];
const layerName = args[4];
const feature = layerName === 'active_components'
  ? { component_id: 'active-1', source_type: 'icb_full_single_region' }
  : { component_id: 'inactive-1', source_type: 'icb_no_points' };
fs.writeFileSync(outputPath, JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: feature, geometry: null }] }));
`,
      { mode: 0o755 },
    );

    const result = buildCurrentComponentLookupsFromGpkg({
      activeSourcePath: path.join(root, 'active.gpkg'),
      activeOutputPath,
      inactiveSourcePath: path.join(root, 'inactive.gpkg'),
      inactiveOutputPath,
      ogr2ogrBin: mockOgr2ogr,
    });

    expect(result.active.name).toBe('UK_Active_Components_Codex_v10_geojson');
    expect(result.inactive.name).toBe('UK_Inactive_Remainder_Codex_v10_geojson');
    expect(JSON.parse(fs.readFileSync(activeOutputPath, 'utf8')).features[0].properties.component_id).toBe('active-1');
    expect(JSON.parse(fs.readFileSync(inactiveOutputPath, 'utf8')).features[0].properties.component_id).toBe('inactive-1');
  });
});
