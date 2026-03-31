// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LabelPanelExact } from '../src/features/labels/LabelPanelExact';
import { useAppStore } from '../src/store/appStore';
import { renderExactPane } from './support/renderExactPane';

describe('LabelPanelExact', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      basemap: {
        ...state.basemap,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 0.4,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 0.65,
        showMajorCities: true,
        regionLabelColor: '#334155',
        regionLabelOpacity: 0.5,
        showRegionLabels: false,
        networkLabelColor: '#475569',
        networkLabelOpacity: 0.55,
        showNetworkLabels: false,
        facilityLabelColor: '#111827',
        facilityLabelOpacity: 0.7,
        showFacilityLabels: true,
      },
    }));
  });

  it('renders labels on the exact shell and updates store-backed state', () => {
    renderExactPane(createElement(LabelPanelExact), 'labels');

    expect(screen.getByText('Countries')).not.toBeNull();
    expect(screen.getByText('Cities')).not.toBeNull();
    expect(screen.getByText('Regions')).not.toBeNull();
    expect(screen.getByText('Networks')).not.toBeNull();
    expect(screen.getByText('Facilities')).not.toBeNull();
    expect(screen.getByLabelText('Mixed state; toggle all').textContent).toContain(
      'Ox',
    );

    fireEvent.click(screen.getByLabelText('Countries controls'));
    fireEvent.change(screen.getAllByLabelText('Colour')[0], {
      target: { value: '#ffffff' },
    });
    expect(screen.getByText('Countries').className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );
    const countriesCard = screen
      .getByText('Countries')
      .closest('.prototype-section-card, .sidebar-exact-section-card');
    expect(countriesCard).not.toBeNull();
    fireEvent.click(within(countriesCard as HTMLElement).getByRole('button', { name: 'Off' }));

    expect(useAppStore.getState().basemap.countryLabelColor).toBe('#ffffff');
    expect(useAppStore.getState().basemap.showCountryLabels).toBe(true);
  });
});
