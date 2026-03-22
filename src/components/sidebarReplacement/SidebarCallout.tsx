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
    <div className="sidebar-replacement-callout sidebar-replacement-callout--floating" role="dialog">
      <div className="sidebar-replacement-callout__content">
      {children}
      </div>
    </div>
  );
}
