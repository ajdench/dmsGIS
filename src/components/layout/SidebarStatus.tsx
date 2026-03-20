import { useAppStore } from '../../store/appStore';

export function SidebarStatus() {
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);
  const notice = useAppStore((state) => state.notice);
  const setNotice = useAppStore((state) => state.setNotice);

  if (!isLoading && !error && !notice) {
    return null;
  }

  return (
    <section className="panel panel--status" aria-live="polite">
      {isLoading && <p className="muted">Loading layers…</p>}
      {error && <p className="muted">Error: {error}</p>}
      {notice && (
        <p className="muted">
          {notice}{' '}
          <button
            type="button"
            className="button button--ghost"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </p>
      )}
    </section>
  );
}
