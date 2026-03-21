import { describe, expect, it } from 'vitest';
import {
  computeFloatingCalloutPlacement,
  FLOATING_CALLOUT_SIDE_OFFSET,
  FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
  FLOATING_CALLOUT_TRIANGLE_MAX_RATIO,
  FLOATING_CALLOUT_TRIANGLE_MIN_RATIO,
  FLOATING_CALLOUT_VIEWPORT_PADDING,
} from '../src/prototypes/sidebarPrototype/floatingCallout';

describe('floatingCallout placement', () => {
  it('centers around the trigger when there is enough viewport space', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 200, left: 360, width: 40, height: 24, bottom: 224 },
      contentRect: { width: 200, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    expect(placement.top).toBe(32);
    expect(placement.left).toBe(128);
    expect(placement.triangleCenter).toBe(80);
  });

  it('pins the popover to the viewport top before breaking the triangle min inset', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 90, left: 360, width: 40, height: 24, bottom: 114 },
      contentRect: { width: 200, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    expect(placement.top).toBe(-18);
    expect(placement.triangleCenter).toBeCloseTo(
      160 * FLOATING_CALLOUT_TRIANGLE_MIN_RATIO +
        FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
      5,
    );
  });

  it('lets the popover drift off once the trigger moves beyond the min triangle inset', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 40, left: 360, width: 40, height: 24, bottom: 64 },
      contentRect: { width: 200, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    expect(placement.top).toBeLessThan(FLOATING_CALLOUT_VIEWPORT_PADDING);
    expect(placement.triangleCenter).toBeCloseTo(
      160 * FLOATING_CALLOUT_TRIANGLE_MIN_RATIO +
        FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
      5,
    );
  });

  it('pins the popover to the viewport bottom before breaking the triangle max inset', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 570, left: 360, width: 40, height: 24, bottom: 594 },
      contentRect: { width: 200, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    expect(placement.top).toBe(342);
    expect(placement.triangleCenter).toBeCloseTo(
      160 * FLOATING_CALLOUT_TRIANGLE_MAX_RATIO -
        FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
      5,
    );
  });

  it('lets the popover drift off once the trigger moves beyond the max triangle inset', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 640, left: 360, width: 40, height: 24, bottom: 664 },
      contentRect: { width: 200, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    expect(placement.top).toBeGreaterThan(332);
    expect(placement.triangleCenter).toBeCloseTo(
      160 * FLOATING_CALLOUT_TRIANGLE_MAX_RATIO -
        FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT,
      5,
    );
  });

  it('clamps the visible arrow edge to the shared inset ratio on smaller popovers too', () => {
    const contentHeight = 120;
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 90, left: 360, width: 40, height: 24, bottom: 114 },
      contentRect: { width: 200, height: contentHeight },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
    });

    const visibleArrowTop =
      placement.triangleCenter - FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT;

    expect(visibleArrowTop).toBeCloseTo(
      contentHeight * FLOATING_CALLOUT_TRIANGLE_MIN_RATIO,
      5,
    );
  });

  it('supports tighter per-popover clamp overrides for compact pane variants', () => {
    const contentHeight = 120;
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 90, left: 360, width: 40, height: 24, bottom: 114 },
      contentRect: { width: 200, height: contentHeight },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 20 },
      triangleMinRatio: 0.15,
      triangleMaxRatio: 0.85,
    });

    const visibleArrowTop =
      placement.triangleCenter - FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT;

    expect(visibleArrowTop).toBeCloseTo(contentHeight * 0.15, 5);
  });

  it('applies the horizontal offset relative to the portal container', () => {
    const placement = computeFloatingCalloutPlacement({
      triggerRect: { top: 200, left: 500, width: 40, height: 24, bottom: 224 },
      contentRect: { width: 220, height: 160 },
      viewportRect: { top: 100, left: 0, width: 320, height: 500, bottom: 600 },
      portalRect: { top: 100, left: 40 },
    });

    expect(placement.left).toBe(500 - 220 - FLOATING_CALLOUT_SIDE_OFFSET - 40);
  });
});
