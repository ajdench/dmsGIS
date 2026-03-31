// @vitest-environment jsdom

import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SidebarMetricPill } from '../src/components/sidebarReplacement/SidebarMetricPill';

describe('SidebarMetricPill', () => {
  it('uses the prototype default border path for shape swatches when no explicit border props are provided', () => {
    const { container } = render(
      createElement(SidebarMetricPill, {
        summary: {
          valueLabel: '75%',
          ariaLabel: 'PMC controls',
          swatch: {
            color: '#ef4444',
            opacity: 0.75,
            shape: 'circle',
          },
        },
      }),
    );

    const swatch = container.querySelector('.sidebar-replacement-pill__swatch');
    const svg = container.querySelector('.sidebar-replacement-pill__swatch-svg');

    expect(swatch?.className).not.toContain('default-outline');
    expect(svg).not.toBeNull();
  });

  it('falls back to the prototype default-outline path when the swatch border is explicitly disabled', () => {
    const { container } = render(
      createElement(SidebarMetricPill, {
        summary: {
          valueLabel: '84%',
          ariaLabel: 'Land controls',
          swatch: {
            color: '#f4f7ef',
            opacity: 0.84,
            borderWidth: 0,
          },
        },
      }),
    );

    const swatch = container.querySelector('.sidebar-replacement-pill__swatch');

    expect(swatch?.className).toContain('default-outline');
  });

  it('renders mixed swatches through the mixed gradient path', () => {
    const { container } = render(
      createElement(SidebarMetricPill, {
        summary: {
          valueLabel: '100%',
          ariaLabel: 'Mixed facility controls',
          swatch: {
            color: '#ef4444',
            mix: [
              { color: '#ef4444', opacity: 0.8 },
              { color: '#3b82f6', opacity: 0.6 },
            ],
            shape: 'diamond',
          },
        },
      }),
    );

    const swatch = container.querySelector('.sidebar-replacement-pill__swatch--mixed');

    expect(swatch).not.toBeNull();
  });
});
