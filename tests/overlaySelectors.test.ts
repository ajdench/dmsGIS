import { describe, expect, it } from 'vitest';
import type { OverlayLayerStyle } from '../src/types';
import {
  getOverlayLayersByFamily,
  getOverlayLayersForPanel,
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

  it('keeps the overlays panel on current board overlays only', () => {
    expect(getOverlayLayersForPanel(OVERLAYS, 'current')).toEqual([OVERLAYS[0]]);
    expect(getOverlayLayersForPanel(OVERLAYS, 'coa3a')).toEqual([]);
  });

  it('returns family-aware overlay sections for the panel', () => {
    expect(getOverlaySectionsForPanel(OVERLAYS, 'current')).toEqual([
      {
        family: 'boardBoundaries',
        title: 'Board Boundaries',
        layers: [OVERLAYS[0]],
      },
    ]);
    expect(getOverlaySectionsForPanel(OVERLAYS, 'coa3b')).toEqual([]);
  });
});
