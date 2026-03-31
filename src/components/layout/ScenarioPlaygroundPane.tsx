import {
  DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
  DPHC_ESTIMATE_COA_PLAYGROUND_ID,
} from '../../lib/config/scenarioWorkspaces';
import { useAppStore } from '../../store/appStore';
import { SidebarPanelShell } from '../sidebar/SidebarPanelShell';

export function ScenarioPlaygroundPane() {
  const activeViewPreset = useAppStore((state) => state.activeViewPreset);
  const activeScenarioWorkspaceId = useAppStore(
    (state) => state.activeScenarioWorkspaceId,
  );
  const activateInteractiveScenarioWorkspace = useAppStore(
    (state) => state.activateInteractiveScenarioWorkspace,
  );

  const coa3aPlaygroundActive =
    activeViewPreset === 'coa3b' &&
    activeScenarioWorkspaceId === DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID;
  const coa3bPlaygroundActive =
    activeViewPreset === 'coa3c' &&
    activeScenarioWorkspaceId === DPHC_ESTIMATE_COA_PLAYGROUND_ID;

  const activatePlaygroundPreset = (
    presetId: 'coa3b' | 'coa3c',
    workspaceId:
      | typeof DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID
      | typeof DPHC_ESTIMATE_COA_PLAYGROUND_ID,
  ) => {
    activateInteractiveScenarioWorkspace(presetId, workspaceId);
  };

  return (
    <SidebarPanelShell
      className="scenario-playground-panel"
      title={
        <>
          <span>DPHC Estimate COA </span>
          <em>Playground</em>
        </>
      }
    >
      <div className="scenario-playground-pane__actions" aria-label="COA playground presets">
        <button
          type="button"
          className={`button sidebar-action-row__button${
            coa3aPlaygroundActive ? ' sidebar-action-row__button--active' : ''
          }`}
          onClick={() =>
            activatePlaygroundPreset('coa3b', DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID)
          }
          aria-pressed={coa3aPlaygroundActive}
        >
          COA 3a
        </button>
        <button
          type="button"
          className={`button sidebar-action-row__button${
            coa3bPlaygroundActive ? ' sidebar-action-row__button--active' : ''
          }`}
          onClick={() =>
            activatePlaygroundPreset('coa3c', DPHC_ESTIMATE_COA_PLAYGROUND_ID)
          }
          aria-pressed={coa3bPlaygroundActive}
        >
          COA 3b
        </button>
      </div>
    </SidebarPanelShell>
  );
}
