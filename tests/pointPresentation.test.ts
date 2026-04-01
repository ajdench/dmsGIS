import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { getCombinedPracticeRingWidth } from '../src/features/map/mapStyleUtils';
import {
  getPlainPointActiveCombinedTreatmentCompensation,
  getPointPresentationOuterDistance,
  resolvePointPresentation,
} from '../src/features/map/pointPresentation';

describe('pointPresentation', () => {
  it('keeps the selected halo flush with a plain point edge', () => {
    expect(
      getPointPresentationOuterDistance({
        shape: 'circle',
        size: 3.5,
        fillColor: 'rgba(65, 150, 50, 1)',
        borderColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 0,
        baseShapeInset: 0,
        outerRingGap: 0,
        outerRingWidth: 0,
        outerRingPlacement: 'outside',
      }),
    ).toBe(0);
  });

  it('includes visible point borders in the selected halo clearance', () => {
    expect(
      getPointPresentationOuterDistance({
        shape: 'circle',
        size: 3.5,
        fillColor: 'rgba(65, 150, 50, 1)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 2,
        baseShapeInset: 0,
        outerRingGap: 0,
        outerRingWidth: 0,
        outerRingPlacement: 'outside',
      }),
    ).toBeCloseTo(2, 3);
  });

  it('includes combined-practice rings and outer borders in the selected halo clearance', () => {
    const ringWidth = getCombinedPracticeRingWidth(3.5);

    expect(
      getPointPresentationOuterDistance({
        shape: 'circle',
        size: 3.5,
        fillColor: 'rgba(65, 150, 50, 1)',
        borderColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 0,
        baseShapeInset: 0,
        outerRingColor: 'rgba(15, 118, 110, 1)',
        outerRingGap: 0,
        outerRingWidth: ringWidth,
        outerRingPlacement: 'outside',
      }),
    ).toBeCloseTo(ringWidth, 3);

    expect(
      getPointPresentationOuterDistance({
        shape: 'circle',
        size: 3.5,
        fillColor: 'rgba(65, 150, 50, 1)',
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1,
        baseShapeInset: 0,
        outerRingColor: 'rgba(15, 118, 110, 1)',
        outerRingGap: 0,
        outerRingWidth: ringWidth,
        outerRingPlacement: 'outside',
      }),
    ).toBeCloseTo(ringWidth + 1, 3);
  });

  it('keeps plain points at their true size until a visible combined treatment is active', () => {
    const plainFeature = new Feature({
      geometry: new Point([0, 0]),
      id: 'FAC-1',
      name: 'Plain Facility',
      region: 'North',
      type: 'pmc-facility',
      default_visible: true,
      point_color_hex: '#a7c636',
    });
    const combinedFeature = new Feature({
      geometry: new Point([0, 0]),
      id: 'FAC-2',
      name: 'Combined Facility',
      combined_practice: 'Portsmouth Combined Medical Practice',
      region: 'North',
      type: 'pmc-facility',
      default_visible: true,
      point_color_hex: '#a7c636',
    });
    const regions = new Map([
      [
        'North',
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          shape: 'circle' as const,
          borderVisible: true,
          borderColor: '#ffffff',
          borderWidth: 1,
          borderOpacity: 0.5,
          symbolSize: 3.5,
        },
      ],
    ]);

    const plainPresentation = resolvePointPresentation({
      feature: plainFeature,
      regions,
      combinedPracticeStyles: new Map(),
      symbolShape: 'circle',
      symbolSize: 3.5,
    });
    const combinedPresentation = resolvePointPresentation({
      feature: combinedFeature,
      regions,
      combinedPracticeStyles: new Map([
        [
          'Portsmouth Combined Medical Practice',
          {
            name: 'Portsmouth Combined Medical Practice',
            displayName: 'Portsmouth',
            visible: true,
            borderColor: '#0f766e',
            borderWidth: 1,
            borderOpacity: 1,
          },
        ],
      ]),
      symbolShape: 'circle',
      symbolSize: 3.5,
    });
    const compensatedPlainPresentation = resolvePointPresentation({
      feature: plainFeature,
      regions,
      combinedPracticeStyles: new Map([
        [
          'Portsmouth Combined Medical Practice',
          {
            name: 'Portsmouth Combined Medical Practice',
            displayName: 'Portsmouth',
            visible: true,
            borderColor: '#0f766e',
            borderWidth: 1,
            borderOpacity: 1,
          },
        ],
      ]),
      symbolShape: 'circle',
      symbolSize: 3.5,
    });

    expect(plainPresentation.baseShapeInset).toBe(0);
    expect(compensatedPlainPresentation.baseShapeInset).toBeCloseTo(
      -getPlainPointActiveCombinedTreatmentCompensation(
        3.5,
        getCombinedPracticeRingWidth(3.5),
      ),
      3,
    );
    expect(Math.abs(compensatedPlainPresentation.baseShapeInset)).toBeLessThan(
      getCombinedPracticeRingWidth(3.5) / 2,
    );
    expect(combinedPresentation.baseShapeInset).toBe(0);
    expect(combinedPresentation.outerRingPlacement).toBe('outside');
  });

  it('uses a lighter-than-half-width compensation for plain points under active combined treatment', () => {
    const ringWidth = getCombinedPracticeRingWidth(3.5);
    const compensation = getPlainPointActiveCombinedTreatmentCompensation(
      3.5,
      ringWidth,
    );

    expect(compensation).toBeGreaterThan(0);
    expect(compensation).toBeLessThan(ringWidth / 2);
    expect(compensation).toBeCloseTo(0.343, 2);
  });
});
