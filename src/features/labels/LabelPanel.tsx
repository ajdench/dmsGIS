import { useState } from 'react';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarToggleButton } from '../../components/sidebar/SidebarToggleButton';
import { SidebarTrailingSlot } from '../../components/sidebar/SidebarTrailingSlot';
import { useAppStore } from '../../store/appStore';
import { buildLabelPanelRows } from './labelPanelFields';

export function LabelPanel() {
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
  const setBasemapNumericValue = useAppStore(
    (state) => state.setBasemapNumericValue,
  );

  const rows = buildLabelPanelRows({
    basemap,
    setBasemapElementColor,
    setBasemapElementOpacity,
    setBasemapLayerVisibility,
    setBasemapNumericValue,
  });
  const paneEnabled = rows.some((row) => row.visibility.state === 'on');

  const setAllLabelsVisible = (enabled: boolean) => {
    setBasemapLayerVisibility('showCountryLabels', enabled);
    setBasemapLayerVisibility('showMajorCities', enabled);
    setBasemapLayerVisibility('showSeaLabels', enabled);
  };

  return (
    <SidebarPanelShell
      title="Labels"
      className="panel--labels"
      meta={
        <>
          <SidebarToggleButton
            state={paneEnabled ? 'on' : 'off'}
            ariaLabel="Labels visible"
            onChange={setAllLabelsVisible}
          />
          <SidebarTrailingSlot
            slot={{
              kind: 'disclosure',
              ariaLabel: expanded ? 'Collapse Labels' : 'Expand Labels',
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
