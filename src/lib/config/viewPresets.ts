import rawConfig from './viewPresets.json';
import type { ViewPresetId } from '../../types';
import { resolveRuntimeMapProductPath } from './runtimeMapProducts';

export type PopulationState = 'unpopulated' | 'populated' | 'outline';

export interface PresetRegionGroup {
  name: string;
  /** Base hue for UI controls (solid reference colour). */
  color: string;
  /** Fill opacity when the ICB/HB contains ≥1 facility (0–1). */
  populatedOpacity: number;
  /** Fill opacity when the ICB/HB contains no facilities (0–1). */
  unpopulatedOpacity: number;
  /** Border colour used at rest. */
  borderColor: string;
  /** Border opacity at rest (0–1). */
  borderOpacity: number;
  /** Border stroke width in pixels (default 1). */
  borderWidth: number;
  /** Border colour on hover. */
  hoverBorderColor: string;
  /** Border opacity on hover (0–1). */
  hoverBorderOpacity: number;
  /** Border colour when selected. */
  selectBorderColor: string;
  /** Border opacity when selected (0–1). */
  selectBorderOpacity: number;
  /**
   * Legacy per-state color map retained for backward-compatible callers.
   * Prefer `color` + opacity handles for new code.
   */
  colors: Record<PopulationState, string>;
}

export interface ScenarioBoardLayerConfig {
  path: string;
  opacity: number;
}

export interface ScenarioOutlineLayerConfig {
  name: string;
  path: string;
  visible: boolean;
  opacity: number;
  borderColor: string;
  borderOpacity: number;
  swatchColor: string;
}

export interface ScenarioPresetConfig {
  id: ViewPresetId;
  label: string;
  assignment?: {
    codePrefix: string;
    codeOverrides: Record<string, string>;
  };
  boardLayer: ScenarioBoardLayerConfig;
  /** Path to ward-split sub-polygon GeoJSON (Current preset only). */
  wardSplitPath?: string;
  /** Parent boundary codes replaced by ward-split sub-polygons. */
  wardSplitParentCodes?: string[];
  outlineLayer: ScenarioOutlineLayerConfig;
  lookupBoundaryPath: string;
  /**
   * Maps boundary_code → group name for all ICBs/HBs in this preset.
   * Replaces the old sourceRegions + boundaryOverrides approach.
   */
  codeGroupings: Record<string, string>;
  regionGroups: PresetRegionGroup[];
}

interface ViewPresetConfigFile {
  presetOrder: ViewPresetId[];
  boardBoundaryStyle: {
    name: string;
    borderColor: string;
    borderOpacity: number;
    swatchColor: string;
  };
  presets: Record<ViewPresetId, ScenarioPresetConfig>;
}

const config = rawConfig as ViewPresetConfigFile;

export const VIEW_PRESET_ORDER = config.presetOrder;

export const VIEW_PRESET_BUTTONS = VIEW_PRESET_ORDER.map((id) => ({
  id,
  label: config.presets[id].label,
}));

export const BOARD_BOUNDARY_BASE_STYLE = config.boardBoundaryStyle;

/**
 * Returns true for all presets (every preset now has a full ScenarioPresetConfig,
 * including 'current'). Retained as a type-guard hook for future use.
 */
export function isScenarioPreset(preset: ViewPresetId): boolean {
  void preset;
  return true;
}

export function getPresetLabel(preset: ViewPresetId): string {
  return config.presets[preset].label;
}

export function getScenarioPresetConfig(
  preset: ViewPresetId,
): ScenarioPresetConfig | null {
  return config.presets[preset] ?? null;
}

export function getScenarioBoardLayerConfig(
  preset: ViewPresetId,
): ScenarioBoardLayerConfig | null {
  const boardLayer = getScenarioPresetConfig(preset)?.boardLayer;
  if (!boardLayer) return null;
  return {
    ...boardLayer,
    path: resolveRuntimeMapProductPath(boardLayer.path),
  };
}

export function getScenarioOutlineLayerConfig(
  preset: ViewPresetId,
): ScenarioOutlineLayerConfig | null {
  const outlineLayer = getScenarioPresetConfig(preset)?.outlineLayer;
  if (!outlineLayer) return null;
  return {
    ...outlineLayer,
    path: resolveRuntimeMapProductPath(outlineLayer.path),
  };
}

export function getScenarioLookupBoundaryPath(
  preset: ViewPresetId,
): string | null {
  const lookupPath = getScenarioPresetConfig(preset)?.lookupBoundaryPath;
  return lookupPath ? resolveRuntimeMapProductPath(lookupPath) : null;
}

export function getScenarioWardSplitPath(
  preset: ViewPresetId,
): string | null {
  const wardSplitPath = getScenarioPresetConfig(preset)?.wardSplitPath;
  return wardSplitPath ? resolveRuntimeMapProductPath(wardSplitPath) : null;
}

export function getScenarioWardSplitParentCodes(
  preset: ViewPresetId,
): ReadonlySet<string> {
  return new Set(getScenarioPresetConfig(preset)?.wardSplitParentCodes ?? []);
}

/**
 * Resolves boundary_code → group name using codeGroupings.
 * Ward-split features use region_ref directly (not this function).
 */
export function getGroupNameForCode(
  preset: ViewPresetId,
  boundaryCode: string,
): string | null {
  const scenario = getScenarioPresetConfig(preset);
  if (!scenario) return null;
  return scenario.codeGroupings[boundaryCode] ?? null;
}

/**
 * Finds the PresetRegionGroup for a given group name.
 */
export function getRegionGroup(
  preset: ViewPresetId,
  groupName: string,
): PresetRegionGroup | null {
  const scenario = getScenarioPresetConfig(preset);
  if (!scenario) return null;
  return scenario.regionGroups.find((g) => g.name === groupName) ?? null;
}

/**
 * Returns the fill colour for a given boundary code and population state.
 * Used by boundary layer styling.
 */
export function getScenarioRegionColor(
  preset: ViewPresetId,
  boundaryCode: string,
  boundaryName: string,
  populationState: PopulationState,
): string | null {
  void boundaryName;
  const groupName = getGroupNameForCode(preset, boundaryCode);
  if (!groupName) return null;
  return getRegionGroup(preset, groupName)?.colors[populationState] ?? null;
}

/**
 * @deprecated Use getGroupNameForCode(preset, boundaryCode) instead.
 * Kept for callers that still pass regionName + boundaryName from feature properties.
 */
export function getScenarioRegionName(
  preset: ViewPresetId,
  regionName: string,
  boundaryName = '',
): string {
  void preset;
  void boundaryName;
  return regionName;
}

/**
 * Returns the public path to the pre-computed exterior arc GeoJSON for a
 * given preset + group name (used for the region selection highlight layer).
 * Matches the filename convention produced by extract-group-outlines.mjs.
 */
export function getGroupOutlinePath(preset: ViewPresetId, groupName: string): string {
  const s = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
  return resolveRuntimeMapProductPath(`data/regions/outlines/${preset}_${s}.geojson`);
}

export function getGroupInlandWaterOutlinePath(
  preset: ViewPresetId,
  groupName: string,
): string {
  const s = groupName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/, '');
  return resolveRuntimeMapProductPath(`data/regions/outlines/${preset}_${s}_inland_water.geojson`);
}

export function getScenarioBoundaryLookupPresets(): ViewPresetId[] {
  return VIEW_PRESET_ORDER.filter((preset) => getScenarioLookupBoundaryPath(preset) !== null);
}
