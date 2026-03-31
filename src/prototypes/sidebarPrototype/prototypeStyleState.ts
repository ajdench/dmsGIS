import { LABEL_SIMPLE_SECTIONS, OVERLAY_ROWS, REGION_ROWS } from './data';
import type { PrototypeShape, SwatchStop } from './PrototypeControls';

export type LabelSectionId = (typeof LABEL_SIMPLE_SECTIONS)[number]['id'];
export type OverlaySectionId = (typeof OVERLAY_ROWS)[number]['key'];

export interface RegionStyleState {
  pointsEnabled: boolean;
  borderEnabled: boolean;
  shape: PrototypeShape;
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

export interface LabelStyleState {
  textEnabled: boolean;
  borderEnabled: boolean;
  size: number;
  opacity: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
}

export interface OverlayStyleState {
  layerEnabled: boolean;
  borderEnabled: boolean;
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
  pointsEnabled: true,
  borderEnabled: false,
  shape: 'circle',
  size: 3.5,
  opacity: 0.75,
  color: '#ed5151',
  borderColor: '#cbd5e1',
  borderWidth: 0,
  borderOpacity: 0,
};

export const INITIAL_LABEL_STYLES: LabelStylesRecord = {
  'country-labels': {
    textEnabled: true,
    borderEnabled: false,
    size: 8,
    opacity: 0.4,
    color: '#0f172a',
    borderColor: '#f8fafc',
    borderWidth: 0,
    borderOpacity: 0,
  },
  'major-cities': {
    textEnabled: true,
    borderEnabled: false,
    size: 6,
    opacity: 0.65,
    color: '#1f2937',
    borderColor: '#f8fafc',
    borderWidth: 0,
    borderOpacity: 0,
  },
  'region-labels': {
    textEnabled: true,
    borderEnabled: false,
    size: 7,
    opacity: 0.5,
    color: '#334155',
    borderColor: '#f8fafc',
    borderWidth: 0,
    borderOpacity: 0,
  },
  'network-labels': {
    textEnabled: true,
    borderEnabled: false,
    size: 6,
    opacity: 0.55,
    color: '#475569',
    borderColor: '#f8fafc',
    borderWidth: 0,
    borderOpacity: 0,
  },
  'facility-labels': {
    textEnabled: true,
    borderEnabled: false,
    size: 5.5,
    opacity: 0.7,
    color: '#111827',
    borderColor: '#f8fafc',
    borderWidth: 0,
    borderOpacity: 0,
  },
};

export const INITIAL_OVERLAY_STYLES: OverlayStylesRecord = {
  careBoards: {
    layerEnabled: true,
    borderEnabled: false,
    opacity: 1,
    color: '#f4b740',
    borderColor: '#8f8f8f',
    borderWidth: 0,
    borderOpacity: 0,
  },
  pmcPopulated: {
    layerEnabled: true,
    borderEnabled: false,
    opacity: 0.75,
    color: '#ed5151',
    borderColor: '#ffffff',
    borderWidth: 0,
    borderOpacity: 0,
  },
  pmcUnpopulated: {
    layerEnabled: true,
    borderEnabled: false,
    opacity: 0.35,
    color: '#94a3b8',
    borderColor: '#ffffff',
    borderWidth: 0,
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
