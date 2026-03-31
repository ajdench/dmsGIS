import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { isDphcEstimateCoaPlaygroundWorkspaceId } from '../../lib/config/scenarioWorkspaces';
import { getScenarioPresetConfig } from '../../lib/config/viewPresets';
import {
  reorderItems,
  resolveItemOrder,
  synchronizeOrderedIds,
} from '../../lib/sidebar/reorderItems';
import { aggregateVisibilityStates } from '../../lib/sidebar/visibilityTree';
import { sortItemsByPmcRegionOrder } from '../../lib/regions/regionOrder';
import {
  buildRegionsPanelRows,
  buildRegionsGlobalPillSections,
  buildRegionsGlobalPillSummary,
} from './regionsPanelFields';
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

/** Maps preset id → sub-pane label shown as the section card title. */
const SUBPANE_LABELS: Record<string, string> = {
  current: 'Current',
  coa3a: 'SJC JMC',
  coa3b: 'COA 3a',
  coa3c: 'COA 3b',
};

export function RegionsPanelExact() {
  const [groupsExpanded, setGroupsExpanded] = useState(true);
  const [groupOrder, setGroupOrder] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const sensors = useSidebarDndSensors();

  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activeScenarioWorkspaceId = useAppStore(
    (state) => state.activeScenarioWorkspaceId,
  );
  const regionGroupOverrides = useAppStore((state) => state.regionGroupOverrides);
  const setRegionGroupVisible = useAppStore((state) => state.setRegionGroupVisible);
  const setRegionGroupPopulatedFillVisible = useAppStore((state) => state.setRegionGroupPopulatedFillVisible);
  const setRegionGroupUnpopulatedFillVisible = useAppStore((state) => state.setRegionGroupUnpopulatedFillVisible);
  const setRegionGroupPopulatedFillColor = useAppStore((state) => state.setRegionGroupPopulatedFillColor);
  const setRegionGroupUnpopulatedFillColor = useAppStore((state) => state.setRegionGroupUnpopulatedFillColor);
  const setRegionGroupPopulatedOpacity = useAppStore((state) => state.setRegionGroupPopulatedOpacity);
  const setRegionGroupUnpopulatedOpacity = useAppStore((state) => state.setRegionGroupUnpopulatedOpacity);
  const setRegionGroupBorderVisible = useAppStore((state) => state.setRegionGroupBorderVisible);
  const setRegionGroupBorderColor = useAppStore((state) => state.setRegionGroupBorderColor);
  const setRegionGroupBorderOpacity = useAppStore((state) => state.setRegionGroupBorderOpacity);
  const setRegionGroupBorderWidth = useAppStore((state) => state.setRegionGroupBorderWidth);
  const setAllRegionGroupsPopulatedOpacity = useAppStore((state) => state.setAllRegionGroupsPopulatedOpacity);
  const setAllRegionGroupsUnpopulatedOpacity = useAppStore((state) => state.setAllRegionGroupsUnpopulatedOpacity);
  const setAllRegionGroupsBorderVisible = useAppStore((state) => state.setAllRegionGroupsBorderVisible);
  const setAllRegionGroupsBorderOpacity = useAppStore((state) => state.setAllRegionGroupsBorderOpacity);
  const setAllRegionGroupsBorderWidth = useAppStore((state) => state.setAllRegionGroupsBorderWidth);

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const presetConfig = getScenarioPresetConfig(activeViewPreset);
  const groups = sortItemsByPmcRegionOrder(presetConfig?.regionGroups ?? []);
  const subpaneLabel =
    isDphcEstimateCoaPlaygroundWorkspaceId(activeScenarioWorkspaceId)
      ? 'Playground'
      : (SUBPANE_LABELS[activeViewPreset] ?? activeViewPreset);

  const rows = buildRegionsPanelRows({
    groups,
    overrides: regionGroupOverrides,
    setVisible: setRegionGroupVisible,
    setPopulatedFillVisible: setRegionGroupPopulatedFillVisible,
    setUnpopulatedFillVisible: setRegionGroupUnpopulatedFillVisible,
    setPopulatedFillColor: setRegionGroupPopulatedFillColor,
    setUnpopulatedFillColor: setRegionGroupUnpopulatedFillColor,
    setPopulatedOpacity: setRegionGroupPopulatedOpacity,
    setUnpopulatedOpacity: setRegionGroupUnpopulatedOpacity,
    setBorderVisible: setRegionGroupBorderVisible,
    setBorderColor: setRegionGroupBorderColor,
    setBorderOpacity: setRegionGroupBorderOpacity,
    setBorderWidth: setRegionGroupBorderWidth,
  });

  const orderedRows = resolveItemOrder(rows, groupOrder);
  const groupVisibilityState = aggregateVisibilityStates(
    rows.map((row) => row.visibility.state),
  );

  useEffect(() => {
    setGroupOrder((current) => {
      const next = synchronizeOrderedIds(rows, current);
      if (
        current.length === next.length &&
        current.every((id, index) => id === next[index])
      ) {
        return current;
      }
      return next;
    });
  }, [rows]);

  const globalPillSummary = buildRegionsGlobalPillSummary(groups, regionGroupOverrides);
  const globalPillSections = buildRegionsGlobalPillSections({
    groups,
    overrides: regionGroupOverrides,
    setAllPopulatedOpacity: setAllRegionGroupsPopulatedOpacity,
    setAllUnpopulatedOpacity: setAllRegionGroupsUnpopulatedOpacity,
    setAllBorderVisible: setAllRegionGroupsBorderVisible,
    setAllBorderOpacity: setAllRegionGroupsBorderOpacity,
    setAllBorderWidth: setAllRegionGroupsBorderWidth,
  });

  const handleGroupDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setGroupOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  const handleToggleAll = () => {
    const next = groupVisibilityState !== 'on';
    rows.forEach((row) => row.visibility.onChange(next));
  };

  return (
    <div ref={rootRef}>
      <SidebarSortablePane
        id="regions"
        title="Regions"
        enabled={groupVisibilityState !== 'off'}
        toggleState={groupVisibilityState}
        onEnabledToggle={handleToggleAll}
      >
        <div className="prototype-panel__content">
          <div className="prototype-section-list">
            <ExactSectionCardShell
              title={subpaneLabel}
              enabled={groupVisibilityState !== 'off'}
              toggleState={groupVisibilityState}
              onEnabledToggle={handleToggleAll}
              pillPopover={
                groups.length > 0 ? (
                  <ExactPillPopover
                    open={openPopoverId === 'regions-global'}
                    onOpenChange={(open) =>
                      setOpenPopoverId(open ? 'regions-global' : null)
                    }
                    summary={globalPillSummary}
                    scrollContainer={sidebarElement}
                    portalContainer={workspaceGridElement}
                    viewportContainer={sidebarElement}
                    triangleMinRatio={0.15}
                    triangleMaxRatio={0.85}
                  >
                    <ExactFieldSections
                      sections={globalPillSections}
                      ariaLabelPrefix={subpaneLabel}
                    />
                  </ExactPillPopover>
                ) : undefined
              }
              trailingControl={
                <button
                  type="button"
                  className="prototype-disclosure-button"
                  onClick={() => setGroupsExpanded((current) => !current)}
                  aria-expanded={groupsExpanded}
                  aria-label={groupsExpanded ? `Collapse ${subpaneLabel}` : `Expand ${subpaneLabel}`}
                  data-state={groupsExpanded ? 'open' : 'closed'}
                >
                  <SidebarChevronDownIcon className="prototype-accordion-item__chevron" />
                </button>
              }
              body={
                groupsExpanded ? (
                  groups.length === 0 ? (
                    <p className="muted">No region groups for this preset</p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      modifiers={[restrictToVerticalAxis]}
                      onDragEnd={handleGroupDragEnd}
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
        </div>
      </SidebarSortablePane>
    </div>
  );
}
