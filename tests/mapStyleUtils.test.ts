import { describe, expect, it } from 'vitest';
import {
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  getPointSymbolCanvasPadding,
} from '../src/features/map/mapStyleUtils';
import { getPointPresentationOuterDistance } from '../src/features/map/pointPresentation';

describe('mapStyleUtils', () => {
  it('keeps the combined-practice ring contract stable', () => {
    const size = 3.5;
    expect(getCombinedPracticeRingWidth(size)).toBeGreaterThan(0);
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
      baseShapeInset: 0,
      outerRingColor: '#000000',
      outerRingGap: 0,
      outerRingWidth: getCombinedPracticeRingWidth(size),
      outerRingPlacement: 'outside',
    });

    expect(
      getPointSymbolCanvasPadding(size, 0, {
        outerRingColor: '#fffb00',
        outerRingGap: highlightOffset,
        outerRingWidth: 2,
      }),
    ).toBeGreaterThan(30);
  });

  it('grows canvas padding as outer point treatments stack outside the symbol', () => {
    const size = 3.5;
    const borderOnlyPadding = getPointSymbolCanvasPadding(size, 1, {
      baseShapeInset: 0,
    });
    const combinedWithBorderPadding = getPointSymbolCanvasPadding(size, 1, {
      outerRingColor: '#0f766e',
      outerRingGap: 0,
      outerRingWidth: getCombinedPracticeRingWidth(size),
      outerRingPlacement: 'outside',
      baseShapeInset: 0,
    });

    expect(combinedWithBorderPadding).toBeGreaterThan(borderOnlyPadding);
  });
});
