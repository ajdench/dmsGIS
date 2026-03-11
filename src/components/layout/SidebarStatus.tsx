import { useAppStore } from '../../store/appStore';

export function SidebarStatus() {
  const isLoading = useAppStore((state) => state.isLoading);
  const error = useAppStore((state) => state.error);

  if (!isLoading && !error) {
    return null;
  }

  return (
    <section className="panel panel--status" aria-live="polite">
      {isLoading && <p className="muted">Loading layers…</p>}
      {error && <p className="muted">Error: {error}</p>}
    </section>
  );
}
