// @vitest-environment jsdom

import { createElement, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  PrototypeDragHandle,
  PrototypeInlineRowShell,
  PrototypePillPopover,
  PrototypeSectionCardShell,
} from '../src/prototypes/sidebarPrototype/PrototypeControls';

function InlineRowHarness({ onDragClick }: { onDragClick: () => void }) {
  const [open, setOpen] = useState(false);

  return createElement(PrototypeInlineRowShell, {
    label: 'North',
    enabled: true,
    onEnabledToggle: () => {},
    pillPopover: createElement(
      PrototypePillPopover,
      {
        open,
        onOpenChange: setOpen,
        value: '75%',
        swatch: '#ed5151',
      },
      createElement('div', null, 'Region editor'),
    ),
    trailingControl: createElement(PrototypeDragHandle, {
      label: 'North',
      onClick: onDragClick,
    }),
  });
}

function SectionCardHarness({ onDragClick }: { onDragClick: () => void }) {
  const [open, setOpen] = useState(false);

  return createElement(PrototypeSectionCardShell, {
    title: 'Land',
    enabled: true,
    onEnabledToggle: () => {},
    pillPopover: createElement(
      PrototypePillPopover,
      {
        open,
        onOpenChange: setOpen,
        value: '84%',
        swatch: '#ecf0e6',
      },
      createElement('div', null, 'Basemap editor'),
    ),
    trailingControl: createElement(PrototypeDragHandle, {
      label: 'Land',
      onClick: onDragClick,
    }),
    body: createElement('div', null, 'Section body'),
  });
}

describe('prototype control shells', () => {
  it('keeps inline-row toggle, pill, and drag handle interactions separate', () => {
    const onDragClick = vi.fn();

    render(createElement(InlineRowHarness, { onDragClick }));

    expect(screen.queryByText('Region editor')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'On' }));
    expect(screen.queryByText('Region editor')).toBeNull();
    expect(onDragClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /75%/i }));
    expect(screen.queryByText('Region editor')).not.toBeNull();
    expect(onDragClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /reorder north/i }));
    expect(onDragClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Region editor')).not.toBeNull();
  });

  it('keeps section-card pill and drag handle interactions separate', () => {
    const onDragClick = vi.fn();

    render(createElement(SectionCardHarness, { onDragClick }));

    expect(screen.queryByText('Basemap editor')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /84%/i }));
    expect(screen.queryByText('Basemap editor')).not.toBeNull();
    expect(onDragClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /reorder land/i }));
    expect(onDragClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Basemap editor')).not.toBeNull();
  });
});
