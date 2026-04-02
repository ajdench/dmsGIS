import VectorSource from 'ol/source/Vector';
import type { FeatureLike } from 'ol/Feature';
import type Geometry from 'ol/geom/Geometry';
import type {
  ScenarioWorkspaceDraft,
} from '../../lib/schemas/scenarioWorkspaces';
import { getScenarioWorkspaceBaseline } from '../../lib/config/scenarioWorkspaces';
import {
  getScenarioBoundaryUnitId,
  resolveScenarioWorkspaceRegionId,
} from '../../lib/scenarioWorkspaceAssignments';
import type { ScenarioWorkspaceId } from '../../types';
import {
  buildAssignmentByBoundaryName,
  buildAssignmentByBoundaryUnitId,
  type ScenarioBoundaryUnitAssignment,
} from './scenarioAssignmentAuthority';

export interface ScenarioWorkspaceRuntimeState {
  assignmentSource: VectorSource | null;
  assignmentByBoundaryName: Map<string, string>;
  assignmentByBoundaryUnitId: Map<string, ScenarioBoundaryUnitAssignment>;
}

export interface ScenarioWorkspaceAssignmentSourceSummary {
  featureCount: number;
  mappedFeatureCount: number;
  unmappedFeatureCount: number;
  explicitScenarioRegionIdCount: number;
  invalidExplicitScenarioRegionIdCount: number;
  sampleUnmappedBoundaryNames: string[];
}

export interface PlaygroundRuntimeDiagnosticsSnapshot {
  generatedAt: string;
  workspaceId: ScenarioWorkspaceId;
  baselineAssignmentKind: string | null;
  liveAssignmentPath: string | null;
  sourceRoles: {
    baseline: string | null;
    runtimeAssignment: string | null;
    derivedOutlineAssignment: string | null;
  };
  sources: Record<string, ScenarioWorkspaceAssignmentSourceSummary>;
  topologyEdges: {
    featureCount: number;
    internalFeatureCount: number;
    externalFeatureCount: number;
  };
  derivedOutline: {
    featureCount: number;
    lineFeatureCount: number;
    polygonFeatureCount: number;
    usesLineGeometry: boolean;
  };
}

export function resolveScenarioWorkspaceBaselineAssignmentSource({
  runtimeActive,
  baselineAssignmentKind,
  preloadedAssignmentSource,
  liveAssignmentSource,
  liveAssignmentPath,
  currentBaselineAssignmentSource,
}: {
  runtimeActive: boolean;
  baselineAssignmentKind: string | null;
  preloadedAssignmentSource: VectorSource | null;
  liveAssignmentSource: VectorSource | null;
  liveAssignmentPath: string | null;
  currentBaselineAssignmentSource: VectorSource | null;
}): VectorSource | null {
  const hasPreloadedAssignmentSource =
    !!preloadedAssignmentSource &&
    preloadedAssignmentSource.getFeatures().length > 0;

  if (!runtimeActive) {
    return null;
  }

  if (hasPreloadedAssignmentSource) {
    return preloadedAssignmentSource;
  }

  // Interactive playground workspaces should wait for their dedicated
  // baseline assignment dataset instead of seeding from whichever live layer
  // happens to be available first.
  if (baselineAssignmentKind === 'interactive-runtime') {
    return currentBaselineAssignmentSource;
  }

  if (
    liveAssignmentSource &&
    liveAssignmentPath !== 'runtime:regionFill' &&
    currentBaselineAssignmentSource !== liveAssignmentSource
  ) {
    return liveAssignmentSource;
  }

  return currentBaselineAssignmentSource;
}

interface BuildScenarioWorkspaceRuntimeOptions {
  includeBaselineWhenUnedited?: boolean;
}

export function buildScenarioWorkspaceRuntimeState(
  workspaceId: ScenarioWorkspaceId,
  baselineAssignmentSource: VectorSource | null,
  draft: ScenarioWorkspaceDraft | null,
  options: BuildScenarioWorkspaceRuntimeOptions = {},
): ScenarioWorkspaceRuntimeState {
  const { includeBaselineWhenUnedited = false } = options;

  if (
    !baselineAssignmentSource ||
    !draft ||
    (draft.assignments.length === 0 && !includeBaselineWhenUnedited)
  ) {
    return {
      assignmentSource: null,
      assignmentByBoundaryName: new Map(),
      assignmentByBoundaryUnitId: new Map(),
    };
  }

  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  if (!baseline) {
    return {
      assignmentSource: null,
      assignmentByBoundaryName: new Map(),
      assignmentByBoundaryUnitId: new Map(),
    };
  }

  const regionLabelById = new Map(
    baseline.regions.map((region) => [region.id, region.label] as const),
  );
  const assignmentByBoundaryUnitId = new Map(
    draft.assignments.map((assignment) => [
      assignment.boundaryUnitId,
      assignment.scenarioRegionId,
    ] as const),
  );

  const features = baselineAssignmentSource.getFeatures().map((feature) => {
    const clone = feature.clone();
    const boundaryUnitId = getScenarioBoundaryUnitId(
      clone.getProperties() as Record<string, unknown>,
    );
    const boundaryCode = String(clone.get('boundary_code') ?? '').trim();
    const assignedScenarioRegionId =
      (boundaryUnitId ? assignmentByBoundaryUnitId.get(boundaryUnitId) : null) ??
      null;
    const scenarioRegionId =
      (assignedScenarioRegionId && regionLabelById.has(assignedScenarioRegionId)
        ? assignedScenarioRegionId
        : null) ??
      resolveScenarioWorkspaceRegionId(
        workspaceId,
        String(
          clone.get('source_region_name') ??
            clone.get('region_name') ??
            clone.get('jmc_name') ??
            '',
        ),
        String(clone.get('boundary_name') ?? ''),
        boundaryCode,
      );
    if (!scenarioRegionId) {
      return clone;
    }

    const scenarioRegionLabel = regionLabelById.get(scenarioRegionId);
    if (!scenarioRegionLabel) {
      return clone;
    }

    clone.set('scenario_region_id', scenarioRegionId);
    clone.set('region_name', scenarioRegionLabel);
    clone.set('jmc_name', scenarioRegionLabel);
    return clone;
  });

  const assignmentSource = new VectorSource();
  assignmentSource.addFeatures(features);

  return {
    assignmentSource,
    assignmentByBoundaryName: buildAssignmentByBoundaryName(assignmentSource),
    assignmentByBoundaryUnitId: buildAssignmentByBoundaryUnitId(assignmentSource),
  };
}

export function buildPlaygroundRuntimeDiagnosticsSnapshot({
  workspaceId,
  baselineAssignmentKind,
  liveAssignmentPath,
  preloadedAssignmentSource,
  liveAssignmentSource,
  resolvedBaselineAssignmentSource,
  runtimeAssignmentBaselineSource,
  runtimeAssignmentSource,
  derivedOutlineAssignmentSource,
  topologyEdgeSource,
  derivedOutlineSource,
}: {
  workspaceId: ScenarioWorkspaceId;
  baselineAssignmentKind: string | null;
  liveAssignmentPath: string | null;
  preloadedAssignmentSource: VectorSource | null;
  liveAssignmentSource: VectorSource | null;
  resolvedBaselineAssignmentSource: VectorSource | null;
  runtimeAssignmentBaselineSource: VectorSource | null;
  runtimeAssignmentSource: VectorSource | null;
  derivedOutlineAssignmentSource: VectorSource | null;
  topologyEdgeSource: VectorSource | null;
  derivedOutlineSource: VectorSource | null;
}): PlaygroundRuntimeDiagnosticsSnapshot {
  const namedSources = [
    ['preloadedAssignmentSource', preloadedAssignmentSource],
    ['liveAssignmentSource', liveAssignmentSource],
    ['resolvedBaselineAssignmentSource', resolvedBaselineAssignmentSource],
    ['runtimeAssignmentBaselineSource', runtimeAssignmentBaselineSource],
    ['runtimeAssignmentSource', runtimeAssignmentSource],
    ['derivedOutlineAssignmentSource', derivedOutlineAssignmentSource],
  ] as const;

  return {
    generatedAt: new Date().toISOString(),
    workspaceId,
    baselineAssignmentKind,
    liveAssignmentPath,
    sourceRoles: {
      baseline: resolveNamedSourceRole(
        namedSources,
        runtimeAssignmentBaselineSource,
      ),
      runtimeAssignment: resolveNamedSourceRole(
        namedSources,
        runtimeAssignmentSource,
      ),
      derivedOutlineAssignment: resolveNamedSourceRole(
        namedSources,
        derivedOutlineAssignmentSource,
      ),
    },
    sources: Object.fromEntries(
      namedSources.map(([name, source]) => [
        name,
        summarizeScenarioAssignmentSource(workspaceId, source),
      ]),
    ),
    topologyEdges: summarizeTopologyEdgeSource(topologyEdgeSource),
    derivedOutline: summarizeDerivedOutlineSource(derivedOutlineSource),
  };
}

function summarizeScenarioAssignmentSource(
  workspaceId: ScenarioWorkspaceId,
  source: VectorSource | null,
): ScenarioWorkspaceAssignmentSourceSummary {
  if (!source) {
    return {
      featureCount: 0,
      mappedFeatureCount: 0,
      unmappedFeatureCount: 0,
      explicitScenarioRegionIdCount: 0,
      invalidExplicitScenarioRegionIdCount: 0,
      sampleUnmappedBoundaryNames: [],
    };
  }

  const features = source.getFeatures();
  let mappedFeatureCount = 0;
  let explicitScenarioRegionIdCount = 0;
  let invalidExplicitScenarioRegionIdCount = 0;
  const sampleUnmappedBoundaryNames: string[] = [];

  for (const feature of features) {
    const explicitScenarioRegionId = String(
      feature.get('scenario_region_id') ?? '',
    ).trim();
    if (explicitScenarioRegionId) {
      explicitScenarioRegionIdCount += 1;
    }

    const resolvedScenarioRegionId = resolveScenarioWorkspaceRegionId(
      workspaceId,
      String(
        feature.get('source_region_name') ??
          feature.get('region_name') ??
          feature.get('jmc_name') ??
          '',
      ).trim(),
      String(feature.get('boundary_name') ?? '').trim(),
      String(feature.get('boundary_code') ?? '').trim(),
    );

    if (resolvedScenarioRegionId) {
      mappedFeatureCount += 1;
    } else {
      const boundaryName = String(feature.get('boundary_name') ?? '').trim();
      if (
        boundaryName &&
        sampleUnmappedBoundaryNames.length < 8 &&
        !sampleUnmappedBoundaryNames.includes(boundaryName)
      ) {
        sampleUnmappedBoundaryNames.push(boundaryName);
      }
    }

    if (explicitScenarioRegionId && !resolvedScenarioRegionId) {
      invalidExplicitScenarioRegionIdCount += 1;
    }
  }

  return {
    featureCount: features.length,
    mappedFeatureCount,
    unmappedFeatureCount: Math.max(features.length - mappedFeatureCount, 0),
    explicitScenarioRegionIdCount,
    invalidExplicitScenarioRegionIdCount,
    sampleUnmappedBoundaryNames,
  };
}

function summarizeTopologyEdgeSource(source: VectorSource | null): {
  featureCount: number;
  internalFeatureCount: number;
  externalFeatureCount: number;
} {
  const features = source?.getFeatures() ?? [];
  let internalFeatureCount = 0;
  let externalFeatureCount = 0;

  for (const feature of features) {
    if (feature.get('internal')) {
      internalFeatureCount += 1;
    } else {
      externalFeatureCount += 1;
    }
  }

  return {
    featureCount: features.length,
    internalFeatureCount,
    externalFeatureCount,
  };
}

function summarizeDerivedOutlineSource(source: VectorSource | null): {
  featureCount: number;
  lineFeatureCount: number;
  polygonFeatureCount: number;
  usesLineGeometry: boolean;
} {
  const features = source?.getFeatures() ?? [];
  let lineFeatureCount = 0;
  let polygonFeatureCount = 0;

  for (const feature of features) {
    const geometryType = getGeometryType(feature.getGeometry());
    if (
      geometryType === 'LineString' ||
      geometryType === 'MultiLineString'
    ) {
      lineFeatureCount += 1;
      continue;
    }

    if (
      geometryType === 'Polygon' ||
      geometryType === 'MultiPolygon'
    ) {
      polygonFeatureCount += 1;
    }
  }

  return {
    featureCount: features.length,
    lineFeatureCount,
    polygonFeatureCount,
    usesLineGeometry: lineFeatureCount > 0,
  };
}

function getGeometryType(geometry: Geometry | null | undefined): string | null {
  if (!geometry) {
    return null;
  }

  return typeof geometry.getType === 'function' ? geometry.getType() : null;
}

function resolveNamedSourceRole(
  namedSources: readonly (readonly [string, VectorSource | null])[],
  targetSource: VectorSource | null,
): string | null {
  if (!targetSource) {
    return null;
  }

  for (const [name, source] of namedSources) {
    if (source === targetSource) {
      return name;
    }
  }

  return 'untrackedSource';
}
