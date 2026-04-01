// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TopBar } from '../src/components/layout/TopBar';
import { useAppStore } from '../src/store/appStore';

describe('TopBar', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    useAppStore.setState((state) => ({
      ...state,
      selection: {
        ...state.selection,
        boundaryName: null,
      },
      pointTooltipDisplay: {
        ...state.pointTooltipDisplay,
        facilityName: null,
        regionName: null,
        isCombinedPractice: false,
        combinedPracticeName: null,
        combinedPracticeMembers: [],
        facilityPar: null,
        practicePar: null,
        regionPar: null,
        baseportPar: null,
        totalPar: null,
        pageIndex: 0,
        pageCount: 0,
      },
    }));
  });

  it('shows Combined Practice in the default empty state', () => {
    render(createElement(TopBar));

    expect(screen.getByText('Combined Practice')).toBeTruthy();
    expect(screen.queryByText('Non-Combined Practice')).toBeNull();
  });

  it('shows Combined Medical Practice when the selected facility belongs to a combined practice', () => {
    useAppStore.setState((state) => ({
      ...state,
      pointTooltipDisplay: {
        ...state.pointTooltipDisplay,
        isCombinedPractice: true,
        combinedPracticeName: 'Portsmouth Combined Medical Practice',
        combinedPracticeMembers: [],
      },
    }));

    render(createElement(TopBar));

    expect(screen.getAllByText('Combined Medical Practice').length).toBeGreaterThan(
      0,
    );
  });

  it('shows the live top-bar preset as active when not in Playground mode', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3b',
      activeStandardViewPreset: 'current',
      activeScenarioWorkspaceId: null,
    }));

    render(createElement(TopBar));
    const presetRow = within(screen.getByLabelText('Map presets'));

    expect(
      presetRow.getByRole('button', { name: 'COA 3a' }).getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      presetRow.getByRole('button', { name: 'Current' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('clears all top-bar preset buttons when a Playground workspace is active', () => {
    useAppStore.setState((state) => ({
      ...state,
      activeViewPreset: 'coa3c',
      activeStandardViewPreset: 'current',
      activeScenarioWorkspaceId: 'dphcEstimateCoaPlayground',
    }));

    render(createElement(TopBar));
    const presetRow = within(screen.getByLabelText('Map presets'));

    expect(
      presetRow.getByRole('button', { name: 'Current' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      presetRow.getByRole('button', { name: 'SJC JMC' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      presetRow.getByRole('button', { name: 'COA 3a' }).getAttribute('aria-pressed'),
    ).toBe('false');
    expect(
      presetRow.getByRole('button', { name: 'COA 3b' }).getAttribute('aria-pressed'),
    ).toBe('false');
  });

  it('shows boundary-only PAR summary values when a board remains selected without a facility', () => {
    useAppStore.setState((state) => ({
      ...state,
      selection: {
        ...state.selection,
        boundaryName: 'NHS Hampshire and Isle of Wight Integrated Care Board',
      },
      pointTooltipDisplay: {
        ...state.pointTooltipDisplay,
        facilityName: null,
        regionName: 'Central & Wessex',
        facilityPar: null,
        practicePar: null,
        regionPar: '2,000',
        baseportPar: '40',
        totalPar: '2,040',
      },
    }));

    render(createElement(TopBar));

    expect(screen.getByText('ICB:')).toBeTruthy();
    expect(screen.getByText('Hampshire and Isle of Wight')).toBeTruthy();
    expect(screen.getByText('Central & Wessex')).toBeTruthy();
    expect(screen.getByText('2,000')).toBeTruthy();
    expect(screen.getByText('40')).toBeTruthy();
    expect(screen.getByText('2,040')).toBeTruthy();
  });
});
