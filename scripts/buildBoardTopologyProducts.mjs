import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_OUTPUT_ROOT = path.join(
  ROOT,
  'geopackages',
  'outputs',
  'manual_topology',
);

const DEFAULT_CURRENT_BOARDS_PATH = path.join(
  ROOT,
  'public',
  'data',
  'regions',
  'UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
);
const DEFAULT_2026_BOARDS_PATH = path.join(
  ROOT,
  'public',
  'data',
  'regions',
  'UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
);
const DEFAULT_CURRENT_TOPOLOGY_OUTPUT_PATH = path.join(
  DEFAULT_OUTPUT_ROOT,
  'uk_boards_current_topology_edges.geojson',
);
const DEFAULT_2026_TOPOLOGY_OUTPUT_PATH = path.join(
  DEFAULT_OUTPUT_ROOT,
  'uk_boards_2026_topology_edges.geojson',
);
const DEFAULT_INTERNAL_BORDERS_OUTPUT_PATH = path.join(
  ROOT,
  'public',
  'data',
  'basemaps',
  'uk_internal_borders.geojson',
);

const WALES_HEALTH_BOARD_CODES = new Set([
  'W11000023',
  'W11000024',
  'W11000025',
  'W11000028',
  'W11000029',
  'W11000030',
  'W11000031',
]);
const NORTHERN_IRELAND_CODES = new Set([
  'BHSCT',
  'NHSCT',
  'WHSCT',
  'SHSCT',
  'SEHSCT',
]);

function resolveEnvPath(envName, fallbackPath) {
  const value = String(process.env[envName] ?? '').trim();
  return value ? path.resolve(ROOT, value) : fallbackPath;
}

function readGeoJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeGeoJson(filePath, collection) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(collection, null, 2)}\n`);
}

function pointKey(coordinate) {
  return `${coordinate[0]},${coordinate[1]}`;
}

function normalizeSegment(start, end) {
  const startKey = pointKey(start);
  const endKey = pointKey(end);
  if (startKey <= endKey) {
    return {
      key: `${startKey}|${endKey}`,
      start,
      end,
    };
  }

  return {
    key: `${endKey}|${startKey}`,
    start: end,
    end: start,
  };
}

function* iterateRings(geometry) {
  if (!geometry) {
    return;
  }

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates ?? []) {
      yield ring;
    }
    return;
  }

  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates ?? []) {
      for (const ring of polygon ?? []) {
        yield ring;
      }
    }
  }
}

function resolveNationFromFeature(feature) {
  const code = String(feature.properties?.boundary_code ?? '').trim();
  if (code.startsWith('E')) {
    return 'england';
  }
  if (WALES_HEALTH_BOARD_CODES.has(code)) {
    return 'wales';
  }
  if (NORTHERN_IRELAND_CODES.has(code)) {
    return 'northern_ireland';
  }
  return 'scotland';
}

function collectBoardSegments(featureCollection) {
  const segments = new Map();

  for (const feature of featureCollection.features ?? []) {
    const ownerCode = String(feature.properties?.boundary_code ?? '').trim();
    if (!ownerCode) {
      continue;
    }

    const ownerName = String(feature.properties?.boundary_name ?? ownerCode).trim();
    const nation = resolveNationFromFeature(feature);

    for (const ring of iterateRings(feature.geometry)) {
      for (let index = 1; index < ring.length; index += 1) {
        const rawStart = ring[index - 1];
        const rawEnd = ring[index];
        if (!rawStart || !rawEnd) {
          continue;
        }
        if (rawStart[0] === rawEnd[0] && rawStart[1] === rawEnd[1]) {
          continue;
        }

        const normalized = normalizeSegment(rawStart, rawEnd);
        const existing = segments.get(normalized.key) ?? {
          key: normalized.key,
          start: normalized.start,
          end: normalized.end,
          owners: new Map(),
          nations: new Set(),
        };

        existing.owners.set(ownerCode, ownerName);
        existing.nations.add(nation);
        segments.set(normalized.key, existing);
      }
    }
  }

  return [...segments.values()];
}

function mergeSegments(segmentPairs) {
  if (segmentPairs.length === 0) {
    return [];
  }

  const nodes = new Map();
  const segments = segmentPairs.map(([start, end], index) => {
    const startKey = pointKey(start);
    const endKey = pointKey(end);
    const segment = {
      id: index,
      start,
      end,
      startKey,
      endKey,
    };
    const startEdges = nodes.get(startKey) ?? [];
    startEdges.push(segment);
    nodes.set(startKey, startEdges);
    const endEdges = nodes.get(endKey) ?? [];
    endEdges.push(segment);
    nodes.set(endKey, endEdges);
    return segment;
  });

  const unused = new Set(segments.map((segment) => segment.id));
  const lines = [];

  function walkFromNode(initialNodeKey) {
    const incident = (nodes.get(initialNodeKey) ?? []).find((segment) => unused.has(segment.id));
    if (!incident) {
      return null;
    }

    unused.delete(incident.id);
    const coordinates = [];

    let currentNodeKey;
    if (incident.startKey === initialNodeKey) {
      coordinates.push(incident.start, incident.end);
      currentNodeKey = incident.endKey;
    } else {
      coordinates.push(incident.end, incident.start);
      currentNodeKey = incident.startKey;
    }

    while (true) {
      const next = (nodes.get(currentNodeKey) ?? []).find((segment) => unused.has(segment.id));
      if (!next) {
        break;
      }

      unused.delete(next.id);
      if (next.startKey === currentNodeKey) {
        coordinates.push(next.end);
        currentNodeKey = next.endKey;
      } else {
        coordinates.push(next.start);
        currentNodeKey = next.startKey;
      }
    }

    return coordinates;
  }

  const endpointKeys = [...nodes.entries()]
    .filter(([, incident]) => incident.length !== 2)
    .map(([nodeKey]) => nodeKey);

  for (const nodeKey of endpointKeys) {
    while ((nodes.get(nodeKey) ?? []).some((segment) => unused.has(segment.id))) {
      const line = walkFromNode(nodeKey);
      if (line) {
        lines.push(line);
      }
    }
  }

  while (unused.size > 0) {
    const nextId = unused.values().next().value;
    const seed = segments.find((segment) => segment.id === nextId);
    if (!seed) {
      break;
    }
    const line = walkFromNode(seed.startKey);
    if (line) {
      lines.push(line);
    }
  }

  return lines;
}

function buildTopologyCollection(featureCollection, sourceFamily) {
  const grouped = new Map();

  for (const segment of collectBoardSegments(featureCollection)) {
    const ownerCodes = [...segment.owners.keys()].sort();
    const ownerNames = ownerCodes.map((code) => segment.owners.get(code));
    const nationCodes = [...segment.nations].sort();
    const edgeType = ownerCodes.length > 1 ? 'internal' : 'external';
    const signature = `${edgeType}|${ownerCodes.join('|')}`;
    const existing = grouped.get(signature) ?? {
      edgeType,
      ownerCodes,
      ownerNames,
      nationCodes,
      segments: [],
    };
    existing.segments.push([segment.start, segment.end]);
    grouped.set(signature, existing);
  }

  const features = [];
  for (const group of grouped.values()) {
    const mergedLines = mergeSegments(group.segments);
    mergedLines.forEach((coordinates, index) => {
      features.push({
        type: 'Feature',
        properties: {
          source_family: sourceFamily,
          edge_type: group.edgeType,
          owner_codes: group.ownerCodes,
          owner_names: group.ownerNames,
          nation_codes: group.nationCodes,
          part_index: index + 1,
        },
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

function buildInternalCountryBorders(featureCollection) {
  const grouped = new Map([
    ['england-scotland', []],
    ['england-wales', []],
  ]);

  for (const segment of collectBoardSegments(featureCollection)) {
    if (segment.owners.size !== 2) {
      continue;
    }

    const nationCodes = [...segment.nations].sort();
    const signature = nationCodes.join('-');
    if (!grouped.has(signature)) {
      continue;
    }

    grouped.get(signature).push([segment.start, segment.end]);
  }

  const featureSpecs = [
    {
      signature: 'england-wales',
      name: 'England-Wales border',
    },
    {
      signature: 'england-scotland',
      name: 'England-Scotland border',
    },
  ];

  return {
    type: 'FeatureCollection',
    features: featureSpecs.map(({ signature, name }) => ({
      type: 'Feature',
      properties: {
        name,
        source: 'derived_from_current_runtime_boards',
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: mergeSegments(grouped.get(signature) ?? []),
      },
    })),
  };
}

export function buildBoardTopologyProducts({
  currentBoardsPath = DEFAULT_CURRENT_BOARDS_PATH,
  y2026BoardsPath = DEFAULT_2026_BOARDS_PATH,
  currentTopologyOutputPath = DEFAULT_CURRENT_TOPOLOGY_OUTPUT_PATH,
  y2026TopologyOutputPath = DEFAULT_2026_TOPOLOGY_OUTPUT_PATH,
  internalBordersOutputPath = DEFAULT_INTERNAL_BORDERS_OUTPUT_PATH,
} = {}) {
  const currentBoards = readGeoJson(currentBoardsPath);
  const y2026Boards = readGeoJson(y2026BoardsPath);

  const currentTopology = buildTopologyCollection(currentBoards, 'current');
  const y2026Topology = buildTopologyCollection(y2026Boards, 'merged2026');
  const internalBorders = buildInternalCountryBorders(currentBoards);

  writeGeoJson(currentTopologyOutputPath, currentTopology);
  writeGeoJson(y2026TopologyOutputPath, y2026Topology);
  writeGeoJson(internalBordersOutputPath, internalBorders);

  return {
    currentTopology,
    y2026Topology,
    internalBorders,
  };
}

function main() {
  buildBoardTopologyProducts({
    currentBoardsPath: resolveEnvPath('CURRENT_RUNTIME_BOARDS_PATH', DEFAULT_CURRENT_BOARDS_PATH),
    y2026BoardsPath: resolveEnvPath('Y2026_RUNTIME_BOARDS_PATH', DEFAULT_2026_BOARDS_PATH),
    currentTopologyOutputPath: resolveEnvPath(
      'CURRENT_TOPOLOGY_OUTPUT_PATH',
      DEFAULT_CURRENT_TOPOLOGY_OUTPUT_PATH,
    ),
    y2026TopologyOutputPath: resolveEnvPath(
      'Y2026_TOPOLOGY_OUTPUT_PATH',
      DEFAULT_2026_TOPOLOGY_OUTPUT_PATH,
    ),
    internalBordersOutputPath: resolveEnvPath(
      'UK_INTERNAL_BORDERS_OUTPUT_PATH',
      DEFAULT_INTERNAL_BORDERS_OUTPUT_PATH,
    ),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
