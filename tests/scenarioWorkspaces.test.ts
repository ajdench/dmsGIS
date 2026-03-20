import { describe, expect, it } from 'vitest';
import {
  DPHC_ESTIMATE_COA_PLAYGROUND_ID,
  SCENARIO_WORKSPACE_BASELINES,
  createScenarioWorkspaceDraft,
  getScenarioWorkspaceBaseline,
} from '../src/lib/config/scenarioWorkspaces';

describe('scenarioWorkspaces', () => {
  it('builds baseline workspaces for the existing scenario presets', () => {
    expect(SCENARIO_WORKSPACE_BASELINES.map((workspace) => workspace.id)).toEqual([
      'coa3a',
      'coa3b',
      'coa3c',
      DPHC_ESTIMATE_COA_PLAYGROUND_ID,
    ]);
  });

  it('pins scenario baselines to the 2026 boundary system', () => {
    expect(getScenarioWorkspaceBaseline('coa3a')?.boundarySystemId).toBe('icbHb2026');
    expect(getScenarioWorkspaceBaseline('coa3b')?.boundarySystemId).toBe('icbHb2026');
    expect(getScenarioWorkspaceBaseline('coa3c')?.boundarySystemId).toBe('icbHb2026');
  });

  it('translates legacy boundary-name overrides into region ids for future editing', () => {
    const coa3a = getScenarioWorkspaceBaseline('coa3b');

    expect(coa3a?.boundaryNameRegionOverrides).toEqual({
      'NHS Essex Integrated Care Board': 'coa3a_south_east',
      'NHS Central East Integrated Care Board': 'coa3a_south_east',
      'NHS Norfolk and Suffolk Integrated Care Board': 'coa3a_south_east',
    });
  });

  it('creates an editable draft for the future playground workspace', () => {
    const draft = createScenarioWorkspaceDraft(DPHC_ESTIMATE_COA_PLAYGROUND_ID);

    expect(draft).toEqual({
      schemaVersion: 1,
      id: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
      label: 'DPHC Estimate COA Playground',
      boundarySystemId: 'icbHb2026',
      baseWorkspaceId: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
      assignments: [],
    });
  });
});
