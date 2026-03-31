import { getPresetBoundarySystemId } from './config/boundarySystems';
import { getScenarioPresetConfig } from './config/viewPresets';
import { getScenarioWorkspaceBaseline } from './config/scenarioWorkspaces';
import { resolveScenarioWorkspaceRegionId } from './scenarioWorkspaceAssignments';
import type { ScenarioWorkspaceId, ViewPresetId } from '../types';

export interface FacilityParRecord {
  regionName: string | null;
  legacyBoundaryCode: unknown;
  boundaryCode2026: unknown;
  parValue: unknown;
}

export function parseFacilityParValue(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatParDisplayValue(value: number | null): string {
  if (value === null) {
    return '—';
  }

  return new Intl.NumberFormat('en-GB').format(value);
}

export function summarizeFacilityParByRegion(
  facilities: Iterable<{ regionName: string | null; parValue: unknown }>,
): {
  regionParByName: Record<string, number>;
  totalPar: number | null;
} {
  const regionParByName = new Map<string, number>();
  let totalPar = 0;
  let hasPar = false;

  for (const facility of facilities) {
    const parValue = parseFacilityParValue(facility.parValue);
    const regionName = facility.regionName?.trim() ?? '';

    if (parValue === null) {
      continue;
    }

    hasPar = true;
    totalPar += parValue;

    if (!regionName) {
      continue;
    }

    regionParByName.set(regionName, (regionParByName.get(regionName) ?? 0) + parValue);
  }

  return {
    regionParByName: Object.fromEntries(regionParByName.entries()),
    totalPar: hasPar ? totalPar : null,
  };
}

export function summarizeFacilityParByPresetRegion(params: {
  facilities: Iterable<FacilityParRecord>;
  preset: ViewPresetId;
  preserveOriginalRegionNames?: readonly string[];
}): {
  regionParByName: Record<string, number>;
  totalPar: number | null;
} {
  const { facilities, preset, preserveOriginalRegionNames = [] } = params;
  const presetConfig = getScenarioPresetConfig(preset);
  if (!presetConfig) {
    return {
      regionParByName: {},
      totalPar: null,
    };
  }

  const regionParByName = new Map<string, number>();
  const preservedRegionNameSet = new Set(preserveOriginalRegionNames);
  const boundarySystemId = getPresetBoundarySystemId(preset);
  let totalPar = 0;
  let hasPar = false;

  for (const facility of facilities) {
    const parValue = parseFacilityParValue(facility.parValue);
    if (parValue === null) {
      continue;
    }

    hasPar = true;
    totalPar += parValue;

    const originalRegionName = facility.regionName?.trim() ?? '';
    if (originalRegionName && preservedRegionNameSet.has(originalRegionName)) {
      regionParByName.set(
        originalRegionName,
        (regionParByName.get(originalRegionName) ?? 0) + parValue,
      );
      continue;
    }

    const boundaryCode = normalizeBoundaryCode(
      boundarySystemId === 'icbHb2026'
        ? facility.boundaryCode2026
        : facility.legacyBoundaryCode,
    );
    const mappedRegionName =
      (boundaryCode ? presetConfig.codeGroupings[boundaryCode] : null) ??
      resolveCurrentRoyalNavyFacilityFallbackRegion({
        facility,
        preset,
        boundaryCode,
      }) ??
      (preset === 'current' ? originalRegionName : '');

    if (!mappedRegionName) {
      continue;
    }

    regionParByName.set(
      mappedRegionName,
      (regionParByName.get(mappedRegionName) ?? 0) + parValue,
    );
  }

  return {
    regionParByName: Object.fromEntries(regionParByName.entries()),
    totalPar: hasPar ? totalPar : null,
  };
}

export function summarizeFacilityParByScenarioWorkspace(params: {
  facilities: Iterable<FacilityParRecord>;
  workspaceId: ScenarioWorkspaceId;
  assignmentLookup?: Record<string, string>;
  preserveOriginalRegionNames?: readonly string[];
}): {
  regionParByName: Record<string, number>;
  totalPar: number | null;
} {
  const {
    facilities,
    workspaceId,
    assignmentLookup = {},
    preserveOriginalRegionNames = [],
  } = params;
  const baseline = getScenarioWorkspaceBaseline(workspaceId);
  if (!baseline) {
    return {
      regionParByName: {},
      totalPar: null,
    };
  }

  const regionParByName = new Map<string, number>();
  const regionLabelById = new Map(baseline.regions.map((region) => [region.id, region.label]));
  const preservedRegionNameSet = new Set(preserveOriginalRegionNames);
  let totalPar = 0;
  let hasPar = false;

  for (const facility of facilities) {
    const parValue = parseFacilityParValue(facility.parValue);
    if (parValue === null) {
      continue;
    }

    hasPar = true;
    totalPar += parValue;

    const originalRegionName = facility.regionName?.trim() ?? '';
    if (originalRegionName && preservedRegionNameSet.has(originalRegionName)) {
      regionParByName.set(
        originalRegionName,
        (regionParByName.get(originalRegionName) ?? 0) + parValue,
      );
      continue;
    }

    const boundaryUnitId = normalizeBoundaryCode(facility.boundaryCode2026);
    if (!boundaryUnitId) {
      continue;
    }

    const scenarioRegionId =
      assignmentLookup[boundaryUnitId] ??
      resolveScenarioWorkspaceRegionId(
        workspaceId,
        originalRegionName,
        '',
        boundaryUnitId,
      );
    if (!scenarioRegionId) {
      continue;
    }

    const regionLabel =
      regionLabelById.get(scenarioRegionId) ?? '';
    if (!regionLabel) {
      continue;
    }

    regionParByName.set(regionLabel, (regionParByName.get(regionLabel) ?? 0) + parValue);
  }

  return {
    regionParByName: Object.fromEntries(regionParByName.entries()),
    totalPar: hasPar ? totalPar : null,
  };
}

export function resolveCurrentRoyalNavyFallbackRegion(params: {
  regionName: string | null;
  legacyBoundaryCode: unknown;
  boundaryCode2026: unknown;
  preset: ViewPresetId;
}): string | null {
  const { regionName, legacyBoundaryCode, boundaryCode2026, preset } = params;
  if (preset !== 'current') {
    return null;
  }

  if ((regionName?.trim() ?? '') !== 'Royal Navy') {
    return null;
  }

  const boundaryCode = normalizeBoundaryCode(legacyBoundaryCode);
  if (boundaryCode === 'E54000042') {
    return 'London & South';
  }

  const normalizedBoundaryCode2026 = normalizeBoundaryCode(boundaryCode2026);
  if (normalizedBoundaryCode2026 === 'E54000067') {
    return 'London & South';
  }

  return null;
}

function normalizeBoundaryCode(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function resolveCurrentRoyalNavyFacilityFallbackRegion(params: {
  facility: FacilityParRecord;
  preset: ViewPresetId;
  boundaryCode: string | null;
}): string | null {
  const { facility, preset } = params;

  return resolveCurrentRoyalNavyFallbackRegion({
    regionName: facility.regionName,
    legacyBoundaryCode: facility.legacyBoundaryCode,
    boundaryCode2026: facility.boundaryCode2026,
    preset,
  });
}
