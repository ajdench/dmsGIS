import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildBoardTopologyProducts } from '../scripts/buildBoardTopologyProducts.mjs';

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

function createPolygon(coordinates) {
  return {
    type: 'Polygon',
    coordinates: [coordinates],
  };
}

describe('buildBoardTopologyProducts', () => {
  it('derives current and 2026 topology edges plus UK internal borders from board polygons', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'board-topology-'));
    tempDirs.push(root);

    const currentBoardsPath = path.join(root, 'current.geojson');
    const y2026BoardsPath = path.join(root, 'merged2026.geojson');
    const currentTopologyOutputPath = path.join(root, 'current_topology.geojson');
    const y2026TopologyOutputPath = path.join(root, 'merged2026_topology.geojson');
    const internalBordersOutputPath = path.join(root, 'uk_internal_borders.geojson');

    const currentBoards = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            boundary_code: 'E54000001',
            boundary_name: 'England Test ICB',
          },
          geometry: createPolygon([
            [0, 0],
            [2, 0],
            [2, 2],
            [1, 2],
            [0, 2],
            [0, 1],
            [0, 0],
          ]),
        },
        {
          type: 'Feature',
          properties: {
            boundary_code: 'W11000023',
            boundary_name: 'Wales Test HB',
          },
          geometry: createSquare(-1, 0, 0, 1),
        },
        {
          type: 'Feature',
          properties: {
            boundary_code: '06',
            boundary_name: 'Borders',
          },
          geometry: createSquare(0, 2, 1, 3),
        },
      ],
    };

    const y2026Boards = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            boundary_code: 'E54000065',
            boundary_name: 'Merged Test East',
          },
          geometry: createPolygon([
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 1],
            [0, 0],
          ]),
        },
        {
          type: 'Feature',
          properties: {
            boundary_code: 'W11000023',
            boundary_name: 'Wales Test HB',
          },
          geometry: createSquare(-1, 0, 0, 1),
        },
      ],
    };

    fs.writeFileSync(currentBoardsPath, JSON.stringify(currentBoards));
    fs.writeFileSync(y2026BoardsPath, JSON.stringify(y2026Boards));

    const result = buildBoardTopologyProducts({
      currentBoardsPath,
      y2026BoardsPath,
      currentTopologyOutputPath,
      y2026TopologyOutputPath,
      internalBordersOutputPath,
    });

    expect(result.currentTopology.features.some((feature) =>
      feature.properties.edge_type === 'internal' &&
      feature.properties.owner_codes.includes('E54000001') &&
      feature.properties.owner_codes.includes('W11000023'),
    )).toBe(true);
    expect(result.y2026Topology.features.length).toBeGreaterThan(0);

    const internalBorders = JSON.parse(fs.readFileSync(internalBordersOutputPath, 'utf8'));
    expect(internalBorders.features).toHaveLength(2);
    expect(internalBorders.features.map((feature) => feature.properties.name)).toEqual([
      'England-Wales border',
      'England-Scotland border',
    ]);
    expect(internalBorders.features[0].geometry.type).toBe('MultiLineString');
    expect(internalBorders.features[0].geometry.coordinates.length).toBeGreaterThan(0);
    expect(internalBorders.features[1].geometry.coordinates.length).toBeGreaterThan(0);
  });
});
