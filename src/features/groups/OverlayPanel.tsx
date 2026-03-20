import { useState } from 'react';
import { SidebarDragHandle } from '../../components/sidebar/SidebarDragHandle';
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
  const paneEnabled = rows.some((row) => row.enabled);

  return (
    <SidebarPanelShell
      title="Overlays"
      className="panel--regions"
      meta={
        <>
          <button
            type="button"
            className={`sidebar-toggle-button${paneEnabled ? ' is-on' : ' is-off'}`}
            aria-label="Overlays visible"
            aria-pressed={paneEnabled}
            onClick={() => {
              const next = !paneEnabled;
              rows.forEach((row) => setOverlayLayerVisibility(row.id, next));
            }}
          >
            <span className="sidebar-toggle-button__label sidebar-toggle-button__label--default">
              {paneEnabled ? 'On' : 'Off'}
            </span>
            <span className="sidebar-toggle-button__label sidebar-toggle-button__label--hover">
              {paneEnabled ? 'Off' : 'On'}
            </span>
          </button>
          <button
            type="button"
            className="sidebar-disclosure-button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse Overlays' : 'Expand Overlays'}
          >
            <span
              className={`sidebar-chevron${expanded ? ' is-open' : ''}`}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        </>
      }
    >
      {expanded ? (
        emptyState ? (
          <p className="muted">{emptyState}</p>
        ) : (
          <div className="stack-col sidebar-section-list">
            {rows.map((row) => (
              <SidebarControlRow
                key={row.id}
                label={row.label}
                enabled={row.enabled}
                onEnabledChange={(enabled) =>
                  setOverlayLayerVisibility(row.id, enabled)
                }
                pillLabel={row.valueLabel}
                pillAriaLabel={`${row.label} controls`}
                swatchColor={row.swatchColor}
                swatchOpacity={row.swatchOpacity}
                trailingControl={<SidebarDragHandle label={row.label} />}
              >
                <SidebarControlSections
                  sections={row.sections}
                  ariaLabelPrefix={row.label}
                />
              </SidebarControlRow>
            ))}
          </div>
        )
      ) : null}
    </SidebarPanelShell>
  );
}
