import { describe, expect, it } from 'vitest';
import { getCombinedPracticeRingWidth } from '../src/features/map/mapStyleUtils';
import { getPointPresentationOuterDistance } from '../src/features/map/pointPresentation';

describe('pointPresentation', () => {
  it('keeps the selected halo flush with a plain point edge', () => {
    expect(
      getPointPresentationOuterDistance({
        shape: 'circle',
        size: 3.5,
        fillColor: 'rgba(65, 150, 50, 1)',
        borderColor: 'rgba(0, 0, 0, 0)',
        borderWidth: 0,
        baseShapeInset: 0.6125,
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
        baseShapeInset: 0.6125,
        outerRingGap: 0,
        outerRingWidth: 0,
        outerRingPlacement: 'inside',
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
        baseShapeInset: ringWidth,
        outerRingColor: 'rgba(15, 118, 110, 1)',
        outerRingGap: 0,
        outerRingWidth: ringWidth,
        outerRingPlacement: 'inside',
      }),
    ).toBeCloseTo(ringWidth + 1, 3);
  });
});
