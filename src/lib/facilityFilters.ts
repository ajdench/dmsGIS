import type { FacilityRecord } from './facilities';
import {
  parseFacilityFilterState,
  type FacilityFilterState,
} from './schemas/facilities';

export interface FacilityTextSearchFilterDefinition {
  id: 'search';
  kind: 'text-search';
  label: 'Search';
  query: string;
  normalizedQuery: string;
  active: boolean;
}

export type FacilityFilterDefinition = FacilityTextSearchFilterDefinition;

export function createFacilityFilterState(
  input: Partial<FacilityFilterState> = {},
): FacilityFilterState {
  return parseFacilityFilterState({
    searchQuery: input.searchQuery ?? '',
  });
}

export function getFacilityFilterDefinitions(
  state: FacilityFilterState,
): FacilityFilterDefinition[] {
  const normalizedQuery = normalizeFacilitySearchQuery(state.searchQuery);

  return [
    {
      id: 'search',
      kind: 'text-search',
      label: 'Search',
      query: state.searchQuery,
      normalizedQuery,
      active: normalizedQuery.length > 0,
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

  return facility.searchText.includes(filter.normalizedQuery);
}

export function normalizeFacilitySearchQuery(query: string): string {
  return query.trim().toLowerCase();
}
