import { describe, expect, it } from 'vitest';
import {
  buildFacilitiesGeoJson,
  normalizeFacilityRegion,
  PMC_REGION_COLORS,
} from '../scripts/import-facilities-csv.mjs';

describe('import-facilities-csv', () => {
  it('normalizes the replacement CSV region names to the production PMC set', () => {
    expect(normalizeFacilityRegion('', 'Hamworthy Napier Road Medical Centre')).toBe(
      'South West',
    );
    expect(normalizeFacilityRegion('Royal Navy Baseport', 'BP1 Portsmouth Medical Centre')).toBe(
      'Royal Navy',
    );
    expect(normalizeFacilityRegion('Scotland & North', 'Fylingdales Medical Centre')).toBe(
      'Scotland & Northern Ireland',
    );
  });

  it('builds active facility features with the expected PMC region colours', () => {
    const csv = [
      'AD_ID,Site,Combined  Practice,Region ,Active DMICP ID,Legacy DMICP ID,Status,Parent,Postcode,Latitude,Longitude,PAR',
      'SSMP24,Hamworthy Napier Road Medical Centre,South West Combined Medical Practice,,123,456,Open,Child,BH15 4NQ,50.718,-2.001,',
      'BP1,Portsmouth Medical Centre,Royal Navy Baseport Combined Medical Practice,Royal Navy Baseport,789,,Open,Parent,PO1 3LT,50.799,-1.088,',
      'FY1,Fylingdales Medical Centre,North Combined Medical Practice,Scotland & North,333,444,Open,Child,YO22 4UF,54.366,-0.663,',
    ].join('\n');

    const result = buildFacilitiesGeoJson(csv);

    expect(result.features).toHaveLength(3);
    expect(result.features.map((feature) => feature.properties.region)).toEqual([
      'South West',
      'Royal Navy',
      'Scotland & Northern Ireland',
    ]);
    expect(result.features.map((feature) => feature.properties.point_color_hex)).toEqual([
      PMC_REGION_COLORS['South West'],
      PMC_REGION_COLORS['Royal Navy'],
      PMC_REGION_COLORS['Scotland & Northern Ireland'],
    ]);
    expect(result.features.map((feature) => feature.properties.default_visible)).toEqual([1, 1, 1]);
  });

  it('applies documented coordinate overrides when the replacement CSV is missing them', () => {
    const csv = [
      'AD_ID,Site,Combined  Practice,Region ,Active DMICP ID,Legacy DMICP ID,Status,Parent,Postcode,Latitude,Longitude,PAR',
      'SSMP37,Nairobi Medical Centre,Nairobi Medical Centre,Overseas,,,Closed,Closed,BF1 3AF,,,',
    ].join('\n');

    const result = buildFacilitiesGeoJson(csv);
    expect(result.features[0].geometry.coordinates).toEqual([36.821946, -1.292066]);
    expect(result.features[0].properties.coordinate_source).toBe('override');
  });

  it('turns closed facilities off by default while keeping open facilities on', () => {
    const csv = [
      'AD_ID,Site,Combined  Practice,Region ,Active DMICP ID,Legacy DMICP ID,Status,Parent,Postcode,Latitude,Longitude,PAR',
      'OPEN1,Open Medical Centre,Open Practice,East,1,2,Open,Parent,AA1 1AA,52.1,0.1,',
      'CLOSED1,Closed Medical Centre,Closed Practice,East,3,4,Closed,Parent,AA1 1AB,52.2,0.2,',
    ].join('\n');

    const result = buildFacilitiesGeoJson(csv);

    expect(result.features.map((feature) => feature.properties.default_visible)).toEqual([1, 0]);
  });
});
