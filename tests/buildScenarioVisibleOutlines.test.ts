import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildScenarioVisibleOutlineCollection,
  buildScenarioVisibleOutlineFile,
} from '../scripts/buildScenarioVisibleOutlines.mjs';

const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function createSquare(minX, minY, maxX, maxY) {
  return {
    type: 'Polygon',
    coordinates: [[
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY],
    ]],
  };
}

const presetConfig = {
  presets: {
    coa3a: {
      regionGroups: [
        { name: 'JMC North' },
        { name: 'JMC South' },
      ],
    },
    coa3b: {
      regionGroups: [
        { name: 'COA 3a North' },
        { name: 'COA 3a South' },
      ],
    },
    coa3c: {
      regionGroups: [
        { name: 'COA 3b North' },
        { name: 'COA 3b South' },
      ],
    },
  },
};

describe('buildScenarioVisibleOutlines', () => {
  it('builds JMC visible outlines with the expected public-style properties', () => {
    const boardAssignments = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            boundary_code: 'E1',
            jmc_code: 'JMC_NORTH',
            jmc_name: 'JMC North',
            nation_group: 'England',
          },
          geometry: createSquare(0, 0, 1, 1),
        },
        {
          type: 'Feature',
          properties: {
            boundary_code: 'E2',
            jmc_code: 'JMC_SOUTH',
            jmc_name: 'JMC South',
            nation_group: 'England',
          },
          geometry: createSquare(1, 0, 2, 1),
        },
      ],
    };

    const collection = buildScenarioVisibleOutlineCollection({
      boardAssignments,
      presetConfig,
      presetId: 'coa3a',
    });

    expect(collection.features).toHaveLength(2);
    expect(collection.features[0].properties).toMatchObject({
      region_code: 'JMC_NORTH',
      region_name: 'JMC North',
      region_ref: 'JMC North',
      build_src: 'staged_jmc_board',
    });
  });

  it('builds COA visible outlines with region_name and region_ref from staged scenario boards', () => {
    const boardAssignments = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            boundary_code: 'E1',
            jmc_code: 'COA3B_NORTH',
            jmc_name: 'COA 3b North',
            nation_group: 'England',
          },
          geometry: createSquare(0, 0, 1, 1),
        },
      ],
    };

    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scenario-outline-'));
    tempDirs.push(root);
    const boardsPath = path.join(root, 'boards.geojson');
    const presetConfigPath = path.join(root, 'viewPresets.json');
    const outputPath = path.join(root, 'outline.geojson');
    fs.writeFileSync(boardsPath, JSON.stringify(boardAssignments));
    fs.writeFileSync(presetConfigPath, JSON.stringify(presetConfig));

    const collection = buildScenarioVisibleOutlineFile({
      boardAssignmentsPath: boardsPath,
      presetConfigPath,
      presetId: 'coa3c',
      outputPath,
    });

    expect(collection.features).toHaveLength(1);
    expect(collection.features[0].properties).toEqual({
      region_name: 'COA 3b North',
      region_ref: 'COA3B_NORTH',
    });

    const written = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(written.features).toHaveLength(1);
  });
});
