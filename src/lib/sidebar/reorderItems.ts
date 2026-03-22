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

export function resolveItemOrder<
  TItem extends { id: string },
  TId extends TItem['id'] = TItem['id'],
>(items: TItem[], orderedIds: readonly TId[]) {
  const itemMap = new Map(items.map((item) => [item.id, item] as const));
  const seen = new Set<TId>();
  const orderedItems: TItem[] = [];

  for (const id of orderedIds) {
    const item = itemMap.get(id);

    if (!item || seen.has(id)) {
      continue;
    }

    orderedItems.push(item);
    seen.add(id);
  }

  for (const item of items) {
    if (!seen.has(item.id as TId)) {
      orderedItems.push(item);
    }
  }

  return orderedItems;
}
