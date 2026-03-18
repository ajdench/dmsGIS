import rawConfig from './viewPresets.json';
import type { ViewPresetId } from '../../types';

type PopulationState = 'unpopulated' | 'populated' | 'outline';

interface PresetRegionGroup {
  name: string;
  sourceRegions: string[];
  colors: Record<PopulationState, string>;
}

interface ScenarioBoardLayerConfig {
  path: string;
  opacity: number;
}

interface ScenarioOutlineLayerConfig {
  name: string;
  path: string;
  visible: boolean;
  opacity: number;
  borderColor: string;
  borderOpacity: number;
  swatchColor: string;
}

interface ScenarioPresetConfig {
  id: ViewPresetId;
  label: string;
  boardLayer: ScenarioBoardLayerConfig;
  outlineLayer: ScenarioOutlineLayerConfig;
  lookupBoundaryPath: string;
  regionGroups: PresetRegionGroup[];
  boundaryOverrides: Record<string, string>;
}

interface ViewPresetConfigFile {
  presetOrder: ViewPresetId[];
  boardBoundaryStyle: {
    name: string;
    borderColor: string;
    borderOpacity: number;
    swatchColor: string;
  };
  presets: Record<
    ViewPresetId,
    | {
        id: ViewPresetId;
        label: string;
      }
    | ScenarioPresetConfig
  >;
}

const config = rawConfig as ViewPresetConfigFile;

export const VIEW_PRESET_ORDER = config.presetOrder;

export const VIEW_PRESET_BUTTONS = VIEW_PRESET_ORDER.map((id) => ({
  id,
  label: config.presets[id].label,
}));

export const BOARD_BOUNDARY_BASE_STYLE = config.boardBoundaryStyle;

export function isScenarioPreset(preset: ViewPresetId): preset is Exclude<ViewPresetId, 'current'> {
  return preset !== 'current';
}

export function getPresetLabel(preset: ViewPresetId): string {
  return config.presets[preset].label;
}

export function getScenarioPresetConfig(
  preset: ViewPresetId,
): ScenarioPresetConfig | null {
  if (!isScenarioPreset(preset)) return null;
  return config.presets[preset] as ScenarioPresetConfig;
}

export function getScenarioBoardLayerConfig(
  preset: ViewPresetId,
): ScenarioBoardLayerConfig | null {
  return getScenarioPresetConfig(preset)?.boardLayer ?? null;
}

export function getScenarioOutlineLayerConfig(
  preset: ViewPresetId,
): ScenarioOutlineLayerConfig | null {
  return getScenarioPresetConfig(preset)?.outlineLayer ?? null;
}

export function getScenarioLookupBoundaryPath(
  preset: ViewPresetId,
): string | null {
  return getScenarioPresetConfig(preset)?.lookupBoundaryPath ?? null;
}

export function getScenarioRegionName(
  preset: ViewPresetId,
  regionName: string,
  boundaryName = '',
): string {
  const scenario = getScenarioPresetConfig(preset);
  if (!scenario) return regionName;

  const override = scenario.boundaryOverrides[boundaryName];
  if (override) return override;

  const group = scenario.regionGroups.find((entry) =>
    entry.sourceRegions.includes(regionName),
  );
  return group?.name ?? regionName;
}

export function getScenarioRegionColor(
  preset: ViewPresetId,
  regionName: string,
  boundaryName: string,
  populationState: PopulationState,
): string | null {
  const scenario = getScenarioPresetConfig(preset);
  if (!scenario) return null;

  const scenarioRegionName = getScenarioRegionName(preset, regionName, boundaryName);
  const group = scenario.regionGroups.find((entry) => entry.name === scenarioRegionName);
  return group?.colors[populationState] ?? null;
}

export function getScenarioBoundaryLookupPresets(): ViewPresetId[] {
  return VIEW_PRESET_ORDER.filter((preset) => getScenarioLookupBoundaryPath(preset) !== null);
}
