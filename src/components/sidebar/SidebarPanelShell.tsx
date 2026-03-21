import type { ReactNode } from 'react';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarToggleButton } from './SidebarToggleButton';
import { SidebarTrailingSlot } from './SidebarTrailingSlot';

interface SidebarPanelShellProps {
  title: string;
  children: ReactNode;
  className?: string;
  visibilityState?: SidebarVisibilityState;
  onVisibilityChange?: (visible: boolean) => void;
  visibilityAriaLabel?: string;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  expandedAriaLabel?: string;
  meta?: ReactNode;
}

export function SidebarPanelShell({
  title,
  children,
  className,
  visibilityState,
  onVisibilityChange,
  visibilityAriaLabel,
  expanded = true,
  onExpandedChange,
  expandedAriaLabel,
  meta,
}: SidebarPanelShellProps) {
  const hasContent =
    children !== null && children !== undefined && children !== false;

  return (
    <section className={`panel sidebar-panel-shell ${className ?? ''}`.trim()}>
      <div className="sidebar-panel-shell__header">
        <span className="sidebar-panel-shell__title-wrap">
          <h2 className="sidebar-panel-shell__title">{title}</h2>
        </span>
        {visibilityState || onExpandedChange || meta ? (
          <span className="sidebar-panel-shell__meta">
            {visibilityState && onVisibilityChange && visibilityAriaLabel ? (
              <SidebarToggleButton
                state={visibilityState}
                ariaLabel={visibilityAriaLabel}
                onChange={onVisibilityChange}
              />
            ) : null}
            {onExpandedChange && expandedAriaLabel ? (
              <SidebarTrailingSlot
                slot={{
                  kind: 'disclosure',
                  ariaLabel: expandedAriaLabel,
                  expanded,
                  onToggle: () => onExpandedChange(!expanded),
                }}
              />
            ) : null}
            {meta}
          </span>
        ) : null}
      </div>
      {expanded && hasContent ? (
        <div className="sidebar-panel-shell__content">{children}</div>
      ) : null}
    </section>
  );
}
