import { Suspense, lazy } from 'react';
import { TopBar } from '../components/layout/TopBar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { WorkspaceBottomRow } from '../components/layout/WorkspaceBottomRow';
import { MapWorkspace } from '../features/map/MapWorkspace';
import { useAppStore } from '../store/appStore';

const SavedViewsDialog = lazy(async () => {
  const module = await import('../components/layout/SavedViewsDialog');
  return { default: module.SavedViewsDialog };
});

export function App() {
  const savedViewsDialogMode = useAppStore((state) => state.savedViewsDialogMode);

  return (
    <div className="app-shell app-shell--topbar-buttons-current app-shell--preset-buttons-midLow">
      <TopBar />
      <div className="workspace-grid">
        <MapWorkspace />
        <RightSidebar />
        <WorkspaceBottomRow />
      </div>
      {savedViewsDialogMode !== 'closed' ? (
        <Suspense fallback={null}>
          <SavedViewsDialog />
        </Suspense>
      ) : null}
    </div>
  );
}
