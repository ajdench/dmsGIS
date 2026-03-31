// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { BasemapPanelReplacement } from '../src/features/basemap/BasemapPanelReplacement';
import { useAppStore } from '../src/store/appStore';

describe('BasemapPanelReplacement', () => {
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
      },
    }));
  });

  it('renders Basemap on the replacement shell and keeps parent visibility tri-state', () => {
    render(createElement(BasemapPanelReplacement));

    expect(screen.getByLabelText('Basemap visible').textContent).toContain('Ox');
    expect(screen.getByText('Basemap')).not.toBeNull();
    expect(screen.getByText('Land')).not.toBeNull();
    expect(screen.getByText('Sea')).not.toBeNull();

    fireEvent.click(screen.getByLabelText('Basemap visible'));
    expect(useAppStore.getState().basemap.showLandFill).toBe(true);
    expect(useAppStore.getState().basemap.showSeaFill).toBe(true);
  });
});
