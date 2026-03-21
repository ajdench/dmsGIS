import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';
import { SidebarDragHandle } from './SidebarDragHandle';

interface SidebarTrailingSlotProps {
  slot: SidebarTrailingSlotDefinition;
}

export function SidebarTrailingSlot({ slot }: SidebarTrailingSlotProps) {
  if (slot.kind === 'dragHandle') {
    return <SidebarDragHandle label={slot.label} />;
  }

  return (
    <button
      type="button"
      className="sidebar-disclosure-button"
      onClick={slot.onToggle}
      aria-expanded={slot.expanded}
      aria-label={slot.ariaLabel}
    >
      <span
        className={`sidebar-chevron${slot.expanded ? ' is-open' : ''}`}
        aria-hidden="true"
      >
        ▾
      </span>
    </button>
  );
}
