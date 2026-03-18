import { describe, expect, it } from 'vitest';
import { createFacilityRecord } from '../src/lib/facilities';
import {
  createFacilityFilterState,
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
  normalizeFacilitySearchQuery,
} from '../src/lib/facilityFilters';
import { parseFacilityProperties } from '../src/lib/schemas/facilities';

describe('facilityFilters', () => {
  it('normalizes facility filter state', () => {
    expect(
      createFacilityFilterState({
        searchQuery: '  North  ',
      }),
    ).toEqual({
      searchQuery: '  North  ',
    });
  });

  it('builds a text-search filter definition from state', () => {
    expect(
      getFacilityFilterDefinitions(
        createFacilityFilterState({
          searchQuery: '  North  ',
        }),
      ),
    ).toEqual([
      {
        id: 'search',
        kind: 'text-search',
        label: 'Search',
        query: '  North  ',
        normalizedQuery: 'north',
        active: true,
      },
    ]);
  });

  it('matches a facility against active filter definitions', () => {
    const facility = createFacilityRecord(
      parseFacilityProperties({
        id: 'XYZ',
        name: 'Another',
        type: 'pmc-facility',
        region: 'North',
      }),
    );
    const filters = getFacilityFilterDefinitions(
      createFacilityFilterState({ searchQuery: 'another' }),
    );

    expect(normalizeFacilitySearchQuery('  North  ')).toBe('north');
    expect(matchesFacilityFilters(facility, filters)).toBe(true);
    expect(
      matchesFacilityFilters(
        facility,
        getFacilityFilterDefinitions(
          createFacilityFilterState({ searchQuery: 'missing' }),
        ),
      ),
    ).toBe(false);
  });
});
