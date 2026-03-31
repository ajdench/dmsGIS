import { useState } from 'react';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { useAppStore } from '../../store/appStore';
import { buildBasemapPanelRows } from './basemapPanelFields';

export function BasemapPanel() {
  const [expanded, setExpanded] = useState(true);
  const basemap = useAppStore((state) => state.basemap);
  const setBasemapElementColor = useAppStore(
    (state) => state.setBasemapElementColor,
  );
  const setBasemapElementOpacity = useAppStore(
    (state) => state.setBasemapElementOpacity,
  );
  const setBasemapLayerVisibility = useAppStore(
    (state) => state.setBasemapLayerVisibility,
  );

  const rows = buildBasemapPanelRows({
    basemap,
    setBasemapElementColor,
    setBasemapElementOpacity,
    setBasemapLayerVisibility,
  });
  const paneVisibilityState = collectImmediateChildVisibility(
    rows,
    (row) => row.visibility.state === 'on',
  );

  return (
    <SidebarPanelShell
      title="Basemap"
      className="panel--basemap"
      visibilityState={paneVisibilityState}
      onVisibilityChange={(next) => {
        setBasemapLayerVisibility('showLandFill', next);
        setBasemapLayerVisibility('showSeaFill', next);
      }}
      visibilityAriaLabel="Basemap visible"
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedAriaLabel={expanded ? 'Collapse Basemap' : 'Expand Basemap'}
      trailingSlot={{
        kind: 'dragHandle',
        label: 'Basemap',
      }}
    >
      <div className="stack-col sidebar-section-list">
        {rows.map((row) => (
          <SidebarControlRow
            key={row.id}
            row={{
              ...row,
              trailingSlot: {
                kind: 'dragHandle',
                label: row.label,
              },
            }}
          >
            <SidebarControlSections
              sections={row.sections}
              ariaLabelPrefix={row.label}
            />
          </SidebarControlRow>
        ))}
      </div>
    </SidebarPanelShell>
  );
}
