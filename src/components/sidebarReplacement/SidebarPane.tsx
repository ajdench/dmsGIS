import type { ReactNode } from 'react';
import { SidebarPaneBody } from './SidebarPaneBody';
import { SidebarPaneHeader } from './SidebarPaneHeader';

interface SidebarPaneProps {
  title: string;
  metaRail: ReactNode;
  expanded: boolean;
  children: ReactNode;
}

export function SidebarPane({
  title,
  metaRail,
  expanded,
  children,
}: SidebarPaneProps) {
  return (
    <section className="sidebar-replacement-pane">
      <SidebarPaneHeader title={title} metaRail={metaRail} />
      {expanded ? <SidebarPaneBody>{children}</SidebarPaneBody> : null}
    </section>
  );
}
