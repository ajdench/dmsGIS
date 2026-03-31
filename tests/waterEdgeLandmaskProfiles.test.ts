import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readJson(relPath: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

describe('water-edge landmask profiles', () => {
  it('ships active-review hydro-normalized landmask profiles for coarse, standard, and fine review', () => {
    const metadata = readJson('geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_hydronormalized_profiles.json');

    expect(metadata.version).toBe('v3.7-review-1');
    expect(metadata.status).toBe('draft-not-active');
    expect(Object.keys(metadata.profiles).sort()).toEqual(['coarse', 'fine', 'standard']);
    expect(metadata.profiles.standard.landfillClasses).toEqual(['inlandWater']);
    expect(metadata.profiles.standard.candidateAreaDeltaM2).toBeGreaterThan(
      metadata.profiles.standard.areaDeltaM2,
    );
    expect(metadata.profiles.standard.classCounts.inlandWater).toBeGreaterThan(0);
    expect(metadata.profiles.standard.classCounts.estuary).toBeGreaterThan(0);
  });

  it.each([
    'geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_hydronormalized_coarse.geojson',
    'geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_hydronormalized_standard.geojson',
    'geopackages/outputs/uk_landmask/UK_Landmask_OSM_simplified_v01_hydronormalized_fine.geojson',
  ])('%s is materialized as a single reviewable feature collection', (relPath) => {
    const fc = readJson(relPath);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features).toHaveLength(1);
  });
});
