import { describe, expect, it } from 'vitest';
import {
  getCombinedPracticeRingGap,
  getCombinedPracticeRingWidth,
  getPointSymbolCanvasPadding,
  getSelectedPointHighlightOffset,
} from '../src/features/map/mapStyleUtils';

describe('mapStyleUtils', () => {
  it('adds extra highlight clearance for combined-practice points', () => {
    const size = 3.5;
    const combinedPracticeOffset = getSelectedPointHighlightOffset(
      size,
      false,
      true,
    );

    expect(getCombinedPracticeRingWidth(size)).toBeGreaterThan(0);
    expect(getCombinedPracticeRingGap(size)).toBe(0);
    expect(combinedPracticeOffset).toBeGreaterThan(
      getSelectedPointHighlightOffset(size, false, false),
    );
    expect(combinedPracticeOffset).toBeCloseTo(
      getCombinedPracticeRingWidth(size),
      3,
    );
  });

  it('keeps non-combined highlight offsets unchanged', () => {
    expect(getSelectedPointHighlightOffset(3.5, false, false)).toBe(0);
    expect(getSelectedPointHighlightOffset(3.5, true, false)).toBe(1);
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
