import { useState } from 'react';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';

interface SidebarToggleProps {
  state: SidebarVisibilityState;
  ariaLabel: string;
  onChange: (visible: boolean) => void;
}

export function SidebarToggle({
  state,
  ariaLabel,
  onChange,
}: SidebarToggleProps) {
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);
  const enabled = state === 'on';
  const defaultLabel = state === 'mixed' ? 'Ox' : enabled ? 'On' : 'Off';
  const hoverLabel = enabled ? 'Off' : 'On';

  return (
    <button
      type="button"
      className={`sidebar-replacement-toggle sidebar-replacement-toggle--${state}${
        state === 'on' ? ' is-on' : state === 'off' ? ' is-off' : ' is-mixed'
      }`}
      data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
      aria-label={ariaLabel}
      aria-pressed={enabled}
      data-state={state}
      onClick={() => {
        setSuppressHoverPreview(true);
        onChange(!enabled);
      }}
      onMouseLeave={() => setSuppressHoverPreview(false)}
    >
      <span className="sidebar-replacement-toggle__label sidebar-replacement-toggle__label--default">
        {defaultLabel}
      </span>
      <span className="sidebar-replacement-toggle__label sidebar-replacement-toggle__label--hover">
        {hoverLabel}
      </span>
    </button>
  );
}
