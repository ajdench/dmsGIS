import type { CSSProperties } from 'react';
import type { ExactPillSwatch, ExactShape, ExactSwatchStop } from './types';

const DEFAULT_SWATCH_BORDER_COLOR = 'rgba(148, 163, 184, 0.6)';
const DEFAULT_SWATCH_BORDER_WIDTH = 1;
const DEFAULT_SWATCH_BORDER_OPACITY = 1;

interface ExactSwatchProps {
  swatch: ExactPillSwatch;
  debugCircleOverlay?: boolean;
}

export function ExactSwatch({
  swatch,
  debugCircleOverlay = false,
}: ExactSwatchProps) {
  const shape = swatch.shape ?? 'circle';
  const fillColor = applyOpacityToColor(swatch.color ?? 'transparent', swatch.opacity ?? 1);
  const borderColor = swatch.borderColor ?? DEFAULT_SWATCH_BORDER_COLOR;
  const borderWidth = swatch.borderWidth ?? DEFAULT_SWATCH_BORDER_WIDTH;
  const borderOpacity = swatch.borderOpacity ?? DEFAULT_SWATCH_BORDER_OPACITY;
  const { borderFill, innerScale, useDefaultOutline } = resolveSwatchRender({
    shape,
    borderColor,
    borderOpacity,
    borderWidth,
  });

  if (swatch.mix && swatch.mix.length > 1) {
    return (
      <span
        className="sidebar-exact-pill__swatch sidebar-exact-pill__swatch--mixed prototype-metric-pill__swatch prototype-metric-pill__swatch--mixed"
        style={buildSwatchStyle({
          color: swatch.color,
          opacity: swatch.opacity ?? 1,
          mix: swatch.mix,
        })}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`sidebar-exact-pill__swatch sidebar-exact-pill__swatch--${shape} prototype-metric-pill__swatch prototype-metric-pill__swatch--${shape}${
        useDefaultOutline
          ? ' sidebar-exact-pill__swatch--default-outline prototype-metric-pill__swatch--default-outline'
          : ''
      }`}
      aria-hidden="true"
    >
      {debugCircleOverlay ? (
        <span
          className="sidebar-exact-pill__swatch-debug-circle prototype-metric-pill__swatch-debug-circle"
          aria-hidden="true"
        />
      ) : null}
        <ExactShapeSwatch
          shape={shape}
          fill={fillColor}
          borderFill={borderFill}
          fillBackdrop="var(--prototype-pill-swatch-fill-backdrop)"
          innerScale={innerScale}
        className={`sidebar-exact-pill__swatch-svg sidebar-exact-pill__swatch-svg--${shape} prototype-metric-pill__swatch-svg prototype-metric-pill__swatch-svg--${shape}`}
      />
    </span>
  );
}

export function ExactShapeIcon({
  shape,
  className,
}: {
  shape: ExactShape;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={
          shape === 'circle' ? 0 : shape === 'square' ? 0.7 : shape === 'diamond' ? 1 : 0.94
        }
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {renderShapePath(shape, 'icon')}
      </g>
    </svg>
  );
}

function buildSwatchStyle({
  color,
  opacity = 1,
  mix,
  borderColor,
  borderOpacity = 1,
  borderWidth,
}: {
  color?: string;
  opacity?: number;
  mix?: ExactSwatchStop[];
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: string;
}): CSSProperties {
  const previewBackground =
    mix && mix.length > 0
      ? buildMixedSwatchBackground(mix)
      : color
        ? `linear-gradient(${applyOpacityToColor(color, opacity)}, ${applyOpacityToColor(color, opacity)})`
        : undefined;

  return {
    background: previewBackground,
    borderColor: borderColor
      ? applyOpacityToColor(borderColor, borderOpacity)
      : undefined,
    borderWidth,
  };
}

function buildMixedSwatchBackground(stops: ExactSwatchStop[]) {
  if (stops.length === 0) {
    return undefined;
  }

  if (stops.length === 1) {
    const color = applyOpacityToColor(stops[0].color, stops[0].opacity ?? 1);
    return `linear-gradient(${color}, ${color})`;
  }

  const normalizedStops = stops.slice(0, 4);
  const gradientStops = buildBlendedGradientStops(normalizedStops, 0.34);

  return `conic-gradient(from 225deg, ${gradientStops})`;
}

function buildBlendedGradientStops(stops: ExactSwatchStop[], featherRatio: number) {
  const normalizedStops = stops.map((stop) =>
    applyOpacityToColor(stop.color, stop.opacity ?? 1),
  );

  if (normalizedStops.length === 1) {
    return `${normalizedStops[0]} 0% 100%`;
  }

  const segment = 100 / normalizedStops.length;
  const feather = segment * featherRatio;
  const gradientStops: string[] = [`${normalizedStops[0]} 0%`];

  normalizedStops.forEach((color, index) => {
    const boundary = segment * (index + 1);
    const nextColor = normalizedStops[index + 1];

    if (!nextColor) {
      // Blend the last colour back into the first so the seam at 0%/100% is smooth
      gradientStops.push(`${color} ${Math.max(0, boundary - feather)}%`);
      gradientStops.push(`${normalizedStops[0]} 100%`);
      return;
    }

    gradientStops.push(`${color} ${Math.max(0, boundary - feather)}%`);
    gradientStops.push(`${nextColor} ${Math.min(100, boundary + feather)}%`);
  });

  return gradientStops.join(', ');
}

function applyOpacityToColor(color: string, opacity = 1) {
  if (opacity >= 1) {
    return color;
  }

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const normalizedHex =
      hex.length === 3
        ? hex
            .split('')
            .map((value) => value + value)
            .join('')
        : hex;

    if (normalizedHex.length === 6) {
      const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
      const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
      const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);

      return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
    }
  }

  return `color-mix(in srgb, ${color} ${opacity * 100}%, transparent)`;
}

function getSwatchInnerScale(shape: ExactShape, borderWidth: number) {
  if (shape === 'square') {
    const inset = Math.max(0, Math.min(24, borderWidth * 2.65));
    return (100 - inset * 2) / 100;
  }

  if (shape === 'diamond') {
    const inset = Math.max(0, Math.min(25, borderWidth * 2.75));
    return (100 - inset * 2) / 100;
  }

  if (shape === 'triangle') {
    const inset = Math.max(0, Math.min(33, borderWidth * 3.825));
    return (100 - inset * 2) / 100;
  }

  const inset = Math.max(0, Math.min(22, borderWidth * 2.35));
  return (100 - inset * 2) / 100;
}

function getSwatchInnerTransform(shape: ExactShape, innerScale: number) {
  if (innerScale >= 1) {
    return undefined;
  }

  if (shape === 'triangle') {
    return `translate(50 56.8) scale(${innerScale}) translate(-50 -56.8)`;
  }

  return `translate(50 50) scale(${innerScale}) translate(-50 -50)`;
}

function renderShapePath(shape: ExactShape, scale: 'icon' | 'swatch') {
  if (scale === 'icon') {
    if (shape === 'circle') {
      return <circle cx="12" cy="12" r="7.85" />;
    }

    if (shape === 'square') {
      return <rect x="5" y="5" width="14" height="14" rx="2.9" />;
    }

    if (shape === 'diamond') {
      return (
        <rect
          x="5.35"
          y="5.35"
          width="13.3"
          height="13.3"
          rx="2.25"
          transform="rotate(45 12 12)"
        />
      );
    }

    return (
      <path d="M12 4.75 C13.0 4.75 13.6 5.1 13.68 5.77 L19.95 16.27 C20.25 17.0 18.97 18.2 18.76 18.2 H5.24 C5.03 18.2 3.75 17.0 4.05 16.27 L10.32 5.77 C10.4 5.1 11.0 4.75 12 4.75 Z" />
    );
  }

  if (shape === 'circle') {
    return <circle cx="50" cy="50" r="47" />;
  }

  if (shape === 'square') {
    return <rect x="9.5" y="9.5" width="81" height="81" rx="13.5" ry="13.5" />;
  }

  if (shape === 'diamond') {
    return (
      <rect
        x="12.25"
        y="12.25"
        width="75.5"
        height="75.5"
        rx="12.6"
        transform="rotate(45 50 50)"
      />
    );
  }

  return (
    <path d="M50 3.7 C53.5 3.7 56.2 5.3 57.9 8.5 L92.6 74.8 C94.7 78.9 91.8 83.3 87.3 83.3 H12.7 C8.2 83.3 5.3 78.9 7.4 74.8 L42.1 8.5 C43.8 5.3 46.5 3.7 50 3.7 Z" />
  );
}

function ExactShapeSwatch({
  shape,
  fill,
  borderFill,
  fillBackdrop = 'transparent',
  innerScale = 1,
  className,
}: {
  shape: ExactShape;
  fill: string;
  borderFill?: string;
  fillBackdrop?: string;
  innerScale?: number;
  className?: string;
}) {
  const innerTransform = getSwatchInnerTransform(shape, innerScale);

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ overflow: 'visible' }}
    >
      {borderFill ? (
        <>
          <g fill={borderFill}>{renderShapePath(shape, 'swatch')}</g>
          <g fill={fillBackdrop} transform={innerTransform}>
            {renderShapePath(shape, 'swatch')}
          </g>
          <g fill={fill} transform={innerTransform}>
            {renderShapePath(shape, 'swatch')}
          </g>
        </>
      ) : (
        <g fill={fill}>{renderShapePath(shape, 'swatch')}</g>
      )}
    </svg>
  );
}

function resolveSwatchRender({
  shape,
  borderColor,
  borderOpacity,
  borderWidth,
}: {
  shape: ExactShape;
  borderColor?: string;
  borderOpacity: number;
  borderWidth: number;
}) {
  if (borderWidth > 0 && borderOpacity > 0 && borderColor) {
    return {
      borderFill: applyOpacityToColor(borderColor, borderOpacity),
      innerScale: getSwatchInnerScale(shape, borderWidth),
      useDefaultOutline: false,
    };
  }

  return {
    borderFill: undefined,
    innerScale: 1,
    useDefaultOutline: true,
  };
}
