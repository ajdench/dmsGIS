import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import {
  reorderItems,
  resolveItemOrder,
  synchronizeOrderedIds,
} from '../../lib/sidebar/reorderItems';
import { aggregateVisibilityStates } from '../../lib/sidebar/visibilityTree';
import { buildPmcPanelDefinition } from '../groups/pmcPanelFields';
import { buildCombinedPracticePanelDefinition } from '../groups/combinedPracticePanelFields';
import {
  ExactDragHandle,
  ExactFieldSections,
  ExactInlineRowShell,
  ExactPillPopover,
  ExactSectionCardShell,
} from '../../components/sidebarExact/SidebarControls';
import { SidebarChevronDownIcon } from '../../components/sidebarExact/SidebarAccordion';
import {
  SidebarSortableInlineRow,
  SidebarSortablePane,
} from '../../components/sidebarExact/SidebarSortable';
import {
  restrictToVerticalAxis,
  useSidebarDndSensors,
} from '../../components/sidebarExact/useSidebarDndSensors';
import { FacilitySearchField } from './FacilitySearchField';

export function SelectionPanelExact() {
  const [pmcExpanded, setPmcExpanded] = useState(true);
  const [combinedPracticesExpanded, setCombinedPracticesExpanded] = useState(true);
  const [regionOrder, setRegionOrder] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const pmcSectionRef = useRef<HTMLDivElement | null>(null);
  const combinedPracticesSectionRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [pmcBodyElement, setPmcBodyElement] = useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const sensors = useSidebarDndSensors();

  const regions = useAppStore((state) => state.regions);
  const currentViewPresetState = useAppStore(
    (state) => state.currentViewPresetState,
  );
  const combinedPracticeStyles = useAppStore(
    (state) => state.combinedPracticeStyles,
  );
  const combinedPracticeCatalog = useAppStore(
    (state) => state.combinedPracticeCatalog,
  );
  const facilitySearchQuery = useAppStore(
    (state) => state.facilityFilters.searchQuery,
  );
  const setFacilitySearchQuery = useAppStore(
    (state) => state.setFacilitySearchQuery,
  );
  const requestFacilitySelection = useAppStore(
    (state) => state.requestFacilitySelection,
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
  const setRegionBorderWidth = useAppStore(
    (state) => state.setRegionBorderWidth,
  );
  const setRegionShape = useAppStore((state) => state.setRegionShape);
  const setRegionSymbolSize = useAppStore((state) => state.setRegionSymbolSize);
  const setRegionGlobalOpacity = useAppStore(
    (state) => state.setRegionGlobalOpacity,
  );
  const setAllRegionBorderVisibility = useAppStore(
    (state) => state.setAllRegionBorderVisibility,
  );
  const setAllRegionColor = useAppStore((state) => state.setAllRegionColor);
  const resetAllRegionColorsToDefault = useAppStore(
    (state) => state.resetAllRegionColorsToDefault,
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
  const setFacilitySymbolSize = useAppStore((state) => state.setFacilitySymbolSize);
  const setCombinedPracticeBorderVisibility = useAppStore(
    (state) => state.setCombinedPracticeBorderVisibility,
  );
  const setCombinedPracticeBorderColor = useAppStore(
    (state) => state.setCombinedPracticeBorderColor,
  );
  const resetCombinedPracticeBorderColor = useAppStore(
    (state) => state.resetCombinedPracticeBorderColor,
  );
  const setCombinedPracticeBorderOpacity = useAppStore(
    (state) => state.setCombinedPracticeBorderOpacity,
  );
  const setCombinedPracticeBorderWidth = useAppStore(
    (state) => state.setCombinedPracticeBorderWidth,
  );
  const setAllCombinedPracticeBorderVisibility = useAppStore(
    (state) => state.setAllCombinedPracticeBorderVisibility,
  );
  const setAllCombinedPracticeBorderColor = useAppStore(
    (state) => state.setAllCombinedPracticeBorderColor,
  );
  const resetAllCombinedPracticeColorsToDefault = useAppStore(
    (state) => state.resetAllCombinedPracticeColorsToDefault,
  );
  const setAllCombinedPracticeBorderOpacity = useAppStore(
    (state) => state.setAllCombinedPracticeBorderOpacity,
  );
  const setAllCombinedPracticeBorderWidth = useAppStore(
    (state) => state.setAllCombinedPracticeBorderWidth,
  );
  const resetCombinedPracticeBorderOpacity = useAppStore(
    (state) => state.resetCombinedPracticeBorderOpacity,
  );
  const resetCombinedPracticeBorderWidth = useAppStore(
    (state) => state.resetCombinedPracticeBorderWidth,
  );
  const resetAllCombinedPracticeBorderOpacity = useAppStore(
    (state) => state.resetAllCombinedPracticeBorderOpacity,
  );
  const resetAllCombinedPracticeBorderWidth = useAppStore(
    (state) => state.resetAllCombinedPracticeBorderWidth,
  );
  const defaultRegionColors = Object.fromEntries(
    (currentViewPresetState?.regions ?? []).map((region) => [region.name, region.color]),
  );
  const defaultCombinedPracticeStyles = Object.fromEntries(
    (currentViewPresetState?.combinedPractices ?? []).map((practice) => [
      practice.name,
      practice,
    ]),
  );

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
    setPmcBodyElement(
      pmcSectionRef.current?.querySelector(
        '.prototype-section-card__body',
      ) as HTMLElement | null,
    );
  }, []);

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
    resetAllRegionColorsToDefault,
    setAllRegionBorderVisibility,
    setAllRegionBorderColor,
    setAllRegionBorderOpacity,
    setAllRegionBorderWidth,
    copyFillToBorder,
    copyRegionFillToBorder,
    setAllRegionShape,
    setFacilitySymbolSize,
    defaultRegionColors,
  });
  const combinedPractices = buildCombinedPracticePanelDefinition({
    combinedPractices: combinedPracticeStyles,
    combinedPracticeCatalog,
    visibleRegionNames: new Set(
      regions.filter((region) => region.visible).map((region) => region.name),
    ),
    defaultCombinedPracticeStyles,
    facilitySymbolShape,
    setCombinedPracticeBorderVisibility,
    setCombinedPracticeBorderColor,
    resetCombinedPracticeBorderColor,
    setCombinedPracticeBorderOpacity,
    setCombinedPracticeBorderWidth,
    setAllCombinedPracticeBorderVisibility,
    setAllCombinedPracticeBorderColor,
    resetAllCombinedPracticeColorsToDefault,
    setAllCombinedPracticeBorderOpacity,
    setAllCombinedPracticeBorderWidth,
    resetCombinedPracticeBorderOpacity,
    resetCombinedPracticeBorderWidth,
    resetAllCombinedPracticeBorderOpacity,
    resetAllCombinedPracticeBorderWidth,
  });
  const facilitiesVisibilityState = aggregateVisibilityStates([
    pmc.visibilityState,
    combinedPractices.visibilityState,
  ]);
  const orderedRows = resolveItemOrder(pmc.rows, regionOrder);

  useEffect(() => {
    setRegionOrder((current) => {
      const next = synchronizeOrderedIds(pmc.rows, current);
      if (
        current.length === next.length &&
        current.every((id, index) => id === next[index])
      ) {
        return current;
      }
      return next;
    });
  }, [pmc.rows]);

  const handleRegionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setRegionOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  return (
    <div ref={rootRef}>
      <SidebarSortablePane
        id="facilities"
        title="Facilities"
        enabled={facilitiesVisibilityState !== 'off'}
        toggleState={facilitiesVisibilityState}
        onEnabledToggle={() => {
          const nextVisible = facilitiesVisibilityState !== 'on';
          setAllRegionVisibility(nextVisible);
          setAllCombinedPracticeBorderVisibility(nextVisible);
        }}
      >
        <div className="prototype-panel__content">
          <div className="prototype-section-list">
            <div ref={pmcSectionRef}>
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
                    triangleMinRatio={0.15}
                    triangleMaxRatio={0.85}
                  >
                    <ExactFieldSections
                      sections={pmc.sections}
                      ariaLabelPrefix="PMC"
                    />
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
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        modifiers={[restrictToVerticalAxis]}
                        onDragEnd={handleRegionDragEnd}
                      >
                        <SortableContext
                          items={orderedRows.map((row) => row.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="stack-col prototype-region-list">
                            {orderedRows.map((row) => (
                              <SidebarSortableInlineRow
                                key={row.id}
                                id={row.id}
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
                                    triangleMinRatio={0.15}
                                    triangleMaxRatio={0.85}
                                  >
                                    <ExactFieldSections
                                      sections={row.sections}
                                      ariaLabelPrefix={row.label}
                                    />
                                  </ExactPillPopover>
                                }
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    )
                  ) : null
                }
              />
            </div>
            <FacilitySearchField
              value={facilitySearchQuery}
              onValueChange={setFacilitySearchQuery}
              onSuggestionSelect={(facility) => {
                if (facility.id) {
                  requestFacilitySelection(facility.id);
                }
              }}
              panelTopBoundaryElement={pmcExpanded ? pmcBodyElement : null}
            />
            <div ref={combinedPracticesSectionRef}>
              <ExactSectionCardShell
                title="Combined Practices"
                enabled={combinedPractices.visibilityState !== 'off'}
                toggleState={combinedPractices.visibilityState}
                onEnabledToggle={() =>
                  setAllCombinedPracticeBorderVisibility(
                    combinedPractices.visibilityState !== 'on',
                  )
                }
                pillPopover={
                  <ExactPillPopover
                    open={openPopoverId === 'combined-practices'}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? 'combined-practices' : null)
                    }
                    summary={combinedPractices.pillSummary}
                    scrollContainer={sidebarElement}
                    portalContainer={workspaceGridElement}
                    viewportContainer={sidebarElement}
                    triangleMinRatio={0.15}
                    triangleMaxRatio={0.85}
                  >
                    <ExactFieldSections
                      sections={combinedPractices.sections}
                      ariaLabelPrefix="Combined Practices"
                    />
                  </ExactPillPopover>
                }
                trailingControl={
                  <button
                    type="button"
                    className="prototype-disclosure-button"
                    onClick={() =>
                      setCombinedPracticesExpanded((current) => !current)
                    }
                    aria-expanded={combinedPracticesExpanded}
                    aria-label={
                      combinedPracticesExpanded
                        ? 'Collapse Combined Practices'
                        : 'Expand Combined Practices'
                    }
                    data-state={combinedPracticesExpanded ? 'open' : 'closed'}
                  >
                    <SidebarChevronDownIcon className="prototype-accordion-item__chevron" />
                  </button>
                }
                body={
                  combinedPracticesExpanded ? (
                    combinedPractices.rows.length === 0 ? (
                      <p className="muted">{combinedPractices.emptyMessage}</p>
                    ) : (
                      <div className="stack-col prototype-region-list">
                        {combinedPractices.rows.map((row) => (
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
                                triangleMinRatio={0.15}
                                triangleMaxRatio={0.85}
                              >
                                <ExactFieldSections
                                  sections={row.sections}
                                  ariaLabelPrefix={row.label}
                                />
                              </ExactPillPopover>
                            }
                            trailingControl={
                              <ExactDragHandle
                                label={row.label}
                                tabIndex={-1}
                                onClick={(event) => {
                                  event.preventDefault();
                                }}
                              />
                            }
                          />
                        ))}
                      </div>
                    )
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      </SidebarSortablePane>
    </div>
  );
}
