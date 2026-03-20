import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { useAppStore } from '../../store/appStore';
import { buildLabelPanelRows } from './labelPanelFields';

export function LabelPanel() {
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

  return (
    <SidebarPanelShell title="Labels" className="panel--labels">
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
    </SidebarPanelShell>
  );
}
