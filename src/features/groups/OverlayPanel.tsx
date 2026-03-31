import { useState } from 'react';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { useAppStore } from '../../store/appStore';
import {
  getOverlayPanelEmptyState,
  getOverlaySectionsForPanel,
} from './overlaySelectors';
import { buildOverlayPanelRows } from './overlayPanelFields';

export function OverlayPanel() {
  const [expanded, setExpanded] = useState(true);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const overlayLayers = useAppStore((state) => state.overlayLayers);
  const setOverlayLayerVisibility = useAppStore(
    (state) => state.setOverlayLayerVisibility,
  );
  const setOverlayLayerOpacity = useAppStore(
    (state) => state.setOverlayLayerOpacity,
  );
  const setOverlayLayerBorderVisibility = useAppStore(
    (state) => state.setOverlayLayerBorderVisibility,
  );
  const setOverlayLayerBorderColor = useAppStore(
    (state) => state.setOverlayLayerBorderColor,
  );
  const setOverlayLayerBorderOpacity = useAppStore(
    (state) => state.setOverlayLayerBorderOpacity,
  );

  const panelSections = getOverlaySectionsForPanel(overlayLayers, activeViewPreset);
  const rows = buildOverlayPanelRows({
    layers: panelSections.flatMap((section) => section.layers),
    setOverlayLayerVisibility,
    setOverlayLayerOpacity,
    setOverlayLayerBorderVisibility,
    setOverlayLayerBorderColor,
    setOverlayLayerBorderOpacity,
  });
  const emptyState = getOverlayPanelEmptyState(activeViewPreset, panelSections.length);
  const paneEnabled = rows.some((row) => row.visibility.state === 'on');

  return (
    <SidebarPanelShell
      title="Overlays"
      className="panel--regions"
      visibilityState={paneEnabled ? 'on' : 'off'}
      onVisibilityChange={(next) => {
        rows.forEach((row) => row.visibility.onChange(next));
      }}
      visibilityAriaLabel="Overlays visible"
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedAriaLabel={expanded ? 'Collapse Overlays' : 'Expand Overlays'}
      trailingSlot={{
        kind: 'dragHandle',
        label: 'Overlays',
      }}
    >
      {emptyState ? (
        <p className="muted">{emptyState}</p>
      ) : (
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
      )}
    </SidebarPanelShell>
  );
}
