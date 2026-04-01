import { useEffect, useState } from 'react';
import type { NamedSavedView } from '../../lib/schemas/savedViews';
import {
  deleteSavedViewById,
  listSavedViews,
  openSavedViewById,
  saveCurrentViewAs,
} from '../../lib/browser/savedViewActions';
import { useAppStore } from '../../store/appStore';

export function SavedViewsDialog() {
  const dialogMode = useAppStore((state) => state.savedViewsDialogMode);
  const closeSavedViewsDialog = useAppStore(
    (state) => state.closeSavedViewsDialog,
  );
  const [views, setViews] = useState<NamedSavedView[]>([]);
  const [name, setName] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (dialogMode === 'closed') {
      setViews([]);
      setName('');
      setIsBusy(false);
      return;
    }

    let cancelled = false;
    void listSavedViews().then((nextViews) => {
      if (cancelled) return;
      setViews(nextViews);
    });

    return () => {
      cancelled = true;
    };
  }, [dialogMode]);

  if (dialogMode === 'closed') {
    return null;
  }

  const title = dialogMode === 'save' ? 'Save View' : 'Open View';

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onClick={() => closeSavedViewsDialog()}
    >
      <section
        className="dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-views-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-card__header">
          <div>
            <h2 id="saved-views-dialog-title">{title}</h2>
            <p className="muted">
              {dialogMode === 'save'
                ? 'Save the current map state to local browser storage'
                : 'Open a saved map state from local browser storage'}
            </p>
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => closeSavedViewsDialog()}
          >
            Close
          </button>
        </div>

        {dialogMode === 'save' && (
          <div className="dialog-card__section">
            <label className="field-label" htmlFor="saved-view-name">
              View name
            </label>
            <input
              id="saved-view-name"
              className="input"
              type="text"
              value={name}
              placeholder="Operational review"
              onChange={(event) => setName(event.target.value)}
            />
            <div className="dialog-card__actions">
              <button
                type="button"
                className="button button--primary"
                disabled={isBusy}
                onClick={() => {
                  setIsBusy(true);
                  void saveCurrentViewAs(useAppStore.getState(), name).then((savedView) => {
                    setIsBusy(false);
                    if (!savedView) return;
                    closeSavedViewsDialog();
                  });
                }}
              >
                Save View
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() => closeSavedViewsDialog()}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="dialog-card__section">
          <div className="dialog-card__section-header">
            <h3>Saved views</h3>
            <span className="muted">{views.length}</span>
          </div>
          {views.length === 0 ? (
            <p className="muted">No saved views yet</p>
          ) : (
            <div className="saved-view-list">
              {views.map((view) => (
                <article key={view.metadata.id} className="saved-view-list__item">
                  <div className="saved-view-list__copy">
                    <div className="saved-view-list__title">{view.metadata.name}</div>
                    <div className="saved-view-list__meta">
                      Updated {formatSavedViewDate(view.metadata.updatedAt)}
                    </div>
                  </div>
                  <div className="saved-view-list__actions">
                    <button
                      type="button"
                      className="button button--primary"
                      disabled={isBusy}
                      onClick={() => {
                        setIsBusy(true);
                        void openSavedViewById(
                          useAppStore.getState(),
                          view.metadata.id,
                        ).then((opened) => {
                          setIsBusy(false);
                          if (!opened) return;
                          closeSavedViewsDialog();
                        });
                      }}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="button button--ghost"
                      disabled={isBusy}
                      onClick={() => {
                        setIsBusy(true);
                        void deleteSavedViewById(
                          useAppStore.getState(),
                          view.metadata.id,
                        ).then((deleted) => {
                          setIsBusy(false);
                          if (!deleted) return;
                          setViews((currentViews) =>
                            currentViews.filter(
                              (entry) => entry.metadata.id !== view.metadata.id,
                            ),
                          );
                        });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatSavedViewDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
