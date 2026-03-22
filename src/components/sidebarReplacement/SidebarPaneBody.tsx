import type { ReactNode } from 'react';

interface SidebarPaneBodyProps {
  children: ReactNode;
}

export function SidebarPaneBody({ children }: SidebarPaneBodyProps) {
  return <div className="sidebar-replacement-pane__content">{children}</div>;
}
