import type { CSSProperties } from 'react';
import type { FacilitySymbolShape } from '../../types';
import type { SidebarPillSummary } from '../../lib/sidebar/contracts';

interface SidebarMetricPillProps {
  summary: SidebarPillSummary;
  asButton?: boolean;
  expanded?: boolean;
}

export function SidebarMetricPill({
  summary,
  asButton = false,
  expanded,
}: SidebarMetricPillProps) {
  const className = `sidebar-metric-pill${
    asButton ? ' sidebar-metric-pill--button' : ''
  }${summary.swatch ? ' sidebar-metric-pill--swatch' : ''}`;
  const swatch = summary.swatch;

  return (
    <span
      className={className}
      aria-label={asButton ? summary.ariaLabel : undefined}
      aria-expanded={asButton ? expanded : undefined}
      aria-haspopup={asButton ? 'dialog' : undefined}
      role={asButton ? 'button' : undefined}
    >
      {swatch ? (
        renderSwatch(swatch)
      ) : null}
      <span className="sidebar-metric-pill__value">{summary.valueLabel}</span>
    </span>
  );
}

function renderSwatch(
  swatch: NonNullable<SidebarPillSummary['swatch']>,
) {
  const shape = swatch.shape ?? 'circle';
  const fillColor = applyOpacity(swatch.color, swatch.opacity ?? 1);
  const borderWidth = swatch.borderWidth ?? 1;
  const borderOpacity = swatch.borderOpacity ?? 1;
  const { borderFill, innerScale, useDefaultOutline } = resolveSwatchRender({
    shape,
    borderColor: swatch.borderColor,
    borderOpacity,
    borderWidth,
  });

  if (swatch.mix && swatch.mix.length > 1) {
    return (
      <span
        className="sidebar-metric-pill__swatch sidebar-metric-pill__swatch--mixed"
        style={buildSwatchStyle({
          color: swatch.color,
          opacity: swatch.opacity ?? 1,
          mix: swatch.mix,
          borderColor:
            borderWidth > 0 && borderOpacity > 0
              ? swatch.borderColor
              : 'var(--prototype-pill-swatch-outline-color)',
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
      className={`sidebar-metric-pill__swatch sidebar-metric-pill__swatch--${shape}${
        useDefaultOutline ? ' sidebar-metric-pill__swatch--default-outline' : ''
      }`}
      aria-hidden="true"
    >
      <ShapeSwatch
        shape={shape}
        fill={fillColor}
        borderFill={borderFill}
        fillBackdrop="var(--prototype-pill-swatch-fill-backdrop)"
        innerScale={innerScale}
        className={`sidebar-metric-pill__swatch-svg sidebar-metric-pill__swatch-svg--${shape}`}
      />
    </span>
  );
}

function buildSwatchBackground(
  swatch: NonNullable<SidebarPillSummary['swatch']>,
): string {
  if (swatch.mix && swatch.mix.length > 0) {
    const stops = swatch.mix.slice(0, 4).map((stop, index, array) => {
      const color = applyOpacity(stop.color, stop.opacity ?? 1);
      const start = (index / array.length) * 100;
      const end = ((index + 1) / array.length) * 100;
      return `${color} ${start}% ${end}%`;
    });

    return `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  return `linear-gradient(${applyOpacity(swatch.color, swatch.opacity ?? 1)}, ${applyOpacity(swatch.color, swatch.opacity ?? 1)})`;
}

function applyOpacity(color: string, opacity: number): string {
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
  mix?: NonNullable<SidebarPillSummary['swatch']>['mix'];
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: string;
}): CSSProperties {
  const previewBackground =
    mix && mix.length > 0
      ? buildSwatchBackground({
          color: color ?? 'transparent',
          mix,
          opacity,
        })
      : color
        ? `linear-gradient(${applyOpacity(color, opacity)}, ${applyOpacity(color, opacity)})`
        : undefined;

  return {
    background: previewBackground,
    borderColor: borderColor
      ? applyOpacity(borderColor, borderOpacity)
      : undefined,
    borderWidth,
  };
}

function getSwatchInnerScale(shape: FacilitySymbolShape, borderWidth: number) {
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

function getSwatchInnerTransform(shape: FacilitySymbolShape, innerScale: number) {
  if (innerScale >= 1) {
    return undefined;
  }

  if (shape === 'triangle') {
    return `translate(50 52.87) scale(${innerScale}) translate(-50 -52.87)`;
  }

  return `translate(50 50) scale(${innerScale}) translate(-50 -50)`;
}

function renderShapePath(shape: FacilitySymbolShape, scale: 'swatch') {
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

function ShapeSwatch({
  shape,
  fill,
  borderFill,
  fillBackdrop = 'transparent',
  innerScale = 1,
  className,
}: {
  shape: FacilitySymbolShape;
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
  shape: FacilitySymbolShape;
  borderColor?: string;
  borderOpacity: number;
  borderWidth: number;
}) {
  if (borderWidth > 0 && borderOpacity > 0 && borderColor) {
    return {
      borderFill: applyOpacity(borderColor, borderOpacity),
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
