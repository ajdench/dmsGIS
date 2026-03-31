import type { BoundarySystemId, ViewPresetId } from '../../types';
import { getPresetBoundarySystemId } from './boundarySystems';
import { resolveRuntimeMapProductPath } from './runtimeMapProducts';

export interface UkBasemapAlignmentPaths {
  seaPath: string;
  landPath: string;
}

export const UK_BASEMAP_ALIGNMENT_PATHS: Record<
  BoundarySystemId,
  UkBasemapAlignmentPaths
> = {
  legacyIcbHb: {
    seaPath: 'data/basemaps/uk_seapatch_current_v01.geojson',
    landPath: 'data/basemaps/uk_landmask_current_v01.geojson',
  },
  icbHb2026: {
    seaPath: 'data/basemaps/uk_seapatch_2026_v01.geojson',
    landPath: 'data/basemaps/uk_landmask_2026_v01.geojson',
  },
};

export function getUkBasemapAlignmentPaths(
  boundarySystemId: BoundarySystemId,
): UkBasemapAlignmentPaths {
  const paths = UK_BASEMAP_ALIGNMENT_PATHS[boundarySystemId];
  return {
    seaPath: resolveRuntimeMapProductPath(paths.seaPath),
    landPath: resolveRuntimeMapProductPath(paths.landPath),
  };
}

export function getUkBasemapAlignmentPathsForPreset(
  preset: ViewPresetId,
): UkBasemapAlignmentPaths {
  return getUkBasemapAlignmentPaths(getPresetBoundarySystemId(preset));
}
