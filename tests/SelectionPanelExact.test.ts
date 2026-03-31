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
      combinedPracticeStyles: [
        {
          name: 'Portsmouth Combined Medical Practice',
          displayName: 'Portsmouth',
          visible: true,
          borderColor: '#0f766e',
          borderWidth: 1,
          borderOpacity: 1,
        },
        {
          name: 'Stonehouse Combined Medical Practice',
          displayName: 'Stonehouse',
          visible: true,
          borderColor: '#b45309',
          borderWidth: 1,
          borderOpacity: 1,
        },
      ],
      combinedPracticeCatalog: [
        {
          name: 'Portsmouth Combined Medical Practice',
          displayName: 'Portsmouth',
          regions: ['North'],
        },
        {
          name: 'Stonehouse Combined Medical Practice',
          displayName: 'Stonehouse',
          regions: ['South West'],
        },
      ],
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#1d4ed8',
          opacity: 0.6,
          shape: 'circle',
          borderVisible: true,
          borderColor: '#0f172a',
          borderWidth: 1,
          borderOpacity: 0.4,
          symbolSize: 3.5,
        },
        {
          name: 'South West',
          visible: false,
          color: '#16a34a',
          opacity: 0.5,
          shape: 'circle',
          borderVisible: false,
          borderColor: '#334155',
          borderWidth: 1,
          borderOpacity: 0.2,
          symbolSize: 3.5,
        },
      ],
    }));
  });

  it('hides combined-practice rows when their region is turned off', () => {
    renderExactPane(createElement(SelectionPanelExact), 'facilities');

    expect(screen.getByText('Portsmouth')).not.toBeNull();
    expect(screen.queryByText('Stonehouse')).toBeNull();
  });

  it('renders facilities and pmc on the exact shell', () => {
    renderExactPane(createElement(SelectionPanelExact), 'facilities');

    expect(screen.getAllByText('Facilities').length).toBeGreaterThan(0);
    const pmcTitles = screen.getAllByText('PMC');
    expect(pmcTitles.length).toBeGreaterThan(0);
    const northTitles = screen.getAllByText('North');
    expect(northTitles.length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText('Search facilities').length).toBeGreaterThan(0);

    expect(
      pmcTitles[0]?.closest(
        '.prototype-section-card, .sidebar-exact-section-card',
      ),
    ).not.toBeNull();
    expect(
      northTitles[0]?.closest(
        '.prototype-region-row, .sidebar-exact-region-row',
      ),
    ).not.toBeNull();
    expect(northTitles[0]?.className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );

    const facilitiesPane = screen
      .getAllByText('Facilities')[0]
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
