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

  it('uses the shared white helper-icon treatment for reset colour buttons at full opacity', () => {
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
                  kind: 'color',
                  id: 'pmc-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 1,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 1 }],
                  copyLabel: 'Reset to default colours',
                  copyShowIcon: true,
                  copyIcon: 'reset',
                },
              ],
            },
          ],
        }),
      ),
    );

    const resetButton = screen.getByRole('button', {
      name: 'Reset to default colours',
    });
    const iconPath = resetButton.querySelector('svg path:last-of-type');

    expect(iconPath?.getAttribute('fill')).toBe('rgb(255, 255, 255)');
    expect(iconPath?.getAttribute('stroke')).toBe('rgb(255, 255, 255)');
  });

  it('keeps helper icons white through 45% opacity', () => {
    const { rerender } = render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'helper-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0.45,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0.45 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    let iconPath = screen
      .getByRole('button', { name: 'Copy fill colour to border' })
      .querySelector('svg path:last-of-type');

    expect(iconPath?.getAttribute('fill')).toBe('rgb(255, 255, 255)');

    rerender(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'helper-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0.4,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0.4 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    iconPath = screen
      .getByRole('button', { name: 'Copy fill colour to border' })
      .querySelector('svg path:last-of-type');

    expect(iconPath?.getAttribute('fill')).toBe('rgb(249, 249, 249)');
    expect(iconPath?.getAttribute('stroke')).toBe('rgb(249, 249, 249)');
  });

  it('keeps glyph-shaped underlay support off above the 45% threshold', () => {
    render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'mid-helper-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0.65,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0.65 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    const copyButtons = screen.getAllByRole('button', {
      name: 'Copy fill colour to border',
    });
    const copyButton = copyButtons.at(-1);
    expect(copyButton).toBeDefined();
    const underlayPath = copyButton.querySelector('svg path:first-of-type');

    expect(underlayPath?.getAttribute('fill')).toBe('rgba(15, 23, 42, 0)');
  });

  it('reaches the shared 0% glyph and underlay anchors below the threshold', () => {
    render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'pmc-border-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    const copyButtons = screen.getAllByRole('button', {
      name: 'Copy fill colour to border',
    });
    const copyButton = copyButtons.at(-1);
    expect(copyButton).toBeDefined();
    const iconPath = copyButton.querySelector('svg path:last-of-type');
    const underlayPath = copyButton.querySelector('svg path:first-of-type');

    expect(iconPath?.getAttribute('fill')).toBe('rgb(158, 158, 158)');
    expect(iconPath?.getAttribute('stroke')).toBe('rgb(158, 158, 158)');
    expect(underlayPath?.getAttribute('fill')).toBe('rgba(15, 23, 42, 0.28)');
  });

  it('adds an inner swatch border below about 10% opacity and ends on the 0% dark-grey anchor', () => {
    const { rerender, container } = render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'low-opacity-helper-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0.08,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0.08 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    let swatch = container.querySelector('.prototype-copy-fill-button__swatch') as HTMLElement | null;
    expect(swatch?.style.boxShadow).toBe('inset 0 0 0 1px rgba(229, 231, 235, 0.2)');

    rerender(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'PMC',
          sections: [
            {
              title: 'Border',
              fields: [
                {
                  kind: 'color',
                  id: 'zero-opacity-helper-colour',
                  label: 'Colour',
                  value: '#ffffff',
                  opacityPreview: 0,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#f8fafc', opacity: 0 }],
                  copyLabel: 'Copy fill colour to border',
                  copyShowIcon: true,
                  copyIcon: 'copy',
                },
              ],
            },
          ],
        }),
      ),
    );

    swatch = container.querySelectorAll('.prototype-copy-fill-button__swatch').item(
      container.querySelectorAll('.prototype-copy-fill-button__swatch').length - 1,
    ) as HTMLElement | null;
    expect(swatch?.style.boxShadow).toBe('inset 0 0 0 1px rgba(229, 231, 235, 1)');
  });

  it('renders neutral right-side slider reset helpers for Land/Sea-style controls', () => {
    render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'Basemap',
          sections: [
            {
              title: 'Layer',
              fields: [
                {
                  kind: 'slider',
                  id: 'land-opacity',
                  label: 'Opacity',
                  value: 0.72,
                  onChange: vi.fn(),
                  onReset: vi.fn(),
                  resetPlacement: 'right',
                  resetTone: 'neutral',
                },
              ],
            },
          ],
        }),
      ),
    );

    const resetButton = screen.getByRole('button', {
      name: 'Reset Opacity to default',
    });
    const wrapper = resetButton.parentElement;
    const swatch = resetButton.querySelector('.prototype-copy-fill-button__swatch') as HTMLElement | null;
    const iconPath = resetButton.querySelector('svg path:last-of-type');

    expect(wrapper?.className).toContain('prototype-slider-field__with-reset--right');
    expect(resetButton.className).toContain('prototype-copy-fill-button--neutral');
    expect(swatch?.style.boxShadow).toBe('inset 0 0 0 1px rgba(229, 231, 235, 1)');
    expect(iconPath?.getAttribute('fill')).toBe('rgb(209, 213, 219)');
  });

  it('keeps the neutral colour reset glyph treatment while still showing the default colour swatch at full opacity', () => {
    const { container } = render(
      createElement(
        'div',
        { className: 'prototype-popover__content' },
        createElement(ExactFieldSections, {
          ariaLabelPrefix: 'Basemap',
          sections: [
            {
              title: 'Layer',
              fields: [
                {
                  kind: 'color',
                  id: 'land-fill-colour',
                  label: 'Colour',
                  value: '#d9e7f5',
                  opacityPreview: 0.61,
                  onChange: vi.fn(),
                  onCopy: vi.fn(),
                  copySwatches: [{ color: '#ecf0e6', opacity: 1 }],
                  copyLabel: 'Reset to default colour',
                  copyShowIcon: true,
                  copyIcon: 'reset',
                  copyTone: 'neutral',
                },
              ],
            },
          ],
        }),
      ),
    );

    const resetButton = screen.getByRole('button', {
      name: 'Reset to default colour',
    });
    const swatch = container.querySelector('.prototype-copy-fill-button__swatch') as HTMLElement | null;
    const iconPath = resetButton.querySelector('svg path:last-of-type');

    expect(swatch?.style.background).toBe('rgb(236, 240, 230)');
    expect(swatch?.style.boxShadow).toBe('inset 0 0 0 1px rgba(229, 231, 235, 1)');
    expect(iconPath?.getAttribute('fill')).toBe('rgb(209, 213, 219)');
  });
});
