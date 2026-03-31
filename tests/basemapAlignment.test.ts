import { describe, expect, it } from 'vitest';
import {
  getUkBasemapAlignmentPaths,
  getUkBasemapAlignmentPathsForPreset,
} from '../src/lib/config/basemapAlignment';
import { resolveRuntimeMapProductPath } from '../src/lib/config/runtimeMapProducts';

describe('basemap alignment config', () => {
  it('maps Current to the legacy land and sea alignment assets', () => {
    expect(getUkBasemapAlignmentPathsForPreset('current')).toEqual({
      seaPath: resolveRuntimeMapProductPath('data/basemaps/uk_seapatch_current_v01.geojson'),
      landPath: resolveRuntimeMapProductPath('data/basemaps/uk_landmask_current_v01.geojson'),
    });
  });

  it('maps scenario presets to the 2026 land and sea alignment assets', () => {
    expect(getUkBasemapAlignmentPathsForPreset('coa3a')).toEqual({
      seaPath: resolveRuntimeMapProductPath('data/basemaps/uk_seapatch_2026_v01.geojson'),
      landPath: resolveRuntimeMapProductPath('data/basemaps/uk_landmask_2026_v01.geojson'),
    });
    expect(getUkBasemapAlignmentPaths('icbHb2026')).toEqual({
      seaPath: resolveRuntimeMapProductPath('data/basemaps/uk_seapatch_2026_v01.geojson'),
      landPath: resolveRuntimeMapProductPath('data/basemaps/uk_landmask_2026_v01.geojson'),
    });
  });
});
