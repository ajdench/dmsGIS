import { describe, expect, it } from 'vitest';
import {
  parseParValue,
  summarizeFacilityRefreshFeatures,
} from '../scripts/facility-refresh-validation.mjs';

describe('facilityRefreshValidation', () => {
  it('parses PAR values from strings with commas', () => {
    expect(parseParValue('18,566')).toBe(18566);
    expect(parseParValue('')).toBeNull();
    expect(parseParValue(null)).toBeNull();
  });

  it('summarizes facility refresh counts and duplicate groups', () => {
    const summary = summarizeFacilityRefreshFeatures([
      {
        properties: {
          id: 'A1',
          name: 'Open Practice',
          status: 'Open',
          default_visible: 1,
          par: '100',
          active_dmicp_id: '34062',
        },
      },
      {
        properties: {
          id: 'A2',
          name: 'Child Practice',
          status: 'Open',
          default_visible: 1,
          par: '200',
          active_dmicp_id: '34062',
        },
      },
      {
        properties: {
          id: 'A2',
          name: 'Duplicate Id Practice',
          status: 'Closed',
          default_visible: 0,
          par: null,
          active_dmicp_id: '99999',
        },
      },
    ]);

    expect(summary.totalFeatures).toBe(3);
    expect(summary.openCount).toBe(2);
    expect(summary.closedCount).toBe(1);
    expect(summary.defaultVisibleCount).toBe(2);
    expect(summary.hiddenByDefaultCount).toBe(1);
    expect(summary.parBearingCount).toBe(2);
    expect(summary.parTotal).toBe(300);
    expect(summary.duplicateIdGroups).toHaveLength(1);
    expect(summary.duplicateIdGroups[0]?.key).toBe('A2');
    expect(summary.sharedActiveDmicpIdGroups).toHaveLength(1);
    expect(summary.sharedActiveDmicpIdGroups[0]?.key).toBe('34062');
  });
});
