import type { ReactNode } from 'react';
import type { SidebarPillSummary, SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarMetricPill } from './SidebarMetricPill';
import { SidebarToggle } from './SidebarToggle';
import { SidebarTrailingSlot } from './SidebarTrailingSlot';

interface SidebarMetaRailProps {
  visibilityState: SidebarVisibilityState;
  visibilityAriaLabel: string;
  onVisibilityChange: (visible: boolean) => void;
  pill?: SidebarPillSummary;
  pillSlot?: ReactNode;
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export function SidebarMetaRail({
  visibilityState,
  visibilityAriaLabel,
  onVisibilityChange,
  pill,
  pillSlot,
  trailingSlot,
}: SidebarMetaRailProps) {
  return (
    <span className="sidebar-replacement-meta-rail">
      <SidebarToggle
        state={visibilityState}
        ariaLabel={visibilityAriaLabel}
        onChange={onVisibilityChange}
      />
      {pillSlot ?? (pill ? <SidebarMetricPill summary={pill} trigger /> : null)}
      <SidebarTrailingSlot slot={trailingSlot} />
    </span>
  );
}
