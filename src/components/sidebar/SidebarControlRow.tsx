import { useState, type ReactNode } from 'react';
import { SidebarPopover } from './SidebarPopover';

interface SidebarControlRowProps {
  label: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  pillLabel: string;
  pillAriaLabel: string;
  swatchColor?: string;
  swatchOpacity?: number;
  children: ReactNode;
  trailingControl?: ReactNode;
}

export function SidebarControlRow({
  label,
  enabled,
  onEnabledChange,
  pillLabel,
  pillAriaLabel,
  swatchColor,
  swatchOpacity = 1,
  children,
  trailingControl,
}: SidebarControlRowProps) {
  const [open, setOpen] = useState(false);
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);

  return (
    <section className="sidebar-section-card">
      <div className="sidebar-section-card__bar">
        <span className="sidebar-section-card__title-wrap">
          <span className="sidebar-section-card__title">{label}</span>
        </span>
        <span className="sidebar-section-card__meta">
        <button
          type="button"
          className={`sidebar-toggle-button${enabled ? ' is-on' : ' is-off'}`}
          data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
          onClick={() => {
            setSuppressHoverPreview(true);
            onEnabledChange(!enabled);
          }}
          onMouseLeave={() => setSuppressHoverPreview(false)}
          aria-label={`${label} visible`}
          aria-pressed={enabled}
        >
          <span className="sidebar-toggle-button__label sidebar-toggle-button__label--default">
            {enabled ? 'On' : 'Off'}
          </span>
          <span className="sidebar-toggle-button__label sidebar-toggle-button__label--hover">
            {enabled ? 'Off' : 'On'}
          </span>
        </button>
        <SidebarPopover
          open={open}
          onOpenChange={setOpen}
          trigger={
            <button
              type="button"
              className="sidebar-metric-pill sidebar-metric-pill--button"
              aria-label={pillAriaLabel}
              aria-expanded={open}
              aria-haspopup="dialog"
            >
              {swatchColor ? (
                <span
                  className="sidebar-metric-pill__swatch"
                  style={{ backgroundColor: swatchColor, opacity: swatchOpacity }}
                  aria-hidden="true"
                />
              ) : null}
              <span className="sidebar-metric-pill__value">{pillLabel}</span>
            </button>
          }
        >
          {children}
        </SidebarPopover>
        {trailingControl}
        </span>
      </div>
    </section>
  );
}
