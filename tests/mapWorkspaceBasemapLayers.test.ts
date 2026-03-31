import { describe, expect, it } from 'vitest';
import {
  createBasemapLayers,
  createLandFillStyle,
  resolveMapSeaFillBackground,
} from '../src/features/map/MapWorkspace';

describe('map workspace basemap layer ordering', () => {
  it('renders the local UK sea patch above the global land fill', () => {
    const layers = createBasemapLayers();

    expect(layers.ukAlignmentMask.getZIndex()).toBeGreaterThan(
      layers.landFill.getZIndex() ?? Number.NEGATIVE_INFINITY,
    );
    expect(layers.ukAlignedLandFill.getZIndex()).toBeGreaterThan(
      layers.ukAlignmentMask.getZIndex() ?? Number.NEGATIVE_INFINITY,
    );
  });

  it('keeps land fill styles stroke-free so land does not outline into visible sea/product fills', () => {
    const style = createLandFillStyle('#ecf0e6');

    expect(style.getStroke()).toBeNull();
  });

  it('turns the map shell sea background off when Sea is hidden', () => {
    expect(
      resolveMapSeaFillBackground({
        showSeaFill: false,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 1,
      }),
    ).toBe('transparent');

    expect(
      resolveMapSeaFillBackground({
        showSeaFill: true,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 0.6,
      }),
    ).toBe('rgba(217, 231, 245, 0.6)');
  });
});
