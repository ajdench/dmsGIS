import { describe, expect, it, vi } from 'vitest';
import { buildPmcPanelDefinition } from '../src/features/groups/pmcPanelFields';
import type { RegionStyle } from '../src/types';

const noop = vi.fn();

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
    const result = buildPmcPanelDefinition({
      regions: buildRegions(),
      facilitySymbolShape: 'diamond',
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
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setAllRegionBorderWidth: noop,
      setAllRegionShape: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    expect(result.pillSummary.swatch.shape).toBe('diamond');
    expect(result.rows[0].pill.swatch?.shape).toBe('diamond');
  });

  it('zeros swatch opacity when points are hidden', () => {
    const result = buildPmcPanelDefinition({
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
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setAllRegionBorderWidth: noop,
      setAllRegionShape: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    expect(result.rows.find((row) => row.id === 'South West')?.pill.swatch?.opacity).toBe(
      0,
    );
  });

  it('keeps the PMC list on the fixed seven-region production order', () => {
    const result = buildPmcPanelDefinition({
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
      ],
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
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setAllRegionBorderWidth: noop,
      setAllRegionShape: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    expect(result.rows.map((row) => row.id)).not.toContain('Overseas');
    expect(result.rows.map((row) => row.id)).toEqual(['North', 'South West']);
  });

  it('matches the prototype points inventory for global PMC and child rows where production state supports it', () => {
    const result = buildPmcPanelDefinition({
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
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setAllRegionBorderWidth: noop,
      setAllRegionShape: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    expect(result.sections[0].enabledState).toBe('mixed');
    expect(result.sections[0].fields.map((field) => field.label)).toEqual([
      'Shape',
      'Size',
      'Colour',
      'Opacity',
    ]);
    expect(result.rows[0].sections[0].enabledState).toBe('on');
    expect(result.rows[0].sections[0].fields.map((field) => field.label)).toEqual([
      'Shape',
      'Colour',
      'Size',
      'Opacity',
    ]);
  });

  it('wires child shape and border thickness controls to the child region only', () => {
    const setRegionShape = vi.fn();
    const setRegionBorderWidth = vi.fn();

    const result = buildPmcPanelDefinition({
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
      setRegionBorderWidth,
      setRegionShape,
      setRegionSymbolSize: noop,
      setRegionGlobalOpacity: noop,
      setAllRegionVisibility: noop,
      setAllRegionColor: noop,
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setAllRegionBorderWidth: noop,
      setAllRegionShape: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    const northRow = result.rows[0];
    const shapeField = northRow.sections[0].fields[0];
    const borderWidthField = northRow.sections[1].fields[2];

    if (shapeField.kind !== 'shape' || borderWidthField.kind !== 'slider') {
      throw new Error('Expected shape and thickness fields');
    }

    shapeField.onChange('square');
    borderWidthField.onChange(2.25);

    expect(setRegionShape).toHaveBeenCalledWith('North', 'square');
    expect(setRegionBorderWidth).toHaveBeenCalledWith('North', 2.25);
  });
});
