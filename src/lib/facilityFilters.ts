import type { FacilityRecord } from './facilities';
import {
  parseFacilityFilterState,
  type FacilityFilterState,
} from './schemas/facilities';

export type FacilityDefaultVisibilityFilterValue =
  FacilityFilterState['defaultVisibility'];

export interface FacilityTextSearchFilterDefinition {
  id: 'search';
  kind: 'text-search';
  label: 'Search';
  query: string;
  normalizedQuery: string;
  active: boolean;
}

export interface FacilityMultiValueFilterDefinition {
  id: 'regions' | 'types';
  kind: 'multi-value';
  label: 'Regions' | 'Types';
  values: string[];
  normalizedValues: string[];
  active: boolean;
}

export interface FacilityDefaultVisibilityFilterDefinition {
  id: 'defaultVisibility';
  kind: 'default-visibility';
  label: 'Default Visibility';
  value: FacilityDefaultVisibilityFilterValue;
  active: boolean;
}

export interface FacilityFilterFacetOptions {
  regions: string[];
  types: string[];
}

export type FacilityFilterDefinition =
  | FacilityTextSearchFilterDefinition
  | FacilityMultiValueFilterDefinition
  | FacilityDefaultVisibilityFilterDefinition;

export function createFacilityFilterState(
  input: Partial<FacilityFilterState> = {},
): FacilityFilterState {
  return parseFacilityFilterState({
    searchQuery: input.searchQuery ?? '',
    regions: input.regions ?? [],
    types: input.types ?? [],
    defaultVisibility: input.defaultVisibility ?? 'all',
  });
}

export function getFacilityFilterDefinitions(
  state: FacilityFilterState,
): FacilityFilterDefinition[] {
  const normalizedQuery = normalizeFacilitySearchQuery(state.searchQuery);
  const normalizedRegions = normalizeFacilityFilterValues(state.regions);
  const normalizedTypes = normalizeFacilityFilterValues(state.types);

  return [
    {
      id: 'search',
      kind: 'text-search',
      label: 'Search',
      query: state.searchQuery,
      normalizedQuery,
      active: normalizedQuery.length > 0,
    },
    {
      id: 'regions',
      kind: 'multi-value',
      label: 'Regions',
      values: [...state.regions],
      normalizedValues: normalizedRegions,
      active: normalizedRegions.length > 0,
    },
    {
      id: 'types',
      kind: 'multi-value',
      label: 'Types',
      values: [...state.types],
      normalizedValues: normalizedTypes,
      active: normalizedTypes.length > 0,
    },
    {
      id: 'defaultVisibility',
      kind: 'default-visibility',
      label: 'Default Visibility',
      value: state.defaultVisibility,
      active: state.defaultVisibility !== 'all',
    },
  ];
}

export function matchesFacilityFilters(
  facility: FacilityRecord,
  filters: FacilityFilterDefinition[],
): boolean {
  return filters.every((filter) => matchesFacilityFilter(facility, filter));
}

export function matchesFacilityFilter(
  facility: FacilityRecord,
  filter: FacilityFilterDefinition,
): boolean {
  if (!filter.active) {
    return true;
  }

  switch (filter.kind) {
    case 'text-search':
      return facility.searchText.includes(filter.normalizedQuery);
    case 'multi-value': {
      const candidateValues =
        filter.id === 'regions'
          ? [facility.region]
          : filter.id === 'types'
            ? [facility.type]
            : [];
      return candidateValues.some((value) =>
        filter.normalizedValues.includes(normalizeFacilityFilterValue(value)),
      );
    }
    case 'default-visibility':
      return filter.value === 'default-visible'
        ? facility.isDefaultVisible
        : !facility.isDefaultVisible;
  }
}

export function normalizeFacilitySearchQuery(
  query: string,
): string {
  return query.trim().toLowerCase();
}

export function normalizeFacilityFilterValue(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeFacilityFilterValues(values: string[]): string[] {
  return [...new Set(values.map(normalizeFacilityFilterValue).filter(Boolean))];
}

export function getFacilityFilterFacetOptions(
  facilities: FacilityRecord[],
): FacilityFilterFacetOptions {
  return {
    regions: getSortedUniqueFacetValues(facilities.map((facility) => facility.region)),
    types: getSortedUniqueFacetValues(facilities.map((facility) => facility.type)),
  };
}

function getSortedUniqueFacetValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}
