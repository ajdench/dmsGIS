import type { SidebarControlFieldDefinition } from '../../lib/sidebar/contracts';

interface SidebarFieldRendererProps {
  field: SidebarControlFieldDefinition;
}

export function SidebarFieldRenderer({ field }: SidebarFieldRendererProps) {
  return (
    <div className="sidebar-replacement-field">
      {'id' in field ? field.id : field.label}
    </div>
  );
}
