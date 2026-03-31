import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_INPUT = path.join(ROOT, 'Export_30_Mar_26.csv');
const FACILITIES_DIR = path.join(ROOT, 'public', 'data', 'facilities');
const ACTIVE_OUTPUT = path.join(FACILITIES_DIR, 'facilities.geojson');
const LEGACY_ARCHIVE = path.join(FACILITIES_DIR, 'facilities_legacy_pre_2026-03-30.geojson');

export const PMC_REGION_COLORS = {
  'Scotland & Northern Ireland': '#4862b8',
  North: '#a7c636',
  'Wales & West Midlands': '#ed5151',
  East: '#fc921f',
  'South West': '#149ece',
  'Central & Wessex': '#e8c723',
  'London & South': '#419632',
  'Royal Navy': '#000080',
  Overseas: '#808080',
};

const FACILITY_COORDINATE_OVERRIDES = {
  SSMP37: {
    latitude: -1.292066,
    longitude: 36.821946,
  },
};

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
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
  return values.map((value) => value.trim());
}

export function normalizeFacilityRegion(rawRegion, facilityName) {
  const region = rawRegion.trim();
  const name = facilityName.trim();

  if (!region && name === 'Hamworthy Napier Road Medical Centre') {
    return 'South West';
  }
  if (region === 'Royal Navy Baseport') {
    return 'Royal Navy';
  }
  if (region === 'Scotland & North') {
    return 'Scotland & Northern Ireland';
  }
  return region;
}

function normalizeStatus(value) {
  return value.trim() || null;
}

function deriveDefaultVisible(status) {
  return status?.toLowerCase() === 'closed' ? 0 : 1;
}

function normalizeParent(value) {
  return value.trim() || null;
}

function normalizeIdentifier(value) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toNullableNumber(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveCoordinates(row) {
  const override = FACILITY_COORDINATE_OVERRIDES[row.AD_ID.trim()] ?? null;
  const latitude = toNullableNumber(row.Latitude);
  const longitude = toNullableNumber(row.Longitude);

  if (latitude !== null && longitude !== null) {
    return { latitude, longitude, coordinateSource: 'csv' };
  }
  if (override) {
    return {
      latitude: override.latitude,
      longitude: override.longitude,
      coordinateSource: 'override',
    };
  }
  return {
    latitude: null,
    longitude: null,
    coordinateSource: null,
  };
}

function mapRowToFeature(row, index) {
  const id = row.AD_ID.trim();
  const name = row.Site.trim();
  const region = normalizeFacilityRegion(row.Region, name);
  const pointColorHex = PMC_REGION_COLORS[region];
  const status = normalizeStatus(row.Status);

  if (!id) {
    throw new Error(`Missing AD_ID on row ${index + 2}`);
  }
  if (!name) {
    throw new Error(`Missing Site on row ${index + 2}`);
  }
  if (!region) {
    throw new Error(`Missing Region after normalization for ${name}`);
  }
  if (!pointColorHex) {
    throw new Error(`No PMC region colour configured for region "${region}" (${name})`);
  }

  const { latitude, longitude, coordinateSource } = resolveCoordinates(row);
  if (latitude === null || longitude === null) {
    throw new Error(`Missing coordinates for ${name}`);
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
    properties: {
      id,
      name,
      type: 'pmc-facility',
      region,
      default_visible: deriveDefaultVisible(status),
      point_color_hex: pointColorHex,
      point_alpha: 1,
      source_file: path.basename(DEFAULT_INPUT),
      source_row: index + 2,
      combined_practice: row['Combined  Practice'].trim() || null,
      active_dmicp_id: normalizeIdentifier(row['Active DMICP ID']),
      legacy_dmicp_id: normalizeIdentifier(row['Legacy DMICP ID']),
      status,
      parent: normalizeParent(row.Parent),
      postcode: normalizeIdentifier(row.Postcode),
      par: normalizeIdentifier(row.PAR),
      coordinate_source: coordinateSource,
    },
  };
}

export function buildFacilitiesGeoJson(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error('Facilities CSV is empty');
  }

  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    return row;
  });

  return {
    type: 'FeatureCollection',
    features: rows.map((row, index) => mapRowToFeature(row, index)),
  };
}

function ensureLegacyArchive() {
  if (!fs.existsSync(ACTIVE_OUTPUT) || fs.existsSync(LEGACY_ARCHIVE)) {
    return;
  }
  fs.copyFileSync(ACTIVE_OUTPUT, LEGACY_ARCHIVE);
  console.log(`Archived legacy facilities file to ${path.relative(ROOT, LEGACY_ARCHIVE)}`);
}

function summarizeRegions(features) {
  const counts = new Map();
  for (const feature of features) {
    const region = feature.properties.region;
    counts.set(region, (counts.get(region) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => left[0].localeCompare(right[0]));
}

function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const csvText = fs.readFileSync(inputPath, 'utf8');
  const geojson = buildFacilitiesGeoJson(csvText);

  ensureLegacyArchive();
  fs.writeFileSync(ACTIVE_OUTPUT, JSON.stringify(geojson, null, 2));

  console.log(`Imported ${geojson.features.length} facilities from ${path.relative(ROOT, inputPath)}`);
  console.log(`Wrote ${path.relative(ROOT, ACTIVE_OUTPUT)}`);
  for (const [region, count] of summarizeRegions(geojson.features)) {
    console.log(`  ${region}: ${count}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
