import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import {
  getScenarioBoundaryUnitId,
  resolveScenarioWorkspaceRegionIdForRecord,
} from '../../lib/scenarioWorkspaceAssignments';
import type { ScenarioWorkspaceId } from '../../types';
import { buildFeatureNameMap } from './overlayLookupBootstrap';

export interface ScenarioBoundaryUnitAssignment {
  boundaryUnitId: string;
  boundaryName: string | null;
  boundaryCode: string | null;
  scenarioRegionId: string | null;
  regionName: string | null;
}

export interface ScenarioAssignmentAuthority {
  assignmentSource: VectorSource | null;
  assignmentByBoundaryName: Map<string, string>;
  assignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
  sourceRole: 'runtime' | 'live' | 'none';
}

interface BuildScenarioAssignmentAuthorityParams {
  runtimeAssignmentSource: VectorSource | null;
  runtimeAssignmentByBoundaryName: Map<string, string>;
  runtimeAssignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
  liveAssignmentSource: VectorSource | null;
  liveAssignmentByBoundaryName: Map<string, string>;
  liveAssignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
}

// This module is the intended optimization seam for future assignment lookups.
// Callers should resolve one authoritative assignment source per render cycle
// and route all feature/selection lookups through it.
export function buildScenarioAssignmentAuthority(
  params: BuildScenarioAssignmentAuthorityParams,
): ScenarioAssignmentAuthority {
  const {
    runtimeAssignmentSource,
    runtimeAssignmentByBoundaryName,
    runtimeAssignmentByBoundaryUnitId,
    liveAssignmentSource,
    liveAssignmentByBoundaryName,
    liveAssignmentByBoundaryUnitId,
  } = params;

  if (runtimeAssignmentSource) {
    return {
      assignmentSource: runtimeAssignmentSource,
      assignmentByBoundaryName:
        runtimeAssignmentByBoundaryName.size > 0
          ? runtimeAssignmentByBoundaryName
          : buildAssignmentByBoundaryName(runtimeAssignmentSource),
      assignmentByBoundaryUnitId:
        runtimeAssignmentByBoundaryUnitId.size > 0
          ? runtimeAssignmentByBoundaryUnitId
          : buildAssignmentByBoundaryUnitId(runtimeAssignmentSource),
      sourceRole: 'runtime',
    };
  }

  if (liveAssignmentSource) {
    return {
      assignmentSource: liveAssignmentSource,
      assignmentByBoundaryName:
        liveAssignmentByBoundaryName.size > 0
          ? liveAssignmentByBoundaryName
          : buildAssignmentByBoundaryName(liveAssignmentSource),
      assignmentByBoundaryUnitId:
        liveAssignmentByBoundaryUnitId.size > 0
          ? liveAssignmentByBoundaryUnitId
          : buildAssignmentByBoundaryUnitId(liveAssignmentSource),
      sourceRole: 'live',
    };
  }

  return {
    assignmentSource: null,
    assignmentByBoundaryName: new Map(),
    assignmentByBoundaryUnitId: new Map(),
    sourceRole: 'none',
  };
}

export function buildAssignmentByBoundaryName(
  assignmentSource: VectorSource | null,
): Map<string, string> {
  if (!assignmentSource) {
    return new Map();
  }

  return buildFeatureNameMap(
    assignmentSource.getFeatures(),
    (feature) => String(feature.get('boundary_name') ?? ''),
    (feature) =>
      String(feature.get('region_name') ?? feature.get('jmc_name') ?? '').trim(),
  );
}

export function buildAssignmentByBoundaryUnitId(
  assignmentSource: VectorSource | null,
): Map<string, ScenarioBoundaryUnitAssignment> {
  if (!assignmentSource) {
    return new Map();
  }

  return new Map(
    assignmentSource.getFeatures().flatMap((feature) => {
      const properties = feature.getProperties() as Record<string, unknown>;
      const boundaryUnitId = getScenarioBoundaryUnitId(properties);
      if (!boundaryUnitId) {
        return [];
      }

      return [[
        boundaryUnitId,
        {
          boundaryUnitId,
          boundaryName: String(feature.get('boundary_name') ?? '').trim() || null,
          boundaryCode: String(feature.get('boundary_code') ?? '').trim() || null,
          scenarioRegionId:
            String(feature.get('scenario_region_id') ?? '').trim() || null,
          regionName:
            String(
              feature.get('region_name') ?? feature.get('jmc_name') ?? '',
            ).trim() || null,
        } satisfies ScenarioBoundaryUnitAssignment,
      ] as const];
    }),
  );
}

export function resolvePlaygroundBoundaryAssignment(params: {
  boundaryProperties: Record<string, unknown>;
  workspaceId: ScenarioWorkspaceId | null;
  assignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
}): ScenarioBoundaryUnitAssignment | null {
  const { boundaryProperties, workspaceId, assignmentByBoundaryUnitId } = params;
  const boundaryUnitId = getScenarioBoundaryUnitId(boundaryProperties);
  if (!boundaryUnitId) {
    return null;
  }

  const runtimeAssignment = assignmentByBoundaryUnitId.get(boundaryUnitId) ?? null;
  if (runtimeAssignment) {
    return runtimeAssignment;
  }

  const scenarioRegionId = workspaceId
    ? resolveScenarioWorkspaceRegionIdForRecord(workspaceId, boundaryProperties)
    : null;

  return {
    boundaryUnitId,
    boundaryName: String(boundaryProperties.boundary_name ?? '').trim() || null,
    boundaryCode: String(boundaryProperties.boundary_code ?? '').trim() || null,
    scenarioRegionId,
    regionName:
      String(
        boundaryProperties.region_name ?? boundaryProperties.jmc_name ?? '',
      ).trim() || null,
  };
}

export function findScenarioAssignmentFeatureAtCoordinate(
  assignmentSource: VectorSource | null,
  coordinate: [number, number] | null,
): FeatureLike | null {
  if (!assignmentSource || !coordinate) {
    return null;
  }

  return (
    assignmentSource
      .getFeatures()
      .find((candidate) => candidate.getGeometry()?.intersectsCoordinate(coordinate)) ?? null
  );
}
