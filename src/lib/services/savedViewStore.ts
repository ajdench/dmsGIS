import {
  parseNamedSavedView,
  type NamedSavedView,
} from '../schemas/savedViews';

const DEFAULT_STORAGE_KEY = 'dmsgis:savedViews';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SavedViewStore {
  list(): Promise<NamedSavedView[]>;
  get(id: string): Promise<NamedSavedView | null>;
  save(view: NamedSavedView): Promise<NamedSavedView>;
  delete(id: string): Promise<void>;
}

export function createLocalSavedViewStore(
  storage: StorageLike,
  storageKey = DEFAULT_STORAGE_KEY,
): SavedViewStore {
  return {
    async list() {
      return readViews(storage, storageKey);
    },
    async get(id) {
      const views = readViews(storage, storageKey);
      return views.find((view) => view.metadata.id === id) ?? null;
    },
    async save(view) {
      const parsedView = parseNamedSavedView(view);
      const views = readViews(storage, storageKey);
      const nextViews = [
        parsedView,
        ...views.filter((entry) => entry.metadata.id !== parsedView.metadata.id),
      ];
      writeViews(storage, storageKey, nextViews);
      return parsedView;
    },
    async delete(id) {
      const views = readViews(storage, storageKey);
      writeViews(
        storage,
        storageKey,
        views.filter((view) => view.metadata.id !== id),
      );
    },
  };
}

export function createBrowserSavedViewStore(): SavedViewStore | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  return createLocalSavedViewStore(window.localStorage);
}

function readViews(
  storage: StorageLike,
  storageKey: string,
): NamedSavedView[] {
  const raw = storage.getItem(storageKey);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.map((entry) => parseNamedSavedView(entry));
}

function writeViews(
  storage: StorageLike,
  storageKey: string,
  views: NamedSavedView[],
): void {
  if (views.length === 0) {
    storage.removeItem(storageKey);
    return;
  }

  storage.setItem(storageKey, JSON.stringify(views));
}
