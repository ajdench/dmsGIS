import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildJmcBoardAssignmentsFrom2026 } from '../scripts/buildJmcBoardAssignmentsFrom2026.mjs';

const tempDirs = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('buildJmcBoardAssignmentsFrom2026', () => {
  it('builds JMC board assignments from rebuilt 2026 boards and assignment CSV', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jmc-build-'));
    tempDirs.push(root);

    const boardsPath = path.join(root, 'boards.geojson');
    const csvPath = path.join(root, 'assignments.csv');
    const outputPath = path.join(root, 'jmc.geojson');

    fs.writeFileSync(
      boardsPath,
      JSON.stringify({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              boundary_type: 'ICB',
              boundary_code: 'E54000008',
              boundary_name: 'NHS Cheshire and Merseyside Integrated Care Board',
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
            },
          },
        ],
      }),
    );

    fs.writeFileSync(
      csvPath,
      [
        'boundary_type,boundary_code,boundary_name,jmc_code,jmc_name,command_type,nation_group,assignment_basis,source_note',
        'ICB,E54000008,NHS Cheshire and Merseyside Integrated Care Board,JMC_NORTH,JMC North,JMC,England,whole_icb_2026_assignment,Example note',
      ].join('\n'),
    );

    const result = buildJmcBoardAssignmentsFrom2026({
      y2026BoardsPath: boardsPath,
      assignmentCsvPath: csvPath,
      outputPath,
    });

    expect(result.name).toBe('UK_JMC_Source_Board_Assignments_Codex_v02_geojson');
    expect(result.features).toHaveLength(1);
    expect(result.features[0].properties).toEqual({
      boundary_type: 'ICB',
      boundary_code: 'E54000008',
      boundary_name: 'NHS Cheshire and Merseyside Integrated Care Board',
      jmc_code: 'JMC_NORTH',
      jmc_name: 'JMC North',
      command_type: 'JMC',
      nation_group: 'England',
      assignment_basis: 'whole_icb_2026_assignment',
      is_populated: false,
    });
    expect(JSON.parse(fs.readFileSync(outputPath, 'utf8')).features).toHaveLength(1);
  });
});
