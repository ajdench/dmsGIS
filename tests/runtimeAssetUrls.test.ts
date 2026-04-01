import { describe, expect, it } from 'vitest';
import { buildRuntimeAssetUrl } from '../src/lib/runtimeAssetUrls';

describe('runtimeAssetUrls', () => {
  it('keeps the configured base path during dev', () => {
    expect(
      buildRuntimeAssetUrl('data/compare/shared-foundation-review/regions/example.geojson', {
        origin: 'http://127.0.0.1:5174',
        baseUrl: '/dmsGIS/',
        isDev: true,
      }),
    ).toBe(
      'http://127.0.0.1:5174/dmsGIS/data/compare/shared-foundation-review/regions/example.geojson',
    );
  });

  it('keeps the configured base path in production', () => {
    expect(
      buildRuntimeAssetUrl('data/compare/shared-foundation-review/regions/example.geojson', {
        origin: 'https://ajdench.github.io',
        baseUrl: '/dmsGIS/',
        isDev: false,
      }),
    ).toBe(
      'https://ajdench.github.io/dmsGIS/data/compare/shared-foundation-review/regions/example.geojson',
    );
  });

  it('leaves absolute URLs unchanged', () => {
    expect(
      buildRuntimeAssetUrl('https://example.test/data/file.geojson', {
        origin: 'https://ajdench.github.io',
        baseUrl: '/dmsGIS/',
        isDev: false,
      }),
    ).toBe('https://example.test/data/file.geojson');
  });
});
