interface SidebarDragHandleProps {
  label: string;
}

export function SidebarDragHandle({ label }: SidebarDragHandleProps) {
  return (
    <span
      className="sidebar-drag-handle"
      aria-label={`Reorder ${label}`}
      aria-hidden="true"
    >
      <span className="sidebar-drag-handle__dots">⋮⋮</span>
    </span>
  );
}
