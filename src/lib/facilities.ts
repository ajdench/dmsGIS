import type { FeatureLike } from 'ol/Feature';
import {
  parseFacilityProperties,
  type FacilityProperties,
} from './schemas/facilities';

export function getFacilityFeatureProperties(
  feature: FeatureLike,
): FacilityProperties {
  const values =
    typeof feature.getProperties === 'function' ? feature.getProperties() : {};
  return parseFacilityProperties(values);
}
