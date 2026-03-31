import { describe, expect, it } from 'vitest';
import {
  getActiveRuntimeMapProductId,
  resolveRuntimeMapProductPath,
} from '../src/lib/config/runtimeMapProducts';
import {
  getRuntimeLayerManifestPath,
  resolveRuntimeLayerPath,
} from '../src/lib/services/layers';

describe('runtimeMapProducts', () => {
  it('keeps the explicit shared-foundation review family active during visual inspection', () => {
    expect(getActiveRuntimeMapProductId()).toBe('sharedFoundationReview');
  });

  it('rewrites data paths into the shared-foundation review family', () => {
    expect(resolveRuntimeMapProductPath('data/regions/UK_JMC_Board_simplified.geojson')).toBe(
      'data/compare/shared-foundation-review/regions/UK_JMC_Board_simplified.geojson',
    );
    expect(resolveRuntimeMapProductPath('data/basemaps/uk_landmask_current_v01.geojson')).toBe(
      'data/compare/shared-foundation-review/basemaps/uk_landmask_current_v01.geojson',
    );
  });

  it('leaves non-data paths alone', () => {
    expect(resolveRuntimeMapProductPath('https://example.com/file.geojson')).toBe(
      'https://example.com/file.geojson',
    );
  });

  it('routes the layer manifest and facilities path through the active review family', () => {
    expect(getRuntimeLayerManifestPath()).toBe(
      'data/compare/shared-foundation-review/manifests/layers.manifest.json',
    );
    expect(resolveRuntimeLayerPath('data/facilities/facilities.geojson')).toBe(
      'data/compare/shared-foundation-review/facilities/facilities.geojson',
    );
  });
});
