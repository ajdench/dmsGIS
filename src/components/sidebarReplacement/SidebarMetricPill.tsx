import { forwardRef, type ReactNode } from 'react';
import type { SidebarPillSummary } from '../../lib/sidebar/contracts';
import { MetricPillSwatch } from '../sidebarShared/MetricPillSwatch';

interface SidebarMetricPillProps {
  summary: SidebarPillSummary;
  trigger?: boolean;
  asButton?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'dialog';
  onClick?: () => void;
  children?: ReactNode;
}

export const SidebarMetricPill = forwardRef<
  HTMLButtonElement,
  SidebarMetricPillProps
>(function SidebarMetricPill(
  {
    summary,
    trigger = false,
    asButton = false,
    ariaExpanded,
    ariaHaspopup,
    onClick,
    children,
  },
  ref,
) {
  const swatch = summary.swatch;
  const content = (
    <>
      {swatch ? (
        <MetricPillSwatch
          swatch={swatch}
          swatchClassName="sidebar-replacement-pill__swatch"
          mixedClassName="sidebar-replacement-pill__swatch--mixed"
          defaultOutlineClassName="sidebar-replacement-pill__swatch--default-outline"
          svgClassName="sidebar-replacement-pill__swatch-svg"
        />
      ) : null}
      <span
        className={`sidebar-replacement-pill__value${
          swatch ? ' sidebar-replacement-pill__value--swatch' : ''
        }`}
      >
        {summary.valueLabel}
      </span>
      {children}
    </>
  );

  if (asButton) {
    return (
      <button
        ref={ref}
        type="button"
        className={`sidebar-replacement-pill sidebar-replacement-pill--button${
          swatch ? ' sidebar-replacement-pill--swatch' : ''
        }${trigger ? ' sidebar-replacement-pill--trigger' : ''}`}
        aria-label={summary.ariaLabel}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHaspopup}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span
      className={`sidebar-replacement-pill${
        swatch ? ' sidebar-replacement-pill--swatch' : ''
      }${trigger ? ' sidebar-replacement-pill--trigger' : ''}`}
      aria-label={trigger ? summary.ariaLabel : undefined}
    >
      {content}
    </span>
  );
});
