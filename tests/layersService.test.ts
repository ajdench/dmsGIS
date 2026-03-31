import { describe, expect, it } from 'vitest';
import {
  getRuntimeLayerManifestPath,
  resolveRuntimeLayerPath,
} from '../src/lib/services/layers';

describe('layers service runtime path helpers', () => {
  it('resolves the manifest through the baseline runtime family', () => {
    expect(getRuntimeLayerManifestPath()).toBe('data/manifests/layers.manifest.json');
  });

  it('resolves manifest layer entries through the same baseline runtime family', () => {
    expect(resolveRuntimeLayerPath('data/facilities/facilities.geojson')).toBe('data/facilities/facilities.geojson');
  });
});
