// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ScenarioPlaygroundPane } from '../src/components/layout/ScenarioPlaygroundPane';

describe('ScenarioPlaygroundPane', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a start-state subtitle above each playground button', () => {
    render(createElement(ScenarioPlaygroundPane));

    expect(screen.getAllByText('Start state')).toHaveLength(2);

    const presets = within(screen.getByLabelText('COA playground presets'));
    expect(presets.getByRole('button', { name: 'COA 3a' })).toBeTruthy();
    expect(presets.getByRole('button', { name: 'COA 3b' })).toBeTruthy();
  });
});
