import type { FeatureLike } from 'ol/Feature';
import {
  parseFacilityProperties,
  type FacilityProperties,
} from './schemas/facilities';

export interface FacilityRecord extends FacilityProperties {
  displayName: string;
  searchText: string;
  isDefaultVisible: boolean;
  hasSnappedCoordinates: boolean;
}

export function getFacilityFeatureProperties(
  feature: FeatureLike,
): FacilityProperties {
  const values =
    typeof feature.getProperties === 'function'
      ? feature.getProperties()
      : getFeatureValuesFromGetters(feature);
  return parseFacilityProperties(values);
}

export function getFacilityRecord(
  feature: FeatureLike,
): FacilityRecord {
  return createFacilityRecord(getFacilityFeatureProperties(feature));
}

export function createFacilityRecord(
  properties: FacilityProperties,
): FacilityRecord {
  const displayName = properties.name.trim() || 'Unnamed facility';
  const searchText = [
    properties.id,
    displayName,
    properties.region,
    properties.type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return {
    ...properties,
    displayName,
    searchText,
    isDefaultVisible: properties.default_visible !== 0,
    hasSnappedCoordinates: properties.snapped_to_land === true,
  };
}

function getFeatureValuesFromGetters(
  feature: FeatureLike,
): Record<string, unknown> {
  if (typeof feature.get !== 'function') {
    return {};
  }

  return {
    id: feature.get('id'),
    name: feature.get('name'),
    type: feature.get('type'),
    region: feature.get('region'),
    default_visible: feature.get('default_visible'),
    point_color_hex: feature.get('point_color_hex'),
    point_alpha: feature.get('point_alpha'),
    lon_original: feature.get('lon_original'),
    lat_original: feature.get('lat_original'),
    snapped_to_land: feature.get('snapped_to_land'),
    snap_distance_m: feature.get('snap_distance_m'),
  };
}
