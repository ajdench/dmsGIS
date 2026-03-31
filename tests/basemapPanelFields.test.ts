import { describe, expect, it, vi } from 'vitest';
import { buildBasemapPanelRows } from '../src/features/basemap/basemapPanelFields';

describe('basemapPanelFields', () => {
  it('keeps layer controls in colour then opacity order', () => {
    const rows = buildBasemapPanelRows({
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#ecf0e6',
        landFillOpacity: 1,
        showLandFill: true,
        countryBorderColor: '#ebebeb',
        countryBorderOpacity: 1,
        showCountryBorders: true,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 0.4,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 0.65,
        showMajorCities: false,
        regionLabelColor: '#334155',
        regionLabelOpacity: 0.5,
        showRegionLabels: false,
        networkLabelColor: '#475569',
        networkLabelOpacity: 0.55,
        showNetworkLabels: false,
        facilityLabelColor: '#111827',
        facilityLabelOpacity: 0.7,
        showFacilityLabels: false,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 1,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
      setBasemapLayerVisibility: vi.fn(),
      setBasemapElementColor: vi.fn(),
      setBasemapElementOpacity: vi.fn(),
    });

    expect(rows[0].sections[0].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Opacity',
    ]);
    expect(rows[1].sections[0].fields.map((field) => field.label)).toEqual([
      'Colour',
      'Opacity',
    ]);
  });

  it('adds right-side neutral reset helpers to Land and Sea opacity sliders', () => {
    const rows = buildBasemapPanelRows({
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#ecf0e6',
        landFillOpacity: 0.72,
        showLandFill: true,
        countryBorderColor: '#ebebeb',
        countryBorderOpacity: 1,
        showCountryBorders: true,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 0.4,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 0.65,
        showMajorCities: false,
        regionLabelColor: '#334155',
        regionLabelOpacity: 0.5,
        showRegionLabels: false,
        networkLabelColor: '#475569',
        networkLabelOpacity: 0.55,
        showNetworkLabels: false,
        facilityLabelColor: '#111827',
        facilityLabelOpacity: 0.7,
        showFacilityLabels: false,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 0.61,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
      setBasemapLayerVisibility: vi.fn(),
      setBasemapElementColor: vi.fn(),
      setBasemapElementOpacity: vi.fn(),
    });

    const landOpacityField = rows[0].sections[0].fields[1];
    const seaOpacityField = rows[1].sections[0].fields[1];

    if (landOpacityField.kind !== 'slider' || seaOpacityField.kind !== 'slider') {
      throw new Error('Expected Land and Sea opacity slider fields');
    }

    expect(landOpacityField.onReset).toBeTypeOf('function');
    expect(landOpacityField.resetPlacement).toBe('right');
    expect(landOpacityField.resetTone).toBe('neutral');

    expect(seaOpacityField.onReset).toBeTypeOf('function');
    expect(seaOpacityField.resetPlacement).toBe('right');
    expect(seaOpacityField.resetTone).toBe('neutral');
  });

  it('makes the Land and Sea colour swatch previews follow the live fill opacity', () => {
    const rows = buildBasemapPanelRows({
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#ecf0e6',
        landFillOpacity: 0.72,
        showLandFill: true,
        countryBorderColor: '#ebebeb',
        countryBorderOpacity: 1,
        showCountryBorders: true,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 0.4,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 0.65,
        showMajorCities: false,
        regionLabelColor: '#334155',
        regionLabelOpacity: 0.5,
        showRegionLabels: false,
        networkLabelColor: '#475569',
        networkLabelOpacity: 0.55,
        showNetworkLabels: false,
        facilityLabelColor: '#111827',
        facilityLabelOpacity: 0.7,
        showFacilityLabels: false,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 0.61,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
      setBasemapLayerVisibility: vi.fn(),
      setBasemapElementColor: vi.fn(),
      setBasemapElementOpacity: vi.fn(),
    });

    const landColourField = rows[0].sections[0].fields[0];
    const seaColourField = rows[1].sections[0].fields[0];

    if (landColourField.kind !== 'color' || seaColourField.kind !== 'color') {
      throw new Error('Expected Land and Sea colour fields');
    }

    expect(landColourField.opacityPreview).toBe(0.72);
    expect(seaColourField.opacityPreview).toBe(0.61);
    expect(landColourField.copyTone).toBe('neutral');
    expect(seaColourField.copyTone).toBe('neutral');
  });

  it('resets Land and Sea colour controls back to default colour and 100% opacity', () => {
    const setBasemapElementColor = vi.fn();
    const setBasemapElementOpacity = vi.fn();

    const rows = buildBasemapPanelRows({
      basemap: {
        provider: 'localDetailed',
        scale: '10m',
        landFillColor: '#a7b99b',
        landFillOpacity: 0.72,
        showLandFill: true,
        countryBorderColor: '#ebebeb',
        countryBorderOpacity: 1,
        showCountryBorders: true,
        countryLabelColor: '#0f172a',
        countryLabelOpacity: 0.4,
        showCountryLabels: false,
        majorCityColor: '#1f2937',
        majorCityOpacity: 0.65,
        showMajorCities: false,
        regionLabelColor: '#334155',
        regionLabelOpacity: 0.5,
        showRegionLabels: false,
        networkLabelColor: '#475569',
        networkLabelOpacity: 0.55,
        showNetworkLabels: false,
        facilityLabelColor: '#111827',
        facilityLabelOpacity: 0.7,
        showFacilityLabels: false,
        seaFillColor: '#9cb7d8',
        seaFillOpacity: 0.61,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
      setBasemapLayerVisibility: vi.fn(),
      setBasemapElementColor,
      setBasemapElementOpacity,
    });

    const landColourField = rows[0].sections[0].fields[0];
    const seaColourField = rows[1].sections[0].fields[0];

    if (landColourField.kind !== 'color' || seaColourField.kind !== 'color') {
      throw new Error('Expected Land and Sea colour fields');
    }

    landColourField.onCopy?.();
    seaColourField.onCopy?.();

    expect(setBasemapElementColor).toHaveBeenNthCalledWith(1, 'landFillColor', '#ecf0e6');
    expect(setBasemapElementOpacity).toHaveBeenNthCalledWith(1, 'landFillOpacity', 1);
    expect(setBasemapElementColor).toHaveBeenNthCalledWith(2, 'seaFillColor', '#d9e7f5');
    expect(setBasemapElementOpacity).toHaveBeenNthCalledWith(2, 'seaFillOpacity', 1);
  });
});
