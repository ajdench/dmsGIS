import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildSelectedOutlineLookup } from '../scripts/buildSelectedOutlineLookups.mjs';

const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('buildSelectedOutlineLookups', () => {
  it('copies a staged selected-outline product into the stage-80 lookup slot', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'selected-outline-'));
    tempDirs.push(root);

    const sourcePath = path.join(root, 'source.geojson');
    const outputPath = path.join(root, 'nested', 'output.geojson');
    const payload = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { region_name: 'Example', region_ref: 'EXAMPLE' },
          geometry: null,
        },
      ],
    };

    fs.writeFileSync(sourcePath, JSON.stringify(payload));
    buildSelectedOutlineLookup({ sourcePath, outputPath });

    expect(JSON.parse(fs.readFileSync(outputPath, 'utf8'))).toEqual(payload);
  });
});
