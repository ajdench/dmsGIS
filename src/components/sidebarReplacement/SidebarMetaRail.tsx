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
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export function SidebarMetaRail({
  visibilityState,
  visibilityAriaLabel,
  onVisibilityChange,
  pill,
  trailingSlot,
}: SidebarMetaRailProps) {
  return (
    <div className="sidebar-replacement-meta-rail">
      <SidebarToggle
        state={visibilityState}
        ariaLabel={visibilityAriaLabel}
        onChange={onVisibilityChange}
      />
      {pill ? <SidebarMetricPill summary={pill} trigger /> : null}
      <SidebarTrailingSlot slot={trailingSlot} />
    </div>
  );
}
