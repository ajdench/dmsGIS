import { arrayMove } from '@dnd-kit/sortable';

export function reorderItems<T extends string>(
  items: T[],
  activeId: T,
  overId: T,
) {
  if (activeId === overId) {
    return items;
  }

  const oldIndex = items.indexOf(activeId);
  const newIndex = items.indexOf(overId);

  if (oldIndex === -1 || newIndex === -1) {
    return items;
  }

  return arrayMove(items, oldIndex, newIndex);
}
