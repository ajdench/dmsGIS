import type { ReactNode } from 'react';

interface SidebarPanelShellProps {
  title: string;
  children: ReactNode;
  meta?: ReactNode;
  className?: string;
}

export function SidebarPanelShell({
  title,
  children,
  meta,
  className,
}: SidebarPanelShellProps) {
  const hasContent =
    children !== null && children !== undefined && children !== false;

  return (
    <section className={`panel sidebar-panel-shell ${className ?? ''}`.trim()}>
      <div className="sidebar-panel-shell__header">
        <span className="sidebar-panel-shell__title-wrap">
          <h2 className="sidebar-panel-shell__title">{title}</h2>
        </span>
        {meta ? <span className="sidebar-panel-shell__meta">{meta}</span> : null}
      </div>
      {hasContent ? (
        <div className="sidebar-panel-shell__content">{children}</div>
      ) : null}
    </section>
  );
}
