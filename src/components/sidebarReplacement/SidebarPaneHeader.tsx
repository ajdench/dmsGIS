import type { ReactNode } from 'react';

interface SidebarPaneHeaderProps {
  title: string;
  metaRail: ReactNode;
}

export function SidebarPaneHeader({ title, metaRail }: SidebarPaneHeaderProps) {
  return (
    <header className="sidebar-replacement-pane__header">
      <div className="sidebar-replacement-pane__title">{title}</div>
      {metaRail}
    </header>
  );
}
