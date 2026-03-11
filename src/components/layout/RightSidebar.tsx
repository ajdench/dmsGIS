import { BasemapPanel } from '../../features/basemap/BasemapPanel';
import { SelectionPanel } from '../../features/facilities/SelectionPanel';
import { GroupPanel } from '../../features/groups/GroupPanel';
import { LabelPanel } from '../../features/labels/LabelPanel';
import { SidebarStatus } from './SidebarStatus';

export function RightSidebar() {
  return (
    <aside className="sidebar sidebar--right">
      <SidebarStatus />
      <BasemapPanel />
      <SelectionPanel />
      <LabelPanel />
      <GroupPanel mode="regions" />
    </aside>
  );
}
