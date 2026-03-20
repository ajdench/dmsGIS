import {
  getScenarioPresetConfig,
  getScenarioRegionName,
} from './viewPresets';
import type { ViewPresetId } from '../../types';

export interface ScenarioAssignment {
  name: string;
  code: string;
}

export function resolveScenarioAssignment(
  preset: ViewPresetId,
  sourceRegionName: string,
  boundaryName: string,
  sourceCode = '',
): ScenarioAssignment {
  const name = getScenarioRegionName(preset, sourceRegionName, boundaryName);
  const code = getScenarioAssignmentCode(preset, name, sourceCode);
  return { name, code };
}

export function getScenarioAssignmentCode(
  preset: ViewPresetId,
  scenarioRegionName: string,
  sourceCode = '',
): string {
  const scenario = getScenarioPresetConfig(preset);
  const assignment = scenario?.assignment;
  if (!assignment) {
    return sourceCode.trim();
  }

  const override = assignment.codeOverrides[scenarioRegionName];
  if (override) {
    return override;
  }

  const normalizedName = scenarioRegionName
    .trim()
    .replace(/\s+/g, '_')
    .toUpperCase();
  if (!normalizedName) {
    return sourceCode.trim();
  }

  return `${assignment.codePrefix}_${normalizedName}`;
}
