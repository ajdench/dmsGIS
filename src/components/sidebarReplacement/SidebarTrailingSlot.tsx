import type { SidebarTrailingSlotDefinition } from '../../lib/sidebar/contracts';

interface SidebarTrailingSlotProps {
  slot?: SidebarTrailingSlotDefinition;
}

export function SidebarTrailingSlot({ slot }: SidebarTrailingSlotProps) {
  if (!slot) {
    return <span className="sidebar-replacement-trailing-slot" aria-hidden="true" />;
  }

  if (slot.kind === 'dragHandle') {
    return (
      <button
        type="button"
        className="sidebar-replacement-trailing-slot sidebar-replacement-trailing-slot--drag"
        aria-label={`Reorder ${slot.label}`}
      >
        <span aria-hidden="true">⋮⋮</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="sidebar-replacement-trailing-slot sidebar-replacement-trailing-slot--disclosure"
      aria-label={slot.ariaLabel}
      aria-expanded={slot.expanded}
      onClick={slot.onToggle}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}
