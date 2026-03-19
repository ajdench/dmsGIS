import {
  createMapSessionState,
  createNamedSavedView,
} from '../savedViews';
import { createBrowserSavedViewStore } from '../services/savedViewStore';
import type { NamedSavedView } from '../schemas/savedViews';
import type { useAppStore } from '../../store/appStore';

type AppStoreState = ReturnType<typeof useAppStore.getState>;

function getNowIsoString(): string {
  return new Date().toISOString();
}

function createSavedViewId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `saved-view-${Date.now()}`;
}

export async function saveCurrentView(
  state: AppStoreState,
): Promise<NamedSavedView | null> {
  const store = createBrowserSavedViewStore();
  if (!store) {
    state.setNotice('Saved views are unavailable in this environment');
    return null;
  }

  const name = window.prompt('Save current map view as');
  if (name === null) {
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

export async function openSavedView(
  state: AppStoreState,
): Promise<NamedSavedView | null> {
  const store = createBrowserSavedViewStore();
  if (!store) {
    state.setNotice('Saved views are unavailable in this environment');
    return null;
  }

  const views = await store.list();
  if (views.length === 0) {
    state.setNotice('No saved views available');
    return null;
  }

  const selection = window.prompt(
    `Open saved view by id or exact name:\n${views
      .map((view) => `${view.metadata.id} - ${view.metadata.name}`)
      .join('\n')}`,
  );
  if (selection === null) {
    return null;
  }

  const trimmedSelection = selection.trim();
  if (!trimmedSelection) {
    state.setNotice('Saved view selection is required');
    return null;
  }

  const view =
    views.find((entry) => entry.metadata.id === trimmedSelection) ??
    views.find((entry) => entry.metadata.name === trimmedSelection) ??
    null;
  if (!view) {
    state.setNotice(`Saved view "${trimmedSelection}" was not found`);
    return null;
  }

  state.applyMapSessionState(view.session);
  state.setNotice(`Opened saved view "${view.metadata.name}"`);
  return view;
}
