// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SelectionPanelExact } from '../src/features/facilities/SelectionPanelExact';
import { useAppStore } from '../src/store/appStore';
import { renderExactPane } from './support/renderExactPane';

describe('SelectionPanelExact', () => {
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

  it('renders facilities and pmc on the exact shell', () => {
    renderExactPane(createElement(SelectionPanelExact), 'facilities');

    expect(screen.getByText('Facilities')).not.toBeNull();
    expect(screen.getByText('PMC')).not.toBeNull();
    expect(screen.getByText('North')).not.toBeNull();
    expect(screen.getByLabelText('Search facilities')).not.toBeNull();

    expect(
      screen.getByText('PMC').closest(
        '.prototype-section-card, .sidebar-exact-section-card',
      ),
    ).not.toBeNull();
    expect(
      screen.getByText('North').closest(
        '.prototype-region-row, .sidebar-exact-region-row',
      ),
    ).not.toBeNull();

    const facilitiesPane = screen
      .getByText('Facilities')
      .closest('.prototype-accordion-item--panel, .sidebar-exact-accordion-item--panel');
    expect(facilitiesPane).not.toBeNull();
    fireEvent.click(
      within(facilitiesPane as HTMLElement).getAllByRole('button', {
        name: 'On',
      })[0],
    );
    expect(useAppStore.getState().regions.every((region) => !region.visible)).toBe(
      true,
    );
  });
});
