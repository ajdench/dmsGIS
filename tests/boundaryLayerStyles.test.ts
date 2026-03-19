import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { Fill, Stroke, Style } from 'ol/style';
import {
  createRegionBoundaryStyle,
  getRegionBoundaryLayerZIndex,
} from '../src/features/map/boundaryLayerStyles';
import type { OverlayLayerStyle } from '../src/types';

function createOverlayLayer(
  overrides: Partial<OverlayLayerStyle> = {},
): OverlayLayerStyle {
  return {
    id: 'careBoardBoundaries',
    name: 'Care board boundaries',
    path: 'data/regions/UK_ICB_LHB_Boundaries_Codex_v10_geojson.geojson',
    family: 'boardBoundaries',
    visible: true,
    opacity: 0.3,
    borderVisible: true,
    borderColor: '#8f8f8f',
    borderOpacity: 0.14,
    swatchColor: '#8f8f8f',
    ...overrides,
  };
}

describe('boundaryLayerStyles', () => {
  it('uses scenario assignment colors for JMC board polygons', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({
        path: 'data/regions/UK_JMC_Source_Board_Assignments_Codex_v02_geojson.geojson',
      }),
      'coa3b',
    );
    const feature = new Feature({
      region_name: 'JMC South East',
      boundary_name: 'NHS Kent and Medway Integrated Care Board',
      is_populated: true,
      geometry: new Polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ]]),
    });

    const style = styleFn(feature) as Style;
    expect(style).toBeInstanceOf(Style);
    expect((style.getFill() as Fill).getColor()).toBe('rgba(184, 213, 176, 0.3)');
    expect((style.getStroke() as Stroke).getColor()).toBe('rgba(143, 143, 143, 0.14)');
  });

  it('uses per-feature stroke metadata for exact health board boundaries', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({
        path: 'data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
        borderColor: '#111111',
        borderOpacity: 0.5,
      }),
      'current',
    );
    const feature = new Feature({
      fill_color_hex: '#00aa55',
      line_color_hex: '#ff0000',
      line_alpha: 50,
      line_width: 1.8,
      geometry: new Polygon([[
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ]]),
    });

    const style = styleFn(feature) as Style;
    expect((style.getFill() as Fill).getColor()).toBe('rgba(0, 170, 85, 0.3)');
    expect((style.getStroke() as Stroke).getColor()).toBe('rgba(255, 0, 0, 0.5)');
    expect((style.getStroke() as Stroke).getWidth()).toBe(1.8);
  });

  it('assigns explicit z-order to key boundary layers', () => {
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ id: 'pmcUnpopulatedCareBoardBoundaries' }),
      ),
    ).toBe(4);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ id: 'pmcPopulatedCareBoardBoundaries' }),
      ),
    ).toBe(5);
    expect(getRegionBoundaryLayerZIndex(createOverlayLayer())).toBe(6);
  });
});
