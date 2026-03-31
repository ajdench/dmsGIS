import type { SidebarPillSummary } from '../../lib/sidebar/contracts';
import { MetricPillSwatch } from '../sidebarShared/MetricPillSwatch';

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
        <MetricPillSwatch
          swatch={swatch}
          swatchClassName="sidebar-metric-pill__swatch"
          mixedClassName="sidebar-metric-pill__swatch--mixed"
          defaultOutlineClassName="sidebar-metric-pill__swatch--default-outline"
          svgClassName="sidebar-metric-pill__swatch-svg"
        />
      ) : null}
      <span className="sidebar-metric-pill__value">{summary.valueLabel}</span>
    </span>
  );
}
