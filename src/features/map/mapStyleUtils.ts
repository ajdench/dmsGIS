import Icon from 'ol/style/Icon';
import type { FacilitySymbolShape } from '../../types';

export interface PointSymbolOptions {
  outerRingColor?: string;
  outerRingWidth?: number;
  outerRingGap?: number;
  outerRingPlacement?: 'outside' | 'inside';
}

export function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function darkenHex(hex: string, factor: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const clampedFactor = Math.max(0, Math.min(1, factor));
  const r = Math.round(Number.parseInt(value.slice(0, 2), 16) * clampedFactor);
  const g = Math.round(Number.parseInt(value.slice(2, 4), 16) * clampedFactor);
  const b = Math.round(Number.parseInt(value.slice(4, 6), 16) * clampedFactor);
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Blend a hex colour at a given opacity against white, returning an opaque
 * `rgba(r, g, b, 1)` string. Used for map symbol borders so they render as
 * solid colours rather than transparent strokes.
 */
export function blendWithWhite(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  const blendR = Math.round(r * opacity + 255 * (1 - opacity));
  const blendG = Math.round(g * opacity + 255 * (1 - opacity));
  const blendB = Math.round(b * opacity + 255 * (1 - opacity));
  return `rgba(${blendR}, ${blendG}, ${blendB}, 1)`;
}

/**
 * Base canvas size for shape rendering. The drawable shape still uses the
 * original 100×100 geometry space, and transparent padding is derived from the
 * current border/ring treatment so outer strokes can grow without clipping.
 */
const BASE_CANVAS_SIZE = 100;
const MIN_CANVAS_PADDING = 10;
const CANVAS_PADDING_BUFFER = 2;

/**
 * Creates a map point symbol rendered to an HTMLCanvasElement.
 *
 * Canvas rendering is synchronous — unlike SVG data-URL Icons which decode
 * asynchronously via `new Image()`, canvas-based icons appear immediately
 * and never cause a visible "blip" when style properties change.
 *
 * All shapes are drawn in a padded 100×100 coordinate space with rounded corners
 * matching the sidebar swatch aesthetic. Shape borders and outer treatments
 * now all use normal same-shape strokes so their geometry stays consistent.
 *
 * NOTE: zoom-relative scaling is deferred — see docs/project-todo.md.
 */
export function createPointSymbol(
  shape: FacilitySymbolShape,
  size: number,
  fillColor: string,
  borderColor: string,
  borderWidth: number,
  options: PointSymbolOptions = {},
) {
  const scale = getSymbolScale(size);
  const outerRingWidth = options.outerRingWidth ?? 0;
  const outerRingGap = options.outerRingGap ?? 0;
  const outerRingPlacement = options.outerRingPlacement ?? 'outside';
  // Convert screen-pixel border width to canvas coordinate units.
  // Double it so the centered canvas stroke contributes one borderWidth of
  // visible expansion outside the filled shape.
  const canvasStrokeWidth = borderWidth > 0 ? (borderWidth / scale) * 2 : 0;
  const canvasOuterRingWidth =
    outerRingWidth > 0 ? outerRingWidth / scale : 0;
  const canvasOuterRingGap = outerRingGap > 0 ? outerRingGap / scale : 0;
  const canvasPadding = getPointSymbolCanvasPadding(size, borderWidth, options);
  const canvasSize = BASE_CANVAS_SIZE + canvasPadding * 2;
  const canvas = renderShapeCanvas(
    shape,
    fillColor,
    borderWidth > 0 ? borderColor : undefined,
    canvasStrokeWidth,
    options.outerRingColor,
    canvasOuterRingWidth,
    canvasOuterRingGap,
    outerRingPlacement,
    canvasPadding,
    canvasSize,
  );
  return new Icon({
    img: canvas,
    scale,
    anchor: getShapeAnchor(shape, canvasPadding, canvasSize),
  });
}

export function getPointSymbolCanvasPadding(
  size: number,
  borderWidth: number,
  options: PointSymbolOptions = {},
): number {
  const scale = getSymbolScale(size);
  const outerRingWidth = options.outerRingWidth ?? 0;
  const outerRingGap = options.outerRingGap ?? 0;
  const outerRingPlacement = options.outerRingPlacement ?? 'outside';
  const canvasStrokeWidth = borderWidth > 0 ? (borderWidth / scale) * 2 : 0;
  const canvasOuterRingWidth =
    outerRingWidth > 0 ? outerRingWidth / scale : 0;
  const canvasOuterRingGap = outerRingGap > 0 ? outerRingGap / scale : 0;
  const borderOutside = canvasStrokeWidth > 0 ? canvasStrokeWidth / 2 : 0;
  const outerRingOutside =
    outerRingPlacement === 'outside' && canvasOuterRingWidth > 0
      ? canvasOuterRingGap + canvasOuterRingWidth
      : 0;
  return Math.ceil(
    Math.max(MIN_CANVAS_PADDING, borderOutside, outerRingOutside) +
      CANVAS_PADDING_BUFFER,
  );
}

export function getCombinedPracticeRingWidth(size: number): number {
  return Math.max(1, Math.min(2.5, size * 0.35));
}

export function getCombinedPracticeRingGap(size: number): number {
  void size;
  return 0;
}

export function getSelectedPointHighlightOffset(
  size: number,
  hasVisibleBorder: boolean,
  hasCombinedPracticeRing: boolean,
): number {
  void size;
  void hasCombinedPracticeRing;
  const baseHighlightOffset = hasVisibleBorder ? 1 : 0;
  return baseHighlightOffset;
}

/**
 * Scale factor from canvas units to screen pixels.
 *
 * All shapes are drawn ~80 canvas units wide/tall. We target the same visual
 * width as the previous square symbol (circumradius * 1.05 * √2).
 */
function getSymbolScale(size: number): number {
  return (size * 1.05 * Math.SQRT2) / 80;
}

/**
 * Icon anchor point as [x, y] fractions. For most shapes the geometric
 * centre is at (0.5, 0.5). For the triangle the centroid sits below the
 * bounding-box centre, so we anchor at the centroid instead.
 */
function getShapeAnchor(
  shape: FacilitySymbolShape,
  canvasPadding: number,
  canvasSize: number,
): [number, number] {
  const centeredAnchor = (50 + canvasPadding) / canvasSize;

  if (shape === 'triangle') {
    // Triangle vertices: apex ≈ y 11.7, base ≈ y 88.3
    // Centroid y = (11.7 + 88.3 + 88.3) / 3 ≈ 62.8, then padded into the larger canvas.
    return [centeredAnchor, (62.8 + canvasPadding) / canvasSize];
  }
  return [centeredAnchor, centeredAnchor];
}

/**
 * Render a shape to an HTMLCanvasElement. Fill is drawn first, then same-shape
 * strokes are applied for any outer family ring and the main point border.
 */
function renderShapeCanvas(
  shape: FacilitySymbolShape,
  fillColor: string,
  borderColor: string | undefined,
  strokeWidth: number,
  outerRingColor: string | undefined,
  outerRingWidth: number,
  outerRingGap: number,
  outerRingPlacement: 'outside' | 'inside',
  canvasPadding: number,
  canvasSize: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  const ctx = canvas.getContext('2d')!;

  // Outer family ring: render an outside-only same-shape stroke so the family
  // treatment stays centered, shape-matched, and visually separate from the
  // underlying point fill and border.
  const borderOutside = strokeWidth > 0 ? strokeWidth / 2 : 0;
  const fillInset =
    outerRingColor && outerRingWidth > 0 && outerRingPlacement === 'inside'
      ? outerRingGap + outerRingWidth
      : 0;

  if (outerRingColor && outerRingWidth > 0) {
    ctx.strokeStyle = outerRingColor;
    ctx.lineWidth = outerRingWidth;
    const ringInset =
      outerRingPlacement === 'inside'
        ? Math.max(0, outerRingGap + outerRingWidth / 2 - borderOutside)
        : -(outerRingGap + outerRingWidth / 2);
    tracePath(ctx, shape, canvasPadding, getScaleFactorFromInset(ringInset));
    ctx.stroke();
  }

  // Fill the shape
  ctx.fillStyle = fillColor;
  tracePath(ctx, shape, canvasPadding, getScaleFactorFromInset(fillInset));
  ctx.fill();

  // Main point border: normal centered stroke on the same shape path.
  if (borderColor && strokeWidth > 0) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = strokeWidth;
    tracePath(ctx, shape, canvasPadding, getScaleFactorFromInset(fillInset));
    ctx.stroke();
  }

  return canvas;
}

function getScaleFactorFromInset(inset: number): number {
  return 1 - (2 * inset) / 80;
}

/**
 * Trace a shape path on the canvas context. Calls beginPath() internally.
 * All shapes are centered at (50, 50) with rounded corners matching the
 * sidebar swatch aesthetic.
 */
function tracePath(
  ctx: CanvasRenderingContext2D,
  shape: FacilitySymbolShape,
  canvasPadding: number,
  scaleFactor = 1,
) {
  const center = 50 + canvasPadding;

  ctx.save();
  ctx.translate(center, center);
  ctx.scale(scaleFactor, scaleFactor);
  ctx.translate(-center, -center);
  ctx.beginPath();

  if (shape === 'circle') {
    // r=40 → diameter=80. Reference shape.
    ctx.arc(50 + canvasPadding, 50 + canvasPadding, 40, 0, Math.PI * 2);
    ctx.restore();
    return;
  }

  if (shape === 'square') {
    // 78×78, a touch smaller than the 80-diameter circle.
    ctx.roundRect(11 + canvasPadding, 11 + canvasPadding, 78, 78, 13.5);
    ctx.restore();
    return;
  }

  if (shape === 'diamond') {
    // Rotated square: 70.7×70.7 at 45° → 100-unit tip-to-tip extent.
    ctx.translate(50 + canvasPadding, 50 + canvasPadding);
    ctx.rotate(Math.PI / 4);
    ctx.roundRect(-70.7 / 2, -70.7 / 2, 70.7, 70.7, 11);
    ctx.restore();
    return;
  }

  // Triangle: swatch path scaled 1.05× from centre, centred vertically.
  ctx.moveTo(50 + canvasPadding, 11.7 + canvasPadding);
  ctx.bezierCurveTo(53.4 + canvasPadding, 11.7 + canvasPadding, 55.9 + canvasPadding, 13.1 + canvasPadding, 57.6 + canvasPadding, 16.2 + canvasPadding);
  ctx.lineTo(91.1 + canvasPadding, 80.1 + canvasPadding);
  ctx.bezierCurveTo(93.1 + canvasPadding, 84.1 + canvasPadding, 90.3 + canvasPadding, 88.3 + canvasPadding, 85.9 + canvasPadding, 88.3 + canvasPadding);
  ctx.lineTo(14.1 + canvasPadding, 88.3 + canvasPadding);
  ctx.bezierCurveTo(9.7 + canvasPadding, 88.3 + canvasPadding, 6.9 + canvasPadding, 84.1 + canvasPadding, 8.9 + canvasPadding, 80.1 + canvasPadding);
  ctx.lineTo(42.4 + canvasPadding, 16.2 + canvasPadding);
  ctx.bezierCurveTo(44.1 + canvasPadding, 13.1 + canvasPadding, 46.6 + canvasPadding, 11.7 + canvasPadding, 50 + canvasPadding, 11.7 + canvasPadding);
  ctx.closePath();
  ctx.restore();
}
