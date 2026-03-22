import type { ReactNode } from 'react';

interface SidebarPaneHeaderProps {
  title: string;
  metaRail: ReactNode;
}

export function SidebarPaneHeader({ title, metaRail }: SidebarPaneHeaderProps) {
  return (
    <header className="sidebar-replacement-pane__header-bar">
      <span className="sidebar-replacement-pane__title-wrap">
        <span className="sidebar-replacement-pane__title">{title}</span>
      </span>
      {metaRail}
    </header>
  );
}
