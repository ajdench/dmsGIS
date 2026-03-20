import type { ViewPresetId } from '../../types';
import {
  parseBoundarySystem,
  type BoundarySystem,
  type BoundarySystemId,
} from '../schemas/boundarySystems';

export const BOUNDARY_SYSTEMS: Record<BoundarySystemId, BoundarySystem> = {
  legacyIcbHb: parseBoundarySystem({
    id: 'legacyIcbHb',
    label: 'Existing ICB / Health Board boundaries',
    description:
      'Legacy current-mode ICB / Health Board boundaries used by the Current preset.',
    interactionBoundaryPath: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
    displayBoundaryPath: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
  }),
  icbHb2026: parseBoundarySystem({
    id: 'icbHb2026',
    label: '2026 ICB / Health Board boundaries',
    description:
      'Updated 2026 ICB / Health Board boundary basis intended for scenario presets and future editable playground work.',
    interactionBoundaryPath:
      'data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
    displayBoundaryPath:
      'data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
  }),
};

export function getBoundarySystem(
  boundarySystemId: BoundarySystemId,
): BoundarySystem {
  return BOUNDARY_SYSTEMS[boundarySystemId];
}

export function getPresetBoundarySystemId(
  preset: ViewPresetId,
): BoundarySystemId {
  return preset === 'current' ? 'legacyIcbHb' : 'icbHb2026';
}

export function getPresetBoundarySystem(preset: ViewPresetId): BoundarySystem {
  return getBoundarySystem(getPresetBoundarySystemId(preset));
}
