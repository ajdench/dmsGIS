import { describe, expect, it } from 'vitest';
import VectorSource from 'ol/source/Vector';
import { getActiveBoundarySystemLookupSource } from '../src/features/map/workspaceLookupSources';

describe('workspaceLookupSources', () => {
  it('uses the legacy boundary lookup source for the Current preset', () => {
    const legacySource = new VectorSource();
    const boundarySystemLookupSources = new Map([
      ['legacyIcbHb', legacySource] as const,
    ]);

    expect(
      getActiveBoundarySystemLookupSource(
        boundarySystemLookupSources,
        'current',
      ),
    ).toBe(legacySource);
  });

  it('uses the 2026 boundary lookup source for scenario presets', () => {
    const exact2026Source = new VectorSource();
    const boundarySystemLookupSources = new Map([
      ['icbHb2026', exact2026Source] as const,
    ]);

    expect(
      getActiveBoundarySystemLookupSource(
        boundarySystemLookupSources,
        'coa3b',
      ),
    ).toBe(exact2026Source);
  });
});
