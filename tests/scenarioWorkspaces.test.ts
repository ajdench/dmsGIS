import { describe, expect, it } from 'vitest';
import {
  DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
  DPHC_ESTIMATE_COA_PLAYGROUND_ID,
  SCENARIO_WORKSPACE_BASELINES,
  createScenarioWorkspaceDraft,
  getScenarioWorkspaceAssignmentDatasetPath,
  getScenarioWorkspaceBaseline,
  getScenarioWorkspaceSourcePresetId,
  isScenarioWorkspaceCompatibleWithPreset,
} from '../src/lib/config/scenarioWorkspaces';

describe('scenarioWorkspaces', () => {
  it('builds baseline workspaces for the existing scenario presets', () => {
    expect(SCENARIO_WORKSPACE_BASELINES.map((workspace) => workspace.id)).toEqual([
      'coa3a',
      'coa3b',
      'coa3c',
      DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
      DPHC_ESTIMATE_COA_PLAYGROUND_ID,
    ]);
  });

  it('pins scenario baselines to the 2026 boundary system', () => {
    expect(getScenarioWorkspaceBaseline('coa3a')?.boundarySystemId).toBe('icbHb2026');
    expect(getScenarioWorkspaceBaseline('coa3b')?.boundarySystemId).toBe('icbHb2026');
    expect(getScenarioWorkspaceBaseline('coa3c')?.boundarySystemId).toBe('icbHb2026');
  });

  it('ships empty boundaryNameRegionOverrides as overrides are now in codeGroupings', () => {
    // Boundary-name overrides are absorbed into codeGroupings (boundary_code-keyed),
    // so the legacy override map is always empty in baseline workspaces.
    const coa3a = getScenarioWorkspaceBaseline('coa3b');

    expect(coa3a?.boundaryNameRegionOverrides).toEqual({});
  });

  it('creates editable drafts for both playground workspaces', () => {
    const coa3aDraft = createScenarioWorkspaceDraft(DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID);
    const coa3bDraft = createScenarioWorkspaceDraft(DPHC_ESTIMATE_COA_PLAYGROUND_ID);

    expect(coa3aDraft).toEqual({
      schemaVersion: 1,
      id: DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
      label: 'DPHC Estimate COA Playground (COA 3a)',
      boundarySystemId: 'icbHb2026',
      baseWorkspaceId: DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
      assignments: [],
    });
    expect(coa3bDraft).toEqual({
      schemaVersion: 1,
      id: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
      label: 'DPHC Estimate COA Playground (COA 3b)',
      boundarySystemId: 'icbHb2026',
      baseWorkspaceId: DPHC_ESTIMATE_COA_PLAYGROUND_ID,
      assignments: [],
    });
  });

  it('maps each playground back to the visible COA preset it extends', () => {
    expect(getScenarioWorkspaceSourcePresetId('coa3c')).toBe('coa3c');
    expect(
      getScenarioWorkspaceSourcePresetId(DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID),
    ).toBe('coa3b');
    expect(
      getScenarioWorkspaceSourcePresetId(DPHC_ESTIMATE_COA_PLAYGROUND_ID),
    ).toBe('coa3c');
    expect(
      isScenarioWorkspaceCompatibleWithPreset(
        DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID,
        'coa3b',
      ),
    ).toBe(true);
    expect(
      isScenarioWorkspaceCompatibleWithPreset(
        DPHC_ESTIMATE_COA_PLAYGROUND_ID,
        'coa3c',
      ),
    ).toBe(true);
    expect(
      isScenarioWorkspaceCompatibleWithPreset(
        DPHC_ESTIMATE_COA_PLAYGROUND_ID,
        'coa3b',
      ),
    ).toBe(false);
  });

  it('resolves assignment dataset paths for editable workspaces from their source preset', () => {
    expect(getScenarioWorkspaceAssignmentDatasetPath('coa3c')).toBe(
      'data/compare/shared-foundation-review/regions/UK_COA3B_Board_simplified.geojson',
    );
    expect(
      getScenarioWorkspaceAssignmentDatasetPath(DPHC_ESTIMATE_COA_3A_PLAYGROUND_ID),
    ).toBe('data/compare/shared-foundation-review/regions/UK_COA3A_Board_simplified.geojson');
    expect(
      getScenarioWorkspaceAssignmentDatasetPath(DPHC_ESTIMATE_COA_PLAYGROUND_ID),
    ).toBe('data/compare/shared-foundation-review/regions/UK_COA3B_Board_simplified.geojson');
  });
});
