import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLayoutEffect, useRef, useState } from 'react';
import { reorderItems, resolveItemOrder } from '../../lib/sidebar/reorderItems';
import { useAppStore } from '../../store/appStore';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { buildBasemapPanelRows } from './basemapPanelFields';
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

export function BasemapPanelExact() {
  const [sectionOrder, setSectionOrder] = useState<Array<'land' | 'sea'>>([
    'land',
    'sea',
  ]);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);
  const [workspaceGridElement, setWorkspaceGridElement] =
    useState<HTMLElement | null>(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const sensors = useSidebarDndSensors();

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

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const rows = buildBasemapPanelRows({
    basemap,
    setBasemapElementColor,
    setBasemapElementOpacity,
    setBasemapLayerVisibility,
  });
  const paneVisibilityState = collectImmediateChildVisibility(
    rows,
    (row) => row.visibility.state === 'on',
  );
  const orderedRows = resolveItemOrder(rows, sectionOrder);

  const handleSectionDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setSectionOrder((current) =>
      reorderItems(
        current,
        String(active.id) as 'land' | 'sea',
        String(over.id) as 'land' | 'sea',
      ),
    );
  };

  return (
    <div ref={rootRef}>
      <SidebarSortablePane
        id="basemap"
        title="Basemap"
        enabled={paneVisibilityState !== 'off'}
        toggleState={paneVisibilityState}
        onEnabledToggle={() => {
          const next = paneVisibilityState !== 'on';
          setBasemapLayerVisibility('showLandFill', next);
          setBasemapLayerVisibility('showSeaFill', next);
        }}
      >
        <div className="prototype-panel__content">
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
        </div>
      </SidebarSortablePane>
    </div>
  );
}
