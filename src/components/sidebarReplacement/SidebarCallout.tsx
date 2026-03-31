import type { CSSProperties, ReactNode } from 'react';

interface SidebarCalloutProps {
  open: boolean;
  children: ReactNode;
  style?: CSSProperties;
}

export function SidebarCallout({
  open,
  children,
  style,
}: SidebarCalloutProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="sidebar-replacement-callout sidebar-replacement-callout--floating"
      role="dialog"
      style={style}
    >
      <div className="sidebar-replacement-callout__content">
        {children}
      </div>
    </div>
  );
}
