import type { ReactNode } from 'react';
import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import { SidebarMetaControls } from './SidebarMetaControls';

interface SidebarControlRowProps {
  row: SidebarRowDefinition;
  children: ReactNode;
}

export function SidebarControlRow({
  row,
  children,
}: SidebarControlRowProps) {
  return (
    <section className="sidebar-section-card">
      <div className="sidebar-section-card__bar">
        <span className="sidebar-section-card__title-wrap">
          <span className="sidebar-section-card__title">{row.label}</span>
        </span>
        <SidebarMetaControls
          visibilityState={row.visibility.state}
          onVisibilityChange={row.visibility.onChange}
          visibilityAriaLabel={`${row.label} visible`}
          pill={row.pill}
          trailingSlot={row.trailingSlot}
        >
          {children}
        </SidebarMetaControls>
      </div>
    </section>
  );
}
