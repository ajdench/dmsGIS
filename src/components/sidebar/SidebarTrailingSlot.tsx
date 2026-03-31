import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import { SidebarDragHandle } from './SidebarDragHandle';

interface SidebarTrailingSlotProps {
  slot: SidebarTrailingSlotDefinition;
  pane?: boolean;
}

export function SidebarTrailingSlot({ slot, pane = false }: SidebarTrailingSlotProps) {
  if (slot.kind === 'dragHandle') {
    return (
      <SidebarDragHandle
        label={slot.label}
        className={pane ? 'sidebar-drag-handle--pane' : undefined}
      />
    );
  }

  return (
    <button
      type="button"
      className={`sidebar-disclosure-button${
        pane ? ' sidebar-disclosure-button--pane' : ''
      }`}
      onClick={slot.onToggle}
      aria-expanded={slot.expanded}
      aria-label={slot.ariaLabel}
      data-state={slot.expanded ? 'open' : 'closed'}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`sidebar-chevron${slot.expanded ? ' is-open' : ''}`}
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}
