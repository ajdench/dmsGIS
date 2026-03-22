// @vitest-environment jsdom

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExactFieldSections } from '../src/components/sidebarExact/ExactFields';

describe('ExactFieldSections', () => {
  it('renders prototype-style section dividers and svg shape controls', () => {
    render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Points',
              fields: [
                {
                  kind: 'shape',
                  label: 'Shape',
                  value: 'circle',
                  onChange: vi.fn(),
                },
              ],
            },
            {
              title: 'Border',
              fields: [
                {
                  kind: 'slider',
                  id: 'border-opacity',
                  label: 'Border opacity',
                  value: 0.5,
                  onChange: vi.fn(),
                },
              ],
            },
          ],
        }),
      ),
    );

    expect(document.querySelectorAll('.prototype-popover__divider')).toHaveLength(1);

    expect(screen.getByRole('group', { name: 'PMC Shape' })).not.toBeNull();

    const shapeButtons = screen.getAllByRole('button', {
      name: /circle|square|diamond|triangle/i,
    });
    expect(shapeButtons).toHaveLength(4);
    shapeButtons.forEach((button) => {
      const icon = button.querySelector('svg');
      expect(icon).not.toBeNull();
      expect(icon?.getAttribute('width')).toBeNull();
      expect(icon?.getAttribute('height')).toBeNull();
    });
  });
});
