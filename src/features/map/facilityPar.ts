import type { FeatureLike } from 'ol/Feature';
import type VectorSource from 'ol/source/Vector';
import { getEffectiveFacilityRegionAssignment } from './scenarioFacilityMapping';
import { getGroupNameForCode } from '../../lib/config/viewPresets';
import {
  parseFacilityParValue,
  resolveCurrentRoyalNavyFallbackRegion,
} from '../../lib/facilityPar';
import type { ViewPresetId } from '../../types';
import { findScenarioAssignmentFeatureAtCoordinate } from './scenarioAssignmentAuthority';

export { formatParDisplayValue, parseFacilityParValue } from '../../lib/facilityPar';
export {
  buildProportionalParCorrectionSummary,
  formatProportionalParCorrectionContext,
} from '../../lib/facilityPar';

export interface SelectedFacilityParSummary {
  facilityPar: number | null;
  practicePar: number | null;
  regionPar: number | null;
  baseportPar: number | null;
  totalPar: number | null;
}

export function buildSelectedFacilityParSummary(params: {
  facilityFeatures: FeatureLike[];
  selectedFacilityId: string | null;
  selectedRegionName: string | null;
  assignmentSource: VectorSource | null;
  activeViewPreset: ViewPresetId;
}): SelectedFacilityParSummary {
  const {
    facilityFeatures,
    selectedFacilityId,
    selectedRegionName,
    assignmentSource,
    activeViewPreset,
  } = params;

  if (!selectedRegionName) {
    return {
      facilityPar: null,
      practicePar: null,
      regionPar: null,
      baseportPar: null,
      totalPar: null,
    };
  }

  let facilityPar: number | null = null;
  let selectedPracticeName: string | null = null;
  let practicePar = 0;
  let practiceHasPar = false;
  let regionPar = 0;
  let regionHasPar = false;
  let baseportPar = 0;
  let baseportHasPar = false;

  if (selectedFacilityId) {
    for (const feature of facilityFeatures) {
      const featureId = readFeatureValue(feature, 'id');
      const combinedPracticeName = parseFacilityPracticeName(
        readFeatureValue(feature, 'combined_practice'),
      );

      if (featureId === selectedFacilityId) {
        selectedPracticeName = combinedPracticeName;
        facilityPar = parseFacilityParValue(readFeatureValue(feature, 'par'));
        break;
      }
    }
  }

  for (const feature of facilityFeatures) {
    const featurePar = parseFacilityParValue(readFeatureValue(feature, 'par'));
    const combinedPracticeName = parseFacilityPracticeName(
      readFeatureValue(feature, 'combined_practice'),
    );
    const originalRegionName = parseFacilityRegionName(readFeatureValue(feature, 'region'));
    const effectiveRegionName = resolveParRegionName(
      feature,
      assignmentSource,
      activeViewPreset,
    );
    if (featurePar !== null) {
      if (
        selectedPracticeName &&
        combinedPracticeName &&
        combinedPracticeName === selectedPracticeName
      ) {
        practicePar += featurePar;
        practiceHasPar = true;
      }

      if (effectiveRegionName === selectedRegionName) {
        if (isRoyalNavyBaseportFacility(originalRegionName)) {
          baseportPar += featurePar;
          baseportHasPar = true;
        } else {
          regionPar += featurePar;
          regionHasPar = true;
        }
      }
    }
  }

  const totalParValue =
    (regionHasPar ? regionPar : 0) + (baseportHasPar ? baseportPar : 0);
  const totalHasPar = regionHasPar || baseportHasPar;

  return {
    facilityPar,
    practicePar: practiceHasPar ? practicePar : null,
    regionPar: regionHasPar ? regionPar : null,
    baseportPar: baseportHasPar ? baseportPar : null,
    totalPar: totalHasPar ? totalParValue : null,
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

function parseFacilityPracticeName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseFacilityRegionName(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
}

function isRoyalNavyBaseportFacility(regionName: string | null): boolean {
  return regionName === 'Royal Navy';
}

function resolveParRegionName(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string {
  const regionAssignment = getEffectiveFacilityRegionAssignment(feature, assignmentSource);
  const originalRegionName = parseFacilityRegionName(readFeatureValue(feature, 'region'));

  if (!isRoyalNavyBaseportFacility(originalRegionName)) {
    return regionAssignment.regionName;
  }

  const mappedBoundaryGroup = resolveBoundaryCodeGroupName(
    feature,
    assignmentSource,
    activeViewPreset,
  );
  return mappedBoundaryGroup ?? regionAssignment.regionName;
}

function resolveBoundaryCodeGroupName(
  feature: FeatureLike,
  assignmentSource: VectorSource | null,
  activeViewPreset: ViewPresetId,
): string | null {
  if (!assignmentSource) {
    return null;
  }

  const coordinate = getFeaturePointCoordinate(feature);
  if (!coordinate) {
    return null;
  }

  const assignmentFeature = findScenarioAssignmentFeatureAtCoordinate(
    assignmentSource,
    coordinate,
  );
  if (!assignmentFeature) {
    return null;
  }

  const boundaryCode = String(assignmentFeature.get('boundary_code') ?? '').trim();
  if (!boundaryCode) {
    return null;
  }

  return (
    getGroupNameForCode(activeViewPreset, boundaryCode) ??
    resolveCurrentRoyalNavyFallbackRegion({
      regionName: parseFacilityRegionName(readFeatureValue(feature, 'region')),
      legacyBoundaryCode: boundaryCode,
      boundaryCode2026: readFeatureValue(feature, 'icb_hb_code_2026'),
      preset: activeViewPreset,
    })
  );
}

function getFeaturePointCoordinate(feature: FeatureLike): [number, number] | null {
  if (
    typeof (feature as { getGeometry?: () => { getType?: () => string; getCoordinates?: () => number[] } | null })
      .getGeometry === 'function'
  ) {
    const geometry = (
      feature as {
        getGeometry: () => { getType?: () => string; getCoordinates?: () => number[] } | null;
      }
    ).getGeometry();
    if (
      geometry?.getType?.() === 'Point' &&
      typeof geometry.getCoordinates === 'function'
    ) {
      const coordinates = geometry.getCoordinates();
      if (coordinates.length >= 2) {
        return [coordinates[0], coordinates[1]];
      }
    }
  }

  return null;
}
