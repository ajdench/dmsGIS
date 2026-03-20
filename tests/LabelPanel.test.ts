// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LabelPanel } from '../src/features/labels/LabelPanel';
import { useAppStore } from '../src/store/appStore';

describe('LabelPanel', () => {
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

  it('renders production label rows and updates store-backed state through the promoted controls', () => {
    render(createElement(LabelPanel));

    fireEvent.click(screen.getByLabelText('Countries controls'));
    fireEvent.change(screen.getByLabelText('Countries Colour'), {
      target: { value: '#ffffff' },
    });
    fireEvent.click(screen.getByLabelText('Countries visible'));

    expect(useAppStore.getState().basemap.countryLabelColor).toBe('#ffffff');
    expect(useAppStore.getState().basemap.showCountryLabels).toBe(true);
    expect(screen.getByText('Cities')).not.toBeNull();
    expect(screen.getByText('Sea labels')).not.toBeNull();
  });
});
