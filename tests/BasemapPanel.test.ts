// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { BasemapPanel } from '../src/features/basemap/BasemapPanel';
import { useAppStore } from '../src/store/appStore';

describe('BasemapPanel', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      basemap: {
        ...state.basemap,
        showLandFill: true,
        landFillColor: '#f4f7ef',
        landFillOpacity: 0.84,
        showSeaFill: false,
        seaFillColor: '#e7f0fd',
        seaFillOpacity: 0.78,
        showCountryBorders: true,
        showCountryLabels: false,
        showMajorCities: false,
        showSeaLabels: false,
      },
    }));
  });

  it('matches the prototype basemap contract with tri-state parent visibility and one Layer section per row', () => {
    render(createElement(BasemapPanel));

    expect(screen.getByLabelText('Basemap visible').textContent).toContain('Ox');

    fireEvent.click(screen.getByLabelText('Land controls'));

    expect(screen.getAllByText('Layer').length).toBeGreaterThan(0);
    expect(screen.queryByText('Borders')).toBeNull();
    expect(screen.queryByText('Major cities')).toBeNull();

    fireEvent.click(screen.getByLabelText('Land Layer visible'));
    expect(useAppStore.getState().basemap.showLandFill).toBe(false);

    fireEvent.click(screen.getByLabelText('Basemap visible'));
    expect(useAppStore.getState().basemap.showLandFill).toBe(true);
    expect(useAppStore.getState().basemap.showSeaFill).toBe(true);
  });
});
