import { describe, expect, it } from 'vitest';
import { createFacilityRecord } from '../src/lib/facilities';
import {
  createFacilityFilterState,
  getFacilityFilterFacetOptions,
  getFacilityFilterDefinitions,
  matchesFacilityFilters,
  normalizeFacilityFilterValues,
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
      regions: [],
      types: [],
      defaultVisibility: 'all',
    });
  });

  it('builds typed filter definitions from state', () => {
    expect(
      getFacilityFilterDefinitions(
        createFacilityFilterState({
          searchQuery: '  North  ',
          regions: [' North ', 'East'],
          types: ['pmc-facility'],
          defaultVisibility: 'default-visible',
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
      {
        id: 'regions',
        kind: 'multi-value',
        label: 'Regions',
        values: ['North', 'East'],
        normalizedValues: ['north', 'east'],
        active: true,
      },
      {
        id: 'types',
        kind: 'multi-value',
        label: 'Types',
        values: ['pmc-facility'],
        normalizedValues: ['pmc-facility'],
        active: true,
      },
      {
        id: 'defaultVisibility',
        kind: 'default-visibility',
        label: 'Default Visibility',
        value: 'default-visible',
        active: true,
      },
    ]);
  });

  it('matches a facility against active filter definitions', () => {
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
        regions: ['North'],
        types: ['pmc-facility'],
        defaultVisibility: 'default-visible',
      }),
    );

    expect(normalizeFacilitySearchQuery('  North  ')).toBe('north');
    expect(normalizeFacilityFilterValues([' North ', 'North', 'East'])).toEqual([
      'north',
      'east',
    ]);
    expect(matchesFacilityFilters(visibleFacility, filters)).toBe(true);
    expect(
      matchesFacilityFilters(
        hiddenFacility,
        getFacilityFilterDefinitions(
          createFacilityFilterState({
            searchQuery: '',
            regions: ['South'],
            types: ['satellite'],
            defaultVisibility: 'default-visible',
          }),
        ),
      ),
    ).toBe(false);
  });

  it('derives sorted region and type facet options from facilities', () => {
    const facilities = [
      createFacilityRecord(
        parseFacilityProperties({
          id: 'A',
          name: 'Alpha',
          type: 'pmc-facility',
          region: 'North',
        }),
      ),
      createFacilityRecord(
        parseFacilityProperties({
          id: 'B',
          name: 'Beta',
          type: 'satellite',
          region: 'South',
        }),
      ),
      createFacilityRecord(
        parseFacilityProperties({
          id: 'C',
          name: 'Gamma',
          type: 'pmc-facility',
          region: 'North',
        }),
      ),
    ];

    expect(getFacilityFilterFacetOptions(facilities)).toEqual({
      regions: ['North', 'South'],
      types: ['pmc-facility', 'satellite'],
    });
  });
});
