import { useState } from 'react';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import {
  SidebarMetaRail,
  SidebarPane,
  SidebarPillPopover,
  SidebarRow,
} from '../../components/sidebarReplacement';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { useAppStore } from '../../store/appStore';
import { buildBasemapPanelRows } from './basemapPanelFields';

export function BasemapPanelReplacement() {
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
    <SidebarPane
      title="Basemap"
      expanded={expanded}
      metaRail={
        <SidebarMetaRail
          visibilityState={paneVisibilityState}
          visibilityAriaLabel="Basemap visible"
          onVisibilityChange={(next) => {
            setBasemapLayerVisibility('showLandFill', next);
            setBasemapLayerVisibility('showSeaFill', next);
          }}
          trailingSlot={{
            kind: 'disclosure',
            ariaLabel: expanded ? 'Collapse Basemap' : 'Expand Basemap',
            expanded,
            onToggle: () => setExpanded((current) => !current),
          }}
        />
      }
    >
      <div className="stack-col sidebar-section-list">
        {rows.map((row) => (
          <SidebarRow
            key={row.id}
            label={row.label}
            visibilityState={row.visibility.state}
            visibilityAriaLabel={`${row.label} visible`}
            onVisibilityChange={row.visibility.onChange}
            pill={row.pill}
            pillSlot={
              <SidebarPillPopover summary={row.pill}>
                <SidebarControlSections
                  sections={row.sections}
                  ariaLabelPrefix={row.label}
                />
              </SidebarPillPopover>
            }
            trailingSlot={{
              kind: 'dragHandle',
              label: row.label,
            }}
          />
        ))}
      </div>
    </SidebarPane>
  );
}
