import { describe, expect, it } from 'vitest';
import type { OverlayLayerStyle } from '../src/types';
import {
  getOverlayFamiliesForPanel,
  getOverlayFamilyMetadata,
  getOverlayFamilyOrder,
  getOverlayLayersByFamily,
  getOverlayLayersForPanel,
  getOverlayPanelEmptyState,
  getOverlaySectionsForPanel,
} from '../src/features/groups/overlaySelectors';

const OVERLAYS: OverlayLayerStyle[] = [
  {
    id: 'boards',
    name: 'Boards',
    path: 'boards.geojson',
    family: 'boardBoundaries',
    visible: true,
    opacity: 1,
    borderVisible: true,
    borderColor: '#000000',
    borderOpacity: 1,
    swatchColor: '#000000',
  },
  {
    id: 'scenario',
    name: 'Scenario',
    path: 'scenario.geojson',
    family: 'scenarioRegions',
    visible: false,
    opacity: 0,
    borderVisible: true,
    borderColor: '#ffffff',
    borderOpacity: 0,
    swatchColor: '#ffffff',
  },
  {
    id: 'nhs',
    name: 'NHS',
    path: 'nhs.geojson',
    family: 'nhsRegions',
    visible: false,
    opacity: 0,
    borderVisible: true,
    borderColor: '#ffffff',
    borderOpacity: 0,
    swatchColor: '#ffffff',
  },
];

describe('overlay selectors', () => {
  it('filters overlay layers by family', () => {
    expect(getOverlayLayersByFamily(OVERLAYS, 'boardBoundaries')).toEqual([
      OVERLAYS[0],
    ]);
    expect(getOverlayLayersByFamily(OVERLAYS, 'scenarioRegions')).toEqual([
      OVERLAYS[1],
    ]);
  });

  it('keeps the overlays panel data-driven for current overlay families only', () => {
    expect(getOverlayLayersForPanel(OVERLAYS, 'current')).toEqual([
      OVERLAYS[0],
      OVERLAYS[2],
    ]);
    expect(getOverlayLayersForPanel(OVERLAYS, 'coa3a')).toEqual([]);
  });

  it('returns family-aware overlay sections for the panel', () => {
    expect(getOverlaySectionsForPanel(OVERLAYS, 'current')).toEqual([
      {
        family: 'boardBoundaries',
        title: 'Board Boundaries',
        showWhenEmpty: false,
        layers: [OVERLAYS[0]],
      },
      {
        family: 'nhsRegions',
        title: 'NHS Regions',
        showWhenEmpty: false,
        layers: [OVERLAYS[2]],
      },
    ]);
    expect(getOverlaySectionsForPanel(OVERLAYS, 'coa3b')).toEqual([]);
  });

  it('exposes overlay family metadata for future panel expansion', () => {
    expect(getOverlayFamilyMetadata('nhsRegions')).toMatchObject({
      family: 'nhsRegions',
      title: 'NHS Regions',
      order: 3,
      showWhenEmpty: false,
    });
    expect(getOverlayFamilyOrder('customRegions')).toBe(4);
    expect(getOverlayFamiliesForPanel('current', OVERLAYS)).toEqual([
      'boardBoundaries',
      'nhsRegions',
    ]);
    expect(getOverlayFamiliesForPanel('coa3a')).toEqual([]);
    expect(getOverlayPanelEmptyState('current', 0)).toBe(
      'No overlay datasets are available',
    );
    expect(getOverlayPanelEmptyState('coa3c', 0)).toBe(
      'Additional overlay controls are not available for this preset yet',
    );
  });
});
