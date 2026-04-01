import { describe, expect, it } from 'vitest';
import {
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  getNonCombinedPointInset,
  getPointSymbolCanvasPadding,
} from '../src/features/map/mapStyleUtils';
import { getPointPresentationOuterDistance } from '../src/features/map/pointPresentation';

describe('mapStyleUtils', () => {
  it('keeps non-combined points aligned to the combined-ring midpoint', () => {
    const size = 3.5;
    expect(getNonCombinedPointInset(3.5)).toBeCloseTo(
      getCombinedPracticeRingWidth(3.5) / 2,
      3,
    );
    expect(getCombinedPracticeRingGap(size)).toBe(0);
  });

  it('increases canvas padding for smaller highlighted point symbols', () => {
    const size = 2;
    const highlightOffset = getPointPresentationOuterDistance({
      shape: 'circle',
      size,
      fillColor: 'rgba(0, 0, 0, 0)',
      borderColor: 'rgba(0, 0, 0, 0)',
      borderWidth: 1,
      baseShapeInset: getCombinedPracticeRingWidth(size),
      outerRingColor: '#000000',
      outerRingGap: 0,
      outerRingWidth: getCombinedPracticeRingWidth(size),
      outerRingPlacement: 'inside',
    });

    expect(
      getPointSymbolCanvasPadding(size, 0, {
        outerRingColor: '#fffb00',
        outerRingGap: highlightOffset,
        outerRingWidth: 2,
      }),
    ).toBeGreaterThan(30);
  });
});
