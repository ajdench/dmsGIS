import { ExactMetaControls } from './ExactMetaControls';
import type { ExactInlineRowShellProps, ExactSectionCardShellProps } from './types';

export function ExactSectionCardShell({
  title,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  reserveTrailingSlot = false,
  body,
  style,
  isDragging = false,
}: ExactSectionCardShellProps) {
  return (
    <section
      className={`sidebar-exact-section-card${isDragging ? ' is-dragging' : ''}`}
      style={style}
    >
      <div className="sidebar-exact-section-card__bar">
        <span className="sidebar-exact-accordion-item__title-wrap">
          <span className="sidebar-exact-accordion-item__title">{title}</span>
        </span>
        <ExactMetaControls
          enabled={enabled}
          toggleState={toggleState}
          onEnabledToggle={onEnabledToggle}
          pillPopover={pillPopover}
          trailingControl={trailingControl}
          reserveTrailingSlot={reserveTrailingSlot}
        />
      </div>
      {body ? <div className="sidebar-exact-section-card__body">{body}</div> : null}
    </section>
  );
}

export function ExactInlineRowShell({
  label,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  trailingControl,
  style,
  isDragging = false,
}: ExactInlineRowShellProps) {
  return (
    <div
      className={`sidebar-exact-region-row${isDragging ? ' is-dragging' : ''}`}
      style={style}
    >
      <span className="color-control__label color-control__label--region">{label}</span>
      <ExactMetaControls
        enabled={enabled}
        toggleState={toggleState}
        onEnabledToggle={onEnabledToggle}
        pillPopover={pillPopover}
        trailingControl={trailingControl}
      />
    </div>
  );
}
