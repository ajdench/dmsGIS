// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ScenarioAssignmentPopover } from '../src/features/map/ScenarioAssignmentPopover';

describe('ScenarioAssignmentPopover', () => {
  it('renders region options and dispatches reassignment clicks', () => {
    const onSelectRegion = vi.fn();
    const onClose = vi.fn();

    render(
      createElement(ScenarioAssignmentPopover, {
        boundaryName: 'NHS Essex Integrated Care Board',
        selectedRegionId: 'coa3b_london_east',
        onSelectRegion,
        onClose,
        regions: [
          {
            id: 'coa3b_london_east',
            label: 'COA 3b London and East',
            assignmentCode: 'COA3B_LONDON_EAST',
            sourceRegionNames: [],
            palette: {
              populated: '#f59e0b',
              unpopulated: '#fde68a',
              outline: '#b45309',
            },
            order: 0,
          },
          {
            id: 'coa3b_midlands',
            label: 'COA 3b Midlands',
            assignmentCode: 'COA3B_MIDLANDS',
            sourceRegionNames: [],
            palette: {
              populated: '#ef4444',
              unpopulated: '#fecaca',
              outline: '#b91c1c',
            },
            order: 1,
          },
        ],
      }),
    );

    expect(screen.getByRole('dialog')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: 'COA 3b Midlands' }),
    ).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'COA 3b Midlands' }));
    expect(onSelectRegion).toHaveBeenCalledWith('coa3b_midlands');

    fireEvent.click(screen.getByRole('button', { name: 'Off' }));
    expect(onClose).toHaveBeenCalled();
  });
});
