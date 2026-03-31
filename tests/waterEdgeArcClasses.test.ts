import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');

function readJson(relPath: string) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8'));
}

describe('water-edge arc classes', () => {
  it('materializes review-time classified arc helper products for current and 2026', () => {
    const summary = readJson('geopackages/outputs/water_edges/water_edge_classification_summary.json');

    expect(summary.version).toBe('v3.7-review-1');
    expect(summary.status).toBe('draft-not-active');
    expect(summary.profileId).toBe('standard');
    expect(summary.supportedClasses).toContain('harbourDock');
    expect(summary.supportedClasses).toContain('canalCut');
    expect(summary.supportedClasses).toContain('intertidal');
    expect(summary.boundarySystems.current.featureCount).toBeGreaterThan(0);
    expect(summary.boundarySystems['2026'].featureCount).toBeGreaterThan(0);
    expect(summary.boundarySystems.current.classCounts.internal).toBeGreaterThan(0);
    expect(summary.boundarySystems.current.classCounts.sea).toBeGreaterThan(0);
    expect(summary.boundarySystems['2026'].classCounts.internal).toBeGreaterThan(0);
    expect(summary.boundarySystems['2026'].classCounts.sea).toBeGreaterThan(0);
  });

  it.each([
    'geopackages/outputs/water_edges/UK_ICB_LHB_v10_water_edge_classes.geojson',
    'geopackages/outputs/water_edges/UK_Health_Board_2026_water_edge_classes.geojson',
  ])('%s writes classified line features', (relPath) => {
    const fc = readJson(relPath);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBeGreaterThan(100);
    const sample = fc.features[0];
    expect(sample.geometry.type).toBe('LineString');
    expect(sample.properties.edge_class).toBeTruthy();
    expect(sample.properties.classification_profile).toBe('standard');
  });
});
