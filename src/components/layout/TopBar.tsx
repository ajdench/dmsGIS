import { exportCurrentMapView } from '../../features/export/exportCurrentMapView';
import { useAppStore } from '../../store/appStore';

export function TopBar() {
  const openSavedViewsDialog = useAppStore((state) => state.openSavedViewsDialog);
  const resetActiveViewPreset = useAppStore((state) => state.resetActiveViewPreset);
  const setNotice = useAppStore((state) => state.setNotice);

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__title">dmsGIS</div>
        <div className="topbar__subtitle">
          DMS healthcare facility geographic information service
        </div>
      </div>
      <div className="topbar__actions">
        <button
          type="button"
          className="button button--ghost"
          onClick={() => openSavedViewsDialog('open')}
        >
          Open
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => openSavedViewsDialog('save')}
        >
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            exportCurrentMapView();
            setNotice('Export is not implemented yet');
          }}
        >
          Export
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => resetActiveViewPreset()}
        >
          Reset
        </button>
      </div>
    </header>
  );
}
