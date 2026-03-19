import { createNamedSavedView } from '../savedViews';
import {
  createBrowserSavedViewStore,
  type SavedViewStore,
} from '../services/savedViewStore';
import type { MapSessionState, NamedSavedView } from '../schemas/savedViews';

export interface SavedViewActionState {
  createMapSessionSnapshot(): MapSessionState;
  applyMapSessionState(session: MapSessionState): void;
  setNotice(notice: string | null): void;
}

function getNowIsoString(): string {
  return new Date().toISOString();
}

function createSavedViewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `saved-view-${Date.now()}`;
}

export async function listSavedViews(
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<NamedSavedView[]> {
  if (!store) {
    return [];
  }

  return store.list();
}

export async function saveCurrentViewAs(
  state: SavedViewActionState,
  name: string,
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<NamedSavedView | null> {
  if (!store) {
    state.setNotice('Saved views are unavailable in this environment');
    return null;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    state.setNotice('Saved view name is required');
    return null;
  }

  const now = getNowIsoString();
  const session = state.createMapSessionSnapshot();
  const savedView = createNamedSavedView({
    metadata: {
      id: createSavedViewId(),
      name: trimmedName,
      description: '',
      createdAt: now,
      updatedAt: now,
    },
    session,
  });

  const persisted = await store.save(savedView);
  state.setNotice(`Saved view "${persisted.metadata.name}"`);
  return persisted;
}

export async function openSavedViewById(
  state: SavedViewActionState,
  id: string,
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<NamedSavedView | null> {
  if (!store) {
    state.setNotice('Saved views are unavailable in this environment');
    return null;
  }

  const trimmedId = id.trim();
  if (!trimmedId) {
    state.setNotice('Saved view selection is required');
    return null;
  }

  const view = await store.get(trimmedId);
  if (!view) {
    state.setNotice(`Saved view "${trimmedId}" was not found`);
    return null;
  }

  state.applyMapSessionState(view.session);
  state.setNotice(`Opened saved view "${view.metadata.name}"`);
  return view;
}

export async function deleteSavedViewById(
  state: Pick<SavedViewActionState, 'setNotice'>,
  id: string,
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<boolean> {
  if (!store) {
    state.setNotice('Saved views are unavailable in this environment');
    return false;
  }

  const trimmedId = id.trim();
  if (!trimmedId) {
    state.setNotice('Saved view selection is required');
    return false;
  }

  const existing = await store.get(trimmedId);
  if (!existing) {
    state.setNotice(`Saved view "${trimmedId}" was not found`);
    return false;
  }

  await store.delete(trimmedId);
  state.setNotice(`Deleted saved view "${existing.metadata.name}"`);
  return true;
}
