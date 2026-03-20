import type VectorSource from 'ol/source/Vector';
import type { BoundarySystemId, ViewPresetId } from '../../types';
import { getPresetBoundarySystemId } from '../../lib/config/boundarySystems';

export function getActiveBoundarySystemLookupSource(
  boundarySystemLookupSources: Map<BoundarySystemId, VectorSource>,
  activeViewPreset: ViewPresetId,
): VectorSource | null {
  return (
    boundarySystemLookupSources.get(getPresetBoundarySystemId(activeViewPreset)) ??
    null
  );
}
