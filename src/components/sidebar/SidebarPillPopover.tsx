import { useState, type ReactNode } from 'react';
import type { SidebarPillSummary } from '../../lib/sidebar/contracts';
import { SidebarPopover } from './SidebarPopover';
import { SidebarMetricPill } from './SidebarMetricPill';

interface SidebarPillPopoverProps {
  summary: SidebarPillSummary;
  children: ReactNode;
}

export function SidebarPillPopover({
  summary,
  children,
}: SidebarPillPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <SidebarPopover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          className="sidebar-metric-pill-button-reset"
          aria-label={summary.ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <SidebarMetricPill summary={summary} />
        </button>
      }
    >
      {children}
    </SidebarPopover>
  );
}
