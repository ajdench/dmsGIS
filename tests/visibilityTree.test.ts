import { describe, expect, it } from 'vitest';
import {
  collectImmediateChildVisibility,
  deriveSidebarVisibilityState,
  deriveSidebarVisibilityStateFromChildren,
  isMixedSidebarVisibility,
  setImmediateChildVisibility,
  type SidebarVisibilityChild,
} from '../src/lib/sidebar/visibilityTree';

describe('visibilityTree', () => {
  it('derives on, off, and mixed from immediate child visibility', () => {
    expect(deriveSidebarVisibilityState([])).toBe('off');
    expect(deriveSidebarVisibilityState([true, true, true])).toBe('on');
    expect(deriveSidebarVisibilityState([false, false])).toBe('off');
    expect(deriveSidebarVisibilityState([true, false, true])).toBe('mixed');
  });

  it('derives visibility state from child records', () => {
    const children: SidebarVisibilityChild[] = [
      { id: 'a', visible: true },
      { id: 'b', visible: false },
    ];

    expect(deriveSidebarVisibilityStateFromChildren(children)).toBe('mixed');
  });

  it('broadcasts a parent visibility choice to immediate children only', () => {
    const children: SidebarVisibilityChild[] = [
      { id: 'a', visible: true },
      { id: 'b', visible: false },
    ];

    expect(setImmediateChildVisibility(children, true)).toEqual([
      { id: 'a', visible: true },
      { id: 'b', visible: true },
    ]);
    expect(setImmediateChildVisibility(children, false)).toEqual([
      { id: 'a', visible: false },
      { id: 'b', visible: false },
    ]);
  });

  it('supports collecting visibility through a caller-provided selector', () => {
    const rows = [
      { key: 'land', enabled: true },
      { key: 'sea', enabled: false },
    ];

    expect(collectImmediateChildVisibility(rows, (row) => row.enabled)).toBe(
      'mixed',
    );
  });

  it('exposes a helper for mixed-state checks', () => {
    expect(isMixedSidebarVisibility('mixed')).toBe(true);
    expect(isMixedSidebarVisibility('on')).toBe(false);
    expect(isMixedSidebarVisibility('off')).toBe(false);
  });
});
