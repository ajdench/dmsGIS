import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import Polygon from 'ol/geom/Polygon';
import {
  buildSelectedFacilityParSummary,
} from '../src/features/map/facilityPar';
import {
  buildProportionalParCorrectionSummary,
  formatParDisplayValue,
  formatProportionalParCorrectionContext,
  parseFacilityParValue,
  summarizeFacilityParByScenarioWorkspace,
  summarizeFacilityParByPresetRegion,
  summarizeFacilityParByRegion,
} from '../src/lib/facilityPar';

describe('facilityPar', () => {
  it('parses facility PAR values from strings and numbers', () => {
    expect(parseFacilityParValue('4,548')).toBe(4548);
    expect(parseFacilityParValue('')).toBeNull();
    expect(parseFacilityParValue(null)).toBeNull();
    expect(parseFacilityParValue(17)).toBe(17);
  });

  it('formats null PAR values as an em dash', () => {
    expect(formatParDisplayValue(null)).toBe('—');
    expect(formatParDisplayValue(4548)).toBe('4,548');
  });

  it('builds the proportional correction summary from selected contribution against overall PAR', () => {
    expect(
      buildProportionalParCorrectionSummary({
        regionPar: 200,
        baseportPar: 40,
        overallTotalPar: 4500,
      }),
    ).toEqual({
      contributionPar: 240,
      contributionPercent: 5,
      correctionValue: 453,
      correctedTotal: 693,
    });
    expect(formatProportionalParCorrectionContext(5)).toBe('(5% of 8500)');
    expect(
      buildProportionalParCorrectionSummary({
        regionPar: null,
        baseportPar: null,
        overallTotalPar: 240,
      }),
    ).toEqual({
      contributionPar: null,
      contributionPercent: null,
      correctionValue: null,
      correctedTotal: null,
    });
  });

  it('summarizes PAR totals by region and overall total', () => {
    expect(
      summarizeFacilityParByRegion([
        { regionName: 'North', parValue: '120' },
        { regionName: 'North', parValue: '80' },
        { regionName: 'Royal Navy', parValue: 40 },
        { regionName: 'East', parValue: null },
      ]),
    ).toEqual({
      regionParByName: {
        North: 200,
        'Royal Navy': 40,
      },
      totalPar: 240,
    });
  });

  it('summarizes PAR by assigned preset region using the preset boundary basis', () => {
    expect(
      summarizeFacilityParByPresetRegion({
        preset: 'coa3a',
        facilities: [
          {
            regionName: 'North',
            legacyBoundaryCode: 'E54000048',
            boundaryCode2026: '10',
            parValue: '120',
          },
          {
            regionName: 'North',
            legacyBoundaryCode: 'E54000048',
            boundaryCode2026: 'BHSCT',
            parValue: '80',
          },
          {
            regionName: 'North',
            legacyBoundaryCode: 'E54000048',
            boundaryCode2026: 'W11000023',
            parValue: '60',
          },
          {
            regionName: 'North',
            legacyBoundaryCode: 'E54000048',
            boundaryCode2026: 'E54000048',
            parValue: '40',
          },
          {
            regionName: 'Overseas',
            legacyBoundaryCode: null,
            boundaryCode2026: null,
            parValue: '25',
          },
        ],
      }),
    ).toEqual({
      regionParByName: {
        'JMC Scotland': 120,
        'JMC Northern Ireland': 80,
        'JMC Wales': 60,
        'JMC North': 40,
      },
      totalPar: 325,
    });
  });

  it('can preserve Overseas and Royal Navy as explicit special buckets for scenario cards', () => {
    expect(
      summarizeFacilityParByPresetRegion({
        preset: 'coa3a',
        preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
        facilities: [
          {
            regionName: 'Overseas',
            legacyBoundaryCode: null,
            boundaryCode2026: 'E54000010',
            parValue: '25',
          },
          {
            regionName: 'Royal Navy',
            legacyBoundaryCode: null,
            boundaryCode2026: 'E54000037',
            parValue: '40',
          },
          {
            regionName: 'North',
            legacyBoundaryCode: 'E54000048',
            boundaryCode2026: 'E54000048',
            parValue: '60',
          },
        ],
      }),
    ).toEqual({
      regionParByName: {
        Overseas: 25,
        'Royal Navy': 40,
        'JMC North': 60,
      },
      totalPar: 125,
    });
  });

  it('can remap scenario PAR totals from a playground draft assignment lookup', () => {
    expect(
      summarizeFacilityParByScenarioWorkspace({
        workspaceId: 'dphcEstimateCoaPlayground',
        assignmentLookup: {
          E54000071: 'coa3b_south_east',
        },
        preserveOriginalRegionNames: ['Overseas', 'Royal Navy'],
        facilities: [
          {
            regionName: 'North',
            legacyBoundaryCode: null,
            boundaryCode2026: 'E54000071',
            parValue: '100',
          },
          {
            regionName: 'Royal Navy',
            legacyBoundaryCode: null,
            boundaryCode2026: 'E54000037',
            parValue: '40',
          },
          {
            regionName: 'Overseas',
            legacyBoundaryCode: null,
            boundaryCode2026: null,
            parValue: '25',
          },
        ],
      }),
    ).toEqual({
      regionParByName: {
        'COA 3b South East': 100,
        Overseas: 25,
        'Royal Navy': 40,
      },
      totalPar: 165,
    });
  });

  it('maps Current Royal Navy split-parent Portsmouth fallback into London & South', () => {
    expect(
      summarizeFacilityParByPresetRegion({
        preset: 'current',
        facilities: [
          {
            regionName: 'Royal Navy',
            legacyBoundaryCode: '17',
            boundaryCode2026: '17',
            parValue: '2191',
          },
          {
            regionName: 'Royal Navy',
            legacyBoundaryCode: 'E54000037',
            boundaryCode2026: 'E54000037',
            parValue: '1153',
          },
          {
            regionName: 'Royal Navy',
            legacyBoundaryCode: 'E54000042',
            boundaryCode2026: 'E54000067',
            parValue: '3451',
          },
        ],
      }),
    ).toEqual({
      regionParByName: {
        'Scotland & Northern Ireland': 2191,
        'South West': 1153,
        'London & South': 3451,
      },
      totalPar: 6795,
    });
  });

  it('treats only Royal Navy region facilities as Baseport PAR on the active assignment basis', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 2]),
        id: 'FAC-1',
        region: 'North',
        combined_practice: 'Alpha Combined Medical Practice',
        par: '120',
      }),
      new Feature({
        geometry: new Point([3, 4]),
        id: 'FAC-2',
        region: 'North',
        combined_practice: 'Alpha Combined Medical Practice',
        par: '80',
      }),
      new Feature({
        geometry: new Point([5, 6]),
        id: 'FAC-3',
        region: 'East',
        combined_practice: 'Bravo Combined Medical Practice',
        par: '60',
      }),
      new Feature({
        geometry: new Point([7, 8]),
        id: 'BP1',
        region: 'Royal Navy',
        combined_practice: 'Portsmouth Combined Medical Practice',
        par: '40',
      }),
    ];

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
      ],
    });

    expect(
      buildSelectedFacilityParSummary({
        facilityFeatures: features,
        selectedFacilityId: 'FAC-1',
        selectedRegionName: 'COA 3b London and East',
        assignmentSource,
        activeViewPreset: 'coa3c',
      }),
    ).toEqual({
      facilityPar: 120,
      practicePar: 200,
      regionPar: 260,
      baseportPar: 40,
      totalPar: 300,
    });
  });

  it('maps Royal Navy facilities into the selected Current region from the intersected board code', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 1]),
        id: 'CMP29-2',
        region: 'Scotland & Northern Ireland',
        combined_practice: 'Kentigern Combined Medical Practice',
        par: '315',
      }),
      new Feature({
        geometry: new Point([7, 8]),
        id: 'BP3',
        region: 'Royal Navy',
        combined_practice: null,
        par: '2191',
      }),
      new Feature({
        geometry: new Point([8, 8]),
        id: 'FAC-5',
        region: 'Scotland & Northern Ireland',
        combined_practice: 'Other Combined Medical Practice',
        par: '1000',
      }),
    ];

    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [6, 0],
            [6, 6],
            [0, 6],
            [0, 0],
          ]]),
          boundary_code: '16',
        }),
        new Feature({
          geometry: new Polygon([[
            [6, 6],
            [10, 6],
            [10, 10],
            [6, 10],
            [6, 6],
          ]]),
          boundary_code: '17',
        }),
      ],
    });

    expect(
      buildSelectedFacilityParSummary({
        facilityFeatures: features,
        selectedFacilityId: 'CMP29-2',
        selectedRegionName: 'Scotland & Northern Ireland',
        assignmentSource,
        activeViewPreset: 'current',
      }),
    ).toEqual({
      facilityPar: 315,
      practicePar: 315,
      regionPar: 1315,
      baseportPar: 2191,
      totalPar: 3506,
    });
  });

  it('maps Portsmouth baseport into London & South on the Current basis from its board code', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 1]),
        id: 'BP1',
        region: 'Royal Navy',
        combined_practice: null,
        par: '3451',
      }),
    ];

    const assignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ]]),
          boundary_code: 'E54000042',
        }),
      ],
    });

    expect(
      buildSelectedFacilityParSummary({
        facilityFeatures: features,
        selectedFacilityId: 'BP1',
        selectedRegionName: 'London & South',
        assignmentSource,
        activeViewPreset: 'current',
      }),
    ).toEqual({
      facilityPar: 3451,
      practicePar: null,
      regionPar: null,
      baseportPar: 3451,
      totalPar: 3451,
    });
  });

  it('can summarize region, baseport, and total PAR for a boundary-only selection', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 2]),
        id: 'FAC-1',
        region: 'North',
        combined_practice: 'Alpha Combined Medical Practice',
        par: '120',
      }),
      new Feature({
        geometry: new Point([3, 4]),
        id: 'FAC-2',
        region: 'North',
        combined_practice: 'Alpha Combined Medical Practice',
        par: '80',
      }),
      new Feature({
        geometry: new Point([7, 8]),
        id: 'BP1',
        region: 'Royal Navy',
        combined_practice: 'Portsmouth Combined Medical Practice',
        par: '40',
      }),
    ];

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
      ],
    });

    expect(
      buildSelectedFacilityParSummary({
        facilityFeatures: features,
        selectedFacilityId: null,
        selectedRegionName: 'COA 3b London and East',
        assignmentSource,
        activeViewPreset: 'coa3c',
      }),
    ).toEqual({
      facilityPar: null,
      practicePar: null,
      regionPar: 200,
      baseportPar: 40,
      totalPar: 240,
    });
  });
});
