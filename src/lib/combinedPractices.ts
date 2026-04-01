import type {
  CombinedPracticeCatalogEntry,
  CombinedPracticeStyle,
} from '../types';
import { getRegionGroup } from './config/viewPresets';

export type CombinedPracticeColorFamily =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'pink';

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

export function getTrueCombinedPracticeName(input: {
  name?: unknown;
  combined_practice?: unknown;
}): string | null {
  const facilityName = normalizeText(input.name);
  const combinedPracticeName = normalizeText(input.combined_practice);

  if (!combinedPracticeName) {
    return null;
  }

  if (facilityName && combinedPracticeName === facilityName) {
    return null;
  }

  return combinedPracticeName;
}

export function formatCombinedPracticeDisplayName(
  name: string | null,
): string | null {
  if (!name) {
    return null;
  }

  return name.replace(/\s+Combined Medical Practice$/u, '').trim() || name;
}

export function buildDefaultCombinedPracticeStyles(
  inputs: Array<{
    name?: unknown;
    combined_practice?: unknown;
    default_visible?: unknown;
    region?: unknown;
    point_color_hex?: unknown;
  }>,
): CombinedPracticeStyle[] {
  const catalog = buildCombinedPracticeCatalog(inputs);
  const colorContexts = buildCombinedPracticeColorContexts(inputs);
  const usedColors = new Set<string>();
  const assignedColorsByPractice = new Map<string, string>();

  return catalog.map(({ name, displayName, regions }, index) => {
    const context = colorContexts.get(name);
    const forbiddenFamilies = getCombinedPracticeForbiddenColorFamilies(
      regions,
      context?.pointColors,
    );
    const contextColors = [
      ...(context?.pointColors ?? []),
      ...(context?.regionColors ?? []),
    ];
    const neighbouringPracticeColors = catalog
      .slice(0, index)
      .filter((entry) => entry.regions.some((region) => regions.includes(region)))
      .map((entry) => assignedColorsByPractice.get(entry.name))
      .filter((color): color is string => Boolean(color));
    const recentPracticeColors = catalog
      .slice(Math.max(0, index - 2), index)
      .map((entry) => assignedColorsByPractice.get(entry.name))
      .filter((color): color is string => Boolean(color));
    const namedOverrideColor = COMBINED_PRACTICE_NAMED_COLOR_OVERRIDES[name];
    const borderColor =
      namedOverrideColor && !usedColors.has(namedOverrideColor)
        ? namedOverrideColor
        : selectCombinedPracticeBorderColor(
            name,
            index + (COMBINED_PRACTICE_PALETTE_INDEX_OFFSETS[name] ?? 0),
            {
              usedColors,
              forbiddenFamilies,
              contextColors,
              neighbouringPracticeColors,
              recentPracticeColors,
            },
          );

    usedColors.add(borderColor);
    assignedColorsByPractice.set(name, borderColor);

    return {
      ...createDefaultCombinedPracticeStyle(name, index, borderColor),
      displayName,
    };
  });
}

export function buildCombinedPracticeCatalog(
  inputs: Array<{
    name?: unknown;
    combined_practice?: unknown;
    default_visible?: unknown;
    region?: unknown;
    point_color_hex?: unknown;
  }>,
): CombinedPracticeCatalogEntry[] {
  const entriesByName = new Map<
    string,
    { displayName: string; count: number; regions: Set<string> }
  >();

  for (const input of inputs) {
    if (readDefaultVisible(input.default_visible) === 0) {
      continue;
    }

    const combinedPracticeName = getTrueCombinedPracticeName(input);
    if (!combinedPracticeName) {
      continue;
    }

    const entry = entriesByName.get(combinedPracticeName) ?? {
      displayName:
        formatCombinedPracticeDisplayName(combinedPracticeName) ??
        combinedPracticeName,
      count: 0,
      regions: new Set<string>(),
    };

    entry.count += 1;
    const regionName = normalizeText(input.region);
    if (regionName) {
      entry.regions.add(regionName);
    }

    entriesByName.set(combinedPracticeName, entry);
  }

  return [...entriesByName.entries()]
    .filter(([, entry]) => entry.count > 1)
    .map(([name, entry]) => ({
      name,
      displayName: entry.displayName,
      regions: [...entry.regions].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      ),
    }))
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: 'base',
      }),
    );
}

export function createDefaultCombinedPracticeStyle(
  name: string,
  paletteIndex?: number,
  borderColor = getCombinedPracticeFamilyColor(name, paletteIndex),
): CombinedPracticeStyle {
  return {
    name,
    displayName: formatCombinedPracticeDisplayName(name) ?? name,
    visible: true,
    borderColor,
    borderWidth: 1,
    borderOpacity: 1,
  };
}

export function getCombinedPracticeFamilyColor(
  combinedPracticeName: string,
  paletteIndex?: number,
  options?: {
    usedColors?: ReadonlySet<string>;
    forbiddenFamilies?: ReadonlySet<CombinedPracticeColorFamily>;
  },
): string {
  const usedColors = options?.usedColors;
  const forbiddenFamilies = options?.forbiddenFamilies;

  if (typeof paletteIndex === 'number' && Number.isFinite(paletteIndex)) {
    const paletteOffset =
      ((paletteIndex % COMBINED_PRACTICE_FAMILY_PALETTE.length) +
        COMBINED_PRACTICE_FAMILY_PALETTE.length) %
      COMBINED_PRACTICE_FAMILY_PALETTE.length;

    return selectPaletteColor(paletteOffset, usedColors, forbiddenFamilies);
  }

  const normalized = combinedPracticeName.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return selectPaletteColor(
    hash % COMBINED_PRACTICE_FAMILY_PALETTE.length,
    usedColors,
    forbiddenFamilies,
  );
}

function selectCombinedPracticeBorderColor(
  combinedPracticeName: string,
  paletteIndex?: number,
  options?: {
    usedColors?: ReadonlySet<string>;
    forbiddenFamilies?: ReadonlySet<CombinedPracticeColorFamily>;
    contextColors?: readonly string[];
    neighbouringPracticeColors?: readonly string[];
    recentPracticeColors?: readonly string[];
  },
): string {
  const usedColors = options?.usedColors;
  const forbiddenFamilies = options?.forbiddenFamilies;
  const contextColors = options?.contextColors ?? [];
  const neighbouringPracticeColors = options?.neighbouringPracticeColors ?? [];
  const recentPracticeColors = options?.recentPracticeColors ?? [];
  const palette = COMBINED_PRACTICE_FAMILY_PALETTE;
  const startIndex = resolvePaletteStartIndex(combinedPracticeName, paletteIndex);
  let bestColor: string | null = null;
  let bestScore: number | null = null;

  for (let offset = 0; offset < palette.length; offset += 1) {
    const color = palette[(startIndex + offset) % palette.length];
    if (usedColors?.has(color)) {
      continue;
    }

    const family = getCombinedPracticeColorFamily(color);
    const familyPenalty = forbiddenFamilies?.has(family) ? 1000 : 0;
    const minContextDistance = getMinimumPerceptualDistance(color, contextColors);
    const minNeighbourDistance = getMinimumPerceptualDistance(
      color,
      neighbouringPracticeColors,
    );
    const minRecentDistance = getMinimumPerceptualDistance(color, recentPracticeColors);
    const score =
      familyPenalty * -1 +
      minContextDistance * 4 +
      minNeighbourDistance * 3 +
      minRecentDistance * 1.5 -
      offset * 0.01;

    if (bestScore === null || score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  return (
    bestColor ??
    getCombinedPracticeFamilyColor(combinedPracticeName, paletteIndex, {
      usedColors,
      forbiddenFamilies,
    })
  );
}

export function getCombinedPracticeColorFamily(
  color: string,
): CombinedPracticeColorFamily {
  const { hue } = convertHexToHsl(color);

  if (hue < 15 || hue >= 345) {
    return 'red';
  }

  if (hue < 45) {
    return 'orange';
  }

  if (hue < 70) {
    return 'yellow';
  }

  if (hue < 150) {
    return 'green';
  }

  if (hue < 180) {
    return 'teal';
  }

  if (hue < 255) {
    return 'blue';
  }

  if (hue < 315) {
    return 'purple';
  }

  return 'pink';
}

function readDefaultVisible(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 1;
  }

  return 1;
}

function getCombinedPracticeForbiddenColorFamilies(
  regions: readonly string[],
  pointColors?: ReadonlySet<string>,
): Set<CombinedPracticeColorFamily> {
  const families = new Set<CombinedPracticeColorFamily>();

  for (const regionName of regions) {
    const regionColor = getRegionGroup('current', regionName)?.color;
    if (!regionColor) {
      continue;
    }

    families.add(getCombinedPracticeColorFamily(regionColor));
  }

  for (const pointColor of pointColors ?? []) {
    families.add(getCombinedPracticeColorFamily(pointColor));
  }

  return families;
}

function buildCombinedPracticeColorContexts(
  inputs: Array<{
    name?: unknown;
    combined_practice?: unknown;
    default_visible?: unknown;
    region?: unknown;
    point_color_hex?: unknown;
  }>,
): Map<string, { pointColors: Set<string>; regionColors: Set<string> }> {
  const contexts = new Map<
    string,
    { pointColors: Set<string>; regionColors: Set<string> }
  >();

  for (const input of inputs) {
    if (readDefaultVisible(input.default_visible) === 0) {
      continue;
    }

    const combinedPracticeName = getTrueCombinedPracticeName(input);
    if (!combinedPracticeName) {
      continue;
    }

    const context = contexts.get(combinedPracticeName) ?? {
      pointColors: new Set<string>(),
      regionColors: new Set<string>(),
    };

    const pointColor = normalizeText(input.point_color_hex);
    if (pointColor) {
      context.pointColors.add(pointColor);
    }

    const regionColor = getRegionGroup('current', normalizeText(input.region) ?? '')?.color;
    if (regionColor) {
      context.regionColors.add(regionColor);
    }

    contexts.set(combinedPracticeName, context);
  }

  return contexts;
}

function selectPaletteColor(
  startIndex: number,
  usedColors?: ReadonlySet<string>,
  forbiddenFamilies?: ReadonlySet<CombinedPracticeColorFamily>,
): string {
  const palette = COMBINED_PRACTICE_FAMILY_PALETTE;

  for (let offset = 0; offset < palette.length; offset += 1) {
    const color = palette[(startIndex + offset) % palette.length];
    if (usedColors?.has(color)) {
      continue;
    }
    if (
      forbiddenFamilies?.has(getCombinedPracticeColorFamily(color))
    ) {
      continue;
    }

    return color;
  }

  for (let offset = 0; offset < palette.length; offset += 1) {
    const color = palette[(startIndex + offset) % palette.length];
    if (!usedColors?.has(color)) {
      return color;
    }
  }

  return palette[startIndex % palette.length];
}

function convertHexToHsl(color: string): { hue: number; saturation: number; lightness: number } {
  const hex = color.trim().replace(/^#/u, '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((segment) => `${segment}${segment}`)
          .join('')
      : hex;

  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { hue: 0, saturation: 0, lightness };
  }

  const saturation =
    lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);

  let hue =
    max === red
      ? (green - blue) / delta + (green < blue ? 6 : 0)
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4;

  hue *= 60;

  return { hue, saturation, lightness };
}

function resolvePaletteStartIndex(
  combinedPracticeName: string,
  paletteIndex?: number,
): number {
  if (typeof paletteIndex === 'number' && Number.isFinite(paletteIndex)) {
    return (
      ((paletteIndex % COMBINED_PRACTICE_FAMILY_PALETTE.length) +
        COMBINED_PRACTICE_FAMILY_PALETTE.length) %
      COMBINED_PRACTICE_FAMILY_PALETTE.length
    );
  }

  const normalized = combinedPracticeName.trim().toLowerCase();
  let hash = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return hash % COMBINED_PRACTICE_FAMILY_PALETTE.length;
}

function getMinimumPerceptualDistance(color: string, comparisonColors: readonly string[]): number {
  if (comparisonColors.length === 0) {
    return 100;
  }

  return comparisonColors.reduce((minimum, comparisonColor) => {
    return Math.min(minimum, getOklabDistance(color, comparisonColor));
  }, Number.POSITIVE_INFINITY);
}

function getOklabDistance(a: string, b: string): number {
  const colorA = convertHexToOklab(a);
  const colorB = convertHexToOklab(b);

  return Math.sqrt(
    (colorA.l - colorB.l) ** 2 +
      (colorA.a - colorB.a) ** 2 +
      (colorA.b - colorB.b) ** 2,
  );
}

function convertHexToOklab(color: string): { l: number; a: number; b: number } {
  const { red, green, blue } = convertHexToRgb(color);
  const r = srgbChannelToLinear(red / 255);
  const g = srgbChannelToLinear(green / 255);
  const b = srgbChannelToLinear(blue / 255);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function convertHexToRgb(color: string): { red: number; green: number; blue: number } {
  const hex = color.trim().replace(/^#/u, '');
  const normalized =
    hex.length === 3
      ? hex
          .split('')
          .map((segment) => `${segment}${segment}`)
          .join('')
      : hex;

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function srgbChannelToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }

  return ((value + 0.055) / 1.055) ** 2.4;
}

// Bright categorical palette chosen to read clearly as same-shape outer rings on the
// pale operational basemap while staying more distinct than the old raw HSL hash.
// The ordering deliberately hue-jumps so adjacent practices in the stable sorted
// catalog do not land on near neighbours by default.
const COMBINED_PRACTICE_FAMILY_PALETTE = [
  '#ef4444',
  '#14b8a6',
  '#f59e0b',
  '#8b5cf6',
  '#22c55e',
  '#ec4899',
  '#3b82f6',
  '#eab308',
  '#f97316',
  '#06b6d4',
  '#d946ef',
  '#84cc16',
  '#10b981',
  '#6366f1',
  '#f43f5e',
  '#fbbf24',
  '#0ea5e9',
  '#a855f7',
  '#fb923c',
  '#34d399',
  '#fb7185',
  '#2dd4bf',
  '#fde047',
  '#818cf8',
  '#4ade80',
  '#e879f9',
  '#38bdf8',
  '#bef264',
  '#f87171',
  '#22d3ee',
  '#fdba74',
  '#c084fc',
  '#86efac',
  '#db2777',
  '#60a5fa',
  '#f472b6',
] as const;

// Small named nudges for visually awkward defaults that remain after the
// general family-avoidance rule. Keep this list tiny and intentional.
const COMBINED_PRACTICE_PALETTE_INDEX_OFFSETS: Readonly<Record<string, number>> = {
  'Catterick Combined Medical Practice': 1,
};

const COMBINED_PRACTICE_NAMED_COLOR_OVERRIDES: Readonly<Record<string, string>> = {
  'East of Scotland Combined Medical Practice': '#e11d48',
  'Stonehouse Combined Medical Practice': '#db2777',
  'West of Scotland Combined Medical Practice': '#f59e0b',
};
