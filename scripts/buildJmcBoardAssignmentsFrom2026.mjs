import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_2026_BOARDS_PATH =
  'public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson';
const DEFAULT_ASSIGNMENT_CSV_PATH =
  'geopackages/SJC Regions/derived/normalized/jmc_2026_board_assignments.csv';
const DEFAULT_OUTPUT_PATH =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';

function resolvePath(inputPath) {
  return path.resolve(ROOT, inputPath);
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function readAssignmentRows(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? '';
      return row;
    }, {});
  });
}

function buildAssignmentIndex(rows) {
  return new Map(
    rows.map((row) => [
      `${row.boundary_type}|${row.boundary_code}|${row.boundary_name}`,
      row,
    ]),
  );
}

export function buildJmcBoardAssignmentsFrom2026({
  y2026BoardsPath = resolvePath(DEFAULT_2026_BOARDS_PATH),
  assignmentCsvPath = resolvePath(DEFAULT_ASSIGNMENT_CSV_PATH),
  outputPath = resolvePath(DEFAULT_OUTPUT_PATH),
} = {}) {
  const boards = JSON.parse(fs.readFileSync(y2026BoardsPath, 'utf8'));
  const assignments = buildAssignmentIndex(readAssignmentRows(assignmentCsvPath));

  const features = (boards.features ?? []).map((feature) => {
    const props = feature?.properties ?? {};
    const boundaryType = String(props.boundary_type ?? '').trim();
    const boundaryCode = String(props.boundary_code ?? '').trim();
    const boundaryName = String(props.boundary_name ?? '').trim();
    const assignment = assignments.get(`${boundaryType}|${boundaryCode}|${boundaryName}`);

    if (!assignment) {
      throw new Error(`Missing JMC assignment for ${boundaryType}|${boundaryCode}|${boundaryName}`);
    }

    return {
      type: 'Feature',
      properties: {
        boundary_type: boundaryType,
        boundary_code: boundaryCode,
        boundary_name: boundaryName,
        jmc_code: assignment.jmc_code,
        jmc_name: assignment.jmc_name,
        command_type: assignment.command_type,
        nation_group: assignment.nation_group,
        assignment_basis: assignment.assignment_basis,
        is_populated: false,
      },
      geometry: feature.geometry,
    };
  });

  const collection = {
    type: 'FeatureCollection',
    name: 'UK_JMC_Source_Board_Assignments_Codex_v02_geojson',
    crs: {
      type: 'name',
      properties: {
        name: 'urn:ogc:def:crs:OGC:1.3:CRS84',
      },
    },
    features,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(collection, null, 2)}\n`);
  return collection;
}

function main() {
  buildJmcBoardAssignmentsFrom2026({
    y2026BoardsPath: process.env.Y2026_BOARDS_PATH
      ? resolvePath(process.env.Y2026_BOARDS_PATH)
      : resolvePath(DEFAULT_2026_BOARDS_PATH),
    assignmentCsvPath: process.env.JMC_ASSIGNMENT_CSV_PATH
      ? resolvePath(process.env.JMC_ASSIGNMENT_CSV_PATH)
      : resolvePath(DEFAULT_ASSIGNMENT_CSV_PATH),
    outputPath: process.env.JMC_OUTPUT_PATH
      ? resolvePath(process.env.JMC_OUTPUT_PATH)
      : resolvePath(DEFAULT_OUTPUT_PATH),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
