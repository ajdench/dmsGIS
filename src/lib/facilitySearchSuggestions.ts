import { createFacilityRecord, type FacilityRecord } from './facilities';
import {
  createFacilityFilterState,
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
  normalizeFacilitySearchQuery,
} from './facilityFilters';
import { parseFacilityProperties } from './schemas/facilities';

interface FacilitySearchCollectionLike {
  features?: Array<{
    properties?: Record<string, unknown>;
  }>;
}

export function extractFacilitySuggestionRecords(
  input: FacilitySearchCollectionLike | null | undefined,
): FacilityRecord[] {
  if (!input?.features) {
    return [];
  }

  const uniqueFacilities = new Map<string, FacilityRecord>();

  for (const feature of input.features) {
    if (!feature.properties) {
      continue;
    }

    const rawName = feature.properties.name;
    if (typeof rawName !== 'string' || rawName.trim().length === 0) {
      continue;
    }

    const record = createFacilityRecord(parseFacilityProperties(feature.properties));
    const key = normalizeFacilitySearchQuery(record.displayName);

    if (!key) {
      continue;
    }

    if (!uniqueFacilities.has(key)) {
      uniqueFacilities.set(key, record);
    }
  }

  return [...uniqueFacilities.values()].sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );
}

export function buildFacilitySearchSuggestions(
  facilities: FacilityRecord[],
  query: string,
  limit = 8,
): string[] {
  return buildFacilitySearchSuggestionRecords(facilities, query, limit).map(
    (facility) => facility.displayName,
  );
}

export function buildFacilitySearchSuggestionRecords(
  facilities: FacilityRecord[],
  query: string,
  limit = 8,
): FacilityRecord[] {
  const filters = getFacilityFilterDefinitions(
    createFacilityFilterState({ searchQuery: query }),
  );
  const normalizedQuery = filters[0]?.normalizedQuery ?? '';

  if (normalizedQuery.length === 0) {
    return facilities;
  }

  const startsWithMatches: FacilityRecord[] = [];
  const otherMatches: FacilityRecord[] = [];

  for (const facility of facilities) {
    if (!matchesFacilityFilters(facility, filters)) {
      continue;
    }

    const normalizedName = facility.displayName.toLowerCase();

    if (normalizedName.startsWith(normalizedQuery)) {
      startsWithMatches.push(facility);
      continue;
    }

    otherMatches.push(facility);
  }

  return [...startsWithMatches, ...otherMatches].slice(0, limit);
}
