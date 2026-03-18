import { readFileSync, writeFileSync } from 'node:fs';

const sourcePath =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';
const outputPath =
  'public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson';
const presetConfigPath = 'src/lib/config/viewPresets.json';

const scenario = JSON.parse(readFileSync(sourcePath, 'utf8'));
const presetConfig = JSON.parse(readFileSync(presetConfigPath, 'utf8'));
const preset = presetConfig.presets.coa3c;
const boundaryOverrides = new Map(Object.entries(preset.boundaryOverrides ?? {}));
const groups = preset.regionGroups ?? [];

for (const feature of scenario.features ?? []) {
  const props = feature?.properties ?? {};
  const regionName = String(props.jmc_name ?? '').trim();
  const boundaryName = String(props.boundary_name ?? '').trim();

  let scenarioName = boundaryOverrides.get(boundaryName) ?? regionName;
  let scenarioCode = String(props.jmc_code ?? '').trim();

  if (!boundaryOverrides.has(boundaryName)) {
    const matchedGroup = groups.find((group) =>
      (group.sourceRegions ?? []).includes(regionName),
    );
    if (matchedGroup) {
      scenarioName = matchedGroup.name;
    }
  }

  scenarioCode = String(props.jmc_code ?? '')
    .trim()
    .replace(/^JMC/i, 'COA3B')
    .replace(/^COA 3b /i, 'COA3B_')
    .replace(/\s+/g, '_')
    .toUpperCase();
  if (scenarioName === 'COA 3b Devolved Administrations') scenarioCode = 'COA3B_DEVOLVED';
  if (scenarioName === 'COA 3b North') scenarioCode = 'COA3B_NORTH';
  if (scenarioName === 'COA 3b Midlands') scenarioCode = 'COA3B_MIDLANDS';
  if (scenarioName === 'COA 3b South West') scenarioCode = 'COA3B_SOUTH_WEST';
  if (scenarioName === 'COA 3b South East') scenarioCode = 'COA3B_SOUTH_EAST';
  if (scenarioName === 'COA 3b London and East') scenarioCode = 'COA3B_LONDON_EAST';

  feature.properties = {
    ...props,
    jmc_name: scenarioName,
    jmc_code: scenarioCode,
  };
}

writeFileSync(outputPath, `${JSON.stringify(scenario)}\n`);
