import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createRebuildFamilyStagePlan,
} from '../scripts/rebuildFamilyStagePlan.mjs';

describe('createRebuildFamilyStagePlan', () => {
  it('builds a stable staged tree beneath the requested root and run id', () => {
    const plan = createRebuildFamilyStagePlan({
      root: '/tmp/rebuild-family',
      runId: 'v3.9-paired-reset',
    });

    expect(plan.buildRoot).toBe(
      path.resolve('/tmp/rebuild-family', 'v3.9-paired-reset'),
    );
    expect(plan.stage10.current.boardsGeoJson).toContain(
      path.join('10_exact_canonical', 'current', 'boards.geojson'),
    );
    expect(plan.stage20.source.currentGeoJson).toContain(
      path.join('20_runtime_board_family', 'source', 'current_source.geojson'),
    );
    expect(plan.stage40.outlinesDir).toContain(
      path.join('40_outline_arcs', 'groups'),
    );
    expect(plan.stage80.facilitiesGeoJson).toContain(
      path.join('80_facilities_enrichment', 'live', 'facilities.geojson'),
    );
    expect(plan.workspace.regionsDir).toContain(
      path.join('workspace', 'data', 'regions'),
    );
  });
});
