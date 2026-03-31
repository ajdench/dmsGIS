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

  it('builds a baseline runtime source for an unedited interactive workspace', () => {
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
          boundary_code: 'E54000068',
          region_name: 'COA 3b South East',
          jmc_name: 'COA 3b South East',
        }),
      ],
    });

    const runtimeState = buildScenarioWorkspaceRuntimeState(
      'dphcEstimateCoaPlayground',
      baselineAssignmentSource,
      createScenarioWorkspaceDraft('dphcEstimateCoaPlayground'),
      { includeBaselineWhenUnedited: true },
    );

    const [feature] = runtimeState.assignmentSource?.getFeatures() ?? [];
    expect(feature?.get('scenario_region_id')).toBe('coa3b_london_east');
    expect(feature?.get('region_name')).toBe('COA 3b London and East');
    expect(runtimeState.assignmentByBoundaryName.get('NHS Essex Integrated Care Board')).toBe(
      'COA 3b London and East',
    );
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
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          boundary_name: 'NHS Kent and Medway Integrated Care Board',
          boundary_unit_id: 'UNIT-KENT',
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
    const updatedFeatures = runtimeState.assignmentSource?.getFeatures() ?? [];
    const updatedFeature = updatedFeatures[0];
    const untouchedFeature = updatedFeatures[1];

    expect(updatedFeature?.get('region_name')).toBe('COA 3b London and East');
    expect(updatedFeature?.get('jmc_name')).toBe('COA 3b London and East');
    expect(updatedFeature?.get('scenario_region_id')).toBe('coa3b_london_east');
    expect(untouchedFeature?.get('scenario_region_id')).toBe('coa3b_south_east');
    expect(runtimeState.assignmentByBoundaryName.get('NHS Essex Integrated Care Board')).toBe(
      'COA 3b London and East',
    );
  });

  it('resolves untouched baseline boards by boundary code when source region labels are absent', () => {
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
          boundary_name: 'NHS Humber and North Yorkshire Integrated Care Board',
          boundary_code: 'E54000050',
          boundary_unit_id: 'UNIT-HNY',
        }),
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          boundary_name: 'NHS Essex Integrated Care Board',
          boundary_code: 'E54000068',
          boundary_unit_id: 'UNIT-ESSEX',
        }),
      ],
    });
    const draft = upsertScenarioWorkspaceAssignment(
      createScenarioWorkspaceDraft('coa3c'),
      'UNIT-ESSEX',
      'coa3b_south_east',
    );

    const runtimeState = buildScenarioWorkspaceRuntimeState(
      'coa3c',
      baselineAssignmentSource,
      draft,
    );
    const updatedFeatures = runtimeState.assignmentSource?.getFeatures() ?? [];
    const untouchedFeature = updatedFeatures[0];
    const updatedFeature = updatedFeatures[1];

    expect(untouchedFeature?.get('scenario_region_id')).toBe('coa3b_north');
    expect(untouchedFeature?.get('region_name')).toBe('COA 3b North');
    expect(updatedFeature?.get('scenario_region_id')).toBe('coa3b_south_east');
    expect(updatedFeature?.get('region_name')).toBe('COA 3b South East');
  });

  it('resolves untouched playground boards from the source preset code groupings', () => {
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
          boundary_name: 'NHS Shropshire, Telford and Wrekin Integrated Care Board',
          boundary_code: 'E54000011',
          boundary_unit_id: 'UNIT-SHROP',
          jmc_name: 'JMC Centre',
        }),
        new Feature({
          geometry: new Polygon([[
            [10, 0],
            [20, 0],
            [20, 10],
            [10, 10],
            [10, 0],
          ]]),
          boundary_name: 'NHS Suffolk and North East Essex Integrated Care Board',
          boundary_code: 'E54000071',
          boundary_unit_id: 'UNIT-SNEE',
          jmc_name: 'JMC South East',
        }),
      ],
    });
    const draft = upsertScenarioWorkspaceAssignment(
      createScenarioWorkspaceDraft('dphcEstimateCoaPlayground'),
      'UNIT-SHROP',
      'coa3b_london_east',
    );

    const runtimeState = buildScenarioWorkspaceRuntimeState(
      'dphcEstimateCoaPlayground',
      baselineAssignmentSource,
      draft,
    );
    const updatedFeatures = runtimeState.assignmentSource?.getFeatures() ?? [];
    const movedFeature = updatedFeatures[0];
    const untouchedFeature = updatedFeatures[1];

    expect(movedFeature?.get('scenario_region_id')).toBe('coa3b_london_east');
    expect(movedFeature?.get('region_name')).toBe('COA 3b London and East');
    expect(untouchedFeature?.get('scenario_region_id')).toBe('coa3b_london_east');
    expect(untouchedFeature?.get('region_name')).toBe('COA 3b London and East');
  });
});
