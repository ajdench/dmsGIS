import { BasemapPanel } from '../../features/basemap/BasemapPanel';
import { SelectionPanel } from '../../features/facilities/SelectionPanel';
import { GroupPanel } from '../../features/groups/GroupPanel';
import { LabelPanel } from '../../features/labels/LabelPanel';

export function RightSidebar() {
  return (
    <aside className="sidebar sidebar--right">
      <BasemapPanel />
      <SelectionPanel />
      <LabelPanel />
      <GroupPanel mode="regions" />
    </aside>
  );
}
