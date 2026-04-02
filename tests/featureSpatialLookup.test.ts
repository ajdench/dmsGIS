import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import { findFeatureContainingCoordinate } from '../src/features/map/featureSpatialLookup';

describe('featureSpatialLookup', () => {
  it('returns the intersecting polygon feature for a coordinate while ignoring non-containing features', () => {
    const expectedFeature = new Feature({
      geometry: new Polygon([[
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ]]),
      name: 'Expected polygon',
    });
    const source = new VectorSource({
      features: [
        new Feature({
          geometry: new Point([50, 50]),
          name: 'Ignored point',
        }),
        expectedFeature,
      ],
    });

    expect(findFeatureContainingCoordinate(source, [5, 5])).toBe(expectedFeature);
    expect(findFeatureContainingCoordinate(source, [20, 20])).toBeNull();
  });
});
