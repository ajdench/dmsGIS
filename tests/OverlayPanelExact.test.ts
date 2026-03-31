// @vitest-environment jsdom

import { createElement } from 'react';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { OverlayPanelExact } from '../src/features/groups/OverlayPanelExact';
import { useAppStore } from '../src/store/appStore';
import { renderExactPane } from './support/renderExactPane';

describe('OverlayPanelExact', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3a',
      overlayLayers: [
        {
          id: 'englandIcb',
          name: '2026 NHS England ICBs',
          path: 'data/regions/UK_Health_Board_2026_topology_edges.geojson',
          family: 'englandIcb',
          visible: false,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0.35,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'devolvedHb',
          name: 'Devolved Administrations Health Boards',
          path: 'data/regions/UK_Health_Board_2026_topology_edges.geojson',
          family: 'devolvedHb',
          visible: false,
          opacity: 0,
          borderVisible: true,
          borderColor: '#8f8f8f',
          borderWidth: 1,
          borderOpacity: 0.35,
          swatchColor: '#8f8f8f',
        },
        {
          id: 'nhsEnglandRegionsBsc',
          name: 'NHS England Regions',
          path: 'data/regions/NHS_England_Regions_January_2024_EN_BSC.geojson',
          family: 'nhsRegions',
          visible: false,
          opacity: 0,
          borderVisible: false,
          borderColor: '#7d93ab',
          borderWidth: 1.25,
          borderOpacity: 0.7,
          swatchColor: '#7d93ab',
        },
        {
          id: 'sjcJmcOutline',
          name: 'SJC JMC',
          path: 'data/regions/UK_JMC_Outline_arcs.geojson',
          family: 'customRegions',
          visible: false,
          opacity: 0,
          borderVisible: false,
          borderColor: '#6c8f3d',
          borderWidth: 1.25,
          borderOpacity: 0.7,
          swatchColor: '#6c8f3d',
        },
      ],
    }));
  });

  it('renders overlay sub-list items with the shared title typography classes', () => {
    renderExactPane(createElement(OverlayPanelExact), 'overlays');

    expect(screen.getByText(/2026\s+NHS England ICBs/).className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );
    expect(
      screen.getByText('Devolved Administrations Health Boards').className,
    ).toContain('sidebar-exact-accordion-item__title--row');
    const nhsRegionsTitle = screen.getByText(/NHS\s+England\s+Regions/);
    expect(nhsRegionsTitle.className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );
    expect(nhsRegionsTitle.className).toContain(
      'sidebar-exact-accordion-item__title--three-line-block',
    );
    const sjcJmcTitle = screen.getByText(/SJC\s+JMC\s+Regions/);
    expect(sjcJmcTitle.className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );
    expect(sjcJmcTitle.className).toContain(
      'sidebar-exact-accordion-item__title--three-line-block',
    );
  });

  it('shows the pane-level toggle as Ox when all visible overlay rows are Ox', () => {
    renderExactPane(createElement(OverlayPanelExact), 'overlays');

    const paneHeader = screen
      .getAllByText('Overlays')[0]
      .closest('.prototype-accordion-item--pane')
      ?.querySelector('.prototype-accordion-item__header-bar');

    expect(paneHeader).not.toBeNull();
    expect(
      within(paneHeader as HTMLElement).getByRole('button', {
        name: 'Mixed state; toggle all',
      }),
    ).toBeTruthy();
  });
});
