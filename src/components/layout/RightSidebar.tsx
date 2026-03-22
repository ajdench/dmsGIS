import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { BasemapPanelExact } from '../../features/basemap/BasemapPanelExact';
import { SelectionPanelExact } from '../../features/facilities/SelectionPanelExact';
import { LabelPanelExact } from '../../features/labels/LabelPanelExact';
import { OverlayPanelExact } from '../../features/groups/OverlayPanelExact';
import { VIEW_PRESET_BUTTONS } from '../../lib/config/viewPresets';
import { reorderItems } from '../../lib/sidebar/reorderItems';
import { useAppStore } from '../../store/appStore';
import type { ViewPresetId } from '../../types';
import { SidebarAccordion } from '../sidebarExact/SidebarAccordion';
import {
  restrictToVerticalAxis,
  useSidebarDndSensors,
} from '../sidebarExact/useSidebarDndSensors';
import { SidebarStatus } from './SidebarStatus';

const DEFAULT_PANE_ORDER = ['basemap', 'facilities', 'labels', 'overlays'] as const;

export function RightSidebar() {
  const [openPanes, setOpenPanes] = useState<string[]>([...DEFAULT_PANE_ORDER]);
  const [paneOrder, setPaneOrder] = useState<string[]>([...DEFAULT_PANE_ORDER]);
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activateViewPreset = useAppStore((state) => state.activateViewPreset);
  const sensors = useSidebarDndSensors();

  const handlePaneDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    setPaneOrder((current) =>
      reorderItems(current, String(active.id), String(over.id)),
    );
  };

  return (
    <aside className="sidebar sidebar--right">
      <SidebarStatus />
      <div className="prototype-sidebar-presets">
        <div className="sidebar-action-row" aria-label="Map presets">
          {VIEW_PRESET_BUTTONS.map((preset) => (
            <PresetButton
              key={preset.id}
              id={preset.id}
              label={preset.label}
              activeViewPreset={activeViewPreset}
              activateViewPreset={activateViewPreset}
            />
          ))}
        </div>
        <button
          type="button"
          className="button sidebar-action-row__button sidebar-action-row__button--full"
        >
          <span className="sidebar-action-row__button-label">
            <span>DPHC Estimate COA</span>
            <em>Playground</em>
          </span>
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handlePaneDragEnd}
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

                if (paneId === 'labels') {
                  return <LabelPanelExact key={paneId} />;
                }

                return <OverlayPanelExact key={paneId} />;
              })}
            </div>
          </SidebarAccordion>
        </SortableContext>
      </DndContext>
    </aside>
  );
}

interface PresetButtonProps {
  id: ViewPresetId;
  label: string;
  activeViewPreset: ViewPresetId;
  activateViewPreset: (preset: ViewPresetId) => void;
}

function PresetButton({
  id,
  label,
  activeViewPreset,
  activateViewPreset,
}: PresetButtonProps) {
  return (
    <button
      type="button"
      className={`button sidebar-action-row__button${
        activeViewPreset === id ? ' sidebar-action-row__button--active' : ''
      }`}
      onClick={() => activateViewPreset(id)}
      aria-pressed={activeViewPreset === id}
    >
      {label}
    </button>
  );
}
