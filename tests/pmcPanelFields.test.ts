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
      borderVisible: true,
      borderColor: '#0f172a',
      borderOpacity: 0.4,
      symbolSize: 3.5,
    },
    {
      name: 'South West',
      visible: false,
      color: '#16a34a',
      opacity: 0.5,
      borderVisible: false,
      borderColor: '#334155',
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
      setRegionSymbolSize: noop,
      setRegionGlobalOpacity: noop,
      setAllRegionVisibility: noop,
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
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
      setRegionSymbolSize: noop,
      setRegionGlobalOpacity: noop,
      setAllRegionVisibility: noop,
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
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
          borderVisible: true,
          borderColor: '#581c87',
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
      setRegionSymbolSize: noop,
      setRegionGlobalOpacity: noop,
      setAllRegionVisibility: noop,
      setAllRegionBorderVisibility: noop,
      setAllRegionBorderColor: noop,
      setAllRegionBorderOpacity: noop,
      setFacilitySymbolShape: noop,
      setFacilitySymbolSize: noop,
    });

    expect(result.rows.map((row) => row.id)).not.toContain('Overseas');
    expect(result.rows.map((row) => row.id)).toEqual(['North', 'South West']);
  });
});
