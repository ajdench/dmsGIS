import { useAppStore } from '../../store/appStore';

const STATUS_BANNER_CLASS_NAMES = {
  loading: 'status-banner status-banner--loading',
  info: 'status-banner status-banner--info',
  warning: 'status-banner status-banner--warning',
  success: 'status-banner status-banner--success',
  error: 'status-banner status-banner--error',
} as const;

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
      {isLoading ? <StatusBanner tone="loading" message="Loading layers..." /> : null}
      {error ? <StatusBanner tone="error" message={`Error: ${error}`} /> : null}
      {notice ? (
        <StatusBanner
          tone={notice.tone}
          message={notice.message}
          dismissAction={() => setNotice(null)}
        />
      ) : null}
    </section>
  );
}

function StatusBanner({
  tone,
  message,
  dismissAction,
}: {
  tone: 'loading' | 'info' | 'success' | 'warning' | 'error';
  message: string;
  dismissAction?: () => void;
}) {
  return (
    <div className={STATUS_BANNER_CLASS_NAMES[tone]}>
      <p className="status-banner__message">{message}</p>
      {dismissAction ? (
        <button
          type="button"
          className="status-banner__dismiss"
          onClick={dismissAction}
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
