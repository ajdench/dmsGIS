import type { ReactNode } from 'react';

interface SidebarCalloutProps {
  open: boolean;
  children: ReactNode;
}

export function SidebarCallout({ open, children }: SidebarCalloutProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="sidebar-replacement-callout" role="dialog">
      {children}
    </div>
  );
}
