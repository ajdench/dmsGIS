import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import MultiPolygon from 'ol/geom/MultiPolygon';
import { buildDerivedScenarioOutlineSource } from '../src/features/map/derivedScenarioOutlineSource';

describe('derivedScenarioOutlineSource', () => {
  it('groups assignment features into one derived outline feature per scenario region', () => {
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          region_name: 'COA 3b London and East',
        }),
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          region_name: 'COA 3b London and East',
        }),
      ],
    });

    const derivedSource = buildDerivedScenarioOutlineSource(assignmentSource);
    const derivedFeature = derivedSource?.getFeatures()[0];

    expect(derivedSource?.getFeatures()).toHaveLength(1);
    expect(derivedFeature?.get('region_name')).toBe('COA 3b London and East');
    expect(derivedFeature?.getGeometry()).toBeInstanceOf(MultiPolygon);
    expect((derivedFeature?.getGeometry() as MultiPolygon).getPolygons()).toHaveLength(2);
  });
});
