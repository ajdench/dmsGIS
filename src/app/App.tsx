import { TopBar } from '../components/layout/TopBar';
import { RightSidebar } from '../components/layout/RightSidebar';
import { MapWorkspace } from '../features/map/MapWorkspace';

export function App() {
  return (
    <div className="app-shell">
      <TopBar />
      <div className="workspace-grid">
        <MapWorkspace />
        <RightSidebar />
      </div>
    </div>
  );
}
