import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import { buildCurrentRegionRuntimeState } from '../src/features/map/currentRegionRuntime';

describe('currentRegionRuntime', () => {
  it('builds a stable Current outline source and boundary-code region map', () => {
    const activeSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          parent_code: '03',
          parent_name: 'Tayside',
          region_ref: 'Scotland & Northern Ireland',
        }),
      ],
    });
    const inactiveSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          parent_code: '04',
          parent_name: 'Lanarkshire',
          region_ref: 'Scotland & Northern Ireland',
        }),
      ],
    });

    const runtimeState = buildCurrentRegionRuntimeState([activeSource, inactiveSource]);

    expect(runtimeState.regionByBoundaryCode.get('03')).toBe('Scotland & Northern Ireland');
    expect(runtimeState.regionByBoundaryCode.get('04')).toBe('Scotland & Northern Ireland');
    const derivedFeatures = runtimeState.outlineSource?.getFeatures() ?? [];
    expect(derivedFeatures).toHaveLength(1);
    expect(derivedFeatures[0].get('boundary_name')).toBe('Scotland & Northern Ireland');
  });

  it('keeps discontiguous Current region parts in the outline source', () => {
    const activeSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          parent_code: '01',
          region_ref: 'Wales & West Midlands',
        }),
        new Feature({
          geometry: new Polygon([[
            [30, 0],
            [40, 0],
            [40, 10],
            [30, 10],
            [30, 0],
          ]]),
          parent_code: '02',
          region_ref: 'Wales & West Midlands',
        }),
      ],
    });

    const runtimeState = buildCurrentRegionRuntimeState([activeSource]);
    const derivedFeatures = runtimeState.outlineSource?.getFeatures() ?? [];

    expect(derivedFeatures).toHaveLength(2);
    expect(
      derivedFeatures.every(
        (feature) => feature.get('boundary_name') === 'Wales & West Midlands',
      ),
    ).toBe(true);
  });

  it('prefers a prebuilt Current outline source when one is available', () => {
    const activeSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          parent_code: '03',
          region_ref: 'Scotland & Northern Ireland',
        }),
      ],
    });
    const prebuiltOutlineSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [20, 0],
            [20, 20],
            [0, 20],
            [0, 0],
          ]]),
          boundary_name: 'Prebuilt Scotland & Northern Ireland',
          region_name: 'Scotland & Northern Ireland',
        }),
      ],
    });

    const runtimeState = buildCurrentRegionRuntimeState(
      [activeSource],
      prebuiltOutlineSource,
    );

    expect(runtimeState.outlineSource).toBe(prebuiltOutlineSource);
    expect(runtimeState.regionByBoundaryCode.get('03')).toBe('Scotland & Northern Ireland');
  });
});
