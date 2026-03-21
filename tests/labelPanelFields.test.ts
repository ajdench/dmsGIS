import { describe, expect, it, vi } from 'vitest';
import { buildLabelPanelRows } from '../src/features/labels/labelPanelFields';

describe('labelPanelFields', () => {
  it('builds production label rows from basemap state and routes updates to basemap setters', () => {
    const setBasemapLayerVisibility = vi.fn();
    const setBasemapElementColor = vi.fn();
    const setBasemapElementOpacity = vi.fn();
    const setBasemapNumericValue = vi.fn();

    const rows = buildLabelPanelRows({
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
        showMajorCities: true,
        seaFillColor: '#d9e7f5',
        seaFillOpacity: 1,
        showSeaFill: true,
        seaLabelColor: '#334155',
        seaLabelOpacity: 0.5,
        showSeaLabels: false,
      },
      setBasemapLayerVisibility,
      setBasemapElementColor,
      setBasemapElementOpacity,
      setBasemapNumericValue,
    });

    expect(rows.map((row) => row.label)).toEqual([
      'Countries',
      'Cities',
      'Sea labels',
    ]);
    expect(rows.map((row) => row.pill.valueLabel)).toEqual(['40%', '65%', '50%']);
    expect(rows.map((row) => row.visibility.state)).toEqual(['off', 'on', 'off']);
    expect(rows[0].sections.map((section) => section.title)).toEqual([
      'Text',
      'Border',
    ]);

    rows[0].visibility.onChange(true);
    rows[1].sections[0].fields[0].onChange('#ffffff');
    rows[0].sections[0].fields[1].onChange(10);
    rows[2].sections[1].fields[1].onChange(2);
    rows[2].sections[0].fields[2].onChange(0.75);

    expect(setBasemapLayerVisibility).toHaveBeenCalledWith('showCountryLabels', true);
    expect(setBasemapElementColor).toHaveBeenCalledWith('majorCityColor', '#ffffff');
    expect(setBasemapNumericValue).toHaveBeenCalledWith('countryLabelSize', 10);
    expect(setBasemapNumericValue).toHaveBeenCalledWith('seaLabelBorderWidth', 2);
    expect(setBasemapElementOpacity).toHaveBeenCalledWith('seaLabelOpacity', 0.75);
  });
});
