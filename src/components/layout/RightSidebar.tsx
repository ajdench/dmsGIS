import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRef, useState } from 'react';
import { BasemapPanelExact } from '../../features/basemap/BasemapPanelExact';
import { SelectionPanelExact } from '../../features/facilities/SelectionPanelExact';
import { RegionsPanelExact } from '../../features/groups/RegionsPanelExact';
import { LabelPanelExact } from '../../features/labels/LabelPanelExact';
import { OverlayPanelExact } from '../../features/groups/OverlayPanelExact';
import {
  reorderItems,
} from '../../lib/sidebar/reorderItems';
import { SidebarAccordion } from '../sidebarExact/SidebarAccordion';
import {
  restrictToVerticalAxis,
  useSidebarDndSensors,
} from '../sidebarExact/useSidebarDndSensors';
import { SidebarStatus } from './SidebarStatus';

const DEFAULT_PANE_ORDER = ['basemap', 'facilities', 'regions', 'labels', 'overlays'] as const;

export function RightSidebar() {
  const [openPanes, setOpenPanes] = useState<string[]>([...DEFAULT_PANE_ORDER]);
  const [paneOrder, setPaneOrder] = useState<string[]>([...DEFAULT_PANE_ORDER]);
  const sensors = useSidebarDndSensors();

  // Track which pane was open before drag so we can restore on drop.
  const preDragOpenRef = useRef<string | null>(null);

  // When true, ALL panes collapse during drag (not just the dragged one).
  // Wired but not yet enabled — flip to true when ready.
  const collapseAllDuringDrag = true;

  // Snapshot of open panes before drag, for restoring after drop.
  const preDragOpenSnapshotRef = useRef<string[] | null>(null);

  const handlePaneDragStart = ({ active }: DragStartEvent) => {
    const draggedId = String(active.id);

    if (collapseAllDuringDrag) {
      // Collapse every pane; snapshot the full open set for restore.
      preDragOpenSnapshotRef.current = [...openPanes];
      preDragOpenRef.current = null;
      setOpenPanes([]);
    } else {
      // Collapse only the dragged pane if it was open.
      preDragOpenSnapshotRef.current = null;
      if (openPanes.includes(draggedId)) {
        preDragOpenRef.current = draggedId;
        setOpenPanes((prev) => prev.filter((id) => id !== draggedId));
      } else {
        preDragOpenRef.current = null;
      }
    }
  };

  const restoreDraggedPane = () => {
    if (preDragOpenSnapshotRef.current) {
      // Restore full snapshot (collapse-all mode).
      setOpenPanes(preDragOpenSnapshotRef.current);
      preDragOpenSnapshotRef.current = null;
    } else if (preDragOpenRef.current) {
      // Restore single dragged pane.
      setOpenPanes((prev) => [...prev, preDragOpenRef.current!]);
      preDragOpenRef.current = null;
    }
  };

  const handlePaneDragEnd = ({ active, over }: DragEndEvent) => {
    restoreDraggedPane();

    if (!over || active.id === over.id) {
      return;
    }

    setPaneOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  const handlePaneDragCancel = () => {
    restoreDraggedPane();
  };

  return (
    <aside className="sidebar sidebar--right">
      <div className="sidebar-scroll-frame">
        <SidebarStatus />
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handlePaneDragStart}
          onDragEnd={handlePaneDragEnd}
          onDragCancel={handlePaneDragCancel}
        >
          <SortableContext items={paneOrder} strategy={verticalListSortingStrategy}>
            <SidebarAccordion value={openPanes} onValueChange={setOpenPanes} level="pane">
              <div className="sidebar-pane-stack">
                {paneOrder.map((paneId) => {
                  if (paneId === 'basemap') {
                    return <BasemapPanelExact key={paneId} />;
                  }

                  if (paneId === 'facilities') {
                    return <SelectionPanelExact key={paneId} />;
                  }

                  if (paneId === 'regions') {
                    return <RegionsPanelExact key={paneId} />;
                  }

                  if (paneId === 'labels') {
                    return <LabelPanelExact key={paneId} />;
                  }

                  return <OverlayPanelExact key={paneId} />;
                })}
              </div>
            </SidebarAccordion>
          </SortableContext>
        </DndContext>
      </div>
    </aside>
  );
}
