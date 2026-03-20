import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import { createScenarioWorkspaceDraft } from '../src/lib/config/scenarioWorkspaces';
import { upsertScenarioWorkspaceAssignment } from '../src/lib/scenarioWorkspaceAssignments';
import { buildScenarioWorkspaceRuntimeState } from '../src/features/map/scenarioWorkspaceRuntime';

describe('scenarioWorkspaceRuntime', () => {
  it('keeps static behavior when there are no draft assignments', () => {
    const baselineAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          boundary_name: 'Boundary A',
          region_name: 'COA 3b North',
        }),
      ],
    });

    expect(
      buildScenarioWorkspaceRuntimeState(
        'coa3c',
        baselineAssignmentSource,
        createScenarioWorkspaceDraft('coa3c'),
      ),
    ).toEqual({
      assignmentSource: null,
      assignmentByBoundaryName: new Map(),
    });
  });

  it('builds a runtime assignment source with draft overrides applied', () => {
    const baselineAssignmentSource = new VectorSource({
      features: [
        new Feature({
          geometry: new Polygon([[
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ]]),
          boundary_name: 'NHS Essex Integrated Care Board',
          boundary_unit_id: 'UNIT-ESSEX',
          region_name: 'COA 3b South East',
          jmc_name: 'COA 3b South East',
        }),
      ],
    });
    const draft = upsertScenarioWorkspaceAssignment(
      createScenarioWorkspaceDraft('coa3c'),
      'UNIT-ESSEX',
      'coa3b_london_east',
    );

    const runtimeState = buildScenarioWorkspaceRuntimeState(
      'coa3c',
      baselineAssignmentSource,
      draft,
    );
    const updatedFeature = runtimeState.assignmentSource?.getFeatures()[0];

    expect(updatedFeature?.get('region_name')).toBe('COA 3b London and East');
    expect(updatedFeature?.get('jmc_name')).toBe('COA 3b London and East');
    expect(updatedFeature?.get('scenario_region_id')).toBe('coa3b_london_east');
    expect(runtimeState.assignmentByBoundaryName.get('NHS Essex Integrated Care Board')).toBe(
      'COA 3b London and East',
    );
  });
});
