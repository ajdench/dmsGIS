import { LABEL_SIMPLE_SECTIONS, OVERLAY_ROWS, REGION_ROWS } from './data';
import type { PrototypeShape, SwatchStop } from './PrototypeControls';

export type LabelSectionId = (typeof LABEL_SIMPLE_SECTIONS)[number]['id'];
export type OverlaySectionId = (typeof OVERLAY_ROWS)[number]['key'];

export interface RegionStyleState {
  shape: PrototypeShape;
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

export interface LabelStyleState {
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

export interface OverlayStyleState {
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

export type LabelStyleKey = keyof LabelStyleState;
export type OverlayStyleKey = keyof OverlayStyleState;
export type RegionStyleKey = keyof RegionStyleState;

export type LabelStylesRecord = Record<LabelSectionId, LabelStyleState>;
export type OverlayStylesRecord = Record<OverlaySectionId, OverlayStyleState>;
export type RegionStylesRecord = Record<string, RegionStyleState>;

export const INITIAL_FACILITY_STYLE: RegionStyleState = {
  shape: 'circle',
  size: 3.5,
  opacity: 0.75,
  color: '#ed5151',
  borderColor: '#cbd5e1',
  borderWidth: 1,
  borderOpacity: 0.2,
};

export const INITIAL_LABEL_STYLES: LabelStylesRecord = {
  'country-labels': {
    size: 8,
    opacity: 0.4,
    color: '#0f172a',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.3,
  },
  'major-cities': {
    size: 6,
    opacity: 0.65,
    color: '#1f2937',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.35,
  },
  'region-labels': {
    size: 7,
    opacity: 0.5,
    color: '#334155',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.3,
  },
  'network-labels': {
    size: 6,
    opacity: 0.55,
    color: '#475569',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.32,
  },
  'facility-labels': {
    size: 5.5,
    opacity: 0.7,
    color: '#111827',
    borderColor: '#f8fafc',
    borderWidth: 0.5,
    borderOpacity: 0.36,
  },
};

export const INITIAL_OVERLAY_STYLES: OverlayStylesRecord = {
  careBoards: {
    opacity: 1,
    color: '#f4b740',
    borderColor: '#8f8f8f',
    borderWidth: 1,
    borderOpacity: 0.35,
  },
  pmcPopulated: {
    opacity: 0.75,
    color: '#ed5151',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderOpacity: 0,
  },
  pmcUnpopulated: {
    opacity: 0.35,
    color: '#94a3b8',
    borderColor: '#ffffff',
    borderWidth: 1,
    borderOpacity: 0,
  },
};

export function buildInitialRegionStyles(): RegionStylesRecord {
  return Object.fromEntries(
    REGION_ROWS.map((region) => [region, { ...INITIAL_FACILITY_STYLE }]),
  ) as RegionStylesRecord;
}

export function buildInitialLabelStyles(): LabelStylesRecord {
  return structuredClone(INITIAL_LABEL_STYLES);
}

export function buildInitialOverlayStyles(): OverlayStylesRecord {
  return structuredClone(INITIAL_OVERLAY_STYLES);
}

export function getMixedRegionColors(
  regionStyles: RegionStylesRecord,
  key: 'color' | 'borderColor',
): SwatchStop[] | undefined {
  const opacityKey = key === 'color' ? 'opacity' : 'borderOpacity';
  const colors = Array.from(
    new Map(
      Object.values(regionStyles).map((style) => [
        `${style[key]}|${style[opacityKey]}`,
        {
          color: style[key],
          opacity: style[opacityKey],
        },
      ]),
    ).values(),
  );

  return colors.length > 1 ? colors : undefined;
}

export function applyGlobalStyleChange(
  current: RegionStylesRecord,
  overrides: Partial<RegionStyleState>,
): RegionStylesRecord {
  return Object.fromEntries(
    Object.entries(current).map(([region, style]) => [
      region,
      {
        ...style,
        ...overrides,
      },
    ]),
  ) as RegionStylesRecord;
}

export function updateStyleRecord<
  TRecord extends Record<string, object>,
  TId extends keyof TRecord,
  TKey extends keyof TRecord[TId],
>(
  current: TRecord,
  id: TId,
  key: TKey,
  value: TRecord[TId][TKey],
): TRecord {
  return {
    ...current,
    [id]: {
      ...current[id],
      [key]: value,
    },
  };
}
