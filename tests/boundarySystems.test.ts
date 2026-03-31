import { describe, expect, it } from 'vitest';
import {
  getBoundarySystem,
  getPresetBoundarySystemId,
} from '../src/lib/config/boundarySystems';
import { resolveRuntimeMapProductPath } from '../src/lib/config/runtimeMapProducts';

describe('boundarySystems', () => {
  it('keeps Current on the legacy ICB/HB boundary system', () => {
    expect(getPresetBoundarySystemId('current')).toBe('legacyIcbHb');
    expect(getBoundarySystem('legacyIcbHb').interactionBoundaryPath).toBe(
      resolveRuntimeMapProductPath('data/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson'),
    );
  });

  it('maps scenario presets to the 2026 ICB/HB boundary system', () => {
    expect(getPresetBoundarySystemId('coa3a')).toBe('icbHb2026');
    expect(getPresetBoundarySystemId('coa3b')).toBe('icbHb2026');
    expect(getPresetBoundarySystemId('coa3c')).toBe('icbHb2026');
    expect(getBoundarySystem('icbHb2026').interactionBoundaryPath).toBe(
      resolveRuntimeMapProductPath('data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson'),
    );
  });
});
