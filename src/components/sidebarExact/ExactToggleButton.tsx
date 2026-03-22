import { useState } from 'react';
import type { ExactToggleButtonProps } from './types';

export function ExactToggleButton({
  enabled,
  state = enabled ? 'on' : 'off',
  onClick,
}: ExactToggleButtonProps) {
  const [suppressHoverPreview, setSuppressHoverPreview] = useState(false);
  const defaultLabel = state === 'mixed' ? 'Ox' : enabled ? 'On' : 'Off';
  const hoverLabel = enabled ? 'Off' : 'On';
  const ariaLabel =
    state === 'mixed' ? 'Mixed state; toggle all' : enabled ? 'On' : 'Off';

  return (
    <button
      type="button"
      className={`sidebar-exact-toggle sidebar-exact-toggle--${state}${
        state === 'on' ? ' is-on' : state === 'off' ? ' is-off' : ' is-mixed'
      }`}
      data-preview-disabled={suppressHoverPreview ? 'true' : 'false'}
      onClick={() => {
        setSuppressHoverPreview(true);
        onClick?.();
      }}
      onMouseLeave={() => setSuppressHoverPreview(false)}
      aria-label={ariaLabel}
    >
      <span className="sidebar-exact-toggle__label sidebar-exact-toggle__label--default">
        {defaultLabel}
      </span>
      <span className="sidebar-exact-toggle__label sidebar-exact-toggle__label--hover">
        {hoverLabel}
      </span>
    </button>
  );
}
