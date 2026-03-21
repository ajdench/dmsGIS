export type SidebarVisibilityState = 'on' | 'off' | 'mixed';

export interface SidebarVisibilityChild<TId extends string = string> {
  id: TId;
  visible: boolean;
}

export function deriveSidebarVisibilityState(
  childVisibility: readonly boolean[],
): SidebarVisibilityState {
  if (childVisibility.length === 0) {
    return 'off';
  }

  const allVisible = childVisibility.every(Boolean);
  if (allVisible) {
    return 'on';
  }

  const noneVisible = childVisibility.every((visible) => !visible);
  if (noneVisible) {
    return 'off';
  }

  return 'mixed';
}

export function deriveSidebarVisibilityStateFromChildren<
  TChild extends SidebarVisibilityChild,
>(children: readonly TChild[]): SidebarVisibilityState {
  return deriveSidebarVisibilityState(children.map((child) => child.visible));
}

export function setImmediateChildVisibility<
  TChild extends SidebarVisibilityChild,
>(
  children: readonly TChild[],
  nextVisible: boolean,
): TChild[] {
  return children.map((child) => ({
    ...child,
    visible: nextVisible,
  }));
}

export function collectImmediateChildVisibility<TChild>(
  children: readonly TChild[],
  isVisible: (child: TChild) => boolean,
): SidebarVisibilityState {
  return deriveSidebarVisibilityState(children.map(isVisible));
}

export function isMixedSidebarVisibility(
  state: SidebarVisibilityState,
): boolean {
  return state === 'mixed';
}
