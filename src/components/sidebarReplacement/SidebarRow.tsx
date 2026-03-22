import type { ReactNode } from 'react';
import type { SidebarPillSummary, SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarMetaRail } from './SidebarMetaRail';

interface SidebarRowProps {
  label: string;
  visibilityState: SidebarVisibilityState;
  visibilityAriaLabel: string;
  onVisibilityChange: (visible: boolean) => void;
  pill: SidebarPillSummary;
  trailingSlot?: SidebarTrailingSlotDefinition;
  children?: ReactNode;
}

export function SidebarRow({
  label,
  visibilityState,
  visibilityAriaLabel,
  onVisibilityChange,
  pill,
  trailingSlot,
  children,
}: SidebarRowProps) {
  return (
    <div className="sidebar-replacement-section-card">
      <div className="sidebar-replacement-section-card__bar">
        <span className="sidebar-replacement-row__label">{label}</span>
        <SidebarMetaRail
          visibilityState={visibilityState}
          visibilityAriaLabel={visibilityAriaLabel}
          onVisibilityChange={onVisibilityChange}
          pill={pill}
          trailingSlot={trailingSlot}
        />
      </div>
      {children ? <div className="sidebar-replacement-section-card__body">{children}</div> : null}
    </div>
  );
}
