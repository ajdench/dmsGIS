export interface ExactFloatingRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

export interface ExactFloatingCalloutPlacementInput {
  triggerRect: ExactFloatingRect;
  contentRect: Pick<ExactFloatingRect, 'width' | 'height'>;
  viewportRect: ExactFloatingRect;
  portalRect?: Pick<ExactFloatingRect, 'top' | 'left'> | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
}

export interface ExactFloatingCalloutPlacement {
  top: number;
  left: number;
  triangleCenter: number;
}

export const EXACT_CALLOUT_SIDE_OFFSET = 12;
export const EXACT_CALLOUT_VIEWPORT_PADDING = 8;
export const EXACT_CALLOUT_TRIANGLE_MIN_RATIO = 0.075;
export const EXACT_CALLOUT_TRIANGLE_MAX_RATIO = 0.925;
export const EXACT_CALLOUT_TRIANGLE_HALF_EXTENT = 8;

export function computeExactFloatingCalloutPlacement({
  triggerRect,
  contentRect,
  viewportRect,
  portalRect,
  triangleMinRatio = EXACT_CALLOUT_TRIANGLE_MIN_RATIO,
  triangleMaxRatio = EXACT_CALLOUT_TRIANGLE_MAX_RATIO,
}: ExactFloatingCalloutPlacementInput): ExactFloatingCalloutPlacement {
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;
  const desiredTop = triggerCenterY - contentRect.height / 2;
  const viewportMinTop = viewportRect.top + EXACT_CALLOUT_VIEWPORT_PADDING;
  const viewportMaxTop =
    viewportRect.bottom - contentRect.height - EXACT_CALLOUT_VIEWPORT_PADDING;
  const minTriangleCenter =
    contentRect.height * triangleMinRatio + EXACT_CALLOUT_TRIANGLE_HALF_EXTENT;
  const maxTriangleCenter =
    contentRect.height * triangleMaxRatio - EXACT_CALLOUT_TRIANGLE_HALF_EXTENT;

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
      EXACT_CALLOUT_SIDE_OFFSET -
      (portalRect?.left ?? 0),
    triangleCenter,
  };
}
