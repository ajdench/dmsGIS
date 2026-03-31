export interface FloatingRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

export interface FloatingCalloutPlacementInput {
  triggerRect: FloatingRect;
  contentRect: Pick<FloatingRect, 'width' | 'height'>;
  viewportRect: FloatingRect;
  portalRect?: Pick<FloatingRect, 'top' | 'left'> | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
}

export interface FloatingCalloutPlacement {
  top: number;
  left: number;
  triangleCenter: number;
}

export const FLOATING_CALLOUT_SIDE_OFFSET = 12;
export const FLOATING_CALLOUT_VIEWPORT_PADDING = 8;
export const FLOATING_CALLOUT_TRIANGLE_MIN_RATIO = 0.075;
export const FLOATING_CALLOUT_TRIANGLE_MAX_RATIO = 0.925;
export const FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT = 8;

export function computeFloatingCalloutPlacement({
  triggerRect,
  contentRect,
  viewportRect,
  portalRect,
  triangleMinRatio = FLOATING_CALLOUT_TRIANGLE_MIN_RATIO,
  triangleMaxRatio = FLOATING_CALLOUT_TRIANGLE_MAX_RATIO,
}: FloatingCalloutPlacementInput): FloatingCalloutPlacement {
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;
  const desiredTop = triggerCenterY - contentRect.height / 2;
  const viewportMinTop = viewportRect.top + FLOATING_CALLOUT_VIEWPORT_PADDING;
  const viewportMaxTop =
    viewportRect.bottom - contentRect.height - FLOATING_CALLOUT_VIEWPORT_PADDING;
  const minTriangleCenter =
    contentRect.height * triangleMinRatio +
    FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT;
  const maxTriangleCenter =
    contentRect.height * triangleMaxRatio -
    FLOATING_CALLOUT_TRIANGLE_HALF_EXTENT;

  let viewportTop = desiredTop;

  if (desiredTop < viewportMinTop) {
    viewportTop = Math.min(viewportMinTop, triggerCenterY - minTriangleCenter);
  } else if (desiredTop > viewportMaxTop) {
    viewportTop = Math.max(viewportMaxTop, triggerCenterY - maxTriangleCenter);
  }

  const triangleCenter = Math.max(
    minTriangleCenter,
    Math.min(triggerCenterY - viewportTop, maxTriangleCenter),
  );

  return {
    top: viewportTop - (portalRect?.top ?? 0),
    left:
      triggerRect.left -
      contentRect.width -
      FLOATING_CALLOUT_SIDE_OFFSET -
      (portalRect?.left ?? 0),
    triangleCenter,
  };
}
