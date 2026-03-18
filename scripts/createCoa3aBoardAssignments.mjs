import { readFileSync, writeFileSync } from 'node:fs';

const sourcePath =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';
const outputPath =
  'public/data/regions/UK_COA3A_Source_Board_Assignments_Codex_v01_geojson.geojson';

const devolvedAdministrations = new Set([
  'JMC Scotland',
  'JMC Northern Ireland',
  'JMC Wales',
]);

const southEastBoundaryNames = new Set([
  'NHS Essex Integrated Care Board',
  'NHS Central East Integrated Care Board',
  'NHS Norfolk and Suffolk Integrated Care Board',
]);

const scenario = JSON.parse(readFileSync(sourcePath, 'utf8'));

for (const feature of scenario.features ?? []) {
  const props = feature?.properties ?? {};
  const regionName = String(props.jmc_name ?? '').trim();
  const boundaryName = String(props.boundary_name ?? '').trim();

  let scenarioName = regionName;
  let scenarioCode = String(props.jmc_code ?? '').trim();

  if (devolvedAdministrations.has(regionName)) {
    scenarioName = 'COA 3a Devolved Administrations';
    scenarioCode = 'COA3A_DEVOLVED';
  } else if (regionName === 'JMC North') {
    scenarioName = 'COA 3a North';
    scenarioCode = 'COA3A_NORTH';
  } else if (regionName === 'JMC Centre') {
    scenarioName = 'COA 3a Midlands';
    scenarioCode = 'COA3A_MIDLANDS';
  } else if (regionName === 'JMC South West') {
    scenarioName = 'COA 3a South West';
    scenarioCode = 'COA3A_SOUTH_WEST';
  } else if (regionName === 'JMC South East' || regionName === 'London District') {
    scenarioName = 'COA 3a South East';
    scenarioCode = 'COA3A_SOUTH_EAST';
  }

  if (southEastBoundaryNames.has(boundaryName)) {
    scenarioName = 'COA 3a South East';
    scenarioCode = 'COA3A_SOUTH_EAST';
  }

  feature.properties = {
    ...props,
    jmc_name: scenarioName,
    jmc_code: scenarioCode,
  };
}

writeFileSync(outputPath, `${JSON.stringify(scenario)}\n`);
