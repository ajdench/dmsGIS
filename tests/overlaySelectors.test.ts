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
  {
    id: 'custom',
    name: 'Custom',
    path: 'custom.geojson',
    family: 'customRegions',
    visible: false,
    opacity: 0,
    borderVisible: true,
    borderColor: '#ffffff',
    borderOpacity: 0,
    swatchColor: '#ffffff',
  },
  {
    id: 'englandIcb',
    name: '2026 NHS England ICBs',
    path: 'england-icbs.geojson',
    family: 'englandIcb',
    visible: true,
    opacity: 0,
    borderVisible: true,
    borderColor: '#8f8f8f',
    borderOpacity: 0.35,
    swatchColor: '#8f8f8f',
  },
  {
    id: 'devolvedHb',
    name: 'Devolved Administrations Health Boards',
    path: 'devolved-hbs.geojson',
    family: 'devolvedHb',
    visible: true,
    opacity: 0,
    borderVisible: true,
    borderColor: '#8f8f8f',
    borderOpacity: 0.35,
    swatchColor: '#8f8f8f',
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

  it('keeps the overlays panel broader in Current and exposes shared 2026 boundary overlays in scenario presets', () => {
    expect(getOverlayLayersForPanel(OVERLAYS, 'current')).toEqual([
      OVERLAYS[0],
      OVERLAYS[2],
      OVERLAYS[3],
      OVERLAYS[4],
      OVERLAYS[5],
    ]);
    expect(getOverlayLayersForPanel(OVERLAYS, 'coa3a')).toEqual([
      OVERLAYS[2],
      OVERLAYS[3],
      OVERLAYS[4],
      OVERLAYS[5],
    ]);
  });

  it('returns family-aware overlay sections for the panel', () => {
    const expectedSections = [
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
      {
        family: 'customRegions',
        title: 'Custom Regions',
        showWhenEmpty: false,
        layers: [OVERLAYS[3]],
      },
      {
        family: 'englandIcb',
        title: 'NHS England ICBs',
        showWhenEmpty: false,
        layers: [OVERLAYS[4]],
      },
      {
        family: 'devolvedHb',
        title: 'Devolved Administrations Health Boards',
        showWhenEmpty: false,
        layers: [OVERLAYS[5]],
      },
    ];
    expect(getOverlaySectionsForPanel(OVERLAYS, 'current')).toEqual(expectedSections);
    expect(getOverlaySectionsForPanel(OVERLAYS, 'coa3b')).toEqual([
      {
        family: 'nhsRegions',
        title: 'NHS Regions',
        showWhenEmpty: false,
        layers: [OVERLAYS[2]],
      },
      {
        family: 'customRegions',
        title: 'Custom Regions',
        showWhenEmpty: false,
        layers: [OVERLAYS[3]],
      },
      {
        family: 'englandIcb',
        title: 'NHS England ICBs',
        showWhenEmpty: false,
        layers: [OVERLAYS[4]],
      },
      {
        family: 'devolvedHb',
        title: 'Devolved Administrations Health Boards',
        showWhenEmpty: false,
        layers: [OVERLAYS[5]],
      },
    ]);
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
      'customRegions',
      'englandIcb',
      'devolvedHb',
    ]);
    expect(getOverlayFamiliesForPanel('coa3a', OVERLAYS)).toEqual([
      'nhsRegions',
      'customRegions',
      'englandIcb',
      'devolvedHb',
    ]);
    expect(getOverlayPanelEmptyState('current', 0)).toBe(
      'No overlay datasets are available',
    );
    expect(getOverlayPanelEmptyState('coa3c', 0)).toBe(
      'Additional overlay controls are not available for this preset yet',
    );
  });
});
