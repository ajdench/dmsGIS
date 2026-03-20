import { BasemapPanel } from '../../features/basemap/BasemapPanel';
import { SelectionPanel } from '../../features/facilities/SelectionPanel';
import { OverlayPanel } from '../../features/groups/OverlayPanel';
import { LabelPanel } from '../../features/labels/LabelPanel';
import { VIEW_PRESET_BUTTONS } from '../../lib/config/viewPresets';
import { useAppStore } from '../../store/appStore';
import type { ViewPresetId } from '../../types';
import { SidebarStatus } from './SidebarStatus';

export function RightSidebar() {
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activateViewPreset = useAppStore((state) => state.activateViewPreset);

  return (
    <aside className="sidebar sidebar--right">
      <SidebarStatus />
      <BasemapPanel />
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
      <SelectionPanel />
      <LabelPanel />
      <OverlayPanel />
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
