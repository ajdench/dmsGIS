// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WorkspaceBottomLeftPane } from '../src/components/layout/WorkspaceBottomLeftPane';
import { PMC_REGION_ORDER } from '../src/lib/regions/regionOrder';
import { useAppStore } from '../src/store/appStore';

describe('WorkspaceBottomLeftPane', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'current',
      activeScenarioWorkspaceId: null,
      scenarioWorkspaceDrafts: {},
      facilityParRecords: [],
      regions: PMC_REGION_ORDER.map((name, index) => ({
        name,
        visible: true,
        color: `#${String(index + 1).repeat(6).slice(0, 6)}`,
        opacity: 0.35,
        shape: 'circle',
        borderVisible: true,
        borderColor: '#0f172a',
        borderWidth: 1,
        borderOpacity: 0.4,
        symbolSize: 3.5,
      })),
      pmcRegionParDisplayByName: Object.fromEntries(
        PMC_REGION_ORDER.map((name, index) => [name, `${index + 1},000`]),
      ),
      pmcTotalParDisplay: '45,000',
      presetRegionParByPreset: {
        coa3a: {
          'JMC Scotland': 1000,
          'JMC Northern Ireland': 2000,
          'JMC Wales': 3000,
          'JMC North': 4000,
          'JMC Centre': 5000,
          'JMC South West': 6000,
          'JMC South East': 7000,
          'London District': 8000,
          Overseas: 9000,
          'Royal Navy': 10000,
        },
      },
    }));
  });

  it('renders one title pill per PMC region plus a Total pill across 10 columns', () => {
    const { container } = render(createElement(WorkspaceBottomLeftPane));

    expect(container.querySelectorAll('.workspace-bottom-shell__title-card')).toHaveLength(
      10,
    );
    expect(
      container.querySelectorAll('.workspace-bottom-shell__title-card-swatch-row'),
    ).toHaveLength(10);
    expect(
      container.querySelectorAll('.workspace-bottom-shell__title-card-middle-pill .prototype-metric-pill'),
    ).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Regionalise' })).toBeTruthy();
    expect(
      container.querySelector(
        '.workspace-bottom-shell__title-card--total .prototype-metric-pill__swatch--circle',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Scotland & NI')).toBeTruthy();
    expect(screen.queryByText('Scotland & Northern Ireland')).toBeNull();
    expect(screen.getByText('North')).toBeTruthy();
    expect(screen.getByText('Royal Navy')).toBeTruthy();
    expect(screen.getByText('Total')).toBeTruthy();
    expect(screen.getByText('2,000')).toBeTruthy();
    expect(screen.getByText('9,000')).toBeTruthy();
    expect(screen.getByText('45,000')).toBeTruthy();
  });

  it('regionalises Royal Navy PAR into Current parent region cards when toggled', () => {
    useAppStore.setState((state) => ({
      ...state,
      facilityParRecords: [
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: '16',
          boundaryCode2026: null,
          parValue: '2191',
        },
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: 'E54000042',
          boundaryCode2026: null,
          parValue: '3451',
        },
      ],
    }));

    const { container } = render(createElement(WorkspaceBottomLeftPane));

    expect(screen.getByRole('button', { name: 'Regionalise' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Regionalise' }));

    expect(screen.getByRole('button', { name: 'Unregionalise' })).toBeTruthy();
    expect(screen.getByText('3,191')).toBeTruthy();
    expect(screen.getByText('10,451')).toBeTruthy();
    expect(
      container.querySelectorAll('.workspace-bottom-shell__title-card-middle-contribution'),
    ).toHaveLength(2);
    expect(screen.getByText('2,191')).toBeTruthy();
    expect(screen.getByText('3,451')).toBeTruthy();
    expect(
      container.querySelectorAll('.workspace-bottom-shell__column')[8]?.textContent,
    ).toContain('Royal NavyUnregionalise—');
  });

  it('renders SJC JMC cards from the scenario Regions pane grouping', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3a',
      facilityParRecords: [
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: null,
          boundaryCode2026: '10',
          parValue: '7000',
        },
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: null,
          boundaryCode2026: 'E54000048',
          parValue: '3000',
        },
      ],
    }));

    const { container } = render(createElement(WorkspaceBottomLeftPane));

    expect(container.querySelectorAll('.workspace-bottom-shell__title-card')).toHaveLength(9);
    expect(
      container.querySelectorAll('.workspace-bottom-shell__title-card-middle-pill .prototype-metric-pill'),
    ).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Regionalise' })).toBeTruthy();
    expect(screen.getByText('Devolved Admin...')).toBeTruthy();
    expect(screen.getByText('North')).toBeTruthy();
    expect(screen.getByText('Centre')).toBeTruthy();
    expect(screen.getByText('South West')).toBeTruthy();
    expect(screen.getByText('South East')).toBeTruthy();
    expect(screen.getByText('London District')).toBeTruthy();
    expect(screen.getByText('Overseas')).toBeTruthy();
    expect(screen.getByText('Royal Navy')).toBeTruthy();
    expect(screen.queryByText('JMC North')).toBeNull();
    expect(container.querySelectorAll('.workspace-bottom-shell__column')[6]?.textContent).toBe('');
    expect(
      container.querySelectorAll('.workspace-bottom-shell__column')[7]?.textContent,
    ).toContain('Overseas');
    expect(
      container.querySelectorAll('.workspace-bottom-shell__column')[8]?.textContent,
    ).toContain('Royal Navy');
    expect(
      container.querySelectorAll('.workspace-bottom-shell__column')[8]?.querySelector(
        '.workspace-bottom-shell__title-card-middle-pill .prototype-metric-pill',
      ),
    ).toBeTruthy();
    expect(screen.getByText('9,000')).toBeTruthy();
    expect(screen.getByText('10,000')).toBeTruthy();
    expect(screen.getAllByText('6,000')).toHaveLength(2);
    expect(screen.getByText('4,000')).toBeTruthy();
    expect(screen.getByText('8,000')).toBeTruthy();
    expect(screen.getByText('45,000')).toBeTruthy();
  });

  it('regionalises Royal Navy PAR into parent scenario cards when toggled', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3a',
      facilityParRecords: [
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: null,
          boundaryCode2026: '10',
          parValue: '7000',
        },
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: null,
          boundaryCode2026: 'E54000048',
          parValue: '3000',
        },
      ],
    }));

    const { container } = render(createElement(WorkspaceBottomLeftPane));

    fireEvent.click(screen.getByRole('button', { name: 'Regionalise' }));

    expect(screen.getByRole('button', { name: 'Unregionalise' })).toBeTruthy();
    expect(screen.getByText('13,000')).toBeTruthy();
    expect(
      container.querySelectorAll('.workspace-bottom-shell__title-card-middle-contribution'),
    ).toHaveLength(2);
    expect(screen.getByText('3,000')).toBeTruthy();
    expect(
      container.querySelectorAll(
        '.workspace-bottom-shell__title-card-middle-contribution-value',
      ),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('.workspace-bottom-shell__column')[8]?.textContent,
    ).toContain('Royal NavyUnregionalise—');
  });

  it('uses draft-aware PAR totals for the active playground workspace', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3c',
      activeScenarioWorkspaceId: 'dphcEstimateCoaPlayground',
      scenarioWorkspaceDrafts: {
        dphcEstimateCoaPlayground: {
          schemaVersion: 1,
          id: 'dphcEstimateCoaPlayground',
          label: 'DPHC Estimate COA Playground (COA 3b)',
          boundarySystemId: 'icbHb2026',
          baseWorkspaceId: 'dphcEstimateCoaPlayground',
          assignments: [
            {
              boundaryUnitId: 'E54000071',
              scenarioRegionId: 'coa3b_south_east',
            },
          ],
        },
      },
      facilityParRecords: [
        {
          regionName: 'North',
          legacyBoundaryCode: null,
          boundaryCode2026: 'E54000071',
          parValue: '100',
        },
        {
          regionName: 'Overseas',
          legacyBoundaryCode: null,
          boundaryCode2026: null,
          parValue: '25',
        },
        {
          regionName: 'Royal Navy',
          legacyBoundaryCode: null,
          boundaryCode2026: 'E54000037',
          parValue: '40',
        },
      ],
      pmcTotalParDisplay: '165',
      presetRegionParByPreset: {
        coa3c: {
          'COA 3b Devolved Administrations': 0,
          'COA 3b North': 0,
          'COA 3b Midlands': 0,
          'COA 3b South West': 0,
          'COA 3b South East': 0,
          'COA 3b London and East': 100,
          Overseas: 25,
          'Royal Navy': 40,
        },
      },
    }));

    render(createElement(WorkspaceBottomLeftPane));

    expect(screen.getByText('Devolved Admin...')).toBeTruthy();
    expect(screen.getByText('South East')).toBeTruthy();
    expect(screen.getByText('100')).toBeTruthy();
    expect(screen.queryByText('London and East')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
  });
});
