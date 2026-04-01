import { describe, expect, it } from 'vitest';
import {
  getRuntimeLayerManifestPath,
  resolveRuntimeLayerPath,
} from '../src/lib/services/layers';

describe('layers service runtime path helpers', () => {
  it('keeps the manifest on the stable public root', () => {
    expect(getRuntimeLayerManifestPath()).toBe('data/manifests/layers.manifest.json');
  });

  it('resolves manifest layer entries through the same active runtime family', () => {
    expect(resolveRuntimeLayerPath('data/facilities/facilities.geojson')).toBe(
      'data/compare/shared-foundation-review/facilities/facilities.geojson',
    );
  });
});
