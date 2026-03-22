import Icon from 'ol/style/Icon';
import type { FacilitySymbolShape } from '../../types';

export function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  if (value.length !== 6) return hex;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
 * Canvas size for shape rendering. Shapes are drawn in a 100×100 coordinate
 * space, then scaled to screen size via the Icon scale factor.
 */
const CANVAS_SIZE = 100;

/**
 * Creates a map point symbol rendered to an HTMLCanvasElement.
 *
 * Canvas rendering is synchronous — unlike SVG data-URL Icons which decode
 * asynchronously via `new Image()`, canvas-based icons appear immediately
 * and never cause a visible "blip" when style properties change.
 *
 * All shapes are drawn in a 100×100 coordinate space with rounded corners
 * matching the sidebar swatch aesthetic. Borders are inward-only (clipped to
 * the shape interior).
 *
 * NOTE: zoom-relative scaling is deferred — see docs/project-todo.md.
 */
export function createPointSymbol(
  shape: FacilitySymbolShape,
  size: number,
  fillColor: string,
  borderColor: string,
  borderWidth: number,
) {
  const scale = getSymbolScale(size);
  // Convert screen-pixel border width to canvas coordinate units.
  // Double it because we clip to the shape interior (only inside half visible).
  const canvasStrokeWidth = borderWidth > 0 ? (borderWidth / scale) * 2 : 0;
  const canvas = renderShapeCanvas(
    shape,
    fillColor,
    borderWidth > 0 ? borderColor : undefined,
    canvasStrokeWidth,
  );
  return new Icon({
    img: canvas,
    imgSize: [CANVAS_SIZE, CANVAS_SIZE],
    scale,
    anchor: getShapeAnchor(shape),
  });
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
function getShapeAnchor(shape: FacilitySymbolShape): [number, number] {
  if (shape === 'triangle') {
    // Triangle vertices: apex ≈ y 11.7, base ≈ y 88.3
    // Centroid y = (11.7 + 88.3 + 88.3) / 3 ≈ 62.8 → 0.628 as fraction
    return [0.5, 0.628];
  }
  return [0.5, 0.5];
}

/**
 * Render a shape to an HTMLCanvasElement. Fill is drawn first, then the
 * border is stroked inside the shape via a clip region.
 */
function renderShapeCanvas(
  shape: FacilitySymbolShape,
  fillColor: string,
  borderColor: string | undefined,
  strokeWidth: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;

  // Fill the shape
  ctx.fillStyle = fillColor;
  tracePath(ctx, shape);
  ctx.fill();

  // Inward border: clip to shape, then stroke (only inside half visible)
  if (borderColor && strokeWidth > 0) {
    ctx.save();
    tracePath(ctx, shape);
    ctx.clip();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = strokeWidth;
    tracePath(ctx, shape);
    ctx.stroke();
    ctx.restore();
  }

  return canvas;
}

/**
 * Trace a shape path on the canvas context. Calls beginPath() internally.
 * All shapes are centered at (50, 50) with rounded corners matching the
 * sidebar swatch aesthetic.
 */
function tracePath(ctx: CanvasRenderingContext2D, shape: FacilitySymbolShape) {
  ctx.beginPath();

  if (shape === 'circle') {
    // r=40 → diameter=80. Reference shape.
    ctx.arc(50, 50, 40, 0, Math.PI * 2);
    return;
  }

  if (shape === 'square') {
    // 78×78, a touch smaller than the 80-diameter circle.
    ctx.roundRect(11, 11, 78, 78, 13.5);
    return;
  }

  if (shape === 'diamond') {
    // Rotated square: 70.7×70.7 at 45° → 100-unit tip-to-tip extent.
    ctx.save();
    ctx.translate(50, 50);
    ctx.rotate(Math.PI / 4);
    ctx.roundRect(-70.7 / 2, -70.7 / 2, 70.7, 70.7, 11);
    ctx.restore();
    return;
  }

  // Triangle: swatch path scaled 1.05× from centre, centred vertically.
  ctx.moveTo(50, 11.7);
  ctx.bezierCurveTo(53.4, 11.7, 55.9, 13.1, 57.6, 16.2);
  ctx.lineTo(91.1, 80.1);
  ctx.bezierCurveTo(93.1, 84.1, 90.3, 88.3, 85.9, 88.3);
  ctx.lineTo(14.1, 88.3);
  ctx.bezierCurveTo(9.7, 88.3, 6.9, 84.1, 8.9, 80.1);
  ctx.lineTo(42.4, 16.2);
  ctx.bezierCurveTo(44.1, 13.1, 46.6, 11.7, 50, 11.7);
  ctx.closePath();
}
