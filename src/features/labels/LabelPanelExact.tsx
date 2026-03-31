import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useLayoutEffect, useRef, useState } from 'react';
import { reorderItems, resolveItemOrder } from '../../lib/sidebar/reorderItems';
import { useAppStore } from '../../store/appStore';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
import { buildLabelPanelRows } from './labelPanelFields';
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

export function LabelPanelExact() {
  const [sectionOrder, setSectionOrder] = useState<
    Array<
      | 'country-labels'
      | 'major-cities'
      | 'region-labels'
      | 'network-labels'
      | 'facility-labels'
    >
  >([
    'country-labels',
    'major-cities',
    'region-labels',
    'network-labels',
    'facility-labels',
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
  const setBasemapNumericValue = useAppStore(
    (state) => state.setBasemapNumericValue,
  );

  useLayoutEffect(() => {
    const rootElement = rootRef.current;
    setSidebarElement(rootElement?.closest('.sidebar--right') as HTMLElement | null);
    setWorkspaceGridElement(
      rootElement?.closest('.workspace-grid') as HTMLElement | null,
    );
  }, []);

  const rows = buildLabelPanelRows({
    basemap,
    setBasemapElementColor,
    setBasemapElementOpacity,
    setBasemapLayerVisibility,
    setBasemapNumericValue,
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
        String(active.id) as
          | 'country-labels'
          | 'major-cities'
          | 'region-labels'
          | 'network-labels'
          | 'facility-labels',
        String(over.id) as
          | 'country-labels'
          | 'major-cities'
          | 'region-labels'
          | 'network-labels'
          | 'facility-labels',
      ),
    );
  };

  return (
    <div ref={rootRef}>
      <SidebarSortablePane
        id="labels"
        title="Labels"
        enabled={paneVisibilityState !== 'off'}
        toggleState={paneVisibilityState}
        onEnabledToggle={() => {
          const next = paneVisibilityState !== 'on';
          setBasemapLayerVisibility('showCountryLabels', next);
          setBasemapLayerVisibility('showMajorCities', next);
          setBasemapLayerVisibility('showRegionLabels', next);
          setBasemapLayerVisibility('showNetworkLabels', next);
          setBasemapLayerVisibility('showFacilityLabels', next);
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
