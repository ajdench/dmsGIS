import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readFeatureCollection(filePath: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, filePath), 'utf8')) as {
    features: Array<{
      geometry: { coordinates: number[][] };
      properties: { internal?: boolean };
    }>;
  };
}

describe('topology edge artifacts', () => {
  it.each([
    'public/data/regions/UK_ICB_LHB_v10_topology_edges.geojson',
    'public/data/regions/UK_Health_Board_2026_topology_edges.geojson',
  ])('keeps generated edge coordinates in lon/lat range for %s', (filePath) => {
    const fc = readFeatureCollection(filePath);
    expect(fc.features.length).toBeGreaterThan(100);
    expect(fc.features.some((feature) => feature.properties.internal)).toBe(true);

    for (const feature of fc.features) {
      for (const [lon, lat] of feature.geometry.coordinates) {
        expect(lon).toBeGreaterThanOrEqual(-180);
        expect(lon).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    }
  }, 20000);
});
