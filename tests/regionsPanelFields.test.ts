import { describe, expect, it, vi } from 'vitest';
import {
  buildRegionsGlobalPillSections,
  buildRegionsPanelRows,
} from '../src/features/groups/regionsPanelFields';
import type { PresetRegionGroup } from '../src/lib/config/viewPresets';

const groups: PresetRegionGroup[] = [
  {
    name: 'North',
    code: 'north',
    populatedOpacity: 0.35,
    unpopulatedOpacity: 0.25,
    borderColor: '#a7c636',
    borderOpacity: 0.5,
    borderWidth: 1,
    colors: {
      populated: '#a7c636',
      unpopulated: '#d8e7a8',
      outline: '#a7c636',
    },
  },
];

describe('regionsPanelFields', () => {
  it('keeps global and row border controls in colour, thickness, opacity order', () => {
    const globalSections = buildRegionsGlobalPillSections({
      groups,
      overrides: {},
      setAllPopulatedOpacity: vi.fn(),
      setAllUnpopulatedOpacity: vi.fn(),
      setAllBorderVisible: vi.fn(),
      setAllBorderOpacity: vi.fn(),
      setAllBorderWidth: vi.fn(),
    });

    expect(globalSections[2].fields.map((field) => field.label)).toEqual([
      'Thickness',
      'Opacity',
    ]);

    const rows = buildRegionsPanelRows({
      groups,
      overrides: {},
      setVisible: vi.fn(),
      setPopulatedFillVisible: vi.fn(),
      setUnpopulatedFillVisible: vi.fn(),
      setPopulatedFillColor: vi.fn(),
      setUnpopulatedFillColor: vi.fn(),
      setPopulatedOpacity: vi.fn(),
      setUnpopulatedOpacity: vi.fn(),
      setBorderVisible: vi.fn(),
      setBorderColor: vi.fn(),
      setBorderOpacity: vi.fn(),
      setBorderWidth: vi.fn(),
    });

    expect(rows[0].sections[2].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Thickness',
      'Opacity',
    ]);
  });
});
