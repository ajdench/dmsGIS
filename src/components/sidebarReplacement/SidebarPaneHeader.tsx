import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarToggle } from './SidebarToggle';
import { SidebarTrailingSlot } from './SidebarTrailingSlot';

interface SidebarPaneHeaderProps {
  title: string;
  visibilityState: SidebarVisibilityState;
  visibilityAriaLabel: string;
  onVisibilityChange: (visible: boolean) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export function SidebarPaneHeader({
  title,
  visibilityState,
  visibilityAriaLabel,
  onVisibilityChange,
  expanded,
  onExpandedChange,
  trailingSlot,
}: SidebarPaneHeaderProps) {
  return (
    <header className="sidebar-replacement-pane__header-bar">
      <span className="sidebar-replacement-pane__title-wrap">
        <span className="sidebar-replacement-pane__title">{title}</span>
      </span>
      <span className="sidebar-replacement-pane__main-slot">
        <SidebarToggle
          state={visibilityState}
          ariaLabel={visibilityAriaLabel}
          onChange={onVisibilityChange}
        />
      </span>
      <SidebarTrailingSlot
        slot={{
          kind: 'disclosure',
          ariaLabel: expanded ? `Collapse ${title}` : `Expand ${title}`,
          expanded,
          onToggle: () => onExpandedChange(!expanded),
        }}
        pane
      />
      {trailingSlot ? <SidebarTrailingSlot slot={trailingSlot} pane /> : null}
    </header>
  );
}
