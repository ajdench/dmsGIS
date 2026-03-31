import { describe, expect, it } from 'vitest';
import {
  buildFacilitySearchSuggestions,
  extractFacilitySuggestionRecords,
} from '../src/lib/facilitySearchSuggestions';

describe('facilitySearchSuggestions', () => {
  it('extracts unique trimmed facility records in sorted order', () => {
    expect(
      extractFacilitySuggestionRecords({
        features: [
          { properties: { id: '1', name: ' HMS Drake ', type: 'PMC', region: 'North' } },
          { properties: { id: '2', name: 'DMRC Stanford Hall', type: 'PMC', region: 'South' } },
          { properties: { id: '3', name: 'HMS Drake', type: 'PMC', region: 'North' } },
          { properties: { name: '' } },
          { properties: {} },
        ],
      }).map((facility) => facility.displayName),
    ).toEqual(['DMRC Stanford Hall', 'HMS Drake']);
  });

  it('returns alphabetical defaults when the query is empty', () => {
    expect(
      buildFacilitySearchSuggestions(
        extractFacilitySuggestionRecords({
          features: [
            { properties: { id: '1', name: 'Zulu Medical Centre', type: 'PMC', region: 'East' } },
            { properties: { id: '2', name: 'Aldershot Medical Centre', type: 'PMC', region: 'South' } },
            { properties: { id: '3', name: 'Catterick Medical Centre', type: 'PMC', region: 'North' } },
          ],
        }),
        '',
        2,
      ),
    ).toEqual([
      'Aldershot Medical Centre',
      'Catterick Medical Centre',
      'Zulu Medical Centre',
    ]);
  });

  it('prefers starts-with matches before includes matches', () => {
    expect(
      buildFacilitySearchSuggestions(
        extractFacilitySuggestionRecords({
          features: [
            { properties: { id: '1', name: 'Stanford Hall', type: 'PMC', region: 'East' } },
            { properties: { id: '2', name: 'Hallam Medical Centre', type: 'PMC', region: 'East' } },
            { properties: { id: '3', name: 'Royal Hall Hospital', type: 'PMC', region: 'East' } },
            { properties: { id: '4', name: 'The Hall', type: 'PMC', region: 'East' } },
          ],
        }),
        'hall',
      ),
    ).toEqual([
      'Hallam Medical Centre',
      'Royal Hall Hospital',
      'Stanford Hall',
      'The Hall',
    ]);
  });

  it('uses the same broader search semantics as facility filtering', () => {
    expect(
      buildFacilitySearchSuggestions(
        extractFacilitySuggestionRecords({
          features: [
            { properties: { id: '1', name: 'DMRC Stanford Hall', type: 'PMC', region: 'East' } },
            { properties: { id: '2', name: 'Aldershot Medical Centre', type: 'PMC', region: 'South' } },
          ],
        }),
        'south',
      ),
    ).toEqual(['Aldershot Medical Centre']);
  });
});
