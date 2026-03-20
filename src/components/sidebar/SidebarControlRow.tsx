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
}: SidebarControlRowProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="sidebar-inline-row">
      <span className="sidebar-inline-row__label">{label}</span>
      <span className="sidebar-inline-row__meta">
        <button
          type="button"
          className={`sidebar-toggle-button${enabled ? ' is-on' : ' is-off'}`}
          onClick={() => onEnabledChange(!enabled)}
          aria-label={`${label} visible`}
          aria-pressed={enabled}
        >
          {enabled ? 'On' : 'Off'}
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
      </span>
    </div>
  );
}
