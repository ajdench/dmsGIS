// @vitest-environment jsdom

import { DndContext } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { render } from '@testing-library/react';
import { createElement, type ReactElement } from 'react';
import { SidebarAccordion } from '../../src/components/sidebarExact/SidebarAccordion';

export function renderExactPane(element: ReactElement, id: string) {
  return render(
    createElement(
      DndContext,
      null,
      createElement(
        SortableContext,
        { items: [id], strategy: verticalListSortingStrategy },
        createElement(
          SidebarAccordion,
          { value: [id], onValueChange: () => {}, level: 'pane' },
          element,
        ),
      ),
    ),
  );
}
