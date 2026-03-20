import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getNhsEnglandRegionAssignmentForBoundary,
  getNhsEnglandRegionAssignments,
  getOrderedNhsEnglandRegions,
} from '../src/lib/config/nhsEnglandRegions';

describe('nhsEnglandRegions', () => {
  it('exposes the seven NHS England regions in display order', () => {
    expect(getOrderedNhsEnglandRegions().map((region) => region.label)).toEqual([
      'East of England',
      'London',
      'Midlands',
      'North East and Yorkshire',
      'North West',
      'South East',
      'South West',
    ]);
  });

  it('only applies the assignment catalogue to the 2026 ICB/HB boundary system', () => {
    expect(getNhsEnglandRegionAssignments('legacyIcbHb')).toEqual([]);
    expect(getNhsEnglandRegionAssignments('icbHb2026')).toHaveLength(36);
    expect(
      getNhsEnglandRegionAssignmentForBoundary(
        'legacyIcbHb',
        'E54000070',
        'NHS Thames Valley Integrated Care Board',
      ),
    ).toBeNull();
  });

  it('matches every English ICB feature in the 2026 boundary dataset to an NHS England region', () => {
    const filePath = path.resolve(
      __dirname,
      '../public/data/regions/UK_Health_Board_Boundaries_Codex_2026_exact_geojson_updated.geojson',
    );
    const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
      features: Array<{
        properties: {
          boundary_type?: string;
          boundary_code?: string;
          boundary_name?: string;
        };
      }>;
    };

    const englishIcbFeatures = geojson.features.filter(
      (feature) => feature.properties.boundary_type === 'ICB',
    );
    expect(englishIcbFeatures).toHaveLength(36);

    const resolvedAssignments = englishIcbFeatures.map((feature) =>
      getNhsEnglandRegionAssignmentForBoundary(
        'icbHb2026',
        feature.properties.boundary_code,
        feature.properties.boundary_name,
      ),
    );

    expect(resolvedAssignments.every(Boolean)).toBe(true);
    expect(
      new Set(resolvedAssignments.map((assignment) => assignment?.boundaryCode)).size,
    ).toBe(36);
  });

  it('keeps the expected 2026 ICB counts per NHS England region', () => {
    const counts = getNhsEnglandRegionAssignments('icbHb2026').reduce<
      Record<string, number>
    >((acc, assignment) => {
      acc[assignment.regionId] = (acc[assignment.regionId] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts).toEqual({
      eastOfEngland: 3,
      london: 4,
      midlands: 11,
      northEastAndYorkshire: 4,
      northWest: 3,
      southEast: 4,
      southWest: 7,
    });
  });
});
