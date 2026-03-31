import { WorkspaceBottomLeftPane } from './WorkspaceBottomLeftPane';
import { ScenarioPlaygroundPane } from './ScenarioPlaygroundPane';

export function WorkspaceBottomRow() {
  return (
    <>
      <WorkspaceBottomLeftPane />
      <section className="workspace-bottom-shell workspace-bottom-shell--right">
        <ScenarioPlaygroundPane />
      </section>
    </>
  );
}
