// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { TopBar } from '../src/components/layout/TopBar';
import { useAppStore } from '../src/store/appStore';

describe('TopBar', () => {
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
});
