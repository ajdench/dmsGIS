import { describe, expect, it } from 'vitest';
import {
  VIEW_PRESET_BUTTONS,
  getGroupNameForCode,
  getScenarioRegionColor,
  getScenarioWardSplitParentCodes,
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

  it('maps boundary codes to DPHC regions for Current preset', () => {
    // Scotland & Northern Ireland
    expect(getGroupNameForCode('current', 'BHSCT')).toBe('Scotland & Northern Ireland');
    expect(getGroupNameForCode('current', '10')).toBe('Scotland & Northern Ireland');
    // Wales & West Midlands
    expect(getGroupNameForCode('current', 'W11000023')).toBe('Wales & West Midlands');
    expect(getGroupNameForCode('current', 'E54000008')).toBe('Wales & West Midlands');
    // East
    expect(getGroupNameForCode('current', 'E54000013')).toBe('East');
    // London & South
    expect(getGroupNameForCode('current', 'E54000027')).toBe('London & South');
    // North
    expect(getGroupNameForCode('current', 'E54000050')).toBe('North');
    // Central & Wessex
    expect(getGroupNameForCode('current', 'E54000039')).toBe('Central & Wessex');
    // South West
    expect(getGroupNameForCode('current', 'E54000036')).toBe('South West');
    // Ward-split ICBs should NOT appear in codeGroupings (handled via wardSplitPath)
    expect(getGroupNameForCode('current', 'E54000042')).toBeNull();
    expect(getGroupNameForCode('current', 'E54000048')).toBeNull();
    expect(getGroupNameForCode('current', 'E54000025')).toBeNull();
  });

  it('exposes the three Current split-parent boundary codes separately from codeGroupings', () => {
    expect([...getScenarioWardSplitParentCodes('current')].sort()).toEqual([
      'E54000025',
      'E54000042',
      'E54000048',
    ]);
  });

  it('maps 2026 boundary codes to JMC groups for coa3a preset', () => {
    expect(getGroupNameForCode('coa3a', 'E54000008')).toBe('JMC North');
    expect(getGroupNameForCode('coa3a', 'E54000010')).toBe('JMC Centre');
    expect(getGroupNameForCode('coa3a', 'E54000029')).toBe('London District');
    expect(getGroupNameForCode('coa3a', 'E54000032')).toBe('JMC South East');
    expect(getGroupNameForCode('coa3a', 'W11000023')).toBe('JMC Wales');
    expect(getGroupNameForCode('coa3a', 'BHSCT')).toBe('JMC Northern Ireland');
    expect(getGroupNameForCode('coa3a', '10')).toBe('JMC Scotland');
  });

  it('maps 2026 boundary codes to COA 3a groups, including Essex overrides', () => {
    // Standard JMC Centre → COA 3a Midlands
    expect(getGroupNameForCode('coa3b', 'E54000010')).toBe('COA 3a Midlands');
    // Essex ICB → COA 3a South East (override, absorbed into codeGroupings)
    expect(getGroupNameForCode('coa3b', 'E54000065')).toBe('COA 3a South East');
    // Central East → COA 3a South East
    expect(getGroupNameForCode('coa3b', 'E54000066')).toBe('COA 3a South East');
    // Norfolk & Suffolk → COA 3a South East
    expect(getGroupNameForCode('coa3b', 'E54000068')).toBe('COA 3a South East');
    // London District codes → COA 3a South East
    expect(getGroupNameForCode('coa3b', 'E54000071')).toBe('COA 3a South East');
  });

  it('maps 2026 boundary codes to COA 3b groups with London and East region', () => {
    // London District codes → COA 3b London and East
    expect(getGroupNameForCode('coa3c', 'E54000071')).toBe('COA 3b London and East');
    expect(getGroupNameForCode('coa3c', 'E54000029')).toBe('COA 3b London and East');
    // Essex ICB → COA 3b London and East (override)
    expect(getGroupNameForCode('coa3c', 'E54000065')).toBe('COA 3b London and East');
    // JMC South East → COA 3b South East (distinct from London and East)
    expect(getGroupNameForCode('coa3c', 'E54000032')).toBe('COA 3b South East');
  });

  it('resolves colours by boundary code for coa3c', () => {
    // E54000071 = London District → COA 3b London and East
    // After Task 3: populated now uses the group base colour (#8767ac), not the tinted hex.
    expect(getScenarioRegionColor('coa3c', 'E54000071', '', 'populated')).toBe('#8767ac');
    expect(getScenarioRegionColor('coa3c', 'E54000071', '', 'outline')).toBe('#8767ac');
  });
});
