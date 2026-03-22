import { describe, expect, it } from 'vitest';
import {
  FLOATING_CALLOUT_SIDE_OFFSET,
  FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
  computeFloatingCalloutPlacement,
} from '../src/lib/sidebar/floatingCallout';

describe('computeFloatingCalloutPlacement', () => {
  it('keeps the triangle safely inset when clamped near the viewport edge', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: {
        top: 10,
        left: 500,
        width: 64,
        height: 28,
        bottom: 38,
      },
      contentRect: {
        width: 240,
        height: 160,
      },
      viewportRect: {
        top: 0,
        left: 0,
        width: 320,
        height: 220,
        bottom: 220,
      },
      portalRect: {
        top: 0,
        left: 0,
      },
    });

    expect(placement.left).toBe(500 - 240 - FLOATING_CALLOUT_SIDE_OFFSET);
    expect(placement.triangleCenter).toBeGreaterThanOrEqual(
      160 * 0.075 + FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
    );
  });
});
