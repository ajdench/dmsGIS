import { forwardRef } from 'react';
import { ExactSwatch } from './ExactSwatch';
import type { ExactMetricPillProps } from './types';

export const ExactMetricPill = forwardRef<HTMLButtonElement, ExactMetricPillProps>(
  function ExactMetricPill(
    {
      value,
      swatch,
      summary,
      debugCircleOverlay = false,
      asButton = false,
      ariaExpanded,
      ariaHaspopup,
      className,
      type,
      ...buttonProps
    },
    ref,
  ) {
    const resolvedValue = summary?.valueLabel ?? value ?? '';
    const resolvedSwatch = summary?.swatch
      ? {
          color: summary.swatch.color,
          opacity: summary.swatch.opacity,
          mix: summary.swatch.mix,
          shape: summary.swatch.shape,
          borderColor: summary.swatch.borderColor,
          borderWidth: summary.swatch.borderWidth,
          borderOpacity: summary.swatch.borderOpacity,
        }
      : swatch;
    const content = (
      <>
        {resolvedSwatch ? (
          <ExactSwatch
            swatch={resolvedSwatch}
            debugCircleOverlay={debugCircleOverlay}
          />
        ) : null}
        <span
          className={`sidebar-exact-pill__value prototype-metric-pill__value${
            resolvedSwatch ? ' sidebar-exact-pill__value--swatch' : ''
          }${resolvedSwatch ? ' prototype-metric-pill__value--swatch' : ''}`}
        >
          {resolvedValue}
        </span>
      </>
    );

    if (asButton) {
      return (
        <button
          ref={ref}
          type={type ?? 'button'}
          className={`sidebar-exact-pill prototype-metric-pill prototype-metric-pill--button sidebar-exact-pill--button${
            resolvedSwatch
              ? ' sidebar-exact-pill--swatch prototype-metric-pill--swatch'
              : ''
          }${className ? ` ${className}` : ''}`}
          aria-label={summary?.ariaLabel}
          aria-expanded={ariaExpanded}
          aria-haspopup={ariaHaspopup}
          {...buttonProps}
        >
          {content}
        </button>
      );
    }

    return (
      <span
        className={`sidebar-exact-pill prototype-metric-pill${
          resolvedSwatch
            ? ' sidebar-exact-pill--swatch prototype-metric-pill--swatch'
            : ''
        }`}
        aria-label={summary?.ariaLabel}
      >
        {content}
      </span>
    );
  },
);
