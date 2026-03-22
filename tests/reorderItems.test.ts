import { describe, expect, it } from 'vitest';
import {
  reorderItems,
  resolveItemOrder,
} from '../src/lib/sidebar/reorderItems';

describe('reorderItems', () => {
  it('moves the active item to the over item position', () => {
    expect(reorderItems(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']);
  });

  it('returns the original array when either id is missing', () => {
    const items = ['a', 'b', 'c'];

    expect(reorderItems(items, 'a', 'z' as 'a')).toBe(items);
  });
});

describe('resolveItemOrder', () => {
  it('applies the requested order and appends unknown items at the end', () => {
    expect(
      resolveItemOrder(
        [
          { id: 'a', label: 'Alpha' },
          { id: 'b', label: 'Beta' },
          { id: 'c', label: 'Gamma' },
        ],
        ['c', 'a'],
      ),
    ).toEqual([
      { id: 'c', label: 'Gamma' },
      { id: 'a', label: 'Alpha' },
      { id: 'b', label: 'Beta' },
    ]);
  });
});
