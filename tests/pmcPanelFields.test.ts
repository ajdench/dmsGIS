import { describe, expect, it, vi } from 'vitest';
import { buildPmcPanelDefinition } from '../src/features/groups/pmcPanelFields';
import type { RegionStyle } from '../src/types';

const noop = vi.fn();

function buildDefinition(overrides: Partial<Parameters<typeof buildPmcPanelDefinition>[0]> = {}) {
  return buildPmcPanelDefinition({
    regions: buildRegions(),
    facilitySymbolShape: 'circle',
    facilitySymbolSize: 3.5,
    regionGlobalOpacity: 0.55,
    setRegionVisibility: noop,
    setRegionColor: noop,
    setRegionOpacity: noop,
    setRegionBorderVisibility: noop,
    setRegionBorderColor: noop,
    setRegionBorderOpacity: noop,
    setRegionBorderWidth: noop,
    setRegionShape: noop,
    setRegionSymbolSize: noop,
    setRegionGlobalOpacity: noop,
    setAllRegionVisibility: noop,
    setAllRegionColor: noop,
    resetAllRegionColorsToDefault: noop,
    setAllRegionBorderVisibility: noop,
    setAllRegionBorderColor: noop,
    setAllRegionBorderOpacity: noop,
    setAllRegionBorderWidth: noop,
    copyFillToBorder: noop,
    copyRegionFillToBorder: noop,
    setAllRegionShape: noop,
    setFacilitySymbolSize: noop,
    ...overrides,
  });
}

function buildRegions(): RegionStyle[] {
  return [
    {
      name: 'North',
      visible: true,
      color: '#1d4ed8',
      opacity: 0.6,
      shape: 'diamond',
      borderVisible: true,
      borderColor: '#0f172a',
      borderWidth: 1.5,
      borderOpacity: 0.4,
      symbolSize: 3.5,
    },
    {
      name: 'South West',
      visible: false,
      color: '#16a34a',
      opacity: 0.5,
      shape: 'triangle',
      borderVisible: false,
      borderColor: '#334155',
      borderWidth: 0.5,
      borderOpacity: 0.2,
      symbolSize: 3.5,
    },
  ];
}

describe('buildPmcPanelDefinition', () => {
  it('carries the global facility shape through PMC and region swatches', () => {
    const result = buildDefinition({
      facilitySymbolShape: 'diamond',
    });

    expect(result.pillSummary.swatch.shape).toBe('diamond');
    expect(result.rows[0].pill.swatch?.shape).toBe('diamond');
  });

  it('preserves swatch opacity when points are hidden under the sunsetted policy', () => {
    const result = buildDefinition();

    expect(result.rows.find((row) => row.id === 'South West')?.pill.swatch?.opacity).toBe(
      0.5,
    );
  });

  it('keeps the PMC list on the fixed production order, with Royal Navy after Overseas', () => {
    const result = buildDefinition({
      regions: [
        ...buildRegions(),
        {
          name: 'Overseas',
          visible: true,
          color: '#9333ea',
          opacity: 0.4,
          shape: 'square',
          borderVisible: true,
          borderColor: '#581c87',
          borderWidth: 1,
          borderOpacity: 0.3,
          symbolSize: 3.5,
        },
        {
          name: 'Royal Navy',
          visible: true,
          color: '#000080',
          opacity: 0.4,
          shape: 'square',
          borderVisible: true,
          borderColor: '#0f172a',
          borderWidth: 1,
          borderOpacity: 0.3,
          symbolSize: 3.5,
        },
      ],
    });

    expect(result.rows.map((row) => row.id)).toEqual([
      'North',
      'South West',
      'Overseas',
      'Royal Navy',
    ]);
  });

  it('matches the prototype points inventory for global PMC and child rows where production state supports it', () => {
    const result = buildDefinition();

    expect(result.visibilityState).toBe('mixed');
    expect(result.sections[0].enabledState).toBe('on');
    expect(result.sections[0].fields.map((field) => field.label)).toEqual([
      'Shape',
      'Colour',
      'Size',
      'Opacity',
    ]);
    expect(result.sections[1].enabledState).toBe('off');
    expect(result.rows[0].sections[0].enabledState).toBe('on');
    expect(result.rows[0].sections[0].fields.map((field) => field.label)).toEqual([
      'Shape',
      'Colour',
      'Size',
      'Opacity',
    ]);
    expect(result.sections[1].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Thickness',
      'Opacity',
    ]);
    expect(result.rows[0].sections[1].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Thickness',
      'Opacity',
    ]);
  });

  it('wires child shape and border thickness controls to the child region only', () => {
    const setRegionShape = vi.fn();
    const setRegionBorderWidth = vi.fn();

    const result = buildDefinition({
      setRegionBorderWidth,
      setRegionShape,
    });

    const northRow = result.rows[0];
    const shapeField = northRow.sections[0].fields[0];
    const borderWidthField = northRow.sections[1].fields[1];

    if (shapeField.kind !== 'shape' || borderWidthField.kind !== 'slider') {
      throw new Error('Expected shape and thickness fields');
    }

    shapeField.onChange('square');
    borderWidthField.onChange(2.25);

    expect(setRegionShape).toHaveBeenCalledWith('North', 'square');
    expect(setRegionBorderWidth).toHaveBeenCalledWith('North', 2.25);
  });

  it('adds a reset-style multi-colour helper to the global PMC points colour field', () => {
    const resetAllRegionColorsToDefault = vi.fn();

    const result = buildDefinition({
      resetAllRegionColorsToDefault,
      defaultRegionColors: {
        North: '#0f766e',
        'South West': '#9333ea',
      },
    });

    const colourField = result.sections[0].fields[1];

    if (colourField.kind !== 'color') {
      throw new Error('Expected a global PMC colour field');
    }

    expect(colourField.copyLabel).toBe('Reset to default colours');
    expect(colourField.copyShowIcon).toBe(true);
    expect(colourField.copyIcon).toBe('reset');
    expect(colourField.copySwatches).toEqual([
      { color: '#0f766e', opacity: 0.6 },
      { color: '#9333ea', opacity: 0.5 },
    ]);

    colourField.onCopy?.();

    expect(resetAllRegionColorsToDefault).toHaveBeenCalledTimes(1);
  });

  it('uses full-opacity fill colours for PMC border copy helpers instead of point opacity', () => {
    const result = buildDefinition();

    const globalBorderColourField = result.sections[1].fields[0];
    const rowBorderColourField = result.rows[0].sections[1].fields[0];

    if (globalBorderColourField.kind !== 'color' || rowBorderColourField.kind !== 'color') {
      throw new Error('Expected PMC border colour fields');
    }

    expect(globalBorderColourField.copySwatches).toEqual([
      { color: '#1d4ed8', opacity: 1 },
      { color: '#16a34a', opacity: 1 },
    ]);
    expect(rowBorderColourField.copySwatches).toEqual([
      { color: '#1d4ed8', opacity: 1 },
    ]);
  });

  it('retains the global PMC border multi-colour swatch when border visibility is turned off', () => {
    const result = buildDefinition({
      regions: buildRegions().map((region) => ({
        ...region,
        borderVisible: false,
      })),
    });

    const globalBorderColourField = result.sections[1].fields[0];

    if (globalBorderColourField.kind !== 'color') {
      throw new Error('Expected a global PMC border colour field');
    }

    expect(globalBorderColourField.mixedSwatches).toEqual([
      { color: '#0f172a', opacity: 0.4 },
      { color: '#334155', opacity: 0.2 },
    ]);
  });

  it('lets the global PMC border popover button use its own control state override', () => {
    const result = buildDefinition({
      borderSectionStateOverride: 'off',
      regions: buildRegions().map((region) => ({
        ...region,
        borderVisible: true,
      })),
    });

    expect(result.sections[1].enabledState).toBe('off');
  });
});
