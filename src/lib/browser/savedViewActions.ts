import { createNamedSavedView } from '../savedViews';
import {
  createBrowserSavedViewStore,
  type SavedViewStore,
} from '../services/savedViewStore';
import type { MapSessionState, NamedSavedView } from '../schemas/savedViews';
import type { AppNotice } from '../../store/appStore';

export interface SavedViewActionState {
  createMapSessionSnapshot(): MapSessionState;
  applyMapSessionState(session: MapSessionState): void;
  setNotice(notice: AppNotice | string | null): void;
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
    state.setNotice({
      message: 'Saved views are unavailable in this environment',
      tone: 'warning',
    });
    return null;
  }

  const trimmedName = name.trim();
  if (!trimmedName) {
    state.setNotice({
      message: 'Saved view name is required',
      tone: 'warning',
    });
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
  state.setNotice({
    message: `Saved view "${persisted.metadata.name}"`,
    tone: 'success',
  });
  return persisted;
}

export async function openSavedViewById(
  state: SavedViewActionState,
  id: string,
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<NamedSavedView | null> {
  if (!store) {
    state.setNotice({
      message: 'Saved views are unavailable in this environment',
      tone: 'warning',
    });
    return null;
  }

  const trimmedId = id.trim();
  if (!trimmedId) {
    state.setNotice({
      message: 'Saved view selection is required',
      tone: 'warning',
    });
    return null;
  }

  const view = await store.get(trimmedId);
  if (!view) {
    state.setNotice({
      message: `Saved view "${trimmedId}" was not found`,
      tone: 'warning',
    });
    return null;
  }

  state.applyMapSessionState(view.session);
  state.setNotice({
    message: `Opened saved view "${view.metadata.name}"`,
    tone: 'success',
  });
  return view;
}

export async function deleteSavedViewById(
  state: Pick<SavedViewActionState, 'setNotice'>,
  id: string,
  store: SavedViewStore | null = createBrowserSavedViewStore(),
): Promise<boolean> {
  if (!store) {
    state.setNotice({
      message: 'Saved views are unavailable in this environment',
      tone: 'warning',
    });
    return false;
  }

  const trimmedId = id.trim();
  if (!trimmedId) {
    state.setNotice({
      message: 'Saved view selection is required',
      tone: 'warning',
    });
    return false;
  }

  const existing = await store.get(trimmedId);
  if (!existing) {
    state.setNotice({
      message: `Saved view "${trimmedId}" was not found`,
      tone: 'warning',
    });
    return false;
  }

  await store.delete(trimmedId);
  state.setNotice({
    message: `Deleted saved view "${existing.metadata.name}"`,
    tone: 'success',
  });
  return true;
}
