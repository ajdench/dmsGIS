import { describe, expect, it } from 'vitest';
import {
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  getNonCombinedPointInset,
  getPointSymbolCanvasPadding,
  getSelectedPointHighlightOffset,
} from '../src/features/map/mapStyleUtils';

describe('mapStyleUtils', () => {
  it('keeps combined-practice highlight clearance at the family-ring edge', () => {
    const size = 3.5;
    const combinedPracticeOffset = getSelectedPointHighlightOffset(
      size,
      false,
      true,
    );

    expect(getCombinedPracticeRingWidth(size)).toBeGreaterThan(0);
    expect(getCombinedPracticeRingGap(size)).toBe(0);
    expect(combinedPracticeOffset).toBe(0);
  });

  it('places non-combined points at the midpoint of the combined ring band', () => {
    expect(getNonCombinedPointInset(3.5)).toBeCloseTo(
      getCombinedPracticeRingWidth(3.5) / 2,
      3,
    );
    expect(getSelectedPointHighlightOffset(3.5, false, false)).toBeCloseTo(
      getNonCombinedPointInset(3.5),
      3,
    );
    expect(getSelectedPointHighlightOffset(3.5, true, false)).toBeCloseTo(
      1,
      3,
    );
  });

  it('increases canvas padding for smaller highlighted point symbols', () => {
    const size = 2;
    const highlightOffset = getSelectedPointHighlightOffset(size, false, true);

    expect(
      getPointSymbolCanvasPadding(size, 0, {
        outerRingColor: '#fffb00',
        outerRingGap: highlightOffset,
        outerRingWidth: 2,
      }),
    ).toBeGreaterThan(30);
  });
});
