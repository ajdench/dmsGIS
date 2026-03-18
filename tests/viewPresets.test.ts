import { describe, expect, it } from 'vitest';
import {
  VIEW_PRESET_BUTTONS,
  getScenarioRegionColor,
  getScenarioRegionName,
} from '../src/lib/config/viewPresets';

describe('view preset config', () => {
  it('defines the visible preset labels in sidebar order', () => {
    expect(VIEW_PRESET_BUTTONS).toEqual([
      { id: 'current', label: 'Current' },
      { id: 'coa3a', label: 'SJC JMC' },
      { id: 'coa3b', label: 'COA 3a' },
      { id: 'coa3c', label: 'COA 3b' },
    ]);
  });

  it('maps coa3b board assignments to coa3a scenario regions', () => {
    expect(getScenarioRegionName('coa3b', 'JMC Centre')).toBe('COA 3a Midlands');
    expect(
      getScenarioRegionName(
        'coa3b',
        'JMC Centre',
        'NHS Essex Integrated Care Board',
      ),
    ).toBe('COA 3a South East');
  });

  it('maps coa3c london and east overrides and colors from shared config', () => {
    expect(getScenarioRegionName('coa3c', 'London District')).toBe(
      'COA 3b London and East',
    );
    expect(
      getScenarioRegionName(
        'coa3c',
        'JMC Centre',
        'NHS Norfolk and Suffolk Integrated Care Board',
      ),
    ).toBe('COA 3b London and East');
    expect(
      getScenarioRegionColor(
        'coa3c',
        'London District',
        '',
        'populated',
      ),
    ).toBe('#d0cbde');
    expect(
      getScenarioRegionColor(
        'coa3c',
        'London District',
        '',
        'outline',
      ),
    ).toBe('#8767ac');
  });
});
