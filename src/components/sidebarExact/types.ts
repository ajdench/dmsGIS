import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import type {
  SidebarPillSummary,
  SidebarPopoverSectionDefinition,
} from '../../lib/sidebar/contracts';

export type ExactShape = 'circle' | 'square' | 'diamond' | 'triangle';
export type ExactToggleState = 'on' | 'off' | 'mixed';

export interface ExactSwatchStop {
  color: string;
  opacity?: number;
}

export interface ExactPillSwatch {
  color?: string;
  opacity?: number;
  mix?: ExactSwatchStop[];
  shape?: ExactShape;
  borderColor?: string;
  borderWidth?: number;
  borderOpacity?: number;
}

export interface ExactMetricPillProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value?: string;
  swatch?: ExactPillSwatch;
  summary?: SidebarPillSummary;
  debugCircleOverlay?: boolean;
  asButton?: boolean;
  ariaExpanded?: boolean;
  ariaHaspopup?: 'dialog';
}

export interface ExactToggleButtonProps {
  enabled: boolean;
  state?: ExactToggleState;
  onClick?: () => void;
}

export interface ExactPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  scrollContainer?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  viewportContainer?: HTMLElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
}

export interface ExactPillPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string;
  swatch?: ExactPillSwatch;
  summary?: SidebarPillSummary;
  debugCircleOverlay?: boolean;
  scrollContainer?: HTMLElement | null;
  portalContainer?: HTMLElement | null;
  viewportContainer?: HTMLElement | null;
  triangleMinRatio?: number;
  triangleMaxRatio?: number;
  children: ReactNode;
}

export interface ExactDragHandleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export interface ExactMetaControlsProps {
  enabled?: boolean;
  toggleState?: ExactToggleState;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
  reserveTrailingSlot?: boolean;
}

export interface ExactAccordionProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  children: ReactNode;
  level?: 'pane' | 'subpane';
}

export interface ExactAccordionItemProps {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeSwatch?: ExactPillSwatch;
  children: ReactNode;
  level?: 'pane' | 'subpane';
  panel?: boolean;
  enabled?: boolean;
  toggleState?: ExactToggleState;
  onEnabledToggle?: () => void;
  dragHandleProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  dragHandleRef?: (element: HTMLButtonElement | null) => void;
}

export interface ExactSectionCardShellProps {
  title: string;
  titleClassName?: string;
  titleVariant?: 'default' | 'row';
  enabled?: boolean;
  toggleState?: ExactToggleState;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  trailingControl?: ReactNode;
  reserveTrailingSlot?: boolean;
  body?: ReactNode;
  style?: CSSProperties;
  isDragging?: boolean;
}

export interface ExactInlineRowShellProps {
  label: string;
  labelClassName?: string;
  enabled: boolean;
  toggleState?: ExactToggleState;
  onEnabledToggle: () => void;
  pillPopover: ReactNode;
  trailingControl?: ReactNode;
  style?: CSSProperties;
  isDragging?: boolean;
}

export interface ExactControlFieldProps {
  label: string;
  children: ReactNode;
}

export interface ExactColorFieldProps {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  opacityPreview?: number;
  mixedSwatches?: ExactSwatchStop[];
  onChange?: (value: string) => void;
  onCopy?: () => void;
  copySwatches?: ExactSwatchStop[];
  copyLabel?: string;
  copyShowIcon?: boolean;
  copyIcon?: 'copy' | 'reset';
  copyTone?: 'default' | 'neutral';
}

export interface ExactSliderControlProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  mode?: 'raw' | 'percent';
  onReset?: () => void;
  resetPlacement?: 'left' | 'right';
  resetTone?: 'default' | 'neutral';
}

export interface ExactControlSectionProps {
  title: string;
  enabled?: boolean;
  toggleState?: ExactToggleState;
  onToggle?: () => void;
  children: ReactNode;
}

export interface ExactFieldSectionsProps {
  sections: SidebarPopoverSectionDefinition[];
  ariaLabelPrefix: string;
}
