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
        className="sidebar-exact-pill__swatch sidebar-exact-pill__swatch--mixed"
        style={buildSwatchStyle({
          color: swatch.color,
          opacity: swatch.opacity ?? 1,
          mix: swatch.mix,
          borderColor:
            borderWidth > 0 && borderOpacity > 0
              ? borderColor
              : 'var(--sidebar-exact-pill-swatch-outline-color)',
          borderOpacity:
            borderWidth > 0 && borderOpacity > 0 ? borderOpacity : 1,
          borderWidth: `${borderWidth > 0 && borderOpacity > 0 ? borderWidth : 1}px`,
        })}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={`sidebar-exact-pill__swatch sidebar-exact-pill__swatch--${shape}${
        useDefaultOutline ? ' sidebar-exact-pill__swatch--default-outline' : ''
      }`}
      aria-hidden="true"
    >
      {debugCircleOverlay ? (
        <span className="sidebar-exact-pill__swatch-debug-circle" aria-hidden="true" />
      ) : null}
      <ExactShapeSwatch
        shape={shape}
        fill={fillColor}
        borderFill={borderFill}
        fillBackdrop="var(--sidebar-exact-pill-swatch-fill-backdrop)"
        innerScale={innerScale}
        className={`sidebar-exact-pill__swatch-svg sidebar-exact-pill__swatch-svg--${shape}`}
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
      gradientStops.push(`${color} 100%`);
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
    return `translate(50 52.87) scale(${innerScale}) translate(-50 -52.87)`;
  }

  return `translate(50 50) scale(${innerScale}) translate(-50 -50)`;
}

function renderShapePath(shape: ExactShape, scale: 'icon' | 'swatch') {
  if (scale === 'icon') {
    if (shape === 'circle') {
      return <circle cx="12" cy="12" r="7.35" />;
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
      <path d="M12 5.25 C13.15 5.25 14 5.76 14.56 6.8 L18.74 14.77 C19.47 16.15 18.48 17.7 16.94 17.7 H7.06 C5.52 17.7 4.53 16.15 5.26 14.77 L9.44 6.8 C10 5.76 10.85 5.25 12 5.25 Z" />
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
    <path d="M50 7 C53.25 7 55.65 8.4 57.22 11.35 L89.1 72.2 C91.06 75.94 88.39 80 84.22 80 H15.78 C11.61 80 8.94 75.94 10.9 72.2 L42.78 11.35 C44.35 8.4 46.75 7 50 7 Z" />
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
