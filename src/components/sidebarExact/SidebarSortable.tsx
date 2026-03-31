import { useSortable } from '@dnd-kit/sortable';
import { CSS, type Transform } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';
import { SidebarAccordionItem } from './SidebarAccordion';
import {
  ExactDragHandle,
  ExactInlineRowShell,
  ExactSectionCardShell,
} from './SidebarControls';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';

interface SidebarSortablePaneProps {
  id: string;
  title: string;
  children: ReactNode;
  enabled?: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle?: () => void;
}

interface SidebarSortableSectionCardProps {
  id: string;
  title: string;
  titleClassName?: string;
  enabled?: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle?: () => void;
  pillPopover?: ReactNode;
  body?: ReactNode;
}

interface SidebarSortableInlineRowProps {
  id: string;
  label: string;
  enabled: boolean;
  toggleState?: SidebarVisibilityState;
  onEnabledToggle: () => void;
  pillPopover: ReactNode;
}

export function SidebarSortablePane({
  id,
  title,
  children,
  enabled,
  toggleState,
  onEnabledToggle,
}: SidebarSortablePaneProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  return (
    <div ref={setNodeRef} style={buildSortableStyle(transform, transition)}>
      <SidebarAccordionItem
        id={id}
        title={title}
        level="pane"
        panel
        enabled={enabled}
        toggleState={toggleState}
        onEnabledToggle={onEnabledToggle}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
      >
        {children}
      </SidebarAccordionItem>
    </div>
  );
}

export function SidebarSortableSectionCard({
  id,
  title,
  titleClassName,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
  body,
}: SidebarSortableSectionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div ref={setNodeRef} style={buildSortableStyle(transform, transition)}>
      <ExactSectionCardShell
        title={title}
        titleClassName={titleClassName}
        titleVariant="row"
        enabled={enabled}
        toggleState={toggleState}
        onEnabledToggle={onEnabledToggle}
        pillPopover={pillPopover}
        trailingControl={
          <ExactDragHandle
            ref={setActivatorNodeRef}
            label={title}
            {...attributes}
            {...listeners}
          />
        }
        body={body}
        isDragging={isDragging}
      />
    </div>
  );
}

export function SidebarSortableInlineRow({
  id,
  label,
  enabled,
  toggleState,
  onEnabledToggle,
  pillPopover,
}: SidebarSortableInlineRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div ref={setNodeRef} style={buildSortableStyle(transform, transition)}>
      <ExactInlineRowShell
        label={label}
        enabled={enabled}
        toggleState={toggleState}
        onEnabledToggle={onEnabledToggle}
        pillPopover={pillPopover}
        trailingControl={
          <ExactDragHandle
            ref={setActivatorNodeRef}
            label={label}
            {...attributes}
            {...listeners}
          />
        }
        isDragging={isDragging}
      />
    </div>
  );
}

function buildSortableStyle(
  transform: Transform | null,
  transition: string | undefined,
): CSSProperties {
  return {
    transform: transform
      ? CSS.Transform.toString({
          ...transform,
          scaleX: 1,
          scaleY: 1,
        })
      : undefined,
    transition,
  };
}
