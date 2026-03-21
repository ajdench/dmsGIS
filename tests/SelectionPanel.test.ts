// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectionPanel } from '../src/features/facilities/SelectionPanel';
import { useAppStore } from '../src/store/appStore';

describe('SelectionPanel', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      facilitySymbolShape: 'circle',
      facilitySymbolSize: 3.5,
      regionGlobalOpacity: 0.55,
      facilityFilters: {
        ...state.facilityFilters,
        searchQuery: '',
      },
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#1d4ed8',
          opacity: 0.6,
          borderVisible: true,
          borderColor: '#0f172a',
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'South West',
          visible: false,
          color: '#16a34a',
          opacity: 0.5,
          borderVisible: false,
          borderColor: '#334155',
          borderOpacity: 0.2,
          symbolSize: 3.5,
        },
      ],
    }));
  });

  it('uses the shared production shell for facilities and pmc visibility hierarchy', () => {
    render(createElement(SelectionPanel));

    expect(screen.getByText('Facilities')).not.toBeNull();
    expect(screen.getByText('PMC')).not.toBeNull();

    expect(screen.getByLabelText('Facilities visible').textContent).toContain('Ox');
    expect(screen.getByLabelText('PMC visible').textContent).toContain('Ox');

    fireEvent.click(screen.getByLabelText('Facilities visible'));

    expect(useAppStore.getState().regions.every((region) => region.visible)).toBe(true);

    fireEvent.click(screen.getByLabelText('PMC controls'));
    fireEvent.click(screen.getByLabelText('PMC Border visible'));

    expect(
      useAppStore.getState().regions.every((region) => region.borderVisible),
    ).toBe(true);

    expect(screen.getByLabelText('Search facilities')).not.toBeNull();
  });
});
