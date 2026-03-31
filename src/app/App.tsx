import { SavedViewsDialog } from '../components/layout/SavedViewsDialog';
import { TopBar } from '../components/layout/TopBar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { WorkspaceBottomRow } from '../components/layout/WorkspaceBottomRow';
import { MapWorkspace } from '../features/map/MapWorkspace';

export function App() {
  return (
    <div className="app-shell app-shell--topbar-buttons-current app-shell--preset-buttons-midLow">
      <TopBar />
      <div className="workspace-grid">
        <MapWorkspace />
        <RightSidebar />
        <WorkspaceBottomRow />
      </div>
      <SavedViewsDialog />
    </div>
  );
}
