// @vitest-environment jsdom

import { createElement } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { BasemapPanelExact } from '../src/features/basemap/BasemapPanelExact';
import { useAppStore } from '../src/store/appStore';
import { renderExactPane } from './support/renderExactPane';

describe('BasemapPanelExact', () => {
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

  it('renders Basemap on the exact shell and keeps parent visibility tri-state', () => {
    renderExactPane(createElement(BasemapPanelExact), 'basemap');

    expect(screen.getByText('Basemap')).not.toBeNull();
    expect(screen.getByText('Land')).not.toBeNull();
    expect(screen.getByText('Sea')).not.toBeNull();
    expect(screen.getByLabelText('Mixed state; toggle all').textContent).toContain(
      'Ox',
    );

    fireEvent.click(screen.getByLabelText('Mixed state; toggle all'));
    expect(useAppStore.getState().basemap.showLandFill).toBe(true);
    expect(useAppStore.getState().basemap.showSeaFill).toBe(true);
  });
});
