// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LabelPanelExact } from '../src/features/labels/LabelPanelExact';
import { useAppStore } from '../src/store/appStore';

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
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
    }));
  });

  it('renders labels on the exact shell and updates store-backed state', () => {
    render(createElement(LabelPanelExact));

    expect(screen.getByText('Countries')).not.toBeNull();
    expect(screen.getByText('Cities')).not.toBeNull();
    expect(screen.getByText('Sea labels')).not.toBeNull();
    expect(screen.getByLabelText('Mixed state; toggle all').textContent).toContain(
      'Ox',
    );

    fireEvent.click(screen.getByLabelText('Countries controls'));
    fireEvent.change(screen.getAllByLabelText('Colour')[0], {
      target: { value: '#ffffff' },
    });
    const countriesCard = screen
      .getByText('Countries')
      .closest('.prototype-section-card, .sidebar-exact-section-card');
    expect(countriesCard).not.toBeNull();
    fireEvent.click(within(countriesCard as HTMLElement).getByRole('button', { name: 'Off' }));

    expect(useAppStore.getState().basemap.countryLabelColor).toBe('#ffffff');
    expect(useAppStore.getState().basemap.showCountryLabels).toBe(true);
  });
});
