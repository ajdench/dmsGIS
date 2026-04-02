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
    const { container } = render(createElement(ScenarioPlaygroundPane));

    expect(
      container.querySelector('.scenario-playground-panel .scenario-playground-panel__content'),
    ).toBeTruthy();
    expect(container.querySelector('.scenario-playground-pane__grid')).toBeTruthy();

    const subtitles = screen.getAllByText('Start state');
    expect(subtitles).toHaveLength(2);
    for (const subtitle of subtitles) {
      expect(subtitle.className).toContain('prototype-accordion-item__subtitle');
    }

    const presets = within(screen.getByLabelText('COA playground presets'));
    expect(presets.getByRole('button', { name: 'COA 3a' })).toBeTruthy();
    expect(presets.getByRole('button', { name: 'COA 3b' })).toBeTruthy();
  });
});
