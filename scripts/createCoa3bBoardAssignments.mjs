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
const assignment = preset.assignment ?? { codePrefix: '', codeOverrides: {} };

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

  scenarioCode =
    assignment.codeOverrides?.[scenarioName] ??
    `${assignment.codePrefix}_${scenarioName.trim().replace(/\s+/g, '_').toUpperCase()}`;

  feature.properties = {
    ...props,
    jmc_name: scenarioName,
    jmc_code: scenarioCode,
  };
}

writeFileSync(outputPath, `${JSON.stringify(scenario)}\n`);
