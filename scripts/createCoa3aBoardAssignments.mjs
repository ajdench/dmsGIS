import { readFileSync, writeFileSync } from 'node:fs';

const sourcePath =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';
const outputPath =
  'public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson';
const presetConfigPath = 'src/lib/config/viewPresets.json';

const scenario = JSON.parse(readFileSync(sourcePath, 'utf8'));
const presetConfig = JSON.parse(readFileSync(presetConfigPath, 'utf8'));
const preset = presetConfig.presets.coa3b;
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
    .replace(/^JMC/i, 'COA3A')
    .replace(/^COA 3a /i, 'COA3A_')
    .replace(/\s+/g, '_')
    .toUpperCase();
  if (scenarioName === 'COA 3a Devolved Administrations') scenarioCode = 'COA3A_DEVOLVED';
  if (scenarioName === 'COA 3a North') scenarioCode = 'COA3A_NORTH';
  if (scenarioName === 'COA 3a Midlands') scenarioCode = 'COA3A_MIDLANDS';
  if (scenarioName === 'COA 3a South West') scenarioCode = 'COA3A_SOUTH_WEST';
  if (scenarioName === 'COA 3a South East') scenarioCode = 'COA3A_SOUTH_EAST';

  feature.properties = {
    ...props,
    jmc_name: scenarioName,
    jmc_code: scenarioCode,
  };
}

writeFileSync(outputPath, `${JSON.stringify(scenario)}\n`);
