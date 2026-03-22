interface SidebarDragHandleProps {
  label: string;
  className?: string;
}

export function SidebarDragHandle({
  label,
  className,
}: SidebarDragHandleProps) {
  return (
    <span
      className={`sidebar-drag-handle${className ? ` ${className}` : ''}`}
      aria-label={`Reorder ${label}`}
      aria-hidden="true"
    >
      <span className="sidebar-drag-handle__dots">⋮⋮</span>
    </span>
  );
}
