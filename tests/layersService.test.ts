import { describe, expect, it } from 'vitest';
import {
  getRuntimeLayerManifestPath,
  resolveRuntimeLayerPath,
} from '../src/lib/services/layers';

describe('layers service runtime path helpers', () => {
  it('resolves the manifest through the active runtime family', () => {
    expect(getRuntimeLayerManifestPath()).toBe(
      'data/compare/shared-foundation-review/manifests/layers.manifest.json',
    );
  });

  it('resolves manifest layer entries through the same active runtime family', () => {
    expect(resolveRuntimeLayerPath('data/facilities/facilities.geojson')).toBe(
      'data/compare/shared-foundation-review/facilities/facilities.geojson',
    );
  });
});
