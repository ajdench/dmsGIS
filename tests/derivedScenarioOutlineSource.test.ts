import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import MultiPolygon from 'ol/geom/MultiPolygon';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
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
    expect(derivedFeature?.getGeometry()).toBeInstanceOf(Polygon);
    expect((derivedFeature?.getGeometry() as Polygon).getCoordinates()[0]).toHaveLength(5);
  });

  it('preserves multiple dissolved outline pieces for one scenario region', () => {
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new MultiPolygon([
            [[
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ]],
            [[
              [20, 0],
              [30, 0],
              [30, 10],
              [20, 10],
              [20, 0],
            ]],
          ]),
          region_name: 'COA 3b Midlands',
        }),
      ],
    });

    const derivedSource = buildDerivedScenarioOutlineSource(assignmentSource);
    const derivedFeatures = derivedSource?.getFeatures() ?? [];

    expect(derivedFeatures).toHaveLength(2);
    expect(
      derivedFeatures.every(
        (feature) => feature.get('region_name') === 'COA 3b Midlands',
      ),
    ).toBe(true);
  });

  it('preserves scenario region ids on merged editable region geometry', () => {
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          boundary_code: 'E1',
          scenario_region_id: 'coa3b_south_east',
          region_name: 'COA 3b South East',
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
        }),
        new Feature({
          boundary_code: 'E2',
          scenario_region_id: 'coa3b_london_east',
          region_name: 'COA 3b London and East',
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
        }),
      ],
    });

    const derivedSource = buildDerivedScenarioOutlineSource(assignmentSource);
    const derivedFeatures = derivedSource?.getFeatures() ?? [];
    const southEast = derivedFeatures.filter(
      (feature) => feature.get('region_name') === 'COA 3b South East',
    );
    const londonEast = derivedFeatures.filter(
      (feature) => feature.get('region_name') === 'COA 3b London and East',
    );

    expect(derivedFeatures.every((feature) => feature.getGeometry() instanceof Polygon)).toBe(true);
    expect(southEast).toHaveLength(1);
    expect(londonEast).toHaveLength(1);
    expect(southEast[0]?.get('scenario_region_id')).toBe('coa3b_south_east');
    expect(londonEast[0]?.get('scenario_region_id')).toBe('coa3b_london_east');
  });
});
