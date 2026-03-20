import { useState } from 'react';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
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
  const paneEnabled = rows.some((row) => row.enabled);

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
          <button
            type="button"
            className={`sidebar-toggle-button${paneEnabled ? ' is-on' : ' is-off'}`}
            aria-label="Labels visible"
            aria-pressed={paneEnabled}
            onClick={() => setAllLabelsVisible(!paneEnabled)}
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
            aria-label={expanded ? 'Collapse Labels' : 'Expand Labels'}
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
              enabled={row.enabled}
              onEnabledChange={row.onEnabledChange}
              pillLabel={row.valueLabel}
              pillAriaLabel={`${row.label} controls`}
              swatchColor={row.swatchColor}
              swatchOpacity={row.swatchOpacity}
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
