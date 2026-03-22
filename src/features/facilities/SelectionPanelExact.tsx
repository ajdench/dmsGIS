import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { reorderItems, resolveItemOrder } from '../../lib/sidebar/reorderItems';
import { aggregateVisibilityStates } from '../../lib/sidebar/visibilityTree';
import { buildPmcPanelDefinition } from '../groups/pmcPanelFields';
import {
  ExactFieldSections,
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

export function SelectionPanelExact() {
  const [pmcExpanded, setPmcExpanded] = useState(true);
  const [regionOrder, setRegionOrder] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const sensors = useSidebarDndSensors();

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
    setAllRegionShape,
    setFacilitySymbolShape,
    setFacilitySymbolSize,
  });
  const facilitiesVisibilityState = aggregateVisibilityStates([pmc.visibilityState]);
  const orderedRows = resolveItemOrder(pmc.rows, regionOrder);

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
          <input
            className="input input--compact"
            type="text"
            placeholder="Search facilities..."
            aria-label="Search facilities"
            value={facilitySearchQuery}
            onChange={(event) => setFacilitySearchQuery(event.target.value)}
          />
        </div>
      </SidebarSortablePane>
    </div>
  );
}
