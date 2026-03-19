import { exportCurrentMapView } from '../../features/export/exportCurrentMapView';
import { openSavedView, saveCurrentView } from '../../lib/browser/savedViewActions';
import { useAppStore } from '../../store/appStore';

export function TopBar() {
  const appState = useAppStore();

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
          onClick={() => {
            void openSavedView(appState);
          }}
        >
          Open
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            void saveCurrentView(appState);
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            exportCurrentMapView();
            appState.setNotice('Export is not implemented yet');
          }}
        >
          Export
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => appState.resetActiveViewPreset()}
        >
          Reset
        </button>
      </div>
    </header>
  );
}
