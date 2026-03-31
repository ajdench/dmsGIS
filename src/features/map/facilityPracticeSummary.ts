import type { FeatureLike } from 'ol/Feature';

export interface SelectedFacilityPracticeSummary {
  isCombinedPractice: boolean;
  combinedPracticeName: string | null;
  memberFacilities: SelectedFacilityPracticeMember[];
}

export interface SelectedFacilityPracticeMember {
  facilityId: string;
  facilityName: string;
}

export function buildSelectedFacilityPracticeSummary(params: {
  facilityFeatures: FeatureLike[];
  selectedFacilityId: string | null;
}): SelectedFacilityPracticeSummary {
  const { facilityFeatures, selectedFacilityId } = params;

  if (!selectedFacilityId) {
    return createDefaultPracticeSummary();
  }

  let selectedFacilityName: string | null = null;
  let selectedCombinedPracticeName: string | null = null;

  for (const feature of facilityFeatures) {
    if (!isFeatureDefaultVisible(feature)) {
      continue;
    }

    const featureId = normalizeText(readFeatureValue(feature, 'id'));
    if (featureId !== selectedFacilityId) {
      continue;
    }

    selectedFacilityName = normalizeText(readFeatureValue(feature, 'name'));
    selectedCombinedPracticeName = normalizeText(readFeatureValue(feature, 'combined_practice'));
    break;
  }

  if (!selectedCombinedPracticeName) {
    return createDefaultPracticeSummary();
  }

  const memberFacilitiesById = new Map<string, SelectedFacilityPracticeMember>();

  for (const feature of facilityFeatures) {
    if (!isFeatureDefaultVisible(feature)) {
      continue;
    }

    const combinedPracticeName = normalizeText(readFeatureValue(feature, 'combined_practice'));
    if (combinedPracticeName !== selectedCombinedPracticeName) {
      continue;
    }

    const facilityId = normalizeText(readFeatureValue(feature, 'id'));
    const facilityName = normalizeText(readFeatureValue(feature, 'name'));
    if (facilityId && facilityName) {
      memberFacilitiesById.set(facilityId, {
        facilityId,
        facilityName,
      });
    }
  }

  const memberFacilities = [...memberFacilitiesById.values()]
    .filter((facility) => facility.facilityName !== selectedFacilityName)
    .sort((left, right) => left.facilityName.localeCompare(right.facilityName, 'en-GB'));

  if (memberFacilities.length === 0) {
    return createDefaultPracticeSummary();
  }

  return {
    isCombinedPractice: true,
    combinedPracticeName: selectedCombinedPracticeName,
    memberFacilities,
  };
}

function createDefaultPracticeSummary(): SelectedFacilityPracticeSummary {
  return {
    isCombinedPractice: false,
    combinedPracticeName: null,
    memberFacilities: [],
  };
}

function readFeatureValue(feature: FeatureLike, key: string): unknown {
  if (typeof feature.get === 'function') {
    return feature.get(key);
  }

  const values =
    typeof (feature as { getProperties?: () => Record<string, unknown> }).getProperties === 'function'
      ? (feature as { getProperties: () => Record<string, unknown> }).getProperties()
      : null;

  return values?.[key];
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function isFeatureDefaultVisible(feature: FeatureLike): boolean {
  const value = readFeatureValue(feature, 'default_visible');

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  return true;
}
