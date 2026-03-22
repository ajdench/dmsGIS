import { useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { buildPmcPanelDefinition } from '../groups/pmcPanelFields';
import {
  ExactDragHandle,
  ExactFieldSections,
  ExactInlineRowShell,
  ExactPillPopover,
  ExactSectionCardShell,
} from '../../components/sidebarExact/SidebarControls';
import {
  SidebarAccordion,
  SidebarAccordionItem,
  SidebarChevronDownIcon,
} from '../../components/sidebarExact/SidebarAccordion';

export function SelectionPanelExact() {
  const [openPanes, setOpenPanes] = useState(['facilities']);
  const [pmcExpanded, setPmcExpanded] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const regions = useAppStore((state) => state.regions);
  const facilitySearchQuery = useAppStore(
    (state) => state.facilityFilters.searchQuery,
  );
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );
  const setAllRegionVisibility = useAppStore((state) => state.setAllRegionVisibility);
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
  const setRegionSymbolSize = useAppStore((state) => state.setRegionSymbolSize);
  const setRegionGlobalOpacity = useAppStore(
    (state) => state.setRegionGlobalOpacity,
  );
  const setAllRegionBorderVisibility = useAppStore(
    (state) => state.setAllRegionBorderVisibility,
  );
  const setAllRegionBorderColor = useAppStore(
    (state) => state.setAllRegionBorderColor,
  );
  const setAllRegionBorderOpacity = useAppStore(
    (state) => state.setAllRegionBorderOpacity,
  );
  const setFacilitySymbolShape = useAppStore(
    (state) => state.setFacilitySymbolShape,
  );
  const setFacilitySymbolSize = useAppStore((state) => state.setFacilitySymbolSize);

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const facilitiesVisibilityState = collectImmediateChildVisibility(
    regions,
    (child) => child.visible,
  );
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
    setRegionSymbolSize,
    setRegionGlobalOpacity,
    setAllRegionVisibility,
    setAllRegionBorderVisibility,
    setAllRegionBorderColor,
    setAllRegionBorderOpacity,
    setFacilitySymbolShape,
    setFacilitySymbolSize,
  });

  return (
    <div ref={rootRef}>
      <SidebarAccordion value={openPanes} onValueChange={setOpenPanes} level="pane">
        <SidebarAccordionItem
          id="facilities"
          title="Facilities"
          level="pane"
          panel
          enabled={facilitiesVisibilityState !== 'off'}
          toggleState={facilitiesVisibilityState}
          onEnabledToggle={() =>
            setAllRegionVisibility(facilitiesVisibilityState !== 'on')
          }
        >
          <div className="prototype-panel__content">
            <div className="prototype-section-list">
              <ExactSectionCardShell
                title="PMC"
                enabled={pmc.visibilityState !== 'off'}
                toggleState={pmc.visibilityState}
                onEnabledToggle={() =>
                  setAllRegionVisibility(pmc.visibilityState !== 'on')
                }
                pillPopover={
                  <ExactPillPopover
                    open={openPopoverId === 'pmc'}
                    onOpenChange={(open) => setOpenPopoverId(open ? 'pmc' : null)}
                    summary={pmc.pillSummary}
                    scrollContainer={sidebarElement}
                    portalContainer={workspaceGridElement}
                    viewportContainer={sidebarElement}
                  >
                    <ExactFieldSections sections={pmc.sections} ariaLabelPrefix="PMC" />
                  </ExactPillPopover>
                }
                trailingControl={
                  <button
                    type="button"
                    className="prototype-disclosure-button"
                    onClick={() => setPmcExpanded((current) => !current)}
                    aria-expanded={pmcExpanded}
                    aria-label={pmcExpanded ? 'Collapse PMC' : 'Expand PMC'}
                    data-state={pmcExpanded ? 'open' : 'closed'}
                  >
                    <SidebarChevronDownIcon className="prototype-accordion-item__chevron" />
                  </button>
                }
                body={
                  pmcExpanded ? (
                    pmc.rows.length === 0 ? (
                      <p className="muted">No regions loaded.</p>
                    ) : (
                      <div className="prototype-region-list">
                        {pmc.rows.map((row) => (
                          <ExactInlineRowShell
                            key={row.id}
                            label={row.label}
                            enabled={row.visibility.state !== 'off'}
                            toggleState={row.visibility.state}
                            onEnabledToggle={() =>
                              row.visibility.onChange(row.visibility.state !== 'on')
                            }
                            pillPopover={
                              <ExactPillPopover
                                open={openPopoverId === row.id}
                                onOpenChange={(open) =>
                                  setOpenPopoverId(open ? row.id : null)
                                }
                                summary={row.pill}
                                scrollContainer={sidebarElement}
                                portalContainer={workspaceGridElement}
                                viewportContainer={sidebarElement}
                              >
                                <ExactFieldSections
                                  sections={row.sections}
                                  ariaLabelPrefix={row.label}
                                />
                              </ExactPillPopover>
                            }
                            trailingControl={<ExactDragHandle label={row.label} />}
                          />
                        ))}
                      </div>
                    )
                  ) : null
                }
              />
            </div>
            <input
              className="input input--compact"
              type="text"
              placeholder="Search facilities..."
              aria-label="Search facilities"
              value={facilitySearchQuery}
              onChange={(event) => setFacilitySearchQuery(event.target.value)}
            />
          </div>
        </SidebarAccordionItem>
      </SidebarAccordion>
    </div>
  );
}
