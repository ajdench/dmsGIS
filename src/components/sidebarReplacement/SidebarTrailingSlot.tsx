import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';

interface SidebarTrailingSlotProps {
  slot?: SidebarTrailingSlotDefinition;
  pane?: boolean;
}

export function SidebarTrailingSlot({
  slot,
  pane = false,
}: SidebarTrailingSlotProps) {
  if (!slot) {
    return <span className="sidebar-replacement-trailing-slot" aria-hidden="true" />;
  }

  if (slot.kind === 'dragHandle') {
    return (
      <button
        type="button"
        className={`sidebar-replacement-drag-handle${
          pane ? ' sidebar-replacement-drag-handle--pane' : ''
        }`}
        aria-label={`Reorder ${slot.label}`}
      >
        <span className="sidebar-replacement-drag-handle__dots" aria-hidden="true">
          ⋮⋮
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`sidebar-replacement-disclosure-button${
        pane ? ' sidebar-replacement-disclosure-button--pane' : ''
      }`}
      aria-label={slot.ariaLabel}
      aria-expanded={slot.expanded}
      data-state={slot.expanded ? 'open' : 'closed'}
      onClick={slot.onToggle}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="sidebar-replacement-accordion-item__chevron"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}
