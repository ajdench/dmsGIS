// @vitest-environment jsdom

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SidebarPane } from '../src/components/sidebarReplacement';

describe('SidebarPane replacement scaffold', () => {
  it('unmounts the body when collapsed while preserving the header rail', () => {
    render(
      createElement(
        SidebarPane,
        {
          title: 'Basemap',
          visibilityState: 'on',
          visibilityAriaLabel: 'Basemap visible',
          onVisibilityChange: vi.fn(),
          expanded: false,
          onExpandedChange: vi.fn(),
          trailingSlot: {
            kind: 'dragHandle',
            label: 'Basemap',
          },
        },
        createElement('div', null, 'hidden body'),
      ),
    );

    expect(screen.getByText('Basemap')).not.toBeNull();
    expect(screen.getByLabelText('Basemap visible')).not.toBeNull();
    expect(screen.queryByText('hidden body')).toBeNull();
  });
});
