import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { aggregateVisibilityStates } from '../../lib/sidebar/visibilityTree';
import {
  reorderItems,
  resolveItemOrder,
  synchronizeOrderedIds,
} from '../../lib/sidebar/reorderItems';
import { useAppStore } from '../../store/appStore';
import {
  getOverlayPanelEmptyState,
  getOverlaySectionsForPanel,
} from './overlaySelectors';
import { buildOverlayPanelRows } from './overlayPanelFields';
import {
  ExactFieldSections,
  ExactPillPopover,
} from '../../components/sidebarExact/SidebarControls';
import {
  SidebarSortablePane,
  SidebarSortableSectionCard,
} from '../../components/sidebarExact/SidebarSortable';
import {
  restrictToVerticalAxis,
  useSidebarDndSensors,
} from '../../components/sidebarExact/useSidebarDndSensors';

export function OverlayPanelExact() {
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const sensors = useSidebarDndSensors();

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
  const setOverlayLayerBorderWidth = useAppStore(
    (state) => state.setOverlayLayerBorderWidth,
  );
  const setOverlayLayerBorderOpacity = useAppStore(
    (state) => state.setOverlayLayerBorderOpacity,
  );

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const panelSections = getOverlaySectionsForPanel(overlayLayers, activeViewPreset);
  const rows = buildOverlayPanelRows({
    layers: panelSections.flatMap((section) => section.layers),
    setOverlayLayerVisibility,
    setOverlayLayerOpacity,
    setOverlayLayerBorderVisibility,
    setOverlayLayerBorderColor,
    setOverlayLayerBorderWidth,
    setOverlayLayerBorderOpacity,
  });
  const paneVisibilityState = aggregateVisibilityStates(
    rows.map((row) => row.visibility.state),
  );
  const emptyState = getOverlayPanelEmptyState(activeViewPreset, panelSections.length);
  const orderedRows = resolveItemOrder(rows, sectionOrder);

  useEffect(() => {
    setSectionOrder((current) => {
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

  const handleSectionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setSectionOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  return (
    <div ref={rootRef}>
      <SidebarSortablePane
        id="overlays"
        title="Overlays"
        enabled={paneVisibilityState !== 'off'}
        toggleState={paneVisibilityState}
        onEnabledToggle={() => {
          const next = paneVisibilityState !== 'on';
          rows.forEach((row) => row.visibility.onChange(next));
        }}
      >
        <div className="prototype-panel__content">
          {emptyState ? (
            <p className="muted">{emptyState}</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleSectionDragEnd}
            >
              <SortableContext
                items={orderedRows.map((row) => row.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="prototype-section-list">
                  {orderedRows.map((row) => (
                    <SidebarSortableSectionCard
                      key={row.id}
                      id={row.id}
                      title={row.label}
                      titleClassName={row.titleClassName}
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
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </SidebarSortablePane>
    </div>
  );
}
