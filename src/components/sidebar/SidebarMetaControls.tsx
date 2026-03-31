import type { ReactNode } from 'react';
import type {
  SidebarPillSummary,
  SidebarTrailingSlotDefinition,
} from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarPillPopover } from './SidebarPillPopover';
import { SidebarToggleButton } from './SidebarToggleButton';
import { SidebarTrailingSlot } from './SidebarTrailingSlot';

interface SidebarMetaControlsProps {
  visibilityState: SidebarVisibilityState;
  onVisibilityChange: (visible: boolean) => void;
  visibilityAriaLabel: string;
  pill: SidebarPillSummary;
  children: ReactNode;
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export function SidebarMetaControls({
  visibilityState,
  onVisibilityChange,
  visibilityAriaLabel,
  pill,
  children,
  trailingSlot,
}: SidebarMetaControlsProps) {
  return (
    <span className="sidebar-section-card__meta">
      <SidebarToggleButton
        state={visibilityState}
        ariaLabel={visibilityAriaLabel}
        onChange={onVisibilityChange}
      />
      <SidebarPillPopover summary={pill}>{children}</SidebarPillPopover>
      {trailingSlot ? <SidebarTrailingSlot slot={trailingSlot} /> : null}
    </span>
  );
}
