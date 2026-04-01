import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import VectorSource from 'ol/source/Vector';
import { createScenarioWorkspaceDraft } from '../src/lib/config/scenarioWorkspaces';
import { upsertScenarioWorkspaceAssignment } from '../src/lib/scenarioWorkspaceAssignments';
import { buildPlaygroundRuntimeSession } from '../src/features/map/playgroundRuntimeSession';

describe('playgroundRuntimeSession', () => {
  it('prefers the preloaded interactive baseline source and exposes runtime overrides', () => {
    const preloadedAssignmentSource = new VectorSource({
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
    const topologyEdgeSource = new VectorSource({
      features: [
        new Feature({
          geometry: new LineString([
            [0, 0],
            [10, 0],
          ]),
          left_code: 'E54000068',
          internal: false,
        }),
      ],
    });

    const session = buildPlaygroundRuntimeSession({
      workspaceId: 'dphcEstimateCoaPlayground',
      runtimeActive: true,
      baselineAssignmentKind: 'interactive-runtime',
      preloadedAssignmentSource,
      liveAssignmentSource: null,
      liveAssignmentPath: null,
      currentBaselineAssignmentSource: null,
      draft: upsertScenarioWorkspaceAssignment(
        createScenarioWorkspaceDraft('dphcEstimateCoaPlayground'),
        'UNIT-ESSEX',
        'coa3b_london_east',
      ),
      topologyEdgeSource,
      presetGroupOutlineSource: null,
    });

    expect(session.baselineAssignmentSource).toBe(preloadedAssignmentSource);
    expect(session.runtimeState.assignmentSource).not.toBeNull();
    expect(session.runtimeSourceOverrides.get('regionFill')).toBe(
      session.runtimeState.assignmentSource,
    );
    expect(session.runtimeSourceOverrides.get('scenarioOutline')).toBe(
      session.derivedOutlineSource,
    );
    expect(session.diagnosticsSnapshot?.sourceRoles.baseline).toBe(
      'preloadedAssignmentSource',
    );
    expect(
      session.runtimeState.assignmentSource?.getFeatures()[0]?.get('region_name'),
    ).toBe('COA 3b London and East');
  });

  it('falls back to the live source for non-interactive baseline kinds', () => {
    const liveAssignmentSource = new VectorSource({
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
          boundary_unit_id: 'UNIT-HNY',
          boundary_code: 'E54000050',
          region_name: 'COA 3b North',
          jmc_name: 'COA 3b North',
        }),
      ],
    });

    const session = buildPlaygroundRuntimeSession({
      workspaceId: 'coa3c',
      runtimeActive: true,
      baselineAssignmentKind: 'static-dataset',
      preloadedAssignmentSource: null,
      liveAssignmentSource,
      liveAssignmentPath: 'data/regions/UK_COA3B_Board_simplified.geojson',
      currentBaselineAssignmentSource: null,
      draft: createScenarioWorkspaceDraft('coa3c'),
      topologyEdgeSource: null,
      presetGroupOutlineSource: null,
    });

    expect(session.baselineAssignmentSource).toBe(liveAssignmentSource);
    expect(session.runtimeState.assignmentSource).toBeNull();
    expect(session.derivedOutlineSource).not.toBeNull();
    expect(session.runtimeSourceOverrides.get('scenarioOutline')).toBe(
      session.derivedOutlineSource,
    );
    expect(session.diagnosticsSnapshot).toBeNull();
  });

  it('keeps the preset outline fallback when no derived outline is available', () => {
    const presetGroupOutlineSource = new VectorSource({
      features: [
        new Feature({
          geometry: new LineString([
            [0, 0],
            [10, 0],
          ]),
          region_name: 'COA 3b South East',
        }),
      ],
    });

    const session = buildPlaygroundRuntimeSession({
      workspaceId: null,
      runtimeActive: false,
      baselineAssignmentKind: null,
      preloadedAssignmentSource: null,
      liveAssignmentSource: null,
      liveAssignmentPath: null,
      currentBaselineAssignmentSource: null,
      draft: null,
      topologyEdgeSource: null,
      presetGroupOutlineSource,
    });

    expect(session.runtimeState.assignmentSource).toBeNull();
    expect(session.derivedOutlineSource).toBeNull();
    expect(session.runtimeSourceOverrides.get('scenarioOutline')).toBe(
      presetGroupOutlineSource,
    );
  });
});
