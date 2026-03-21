import type { SidebarVisibilityState } from './visibilityTree';
import type { FacilitySymbolShape } from '../../types';

export interface SidebarSwatchStop {
  color: string;
  opacity?: number;
}

export interface SidebarColorFieldDefinition {
  kind: 'color';
  id: string;
  label: string;
  value: string;
  opacityPreview?: number;
  mixedSwatches?: SidebarSwatchStop[];
  onChange: (value: string) => void;
}

export interface SidebarSliderFieldDefinition {
  kind: 'slider';
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'raw' | 'percent';
  onChange: (value: number) => void;
}

export interface SidebarToggleFieldDefinition {
  kind: 'toggle';
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface SidebarShapeFieldDefinition {
  kind: 'shape';
  label: string;
  value: FacilitySymbolShape;
  onChange: (value: FacilitySymbolShape) => void;
}

export type SidebarControlFieldDefinition =
  | SidebarColorFieldDefinition
  | SidebarSliderFieldDefinition
  | SidebarToggleFieldDefinition
  | SidebarShapeFieldDefinition;

export interface SidebarPopoverSectionDefinition {
  title: string;
  enabledState?: SidebarVisibilityState;
  onEnabledChange?: (enabled: boolean) => void;
  fields: SidebarControlFieldDefinition[];
}

export interface SidebarVisibilityController {
  state: SidebarVisibilityState;
  onChange: (visible: boolean) => void;
}

export interface SidebarPillSwatchSummary {
  color: string;
  opacity?: number;
  mix?: SidebarSwatchStop[];
  shape?: FacilitySymbolShape;
  borderColor?: string;
  borderOpacity?: number;
  borderWidth?: number;
}

export interface SidebarPillSummary {
  valueLabel: string;
  ariaLabel: string;
  swatch?: SidebarPillSwatchSummary;
}

export type SidebarTrailingSlotDefinition =
  | {
      kind: 'dragHandle';
      label: string;
    }
  | {
      kind: 'disclosure';
      ariaLabel: string;
      expanded: boolean;
      onToggle: () => void;
    };

export interface SidebarRowDefinition<TId extends string = string> {
  id: TId;
  label: string;
  visibility: SidebarVisibilityController;
  pill: SidebarPillSummary;
  sections: SidebarPopoverSectionDefinition[];
  trailingSlot?: SidebarTrailingSlotDefinition;
}

export interface SidebarPaneDefinition<
  TPaneId extends string = string,
  TRowId extends string = string,
> {
  id: TPaneId;
  title: string;
  visibility: SidebarVisibilityController;
  rows: SidebarRowDefinition<TRowId>[];
}
