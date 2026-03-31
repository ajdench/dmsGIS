import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
import {
  createRegionBoundaryStyle,
  createSelectedWaterEdgeModifierStyle,
  createSplitInternalArcStyle,
  createWaterEdgeArcStyle,
  createWaterEdgeBorderModifierStyle,
  getRegionBoundaryLayerZIndex,
} from '../src/features/map/boundaryLayerStyles';
import type { OverlayLayerStyle } from '../src/types';

const POLYGON_COORDS = [[
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
  [0, 0],
]];

function createOverlayLayer(
  overrides: Partial<OverlayLayerStyle> = {},
): OverlayLayerStyle {
  return {
    id: 'careBoardBoundaries',
    name: 'ICB / Health Board boundaries',
    path: 'data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
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

function createRegionBoundaryRefs(feature: Feature): Map<string, VectorLayer<VectorSource>> {
  const regionFillSource = new VectorSource();
  regionFillSource.addFeature(feature);
  return new Map([
    ['regionFill', new VectorLayer({ source: regionFillSource })],
  ]);
}

describe('boundaryLayerStyles', () => {
  it('uses codeGroupings to colour JMC board polygons', () => {
    // E54000069 → JMC South East → COA 3a South East in coa3b preset
    const populatedCodes = new Set(['E54000069']);
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer(),
      'coa3b',
      populatedCodes,
    );
    const feature = new Feature({
      boundary_code: 'E54000069',
      boundary_name: 'NHS Kent and Medway Integrated Care Board',
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    expect(style).toBeInstanceOf(Style);
    // After Task 3: coa3b South East populated color is the base color '#419632' at opacity 0.40.
    const fillColor = (style.getFill() as Fill).getColor() as string;
    expect(fillColor).toContain('65, 150, 50'); // #419632 = rgb(65, 150, 50)
    // Border color from group.borderColor '#419632' at group.borderOpacity 0.5
    const strokeColor = (style.getStroke() as Stroke).getColor() as string;
    expect(strokeColor).toContain('65, 150, 50'); // #419632
  });

  it('uses unpopulated opacity when boundary code not in populatedCodes', () => {
    // E54000010 → COA 3a Midlands, unpopulated
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer(),
      'coa3b',
      new Set(), // empty — no populated codes
    );
    const feature = new Feature({
      boundary_code: 'E54000010',
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    expect(style).toBeInstanceOf(Style);
    // After Task 3: coa3b Midlands unpopulated color is the base color '#ed5151' at opacity 0.22.
    const fillColor = (style.getFill() as Fill).getColor() as string;
    expect(fillColor).toContain('237, 81, 81'); // #ed5151 = rgb(237, 81, 81)
  });

  it('prefers runtime-assigned region styling over preset code-group styling', () => {
    const populatedCodes = new Set(['E54000065']);
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer(),
      'coa3c',
      populatedCodes,
    );
    const feature = new Feature({
      boundary_code: 'E54000065',
      boundary_name: 'NHS Essex Integrated Care Board',
      scenario_region_id: 'coa3b_midlands',
      region_name: 'COA 3b Midlands',
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    const fillColor = (style.getFill() as Fill).getColor() as string;
    const strokeColor = (style.getStroke() as Stroke).getColor() as string;

    expect(fillColor).toContain('237, 81, 81');
    expect(strokeColor).toContain('237, 81, 81');
  });

  it('uses per-feature stroke metadata for health board boundaries (2026)', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({
        path: 'data/regions/UK_Health_Board_Boundaries_Codex_2026_simplified.geojson',
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
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    // No boundary_code → falls back to fill_color_hex
    expect((style.getFill() as Fill).getColor()).toBe('rgba(0, 170, 85, 0.3)');
    // line_color_hex + line_alpha used for stroke (50/100 = 0.5)
    expect((style.getStroke() as Stroke).getColor()).toBe('rgba(255, 0, 0, 0.5)');
    expect((style.getStroke() as Stroke).getWidth()).toBe(1.8);
  });

  it('falls back to swatch color when boundary code not in codeGroupings', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({ swatchColor: '#aabbcc', opacity: 0.4 }),
      'current',
    );
    const feature = new Feature({
      boundary_code: 'UNKNOWN_CODE',
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    expect((style.getFill() as Fill).getColor()).toBe('rgba(170, 187, 204, 0.4)');
  });

  it('suppresses Current parent-board fills that are replaced by ward splits', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'regionFill', swatchColor: '#aabbcc', opacity: 0.4 }),
      'current',
    );
    const splitParentFeature = new Feature({
      boundary_code: 'E54000042',
      geometry: new Polygon(POLYGON_COORDS),
    });

    expect(styleFn(splitParentFeature)).toBeUndefined();
  });

  it('uses a very subtle seam stroke for region fills when explicit borders are off', () => {
    const styleFn = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'regionFill', borderVisible: false }),
      'current',
      new Set(['E54000013']),
    );
    const feature = new Feature({
      boundary_code: 'E54000013',
      geometry: new Polygon(POLYGON_COORDS),
    });

    const style = styleFn(feature) as Style;
    expect(style).toBeInstanceOf(Style);
    const fillColor = (style.getFill() as Fill).getColor() as string;
    const strokeColor = (style.getStroke() as Stroke).getColor() as string;
    expect(fillColor).toContain('rgba(');
    expect(fillColor).toContain('0.35');
    expect(strokeColor).toContain('rgba(');
    expect(strokeColor).toContain('0.063');
    expect(strokeColor).not.toBe(fillColor);
    expect((style.getStroke() as Stroke).getWidth()).toBe(0.2);
  });

  it('assigns explicit z-order to key boundary layers', () => {
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'regionFill' }),
      ),
    ).toBe(4);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'wardSplitFill' }),
      ),
    ).toBe(4);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'englandIcb' }),
      ),
    ).toBe(6);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'devolvedHb' }),
      ),
    ).toBe(6);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'nhsRegions' }),
      ),
    ).toBe(5);
    expect(
      getRegionBoundaryLayerZIndex(
        createOverlayLayer({ family: 'customRegions' }),
      ),
    ).toBe(5);
  });

  it('styles nhs/custom overlay families as generic transparent-fill outlines', () => {
    const nhsStyleFn = createRegionBoundaryStyle(
      createOverlayLayer({
        family: 'nhsRegions',
        swatchColor: '#7d93ab',
        opacity: 0,
        borderVisible: true,
        borderColor: '#7d93ab',
        borderOpacity: 0.7,
        borderWidth: 1.25,
      }),
      'current',
    );
    const jmcStyleFn = createRegionBoundaryStyle(
      createOverlayLayer({
        family: 'customRegions',
        swatchColor: '#6c8f3d',
        opacity: 0,
        borderVisible: true,
        borderColor: '#6c8f3d',
        borderOpacity: 0.7,
        borderWidth: 1.25,
      }),
      'current',
    );
    const feature = new Feature({
      geometry: new Polygon(POLYGON_COORDS),
    });

    const nhsStyle = nhsStyleFn(feature) as Style;
    const jmcStyle = jmcStyleFn(feature) as Style;

    expect((nhsStyle.getFill() as Fill).getColor()).toBe('rgba(125, 147, 171, 0)');
    expect((jmcStyle.getFill() as Fill).getColor()).toBe('rgba(108, 143, 61, 0)');
    expect((nhsStyle.getStroke() as Stroke).getColor()).toBe('rgba(125, 147, 171, 0.7)');
    expect((jmcStyle.getStroke() as Stroke).getColor()).toBe('rgba(108, 143, 61, 0.7)');
  });

  it('uses overlay border width for internal edge styles', () => {
    const englandStyleFn = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'englandIcb', borderWidth: 2.5 }),
      'current',
    );
    const devolvedStyleFn = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'devolvedHb', borderWidth: 2.5 }),
      'current',
    );

    const englandFeature = new Feature({
      internal: true,
      left_type: 'ICB',
      right_type: 'ICB',
    });
    const devolvedFeature = new Feature({
      internal: true,
      left_type: 'LHB',
      right_type: 'SHB',
    });

    const englandStyle = englandStyleFn(englandFeature) as Style;
    const devolvedStyle = devolvedStyleFn(devolvedFeature) as Style;

    expect((englandStyle.getStroke() as Stroke).getWidth()).toBe(2.5);
    expect((devolvedStyle.getStroke() as Stroke).getWidth()).toBe(2.5);
    expect((englandStyle.getStroke() as Stroke).getLineCap()).toBe('round');
    expect((englandStyle.getStroke() as Stroke).getLineJoin()).toBe('round');
    expect((devolvedStyle.getStroke() as Stroke).getLineCap()).toBe('round');
    expect((devolvedStyle.getStroke() as Stroke).getLineJoin()).toBe('round');
  });

  it('styles Current split internal arcs as dashed neutral joins and hides them when an adjacent region is hidden', () => {
    const styleFn = createSplitInternalArcStyle(createOverlayLayer({
      family: 'englandIcb',
      borderColor: '#8f8f8f',
      borderWidth: 1.5,
      borderOpacity: 0.2,
      borderVisible: true,
    }), {
      'London & South': { visible: true } as never,
      'South West': { visible: true } as never,
    });
    const feature = new Feature({
      left_region_ref: 'London & South',
      right_region_ref: 'South West',
    });

    const style = styleFn(feature) as Style;
    expect(style).toBeInstanceOf(Style);
    expect((style.getStroke() as Stroke).getLineDash()).toEqual([5, 5]);
    expect((style.getStroke() as Stroke).getWidth()).toBe(1.5);
    expect((style.getStroke() as Stroke).getColor()).toBe('rgba(143, 143, 143, 0.2)');

    const hiddenStyleFn = createSplitInternalArcStyle(createOverlayLayer({
      family: 'englandIcb',
      borderColor: '#8f8f8f',
      borderWidth: 1.5,
      borderOpacity: 0.2,
      borderVisible: true,
    }), {
      'London & South': { visible: false } as never,
      'South West': { visible: true } as never,
    });
    expect(hiddenStyleFn(feature)).toBeUndefined();
  });

  it('shows England/devolved shared arcs on the devolved overlay only when England ICBs are hidden', () => {
    const sharedBorderFeature = new Feature({
      internal: true,
      left_type: 'ICB',
      right_type: 'LHB',
    });

    const devolvedWithEnglandVisible = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'devolvedHb', borderWidth: 1 }),
      'coa3a',
      new Set(),
      {},
      { englandIcb: true, devolvedHb: true },
    );
    const devolvedWithEnglandHidden = createRegionBoundaryStyle(
      createOverlayLayer({ family: 'devolvedHb', borderWidth: 1 }),
      'coa3a',
      new Set(),
      {},
      { englandIcb: false, devolvedHb: true },
    );

    expect(devolvedWithEnglandVisible(sharedBorderFeature)).toBeUndefined();
    expect(devolvedWithEnglandHidden(sharedBorderFeature)).toBeInstanceOf(Style);
  });

  it('styles England-classified inland and estuary water-edge arcs with fixed visible opacity', () => {
    const styleFn = createWaterEdgeArcStyle(createOverlayLayer({
      family: 'englandIcb',
      borderColor: '#8f8f8f',
      borderWidth: 1.5,
      borderOpacity: 0.14,
      borderVisible: true,
    }), 'englandIcb', '#a9b4bf');

    const inlandFeature = new Feature({
      internal: false,
      left_type: 'ICB',
      edge_class: 'inlandWater',
    });
    const estuaryFeature = new Feature({
      internal: false,
      left_type: 'ICB',
      edge_class: 'estuary',
    });
    const seaFeature = new Feature({
      internal: false,
      left_type: 'ICB',
      edge_class: 'sea',
    });

    const inlandStyle = styleFn(inlandFeature) as Style;
    const estuaryStyle = styleFn(estuaryFeature) as Style;
    expect(inlandStyle).toBeInstanceOf(Style);
    expect(estuaryStyle).toBeInstanceOf(Style);
    expect((inlandStyle.getStroke() as Stroke).getWidth()).toBe(1.85);
    expect((inlandStyle.getStroke() as Stroke).getColor()).toBe('rgba(169, 180, 191, 0.5)');
    expect((estuaryStyle.getStroke() as Stroke).getColor()).toBe('rgba(169, 180, 191, 0.32)');
    expect(styleFn(seaFeature)).toBeUndefined();
  });

  it('styles devolved-classified water-edge arcs only for non-ICB boards', () => {
    const styleFn = createWaterEdgeArcStyle(createOverlayLayer({
      family: 'devolvedHb',
      borderColor: '#8f8f8f',
      borderWidth: 1,
      borderOpacity: 0.14,
      borderVisible: true,
    }), 'devolvedHb', '#a9b4bf');

    const devolvedFeature = new Feature({
      internal: false,
      left_type: 'LHB',
      edge_class: 'inlandWater',
    });
    const englandFeature = new Feature({
      internal: false,
      left_type: 'ICB',
      edge_class: 'inlandWater',
    });

    expect(styleFn(devolvedFeature)).toBeInstanceOf(Style);
    expect(styleFn(englandFeature)).toBeUndefined();
  });

  it('folds inland-water arcs into the ordinary region border path with a sea-color mask and hard-opacity redraw', () => {
    const regionBoundaryRefs = createRegionBoundaryRefs(
      new Feature({
        boundary_code: 'E54000010',
        geometry: new Polygon(POLYGON_COORDS),
      }),
    );
    const styleFn = createWaterEdgeBorderModifierStyle(
      'coa3b',
      'englandIcb',
      regionBoundaryRefs,
      {
        'COA 3a Midlands': {
          visible: true,
          borderVisible: true,
          borderColor: '#ed5151',
          borderWidth: 1.4,
        } as never,
      },
      'rgba(100, 150, 200, 0.8)',
    );

    const feature = new Feature({
      internal: false,
      left_code: 'E54000010',
      left_type: 'ICB',
      edge_class: 'inlandWater',
      geometry: new LineString([
        [1, 0.2],
        [1, 0.8],
      ]),
    });

    const styles = styleFn(feature) as Style[];
    expect(styles).toHaveLength(2);
    expect((styles[0].getStroke() as Stroke).getColor()).toBe('rgba(100, 150, 200, 0.8)');
    expect((styles[1].getStroke() as Stroke).getColor()).toBe('rgba(237, 81, 81, 0.5)');
    expect((styles[1].getStroke() as Stroke).getWidth()).toBe(1.75);
  });

  it('folds inland-water arcs into the selected dissolved region outline with hard-opacity redraw', () => {
    const styles = createSelectedWaterEdgeModifierStyle(
      '#fffb00',
      'rgba(120, 160, 210, 0.8)',
    );
    expect(styles).toHaveLength(2);
    expect((styles[0].getStroke() as Stroke).getColor()).toBe('rgba(120, 160, 210, 0.8)');
    expect((styles[1].getStroke() as Stroke).getColor()).toBe('rgba(255, 251, 0, 0.5)');
    expect((styles[1].getStroke() as Stroke).getWidth()).toBe(2);
  });
});
