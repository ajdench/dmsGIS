import { describe, expect, it } from 'vitest';
import { reorderItems } from '../src/prototypes/sidebarPrototype/sortableList';

describe('reorderItems', () => {
  it('moves an item to a new position', () => {
    expect(reorderItems(['a', 'b', 'c'], 'a', 'c')).toEqual(['b', 'c', 'a']);
  });

  it('moves an item upward in the list', () => {
    expect(reorderItems(['a', 'b', 'c', 'd'], 'd', 'b')).toEqual([
      'a',
      'd',
      'b',
      'c',
    ]);
  });

  it('preserves the relative order of unaffected items', () => {
    expect(reorderItems(['a', 'b', 'c', 'd', 'e'], 'b', 'e')).toEqual([
      'a',
      'c',
      'd',
      'e',
      'b',
    ]);
  });

  it('returns a new array when a real reorder happens', () => {
    const items = ['a', 'b', 'c'];
    expect(reorderItems(items, 'c', 'a')).not.toBe(items);
  });

  it('returns the same array when ids match', () => {
    const items = ['a', 'b', 'c'];
    expect(reorderItems(items, 'b', 'b')).toBe(items);
  });

  it('returns the same array when the active id is missing', () => {
    const items = ['a', 'b', 'c'];
    expect(reorderItems(items, 'x', 'b')).toBe(items);
  });

  it('returns the same array when the target id is missing', () => {
    const items = ['a', 'b', 'c'];
    expect(reorderItems(items, 'a', 'x')).toBe(items);
  });
});
