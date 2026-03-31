import { describe, expect, it } from 'vitest';
import {
  getActiveWaterEdgePreprocessingProfile,
  getActiveWaterEdgeVisualProfile,
  getWaterEdgeTreatment,
} from '../src/lib/config/waterEdgeTreatment';

describe('water edge treatment config', () => {
  it('parses the staged v3.7 treatment config', () => {
    const config = getWaterEdgeTreatment();

    expect(config.version).toBe('v3.7-review-1');
    expect(config.status).toBe('draft-not-active');
    expect(config.classes).toEqual([
      'sea',
      'estuary',
      'inlandWater',
      'internal',
      'harbourDock',
      'canalCut',
      'lakeReservoir',
      'intertidal',
      'islandFragment',
    ]);
  });

  it('exposes a draft standard preprocessing profile with projected metric tolerances', () => {
    expect(getActiveWaterEdgePreprocessingProfile()).toEqual({
      minTrueCoastOpeningWidthM: 1200,
      maxInlandWaterProjectionWidthM: 350,
      maxInlandProjectionDepthM: 3500,
      minIslandAreaM2: 150000,
      landfillClasses: ['inlandWater'],
      coastalFacilityInsetM: 25,
      devolvedInternalArcSuppressionWidthM: 300,
    });
  });

  it('exposes a runtime visual profile for inland-arc styling tokens', () => {
    expect(getActiveWaterEdgeVisualProfile()).toEqual({
      inlandArcColorMode: 'regionBorder',
      inlandWaterArcOpacity: 0.5,
      estuaryArcOpacity: 0.32,
      inlandArcSelectedOpacity: 0.5,
      inlandArcDash: [5, 5],
      zoomRange: {
        min: 7,
        max: 9.99,
      },
    });
  });
});
