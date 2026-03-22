import type { ReactNode } from 'react';
import type { SidebarPillSummary } from '../../lib/sidebar/contracts';

interface SidebarMetricPillProps {
  summary: SidebarPillSummary;
  trigger?: boolean;
  children?: ReactNode;
}

export function SidebarMetricPill({
  summary,
  trigger = false,
  children,
}: SidebarMetricPillProps) {
  return (
    <span
      className={`sidebar-replacement-pill${
        summary.swatch ? ' sidebar-replacement-pill--swatch' : ''
      }${trigger ? ' sidebar-replacement-pill--trigger' : ''}`}
      aria-label={trigger ? summary.ariaLabel : undefined}
    >
      {summary.swatch ? (
        <span className="sidebar-replacement-pill__swatch" aria-hidden="true" />
      ) : null}
      <span className="sidebar-replacement-pill__value">{summary.valueLabel}</span>
      {children}
    </span>
  );
}
