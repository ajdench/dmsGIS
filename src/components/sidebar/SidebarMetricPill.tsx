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
  const className = `sidebar-metric-pill${asButton ? ' sidebar-metric-pill--button' : ''}`;

  return (
    <span
      className={className}
      aria-label={asButton ? summary.ariaLabel : undefined}
      aria-expanded={asButton ? expanded : undefined}
      aria-haspopup={asButton ? 'dialog' : undefined}
      role={asButton ? 'button' : undefined}
    >
      {summary.swatch ? (
        <span
          className="sidebar-metric-pill__swatch"
          style={{
            backgroundColor: summary.swatch.color,
            opacity: summary.swatch.opacity ?? 1,
            borderColor: summary.swatch.borderColor,
            borderWidth: summary.swatch.borderWidth,
          }}
          aria-hidden="true"
        />
      ) : null}
      <span className="sidebar-metric-pill__value">{summary.valueLabel}</span>
    </span>
  );
}
