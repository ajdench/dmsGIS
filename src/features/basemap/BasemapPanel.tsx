import { useState } from 'react';
import { SidebarDragHandle } from '../../components/sidebar/SidebarDragHandle';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
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
          <button
            type="button"
            className={`sidebar-toggle-button${paneEnabled ? ' is-on' : ' is-off'}`}
            aria-label="Basemap visible"
            aria-pressed={paneEnabled}
            onClick={() => {
              const next = !paneEnabled;
              setBasemapLayerVisibility('showLandFill', next);
              setBasemapLayerVisibility('showSeaFill', next);
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
            aria-label={expanded ? 'Collapse Basemap' : 'Expand Basemap'}
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
        <div className="stack-col sidebar-section-list">
          {rows.map((row) => (
            <SidebarControlRow
              key={row.id}
              label={row.label}
              enabled={row.visibility.state === 'on'}
              onEnabledChange={row.visibility.onChange}
              pillLabel={row.pill.valueLabel}
              pillAriaLabel={row.pill.ariaLabel}
              swatchColor={row.pill.swatch?.color}
              swatchOpacity={row.pill.swatch?.opacity}
              trailingControl={<SidebarDragHandle label={row.label} />}
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
