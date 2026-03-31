import type { ReactNode } from 'react';
import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarPaneBody } from './SidebarPaneBody';
import { SidebarPaneHeader } from './SidebarPaneHeader';

interface SidebarPaneProps {
  title: string;
  visibilityState: SidebarVisibilityState;
  visibilityAriaLabel: string;
  onVisibilityChange: (visible: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  trailingSlot?: SidebarTrailingSlotDefinition;
  children: ReactNode;
}

export function SidebarPane({
  title,
  visibilityState,
  visibilityAriaLabel,
  onVisibilityChange,
  expanded,
  onExpandedChange,
  trailingSlot,
  children,
}: SidebarPaneProps) {
  return (
    <section className="sidebar-replacement-pane">
      <SidebarPaneHeader
        title={title}
        visibilityState={visibilityState}
        visibilityAriaLabel={visibilityAriaLabel}
        onVisibilityChange={onVisibilityChange}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        trailingSlot={trailingSlot}
      />
      {expanded ? <SidebarPaneBody>{children}</SidebarPaneBody> : null}
    </section>
  );
}
