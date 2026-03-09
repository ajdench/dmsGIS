import { describe, expect, it } from 'vitest';
import { layersManifestSchema } from '../src/lib/schemas/layers';

describe('layers manifest schema', () => {
  it('parses a valid layers manifest list', () => {
    const result = layersManifestSchema.parse({
      layers: [
        {
          id: 'facilities',
          name: 'Facilities',
          type: 'point',
          path: 'data/facilities/facilities.geojson',
          visibleByDefault: true,
        },
      ],
    });

    expect(result.layers[0].id).toBe('facilities');
  });
});
