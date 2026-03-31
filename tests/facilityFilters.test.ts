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

  it('builds search filter definitions from state', () => {
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

  it('matches a facility against the active search filter definition', () => {
    const visibleFacility = createFacilityRecord(
      parseFacilityProperties({
        id: 'XYZ',
        name: 'Another',
        type: 'pmc-facility',
        region: 'North',
        default_visible: 1,
      }),
    );
    const hiddenFacility = createFacilityRecord(
      parseFacilityProperties({
        id: 'ZZZ',
        name: 'Hidden',
        type: 'satellite',
        region: 'South',
        default_visible: 0,
      }),
    );
    const filters = getFacilityFilterDefinitions(
      createFacilityFilterState({
        searchQuery: 'another',
      }),
    );

    expect(normalizeFacilitySearchQuery('  North  ')).toBe('north');
    expect(matchesFacilityFilters(visibleFacility, filters)).toBe(true);
    expect(
      matchesFacilityFilters(
        hiddenFacility,
        getFacilityFilterDefinitions(
          createFacilityFilterState({
            searchQuery: 'another',
          }),
        ),
      ),
    ).toBe(false);
  });
});
