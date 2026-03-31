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

  return catalog.map(({ name, displayName, regions }, index) => {
    const forbiddenFamilies = getCombinedPracticeForbiddenColorFamilies(
      regions,
      colorContexts.get(name)?.pointColors,
    );
    const namedOverrideColor = COMBINED_PRACTICE_NAMED_COLOR_OVERRIDES[name];
    const borderColor =
      namedOverrideColor &&
      !usedColors.has(namedOverrideColor) &&
      !forbiddenFamilies.has(getCombinedPracticeColorFamily(namedOverrideColor))
        ? namedOverrideColor
        : getCombinedPracticeFamilyColor(
            name,
            index + (COMBINED_PRACTICE_PALETTE_INDEX_OFFSETS[name] ?? 0),
            {
              usedColors,
              forbiddenFamilies,
            },
          );

    usedColors.add(borderColor);

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
): Map<string, { pointColors: Set<string> }> {
  const contexts = new Map<string, { pointColors: Set<string> }>();

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
    };

    const pointColor = normalizeText(input.point_color_hex);
    if (pointColor) {
      context.pointColors.add(pointColor);
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
  '#84cc16',
  '#f97316',
  '#06b6d4',
  '#d946ef',
  '#eab308',
  '#10b981',
  '#6366f1',
  '#f43f5e',
  '#a3e635',
  '#0ea5e9',
  '#a855f7',
  '#fb923c',
  '#34d399',
  '#fb7185',
  '#2dd4bf',
  '#fbbf24',
  '#818cf8',
  '#4ade80',
  '#e879f9',
  '#38bdf8',
  '#65a30d',
  '#f87171',
  '#22d3ee',
  '#fdba74',
  '#c084fc',
  '#16a34a',
  '#db2777',
  '#2563eb',
  '#86efac',
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
