// @vitest-environment jsdom

import { createElement } from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { DPHC_ESTIMATE_COA_PLAYGROUND_ID } from '../src/lib/config/scenarioWorkspaces';
import { RegionsPanelExact } from '../src/features/groups/RegionsPanelExact';
import { useAppStore } from '../src/store/appStore';
import { renderExactPane } from './support/renderExactPane';

describe('RegionsPanelExact', () => {
  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'current',
    }));
  });

  it('renders current regions in the shared PMC default order', () => {
    renderExactPane(createElement(RegionsPanelExact), 'regions');

    const scotland = screen.getByText('Scotland & Northern Ireland');
    const north = screen.getByText('North');
    const wales = screen.getByText('Wales & West Midlands');

    expect(scotland.className).toContain(
      'sidebar-exact-accordion-item__title--row',
    );
    expect(
      scotland.compareDocumentPosition(north) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      north.compareDocumentPosition(wales) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(wales.textContent).toContain('\u00A0');
  });

  it('uses prefix-free region labels and a Playground sub-pane title in Playground mode', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3c',
      activeScenarioWorkspaceId: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
    }));

    renderExactPane(createElement(RegionsPanelExact), 'regions');

    expect(screen.getAllByText('Playground')).toHaveLength(2);
    expect(screen.getAllByText('London and East').length).toBeGreaterThan(0);
    expect(screen.getAllByText('South East').length).toBeGreaterThan(0);
    expect(screen.queryByText('COA 3b London and East')).toBeNull();
  });
});
