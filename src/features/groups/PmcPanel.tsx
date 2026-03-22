import { useState } from 'react';
import { SidebarControlRow } from '../../components/sidebar/SidebarControlRow';
import { SidebarControlSections } from '../../components/sidebar/SidebarControlSections';
import { SidebarPanelShell } from '../../components/sidebar/SidebarPanelShell';
import { useAppStore } from '../../store/appStore';
import { buildPmcPanelDefinition } from './pmcPanelFields';

export function PmcPanel() {
  const [expanded, setExpanded] = useState(true);
  const regions = useAppStore((state) => state.regions);
  const regionGlobalOpacity = useAppStore((state) => state.regionGlobalOpacity);
  const facilitySymbolShape = useAppStore((state) => state.facilitySymbolShape);
  const facilitySymbolSize = useAppStore((state) => state.facilitySymbolSize);
  const setRegionVisibility = useAppStore((state) => state.setRegionVisibility);
  const setRegionColor = useAppStore((state) => state.setRegionColor);
  const setRegionOpacity = useAppStore((state) => state.setRegionOpacity);
  const setRegionBorderVisibility = useAppStore(
    (state) => state.setRegionBorderVisibility,
  );
  const setRegionBorderColor = useAppStore((state) => state.setRegionBorderColor);
  const setRegionBorderOpacity = useAppStore(
    (state) => state.setRegionBorderOpacity,
  );
  const setRegionBorderWidth = useAppStore(
    (state) => state.setRegionBorderWidth,
  );
  const setRegionShape = useAppStore((state) => state.setRegionShape);
  const setRegionSymbolSize = useAppStore((state) => state.setRegionSymbolSize);
  const setRegionGlobalOpacity = useAppStore(
    (state) => state.setRegionGlobalOpacity,
  );
  const setAllRegionVisibility = useAppStore((state) => state.setAllRegionVisibility);
  const setAllRegionColor = useAppStore((state) => state.setAllRegionColor);
  const setAllRegionBorderVisibility = useAppStore(
    (state) => state.setAllRegionBorderVisibility,
  );
  const setAllRegionBorderColor = useAppStore(
    (state) => state.setAllRegionBorderColor,
  );
  const setAllRegionBorderOpacity = useAppStore(
    (state) => state.setAllRegionBorderOpacity,
  );
  const setAllRegionBorderWidth = useAppStore(
    (state) => state.setAllRegionBorderWidth,
  );
  const setAllRegionShape = useAppStore((state) => state.setAllRegionShape);
  const copyFillToBorder = useAppStore((state) => state.copyFillToBorder);
  const copyRegionFillToBorder = useAppStore((state) => state.copyRegionFillToBorder);
  const setFacilitySymbolShape = useAppStore(
    (state) => state.setFacilitySymbolShape,
  );
  const setFacilitySymbolSize = useAppStore((state) => state.setFacilitySymbolSize);

  const pmc = buildPmcPanelDefinition({
    regions,
    facilitySymbolShape,
    facilitySymbolSize,
    regionGlobalOpacity,
    setRegionVisibility,
    setRegionColor,
    setRegionOpacity,
    setRegionBorderVisibility,
    setRegionBorderColor,
    setRegionBorderOpacity,
    setRegionBorderWidth,
    setRegionShape,
    setRegionSymbolSize,
    setRegionGlobalOpacity,
    setAllRegionVisibility,
    setAllRegionColor,
    setAllRegionBorderVisibility,
    setAllRegionBorderColor,
    setAllRegionBorderOpacity,
    setAllRegionBorderWidth,
    copyFillToBorder,
    copyRegionFillToBorder,
    setAllRegionShape,
    setFacilitySymbolShape,
    setFacilitySymbolSize,
  });

  return (
    <SidebarPanelShell
      title="PMC"
      level="subpane"
      className="panel--pmc"
      visibilityState={pmc.visibilityState}
      onVisibilityChange={setAllRegionVisibility}
      visibilityAriaLabel="PMC visible"
      pillSummary={pmc.pillSummary}
      pillContent={
        <SidebarControlSections
          sections={pmc.sections}
          ariaLabelPrefix="PMC"
        />
      }
      expanded={expanded}
      onExpandedChange={setExpanded}
      expandedAriaLabel={expanded ? 'Collapse PMC' : 'Expand PMC'}
    >
      {pmc.rows.length === 0 ? (
        <p className="muted">No regions loaded.</p>
      ) : (
        <div className="stack-col sidebar-section-list sidebar-section-list--nested">
          {pmc.rows.map((row) => (
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
