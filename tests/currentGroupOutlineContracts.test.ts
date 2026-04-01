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

function slug(groupName: string): string {
  return groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
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
});
