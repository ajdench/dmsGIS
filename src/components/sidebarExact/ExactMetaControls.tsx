import { ExactToggleButton } from './ExactToggleButton';
import type { ExactMetaControlsProps } from './types';

export function ExactMetaControls({
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  reserveTrailingSlot = false,
}: ExactMetaControlsProps) {
  return (
    <span className="sidebar-exact-accordion-item__meta">
      {typeof enabled === 'boolean' ? (
        <ExactToggleButton
          enabled={enabled}
          state={toggleState}
          onClick={onEnabledToggle}
        />
      ) : null}
      {pillPopover}
      {trailingControl}
      {reserveTrailingSlot ? (
        <span className="sidebar-exact-meta-spacer sidebar-exact-meta-spacer--drag" aria-hidden="true" />
      ) : null}
    </span>
  );
}
