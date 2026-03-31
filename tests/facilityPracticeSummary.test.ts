import { describe, expect, it } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { buildSelectedFacilityPracticeSummary } from '../src/features/map/facilityPracticeSummary';

describe('facilityPracticeSummary', () => {
  it('returns a combined-practice summary only when more than one facility shares the same combined practice', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 1]),
        id: 'FAC-1',
        name: 'Kentigern House Medical Centre',
        combined_practice: 'West of Scotland Combined Medical Practice',
      }),
      new Feature({
        geometry: new Point([2, 2]),
        id: 'FAC-2',
        name: 'Clyde Medical Centre',
        combined_practice: 'West of Scotland Combined Medical Practice',
      }),
      new Feature({
        geometry: new Point([3, 3]),
        id: 'FAC-3',
        name: 'Abbey Wood Medical Centre',
        combined_practice: 'Abbey Wood Medical Centre',
      }),
    ];

    expect(
      buildSelectedFacilityPracticeSummary({
        facilityFeatures: features,
        selectedFacilityId: 'FAC-1',
      }),
    ).toEqual({
      isCombinedPractice: true,
      combinedPracticeName: 'West of Scotland Combined Medical Practice',
      memberFacilities: [
        {
          facilityId: 'FAC-2',
          facilityName: 'Clyde Medical Centre',
        },
      ],
    });

    expect(
      buildSelectedFacilityPracticeSummary({
        facilityFeatures: features,
        selectedFacilityId: 'FAC-3',
      }),
    ).toEqual({
      isCombinedPractice: false,
      combinedPracticeName: null,
      memberFacilities: [],
    });
  });

  it('excludes closed facilities from the combined-practice member list', () => {
    const features = [
      new Feature({
        geometry: new Point([1, 1]),
        id: 'FAC-1',
        name: 'Stonehouse Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        default_visible: 1,
      }),
      new Feature({
        geometry: new Point([2, 2]),
        id: 'FAC-2',
        name: 'The Royal Citadel Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        default_visible: 0,
      }),
      new Feature({
        geometry: new Point([3, 3]),
        id: 'FAC-3',
        name: 'Devonport Medical Centre',
        combined_practice: 'Stonehouse Combined Medical Practice',
        default_visible: 1,
      }),
    ];

    expect(
      buildSelectedFacilityPracticeSummary({
        facilityFeatures: features,
        selectedFacilityId: 'FAC-1',
      }),
    ).toEqual({
      isCombinedPractice: true,
      combinedPracticeName: 'Stonehouse Combined Medical Practice',
      memberFacilities: [
        {
          facilityId: 'FAC-3',
          facilityName: 'Devonport Medical Centre',
        },
      ],
    });
  });
});
