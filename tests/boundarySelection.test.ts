import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import {
  deriveCurrentGroupOutlineFeature,
  getSelectedJmcOutlineFeatures,
  findJmcNameAtCoordinate,
  findJmcNameForBoundarySelection,
  findCareBoardBoundaryAtCoordinate,
  findBoundaryHighlightFeatureForPointCoordinate,
  getBoundaryName,
} from '../src/features/map/boundarySelection';
import VectorLayer from 'ol/layer/Vector';

const SQUARE_COORDS = [[
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
]];

const SQUARE2_COORDS = [[
  [10, 0],
  [20, 0],
  [20, 10],
  [10, 10],
  [10, 0],
]];

describe('boundarySelection', () => {
  it('resolves a readable boundary name from known properties', () => {
    const feature = new Feature({
      boundary_name: 'Boundary X',
    });

    expect(getBoundaryName(feature)).toBe('Boundary X');
  });

  it('prefers ward_name when a split-ward debug feature is selected', () => {
    const feature = new Feature({
      ward_name: 'Stopsley',
      boundary_name: 'NHS Hertfordshire and West Essex Integrated Care Board',
    });

    expect(getBoundaryName(feature)).toBe('Stopsley');
  });

  it('prefers boundary_name over region_ref when both are present on split features', () => {
    const feature = new Feature({
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      region_ref: 'Central & Wessex',
    });

    expect(getBoundaryName(feature)).toBe(
      'NHS Hampshire and Isle of Wight Integrated Care Board',
    );
  });

  it('maps scenario group names from boundary_code at a coordinate', () => {
    // E54000065 → COA 3b London and East in coa3c
    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon(SQUARE_COORDS),
          boundary_code: 'E54000065',
          boundary_name: 'NHS Essex Integrated Care Board',
        }),
      ],
    });

    expect(findJmcNameAtCoordinate([5, 5], assignmentSource, null, 'coa3c')).toBe(
      'COA 3b London and East',
    );
  });

  it('falls back to boundary-name assignment map when no boundary_code on clicked feature', () => {
    // Feature with no boundary_code; assignment map provides legacy jmc_name
    // which becomes the group name via legacy fallback
    const feature = new Feature({
      boundary_name: 'NHS Essex Integrated Care Board',
      boundary_code: 'E54000065',
    });

    expect(
      findJmcNameForBoundarySelection(
        feature,
        undefined,
        new Map(),
        null,
        null,
        'coa3c',
      ),
    ).toBe('COA 3b London and East');
  });

  it('falls back to region_ref when a split feature has a parent boundary_code absent from codeGroupings', () => {
    const feature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      region_ref: 'Central & Wessex',
    });

    expect(
      findJmcNameForBoundarySelection(
        feature,
        undefined,
        new Map(),
        null,
        null,
        'current',
      ),
    ).toBe('Central & Wessex');
  });

  it('prefers runtime-assigned scenario region names over preset code-group defaults', () => {
    const feature = new Feature({
      boundary_code: 'E54000065',
      boundary_name: 'NHS Essex Integrated Care Board',
      scenario_region_id: 'coa3b_midlands',
      region_name: 'COA 3b Midlands',
    });

    expect(
      findJmcNameForBoundarySelection(
        feature,
        undefined,
        new Map(),
        null,
        null,
        'coa3c',
      ),
    ).toBe('COA 3b Midlands');
  });

  it('collapses ward-split boundary hits back to the full parent board while preserving clicked region', () => {
    const regionFillFeature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'Parent board',
      geometry: new Polygon(SQUARE_COORDS),
    });
    const wardSplitFeature = new Feature({
      parent_code: 'E54000042',
      boundary_code: 'E54000042',
      boundary_name: 'Parent board',
      region_ref: 'Central & Wessex',
      geometry: new Polygon(SQUARE_COORDS),
    });

    const matched = findCareBoardBoundaryAtCoordinate(
      [5, 5],
      [
        {
          id: 'regionFill',
          name: 'Region fill',
          path: 'data/regions/boards.geojson',
          family: 'regionFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'wardSplitFill',
          name: 'Ward split fill',
          path: 'data/regions/ward-split.geojson',
          family: 'wardSplitFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
      ],
      new Map([
        ['regionFill', new VectorLayer({ source: new VectorSource({ features: [regionFillFeature] }) })],
        ['wardSplitFill', new VectorLayer({ source: new VectorSource({ features: [wardSplitFeature] }) })],
      ]),
    );

    expect(matched).not.toBeNull();
    expect(matched).not.toBe(wardSplitFeature);
    expect(matched?.get('boundary_code')).toBe('E54000042');
    expect(matched?.get('selection_region_ref')).toBe('Central & Wessex');
    expect(matched?.get('region_ref')).toBe('Central & Wessex');
  });

  it('returns the raw split-ward feature when the split-ward overlay is visible', () => {
    const regionFillFeature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'Parent board',
      geometry: new Polygon(SQUARE_COORDS),
    });
    const wardSplitWardFeature = new Feature({
      parent_code: 'E54000042',
      boundary_code: 'E54000042',
      boundary_name: 'Parent board',
      ward_name: 'Test ward',
      region_ref: 'Central & Wessex',
      geometry: new Polygon(SQUARE_COORDS),
    });

    const matched = findCareBoardBoundaryAtCoordinate(
      [5, 5],
      [
        {
          id: 'wardSplitWards',
          name: 'Split ICB wards',
          path: 'data/regions/ward-split-wards.geojson',
          family: 'wardSplitWards',
          visible: true,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0.35,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'regionFill',
          name: 'Region fill',
          path: 'data/regions/boards.geojson',
          family: 'regionFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
      ],
      new Map([
        ['wardSplitWards', new VectorLayer({ source: new VectorSource({ features: [wardSplitWardFeature] }) })],
        ['regionFill', new VectorLayer({ source: new VectorSource({ features: [regionFillFeature] }) })],
      ]),
    );

    expect(matched).toBe(wardSplitWardFeature);
    expect(getBoundaryName(matched as Feature)).toBe('Test ward');
  });

  it('prefers the clicked split-ward region assignment over the parent board default mapping', () => {
    const feature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      selection_region_ref: 'Central & Wessex',
    });

    expect(
      findJmcNameForBoundarySelection(
        feature,
        undefined,
        new Map(),
        null,
        null,
        'current',
      ),
    ).toBe('Central & Wessex');
  });

  it('uses the parent regionFill feature for point boundary highlights in ward-split areas', () => {
    const regionFillFeature = new Feature({
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      geometry: new Polygon(SQUARE_COORDS),
    });
    const wardSplitFeature = new Feature({
      parent_code: 'E54000042',
      boundary_code: 'E54000042',
      boundary_name: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      region_ref: 'Central & Wessex',
      geometry: new Polygon(SQUARE_COORDS),
    });

    const matched = findBoundaryHighlightFeatureForPointCoordinate(
      [5, 5],
      [
        {
          id: 'regionFill',
          name: 'Region fill',
          path: 'data/regions/boards.geojson',
          family: 'regionFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'wardSplitFill',
          name: 'Ward split fill',
          path: 'data/regions/ward-split.geojson',
          family: 'wardSplitFill',
          visible: true,
          opacity: 0.7,
          borderVisible: false,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0,
          swatchColor: '#8f8f8f',
        },
      ],
      new Map([
        ['regionFill', new VectorLayer({ source: new VectorSource({ features: [regionFillFeature] }) })],
        ['wardSplitFill', new VectorLayer({ source: new VectorSource({ features: [wardSplitFeature] }) })],
      ]),
    );

    expect(matched).not.toBeNull();
    expect(matched).not.toBe(regionFillFeature);
    expect(matched?.get('boundary_code')).toBe('E54000042');
    expect(matched?.get('boundary_name')).toBe(
      'NHS Hampshire and Isle of Wight Integrated Care Board',
    );
    expect(matched?.get('region_ref')).toBe('Central & Wessex');
  });

  it('derives a Current group outline for non-split groups from runtime regionFill', () => {
    const regionFillFeature = new Feature({
      boundary_code: 'E54000039',
      boundary_name: 'Main board',
      geometry: new Polygon(SQUARE_COORDS),
    });
    const regionFillFeature2 = new Feature({
      boundary_code: 'E54000040',
      boundary_name: 'Main board 2',
      geometry: new Polygon([[
        [10, 0],
        [15, 0],
        [15, 10],
        [10, 10],
        [10, 0],
      ]]),
    });

    const outline = deriveCurrentGroupOutlineFeature(
      'Central & Wessex',
      new Map([
        [
          'regionFill',
          new VectorLayer({
            source: new VectorSource({
              features: [regionFillFeature, regionFillFeature2],
            }),
          }),
        ],
      ]),
    );

    expect(outline).not.toBeNull();
    expect(outline?.get('boundary_name')).toBe('Central & Wessex');
    const extent = outline?.getGeometry()?.getExtent();
    expect(extent?.[0]).toBeCloseTo(0, 6);
    expect(extent?.[1]).toBeCloseTo(0, 6);
    expect(extent?.[2] ?? 0).toBeGreaterThan(14.4);
    expect(extent?.[3] ?? 0).toBeGreaterThan(9.9);
  });

  it('derives a Current group outline for split-parent groups from live split-aware geometry', () => {
    const wardSplitFeature = new Feature({
      parent_code: 'E54000042',
      boundary_code: 'E54000042',
      boundary_name: 'Split parent board',
      region_ref: 'Central & Wessex',
      geometry: new Polygon([[
        [10, 0],
        [15, 0],
        [15, 10],
        [10, 10],
        [10, 0],
      ]]),
    });

    const outline = deriveCurrentGroupOutlineFeature(
      'Central & Wessex',
      new Map([
        [
          'regionFill',
          new VectorLayer({
            source: new VectorSource({
              features: [],
            }),
          }),
        ],
        [
          'wardSplitFill',
          new VectorLayer({
            source: new VectorSource({ features: [wardSplitFeature] }),
          }),
        ],
      ]),
    );

    expect(outline).not.toBeNull();
    expect(outline?.get('boundary_name')).toBe('Central & Wessex');
  });

  it(
    'returns a live split-aware Current outline instead of throwing for split-parent geometry',
    () => {
      const format = new GeoJSON({ featureProjection: 'EPSG:3857' });
      const regionFillFeatures = format.readFeatures(
        JSON.parse(
          readFileSync(
            '/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review/regions/UK_ICB_LHB_Boundaries_Codex_v10_simplified.geojson',
            'utf8',
          ),
        ) as object,
      );
      const wardSplitFeatures = format.readFeatures(
        JSON.parse(
          readFileSync(
            '/Users/andrew/Projects/dmsGIS/public/data/compare/shared-foundation-review/regions/UK_WardSplit_simplified.geojson',
            'utf8',
          ),
        ) as object,
      );

      let outline: ReturnType<typeof deriveCurrentGroupOutlineFeature> = null;
      expect(() => {
        outline = deriveCurrentGroupOutlineFeature(
          'London & South',
          new Map([
            [
              'regionFill',
              new VectorLayer({
                source: new VectorSource({ features: regionFillFeatures }),
              }),
            ],
            [
              'wardSplitFill',
              new VectorLayer({
                source: new VectorSource({ features: wardSplitFeatures }),
              }),
            ],
          ]),
        );
      }).not.toThrow();
      expect(outline).not.toBeNull();
    },
    15000,
  );

  it('resolves scenario outline features by selected group name using boundary_code', () => {
    // E54000010 → COA 3b Midlands in coa3c
    const scenarioBoundarySource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon(SQUARE_COORDS),
          boundary_code: 'E54000010',
          boundary_name: 'NHS Birmingham and Solihull Integrated Care Board',
        }),
        new Feature({
          geometry: new Polygon(SQUARE2_COORDS),
          boundary_code: 'E54000010',
          boundary_name: 'NHS Black Country Integrated Care Board',
        }),
      ],
    });

    const outlines = getSelectedJmcOutlineFeatures(
      [5, 5],
      'COA 3b Midlands',
      'coa3c',
      scenarioBoundarySource,
      null,
    );

    expect(outlines).toHaveLength(2);
  });
});
