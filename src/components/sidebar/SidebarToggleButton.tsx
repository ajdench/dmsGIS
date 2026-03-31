import { useState } from 'react';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';

interface SidebarToggleButtonProps {
  state: SidebarVisibilityState;
  ariaLabel: string;
  onChange: (visible: boolean) => void;
}

export function SidebarToggleButton({
  state,
  ariaLabel,
  onChange,
}: SidebarToggleButtonProps) {
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);
  const enabled = state === 'on';
  const defaultLabel = state === 'mixed' ? 'Ox' : enabled ? 'On' : 'Off';
  const hoverLabel = state === 'mixed' || !enabled ? 'On' : 'Off';

  return (
    <button
      type="button"
      className={`sidebar-toggle-button is-${state}`}
      data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
      data-hover-action={state === 'mixed' || !enabled ? 'on' : 'off'}
      onClick={() => {
        setSuppressHoverPreview(true);
        onChange(!enabled);
      }}
      onMouseLeave={() => setSuppressHoverPreview(false)}
      aria-label={ariaLabel}
      aria-pressed={enabled}
      data-state={state}
    >
      <span className="sidebar-toggle-button__label sidebar-toggle-button__label--default">
        {defaultLabel}
      </span>
      <span className="sidebar-toggle-button__label sidebar-toggle-button__label--hover">
        {hoverLabel}
      </span>
    </button>
  );
}
