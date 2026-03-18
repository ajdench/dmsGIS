import { readFileSync, writeFileSync } from 'node:fs';

const sourcePath =
  'public/data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson';
const outputPath =
  'public/data/regions/UK_COA3B_Source_Board_Assignments_Codex_v01_geojson.geojson';

const devolvedAdministrations = new Set([
  'JMC Scotland',
  'JMC Northern Ireland',
  'JMC Wales',
]);

const londonAndEastBoundaryNames = new Set([
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
    scenarioName = 'COA 3b Devolved Administrations';
    scenarioCode = 'COA3B_DEVOLVED';
  } else if (regionName === 'JMC North') {
    scenarioName = 'COA 3b North';
    scenarioCode = 'COA3B_NORTH';
  } else if (regionName === 'JMC Centre') {
    scenarioName = 'COA 3b Midlands';
    scenarioCode = 'COA3B_MIDLANDS';
  } else if (regionName === 'JMC South West') {
    scenarioName = 'COA 3b South West';
    scenarioCode = 'COA3B_SOUTH_WEST';
  } else if (regionName === 'JMC South East') {
    scenarioName = 'COA 3b South East';
    scenarioCode = 'COA3B_SOUTH_EAST';
  } else if (regionName === 'London District') {
    scenarioName = 'COA 3b London and East';
    scenarioCode = 'COA3B_LONDON_EAST';
  }

  if (londonAndEastBoundaryNames.has(boundaryName)) {
    scenarioName = 'COA 3b London and East';
    scenarioCode = 'COA3B_LONDON_EAST';
  }

  feature.properties = {
    ...props,
    jmc_name: scenarioName,
    jmc_code: scenarioCode,
  };
}

writeFileSync(outputPath, `${JSON.stringify(scenario)}\n`);
