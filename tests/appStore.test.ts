import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../src/store/appStore';

describe('appStore region controls', () => {
  beforeEach(() => {
    useAppStore.setState({
      regionGlobalOpacity: 1,
      facilitySymbolSize: 3.5,
      regions: [
        {
          name: 'North',
          visible: true,
          color: '#a7c636',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
        {
          name: 'East',
          visible: true,
          color: '#fc921f',
          opacity: 1,
          borderVisible: true,
          borderColor: '#ffffff',
          borderOpacity: 0,
          symbolSize: 3.5,
        },
      ],
    });
  });

  it('broadcasts PMC global opacity to every region', () => {
    useAppStore.getState().setRegionGlobalOpacity(0.4);

    const { regionGlobalOpacity, regions } = useAppStore.getState();
    expect(regionGlobalOpacity).toBe(0.4);
    expect(regions.map((region) => region.opacity)).toEqual([0.4, 0.4]);
  });

  it('applies global PMC size changes to every region and still allows local overrides', () => {
    useAppStore.getState().setFacilitySymbolSize(5);
    useAppStore.getState().setRegionSymbolSize('East', 7.5);

    const { facilitySymbolSize, regions } = useAppStore.getState();
    expect(facilitySymbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'North')?.symbolSize).toBe(5);
    expect(regions.find((region) => region.name === 'East')?.symbolSize).toBe(7.5);
  });

  it('clamps boundary layer opacity updates', () => {
    useAppStore.getState().setRegionBoundaryLayerOpacity(
      'pmcPopulatedCareBoardBoundaries',
      4,
    );

    const layer = useAppStore
      .getState()
      .regionBoundaryLayers.find(
        (entry) => entry.id === 'pmcPopulatedCareBoardBoundaries',
      );

    expect(layer?.opacity).toBe(1);
  });
});
