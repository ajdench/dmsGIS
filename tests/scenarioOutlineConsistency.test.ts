import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import rawConfig from '../src/lib/config/viewPresets.json';

const ROOT = path.resolve(__dirname, '..');
const REVIEW_REGIONS = path.join(
  ROOT,
  'public',
  'data',
  'compare',
  'shared-foundation-review',
  'regions',
);
const REVIEW_OUTLINES = path.join(REVIEW_REGIONS, 'outlines');

const COLLECTION_BY_PRESET = {
  coa3a: 'UK_JMC_Outline_arcs.geojson',
  coa3b: 'UK_COA3A_Outline_arcs.geojson',
  coa3c: 'UK_COA3B_Outline_arcs.geojson',
} as const;

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

describe('scenario outline consistency', () => {
  for (const presetId of ['coa3a', 'coa3b', 'coa3c'] as const) {
    it(`keeps ${presetId} visible and selected Region borders on the same preprocessed geometry`, () => {
      const collectionPath = path.join(REVIEW_REGIONS, COLLECTION_BY_PRESET[presetId]);
      const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8')) as {
        features: Array<{
          properties?: Record<string, unknown>;
          geometry?: unknown;
        }>;
      };
      const preset = rawConfig.presets[presetId];

      expect(collection.features).toHaveLength(preset.regionGroups.length);

      for (const group of preset.regionGroups) {
        const perGroupPath = path.join(REVIEW_OUTLINES, `${presetId}_${slug(group.name)}.geojson`);
        const perGroup = JSON.parse(fs.readFileSync(perGroupPath, 'utf8')) as {
          features: Array<{
            properties?: Record<string, unknown>;
            geometry?: unknown;
          }>;
        };
        expect(perGroup.features).toHaveLength(1);

        const collectionFeature = collection.features.find(
          (feature) => String(feature.properties?.region_name ?? '').trim() === group.name,
        );
        expect(collectionFeature).toBeTruthy();
        expect(collectionFeature?.geometry).toEqual(perGroup.features[0].geometry);
        expect(collectionFeature?.properties).toEqual(perGroup.features[0].properties);
      }
    });
  }
});
