import { describe, expect, it } from 'vitest';
import { sortItemsByPmcRegionOrder } from '../src/lib/regions/regionOrder';

describe('sortItemsByPmcRegionOrder', () => {
  it('keeps Royal Navy after Overseas in the PMC production order', () => {
    const items = sortItemsByPmcRegionOrder([
      { name: 'Overseas' },
      { name: 'Royal Navy' },
      { name: 'North' },
    ]);

    expect(items.map((item) => item.name)).toEqual([
      'North',
      'Overseas',
      'Royal Navy',
    ]);
  });
});
