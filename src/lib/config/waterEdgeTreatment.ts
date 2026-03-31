import rawConfig from './waterEdgeTreatment.json';
import {
  parseWaterEdgeTreatment,
  type WaterEdgeProfileId,
  type WaterEdgePreprocessingProfile,
  type WaterEdgeTreatment,
  type WaterEdgeVisualProfile,
} from '../schemas/waterEdgeTreatment';

const config = parseWaterEdgeTreatment(rawConfig);

export const WATER_EDGE_TREATMENT: WaterEdgeTreatment = config;

export function getWaterEdgeTreatment(): WaterEdgeTreatment {
  return config;
}

export function isWaterEdgeTreatmentActiveForBuild(): boolean {
  return config.status === 'active-review' || config.status === 'active';
}

export function getActiveWaterEdgePreprocessingProfile(): WaterEdgePreprocessingProfile {
  return getWaterEdgePreprocessingProfile(config.preprocessing.activeProfileId);
}

export function getWaterEdgePreprocessingProfile(
  profileId: WaterEdgeProfileId,
): WaterEdgePreprocessingProfile {
  const profile = config.preprocessing.profiles[profileId];
  if (!profile) {
    throw new Error(`Missing water-edge preprocessing profile: ${profileId}`);
  }
  return profile;
}

export function getActiveWaterEdgeVisualProfile(): WaterEdgeVisualProfile {
  return getWaterEdgeVisualProfile(config.runtime.activeVisualProfileId);
}

export function getWaterEdgeVisualProfile(
  profileId: WaterEdgeProfileId,
): WaterEdgeVisualProfile {
  const profile = config.runtime.visualProfiles[profileId];
  if (!profile) {
    throw new Error(`Missing water-edge visual profile: ${profileId}`);
  }
  return profile;
}
