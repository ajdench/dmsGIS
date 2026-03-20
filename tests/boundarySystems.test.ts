import { describe, expect, it } from 'vitest';
import {
  getBoundarySystem,
  getPresetBoundarySystemId,
} from '../src/lib/config/boundarySystems';

describe('boundarySystems', () => {
  it('keeps Current on the legacy ICB/HB boundary system', () => {
    expect(getPresetBoundarySystemId('current')).toBe('legacyIcbHb');
    expect(getBoundarySystem('legacyIcbHb').interactionBoundaryPath).toBe(
      'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
    );
  });

  it('maps scenario presets to the 2026 ICB/HB boundary system', () => {
    expect(getPresetBoundarySystemId('coa3a')).toBe('icbHb2026');
    expect(getPresetBoundarySystemId('coa3b')).toBe('icbHb2026');
    expect(getPresetBoundarySystemId('coa3c')).toBe('icbHb2026');
    expect(getBoundarySystem('icbHb2026').interactionBoundaryPath).toBe(
      'data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
    );
  });
});
