import { useState } from 'react';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { useAppStore } from '../../store/appStore';
import { PmcPanel } from '../groups/PmcPanel';

export function SelectionPanel() {
  const [expanded, setExpanded] = useState(true);
  const regions = useAppStore((state) => state.regions);
  const facilitySearchQuery = useAppStore(
    (state) => state.facilityFilters.searchQuery,
  );
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );
  const setAllRegionVisibility = useAppStore((state) => state.setAllRegionVisibility);

  const facilitiesVisibilityState = collectImmediateChildVisibility(
    regions,
    (child) => child.visible,
  );

  return (
    <SidebarPanelShell
      title="Facilities"
      className="panel--facilities"
      visibilityState={facilitiesVisibilityState}
      onVisibilityChange={setAllRegionVisibility}
      visibilityAriaLabel="Facilities visible"
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedAriaLabel={expanded ? 'Collapse Facilities' : 'Expand Facilities'}
      trailingSlot={{
        kind: 'dragHandle',
        label: 'Facilities',
      }}
    >
      <div className="stack-col sidebar-section-list">
        <PmcPanel />
      </div>
      <input
        className="input input--compact"
        type="text"
        placeholder="Search facilities..."
        aria-label="Search facilities"
        value={facilitySearchQuery}
        onChange={(event) => setFacilitySearchQuery(event.target.value)}
      />
    </SidebarPanelShell>
  );
}
