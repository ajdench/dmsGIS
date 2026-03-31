import type { ReactNode } from 'react';
import type {
  SidebarPillSummary,
  SidebarTrailingSlotDefinition,
} from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { SidebarPillPopover } from './SidebarPillPopover';
import { SidebarToggleButton } from './SidebarToggleButton';
import { SidebarTrailingSlot } from './SidebarTrailingSlot';

interface SidebarPanelShellProps {
  title: ReactNode;
  children: ReactNode;
  className?: string;
  level?: 'pane' | 'subpane';
  visibilityState?: SidebarVisibilityState;
  onVisibilityChange?: (visible: boolean) => void;
  visibilityAriaLabel?: string;
  pillSummary?: SidebarPillSummary;
  pillContent?: ReactNode;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  expandedAriaLabel?: string;
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export function SidebarPanelShell({
  title,
  children,
  className,
  level = 'pane',
  visibilityState,
  onVisibilityChange,
  visibilityAriaLabel,
  pillSummary,
  pillContent,
  expanded = true,
  onExpandedChange,
  expandedAriaLabel,
  trailingSlot,
}: SidebarPanelShellProps) {
  const hasContent =
    children !== null && children !== undefined && children !== false;
  const hasPrimaryControl =
    (visibilityState && onVisibilityChange && visibilityAriaLabel) ||
    (pillSummary && pillContent);

  return (
    <section
      className={`panel sidebar-panel-shell sidebar-panel-shell--${level} ${className ?? ''}`.trim()}
    >
      <div className="sidebar-panel-shell__header">
        <span className="sidebar-panel-shell__title-wrap">
          <h2 className="sidebar-panel-shell__title">{title}</h2>
        </span>
        {level === 'pane' ? (
          <>
            {hasPrimaryControl ? (
              <span className="sidebar-panel-shell__main-slot sidebar-panel-shell__main-slot--pane">
                {visibilityState && onVisibilityChange && visibilityAriaLabel ? (
                  <SidebarToggleButton
                    state={visibilityState}
                    ariaLabel={visibilityAriaLabel}
                    onChange={onVisibilityChange}
                  />
                ) : null}
                {pillSummary && pillContent ? (
                  <SidebarPillPopover summary={pillSummary}>
                    {pillContent}
                  </SidebarPillPopover>
                ) : null}
              </span>
            ) : null}
            {onExpandedChange && expandedAriaLabel ? (
              <SidebarTrailingSlot
                slot={{
                  kind: 'disclosure',
                  ariaLabel: expandedAriaLabel,
                  expanded,
                  onToggle: () => onExpandedChange(!expanded),
                }}
                pane
              />
            ) : null}
            {trailingSlot ? <SidebarTrailingSlot slot={trailingSlot} pane /> : null}
          </>
        ) : visibilityState || pillSummary || onExpandedChange || trailingSlot ? (
          <span className="sidebar-panel-shell__meta sidebar-panel-shell__meta--subpane">
            {hasPrimaryControl ? (
              <span className="sidebar-panel-shell__main-slot sidebar-panel-shell__main-slot--subpane">
                {visibilityState && onVisibilityChange && visibilityAriaLabel ? (
                  <SidebarToggleButton
                    state={visibilityState}
                    ariaLabel={visibilityAriaLabel}
                    onChange={onVisibilityChange}
                  />
                ) : null}
                {pillSummary && pillContent ? (
                  <SidebarPillPopover summary={pillSummary}>
                    {pillContent}
                  </SidebarPillPopover>
                ) : null}
              </span>
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
            {trailingSlot ? <SidebarTrailingSlot slot={trailingSlot} /> : null}
          </span>
        ) : null}
      </div>
      {expanded && hasContent ? (
        <div className="sidebar-panel-shell__content">{children}</div>
      ) : null}
    </section>
  );
}
