import {
  DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
  DPHC_ESTIMATE_COA_PLAYGROUND_ID,
} from '../../lib/config/scenarioWorkspaces';
import { useAppStore } from '../../store/appStore';

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
    <section className="panel sidebar-panel-shell sidebar-panel-shell--pane scenario-playground-panel">
      <div className="sidebar-panel-shell__header">
        <span className="sidebar-panel-shell__title-wrap">
          <h2 className="sidebar-panel-shell__title">
            <span>DPHC Estimate COA </span>
            <em>Playground</em>
          </h2>
        </span>
      </div>
      <div className="sidebar-panel-shell__content">
        <div className="scenario-playground-pane__grid">
          <div className="scenario-playground-pane__subtitles" aria-hidden="true">
            <span className="scenario-playground-pane__subtitle prototype-accordion-item__subtitle">
              Start state
            </span>
            <span className="scenario-playground-pane__subtitle prototype-accordion-item__subtitle">
              Start state
            </span>
          </div>
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
        </div>
      </div>
    </section>
  );
}
