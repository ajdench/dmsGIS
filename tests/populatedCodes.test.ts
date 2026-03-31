import { describe, expect, it } from 'vitest';
import { buildEffectivePopulatedCodes } from '../src/features/map/populatedCodes';

describe('buildEffectivePopulatedCodes', () => {
  it('includes populated codes from both current and 2026 facility mappings', () => {
    const result = buildEffectivePopulatedCodes(
      new Set(['E54000022', 'E54000034']),
      new Set(['E54000065', 'E54000067']),
    );

    expect(result.has('E54000022')).toBe(true);
    expect(result.has('E54000034')).toBe(true);
    expect(result.has('E54000065')).toBe(true);
    expect(result.has('E54000067')).toBe(true);
    expect(result.size).toBe(4);
  });

  it('deduplicates codes that appear in both sets', () => {
    const result = buildEffectivePopulatedCodes(
      new Set(['E54000008', 'E54000010']),
      new Set(['E54000008', 'E54000065']),
    );

    expect([...result].sort()).toEqual([
      'E54000008',
      'E54000010',
      'E54000065',
    ]);
  });
});
