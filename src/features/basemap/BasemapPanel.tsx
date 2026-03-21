import { useState } from 'react';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { SidebarToggleButton } from '../../components/sidebar/SidebarToggleButton';
import { SidebarTrailingSlot } from '../../components/sidebar/SidebarTrailingSlot';
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
  const paneEnabled = rows.some((row) => row.visibility.state === 'on');

  return (
    <SidebarPanelShell
      title="Basemap"
      className="panel--basemap"
      meta={
        <>
          <SidebarToggleButton
            state={paneEnabled ? 'on' : 'off'}
            ariaLabel="Basemap visible"
            onChange={(next) => {
              setBasemapLayerVisibility('showLandFill', next);
              setBasemapLayerVisibility('showSeaFill', next);
            }}
          />
          <SidebarTrailingSlot
            slot={{
              kind: 'disclosure',
              ariaLabel: expanded ? 'Collapse Basemap' : 'Expand Basemap',
              expanded,
              onToggle: () => setExpanded((current) => !current),
            }}
          />
        </>
      }
    >
      {expanded ? (
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
      ) : null}
    </SidebarPanelShell>
  );
}
