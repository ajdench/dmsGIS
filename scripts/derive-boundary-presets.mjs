/**
 * derive-boundary-presets.mjs
 *
 * Reads the two simplified canonical boundary sources and generates preset-specific
 * board + outline files. No large pre-dissolved assignment files required.
 *
 * Usage:
 *   node scripts/derive-boundary-presets.mjs
 *
 * Inputs (public/data/regions/):
 *   UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson        (68 features)
 *   UK_Health_Board_Boundaries_Codex_2026_simplified.geojson   (62 features)
 *
 * Outputs (public/data/regions/):
 *   UK_JMC_Board_simplified.geojson        2026 features + jmc_name
 *   UK_JMC_Outline_simplified.geojson      2026 dissolved by jmc_name (8 regions)
 *   UK_COA3A_Board_simplified.geojson      2026 features + region_name
 *   UK_COA3A_Outline_simplified.geojson    2026 dissolved by coa3a_name (5 regions)
 *   UK_COA3B_Board_simplified.geojson      2026 features + region_name
 *   UK_COA3B_Outline_simplified.geojson    2026 dissolved by coa3b_name (6 regions)
 */

import mapshaper from 'mapshaper';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGIONS = process.env.REGIONS_DIR
  ? path.resolve(ROOT, process.env.REGIONS_DIR)
  : path.join(ROOT, 'public', 'data', 'regions');

// Scotland SHB codes (2-digit strings used in the data).
const SCOTLAND_CODES = new Set(['02', '03', '04', '05', '06', '07', '10', '11', '12', '13', '14', '15', '16', '17']);
const WALES_CODES = new Set(['W11000023', 'W11000024', 'W11000025', 'W11000028', 'W11000029', 'W11000030', 'W11000031']);
const NI_CODES = new Set(['BHSCT', 'NHSCT', 'WHSCT', 'SHSCT', 'SEHSCT']);

// ---------------------------------------------------------------------------
// COA3A regionGroups (mirrors viewPresets.json coa3b entry)
// ---------------------------------------------------------------------------
const COA3A_GROUPS = [
  { name: 'COA 3a Devolved Administrations', sourceJmcNames: ['JMC Scotland', 'JMC Northern Ireland', 'JMC Wales'] },
  { name: 'COA 3a North',                    sourceJmcNames: ['JMC North'] },
  { name: 'COA 3a Midlands',                 sourceJmcNames: ['JMC Centre'] },
  { name: 'COA 3a South West',               sourceJmcNames: ['JMC South West'] },
  { name: 'COA 3a South East',               sourceJmcNames: ['JMC South East', 'London District'] },
];

// boundaryOverrides override the above for specific boundary_names.
const COA3A_BOUNDARY_OVERRIDES = {
  'NHS Essex Integrated Care Board':          'COA 3a South East',
  'NHS Central East Integrated Care Board':   'COA 3a South East',
  'NHS Norfolk and Suffolk Integrated Care Board': 'COA 3a South East',
};

// ---------------------------------------------------------------------------
// COA3B regionGroups (mirrors viewPresets.json coa3c entry)
// ---------------------------------------------------------------------------
const COA3B_GROUPS = [
  { name: 'COA 3b Devolved Administrations', sourceJmcNames: ['JMC Scotland', 'JMC Northern Ireland', 'JMC Wales'] },
  { name: 'COA 3b North',                    sourceJmcNames: ['JMC North'] },
  { name: 'COA 3b Midlands',                 sourceJmcNames: ['JMC Centre'] },
  { name: 'COA 3b South West',               sourceJmcNames: ['JMC South West'] },
  { name: 'COA 3b South East',               sourceJmcNames: ['JMC South East'] },
  { name: 'COA 3b London and East',          sourceJmcNames: ['London District'] },
];

const COA3B_BOUNDARY_OVERRIDES = {
  'NHS Essex Integrated Care Board':          'COA 3b London and East',
  'NHS Central East Integrated Care Board':   'COA 3b London and East',
  'NHS Norfolk and Suffolk Integrated Care Board': 'COA 3b London and East',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveJmcNameFor2026(boundaryCode, jmc2026Lookup) {
  if (SCOTLAND_CODES.has(boundaryCode)) return 'JMC Scotland';
  if (WALES_CODES.has(boundaryCode))    return 'JMC Wales';
  if (NI_CODES.has(boundaryCode))       return 'JMC Northern Ireland';
  return jmc2026Lookup.get(boundaryCode) ?? null;
}

function resolveCoaName(jmcName, boundaryName, groups, boundaryOverrides) {
  const override = boundaryOverrides[boundaryName];
  if (override) return override;
  const group = groups.find((g) => g.sourceJmcNames.includes(jmcName));
  return group?.name ?? null;
}

/**
 * Dissolve GeoJSON features by a named field and write the output.
 * Uses Mapshaper for topology-preserving dissolve.
 */
async function dissolveByField(inputGeoJson, fieldName, outputPath, dissolvedRegionField = 'region_name') {
  // Write temp file for mapshaper.
  const tmpIn = outputPath + '.tmp_in.geojson';
  const tmpOut = outputPath + '.tmp_out.geojson';
  fs.writeFileSync(tmpIn, JSON.stringify(inputGeoJson));

  const cmd = [
    `-i "${tmpIn}" snap`,
    `-dissolve ${fieldName} copy-fields=${fieldName}`,
    `-rename-fields ${dissolvedRegionField}=${fieldName}`,
    `-o "${tmpOut}" format=geojson precision=0.000001`,
  ].join(' ');

  await mapshaper.runCommands(cmd);

  // Read and clean up.
  const result = JSON.parse(fs.readFileSync(tmpOut, 'utf8'));
  fs.unlinkSync(tmpIn);
  fs.unlinkSync(tmpOut);
  return result;
}

function writeGeoJson(outputPath, geojson) {
  fs.writeFileSync(outputPath, JSON.stringify(geojson));
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2);
  const count = geojson.features.length;
  console.log(`  Written: ${path.basename(outputPath)} (${count} features, ${sizeMB} MB)`);
}

function readFirstExistingJson(candidates) {
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, 'utf8'));
    }
  }
  throw new Error(`Missing required input; checked: ${candidates.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== derive-boundary-presets ===');

  // Load inputs.
  const v10 = JSON.parse(
    fs.readFileSync(path.join(REGIONS, 'UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'), 'utf8'),
  );
  const src2026 = JSON.parse(
    fs.readFileSync(path.join(REGIONS, 'UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'), 'utf8'),
  );
  const jmcAssignments = readFirstExistingJson([
    path.join(REGIONS, 'UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'),
    path.join(REGIONS, 'full-res', 'UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson'),
  ]);

  // Build lookup: boundary_code → jmc_name from 2026 assignment file.
  const jmc2026Lookup = new Map(
    jmcAssignments.features.map((f) => [f.properties.boundary_code, f.properties.jmc_name]),
  );

  console.log(`v10 features: ${v10.features.length}`);
  console.log(`2026 features: ${src2026.features.length}`);

  // -------------------------------------------------------------------------
  // JMC board: 2026 + jmc_name
  // -------------------------------------------------------------------------
  console.log('\n--- JMC board (2026 source) ---');
  const jmcBoard = {
    type: 'FeatureCollection',
    features: src2026.features.map((f) => {
      const code = f.properties.boundary_code;
      const jmcName = resolveJmcNameFor2026(code, jmc2026Lookup);
      if (!jmcName) {
        console.warn(`  [warn] No JMC mapping for 2026 code: ${code} (${f.properties.boundary_name})`);
      }
      return {
        ...f,
        properties: {
          ...f.properties,
          jmc_name: jmcName ?? 'Unknown',
          region_name: jmcName ?? 'Unknown',
          source_region_name: jmcName ?? 'Unknown',
          is_populated: true,
        },
      };
    }),
  };
  writeGeoJson(path.join(REGIONS, 'UK_JMC_Board_simplified.geojson'), jmcBoard);

  // JMC outline: dissolve 2026 by jmc_name.
  console.log('\n--- JMC outline (dissolve 2026 by jmc_name) ---');
  const jmcOutline = await dissolveByField(
    jmcBoard,
    'jmc_name',
    path.join(REGIONS, 'UK_JMC_Outline_simplified.geojson'),
  );
  writeGeoJson(path.join(REGIONS, 'UK_JMC_Outline_simplified.geojson'), jmcOutline);

  // -------------------------------------------------------------------------
  // COA3A board: 2026 + jmc_name + region_name
  // -------------------------------------------------------------------------
  console.log('\n--- COA3A board (2026 source) ---');
  const coa3aBoard = {
    type: 'FeatureCollection',
    features: src2026.features.map((f) => {
      const code = f.properties.boundary_code;
      const jmcName = resolveJmcNameFor2026(code, jmc2026Lookup);
      const coaName = resolveCoaName(
        jmcName ?? '',
        f.properties.boundary_name,
        COA3A_GROUPS,
        COA3A_BOUNDARY_OVERRIDES,
      );
      if (!jmcName) {
        console.warn(`  [warn] No JMC mapping for 2026 code: ${code} (${f.properties.boundary_name})`);
      }
      return {
        ...f,
        properties: {
          ...f.properties,
          jmc_name: jmcName ?? 'Unknown',
          region_name: coaName ?? 'Unknown',
          source_region_name: jmcName ?? 'Unknown',
          coa3a_name: coaName ?? 'Unknown',
          is_populated: true,
        },
      };
    }),
  };
  writeGeoJson(path.join(REGIONS, 'UK_COA3A_Board_simplified.geojson'), coa3aBoard);

  // COA3A outline: dissolve 2026 by coa3a_name.
  console.log('\n--- COA3A outline (dissolve 2026 by coa3a_name) ---');
  const coa3aOutline = await dissolveByField(
    coa3aBoard,
    'coa3a_name',
    path.join(REGIONS, 'UK_COA3A_Outline_simplified.geojson'),
  );
  writeGeoJson(path.join(REGIONS, 'UK_COA3A_Outline_simplified.geojson'), coa3aOutline);

  // -------------------------------------------------------------------------
  // COA3B board: same 2026 source + jmc_name + region_name
  // -------------------------------------------------------------------------
  console.log('\n--- COA3B board (2026 source) ---');
  const coa3bBoard = {
    type: 'FeatureCollection',
    features: src2026.features.map((f) => {
      const code = f.properties.boundary_code;
      const jmcName = resolveJmcNameFor2026(code, jmc2026Lookup);
      const coaName = resolveCoaName(
        jmcName ?? '',
        f.properties.boundary_name,
        COA3B_GROUPS,
        COA3B_BOUNDARY_OVERRIDES,
      );
      if (!jmcName) {
        console.warn(`  [warn] No JMC mapping for 2026 code: ${code} (${f.properties.boundary_name})`);
      }
      return {
        ...f,
        properties: {
          ...f.properties,
          jmc_name: jmcName ?? 'Unknown',
          region_name: coaName ?? 'Unknown',
          source_region_name: jmcName ?? 'Unknown',
          coa3b_name: coaName ?? 'Unknown',
          is_populated: true,
        },
      };
    }),
  };
  writeGeoJson(path.join(REGIONS, 'UK_COA3B_Board_simplified.geojson'), coa3bBoard);

  // COA3B outline: dissolve 2026 by coa3b_name.
  console.log('\n--- COA3B outline (dissolve 2026 by coa3b_name) ---');
  const coa3bOutline = await dissolveByField(
    coa3bBoard,
    'coa3b_name',
    path.join(REGIONS, 'UK_COA3B_Outline_simplified.geojson'),
  );
  writeGeoJson(path.join(REGIONS, 'UK_COA3B_Outline_simplified.geojson'), coa3bOutline);

  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
