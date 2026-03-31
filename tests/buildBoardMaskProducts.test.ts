import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildBoardMaskProducts } from '../scripts/buildBoardMaskProducts.mjs';

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

describe('buildBoardMaskProducts', () => {
  it('builds internal current and 2026 landmask products from shipped board unions', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'board-mask-'));
    tempDirs.push(root);

    const currentBoardsPath = path.join(root, 'current.geojson');
    const y2026BoardsPath = path.join(root, 'merged2026.geojson');
    const currentLandmaskOutputPath = path.join(root, 'current_landmask.geojson');
    const y2026LandmaskOutputPath = path.join(root, 'merged2026_landmask.geojson');

    fs.writeFileSync(
      currentBoardsPath,
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { boundary_code: 'A' },
            geometry: createSquare(0, 0, 1, 1),
          },
          {
            type: 'Feature',
            properties: { boundary_code: 'B' },
            geometry: createSquare(1, 0, 2, 1),
          },
        ],
      }),
    );
    fs.writeFileSync(
      y2026BoardsPath,
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { boundary_code: 'C' },
            geometry: createSquare(0, 0, 2, 1),
          },
        ],
      }),
    );

    const result = buildBoardMaskProducts({
      currentBoardsPath,
      y2026BoardsPath,
      currentLandmaskOutputPath,
      y2026LandmaskOutputPath,
    });

    expect(result.currentLandmask.features).toHaveLength(1);
    expect(result.currentLandmask.features[0].properties.source_family).toBe('current');
    expect(result.currentLandmask.features[0].properties.geometry_basis).toBe('board_union');
    expect(result.y2026Landmask.features).toHaveLength(1);
    expect(result.y2026Landmask.features[0].properties.source_family).toBe('merged2026');

    const writtenCurrent = JSON.parse(fs.readFileSync(currentLandmaskOutputPath, 'utf8'));
    const written2026 = JSON.parse(fs.readFileSync(y2026LandmaskOutputPath, 'utf8'));
    expect(writtenCurrent.features).toHaveLength(1);
    expect(written2026.features).toHaveLength(1);
  });
});
