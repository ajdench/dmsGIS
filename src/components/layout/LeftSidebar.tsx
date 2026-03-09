import { LayerPanel } from '../../features/layers/LayerPanel';
import { FacilitySearchPanel } from '../../features/facilities/FacilitySearchPanel';
import { BasemapPanel } from '../../features/basemap/BasemapPanel';

export function LeftSidebar() {
  return (
    <aside className="sidebar sidebar--left">
      <BasemapPanel />
      <LayerPanel />
      <FacilitySearchPanel />
    </aside>
  );
}
