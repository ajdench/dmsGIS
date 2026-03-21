import type { BasemapSettings } from '../../types';
import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';

interface BuildLabelPanelRowsOptions {
  basemap: BasemapSettings;
  setBasemapLayerVisibility: (
    key: 'showCountryLabels' | 'showMajorCities' | 'showSeaLabels',
    visible: boolean,
  ) => void;
  setBasemapElementColor: (
    key:
      | 'countryLabelColor'
      | 'countryLabelBorderColor'
      | 'majorCityColor'
      | 'majorCityBorderColor'
      | 'seaLabelColor'
      | 'seaLabelBorderColor',
    color: string,
  ) => void;
  setBasemapElementOpacity: (
    key:
      | 'countryLabelOpacity'
      | 'countryLabelBorderOpacity'
      | 'majorCityOpacity'
      | 'majorCityBorderOpacity'
      | 'seaLabelOpacity'
      | 'seaLabelBorderOpacity',
    opacity: number,
  ) => void;
  setBasemapNumericValue: (
    key:
      | 'countryLabelSize'
      | 'countryLabelBorderWidth'
      | 'majorCitySize'
      | 'majorCityBorderWidth'
      | 'seaLabelSize'
      | 'seaLabelBorderWidth',
    value: number,
  ) => void;
}

export function buildLabelPanelRows({
  basemap,
  setBasemapLayerVisibility,
  setBasemapElementColor,
  setBasemapElementOpacity,
  setBasemapNumericValue,
}: BuildLabelPanelRowsOptions): SidebarRowDefinition<
  'country-labels' | 'major-cities' | 'sea-labels'
>[] {
  return [
    {
      id: 'country-labels',
      label: 'Countries',
      visibility: {
        state: booleanToSidebarVisibilityState(basemap.showCountryLabels),
        onChange: (enabled) =>
          setBasemapLayerVisibility('showCountryLabels', enabled),
      },
      pill: {
        valueLabel: formatPercent(basemap.countryLabelOpacity),
        ariaLabel: 'Countries controls',
        swatch: {
          color: basemap.countryLabelColor,
          opacity: basemap.countryLabelOpacity,
        },
      },
      sections: [
        {
          title: 'Text',
          fields: [
            {
              kind: 'color',
              id: 'country-label-colour',
              label: 'Colour',
              value: basemap.countryLabelColor,
              onChange: (color) =>
                setBasemapElementColor('countryLabelColor', color),
            },
            {
              kind: 'slider',
              id: 'country-label-size',
              label: 'Size',
              value: basemap.countryLabelSize ?? 8,
              min: 1,
              max: 18,
              step: 0.5,
              mode: 'raw',
              onChange: (size) => setBasemapNumericValue('countryLabelSize', size),
            },
            {
              kind: 'slider',
              id: 'country-label-opacity',
              label: 'Opacity',
              value: basemap.countryLabelOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('countryLabelOpacity', opacity),
            },
          ],
        },
        {
          title: 'Border',
          fields: [
            {
              kind: 'color',
              id: 'country-label-border-colour',
              label: 'Colour',
              value: basemap.countryLabelBorderColor ?? '#f8fafc',
              onChange: (color) =>
                setBasemapElementColor('countryLabelBorderColor', color),
            },
            {
              kind: 'slider',
              id: 'country-label-border-width',
              label: 'Thickness',
              value: basemap.countryLabelBorderWidth ?? 0.5,
              min: 0,
              max: 6,
              step: 0.5,
              mode: 'raw',
              onChange: (width) =>
                setBasemapNumericValue('countryLabelBorderWidth', width),
            },
            {
              kind: 'slider',
              id: 'country-label-border-opacity',
              label: 'Opacity',
              value: basemap.countryLabelBorderOpacity ?? 0.3,
              onChange: (opacity) =>
                setBasemapElementOpacity('countryLabelBorderOpacity', opacity),
            },
          ],
        },
      ],
    },
    {
      id: 'major-cities',
      label: 'Cities',
      visibility: {
        state: booleanToSidebarVisibilityState(basemap.showMajorCities),
        onChange: (enabled) =>
          setBasemapLayerVisibility('showMajorCities', enabled),
      },
      pill: {
        valueLabel: formatPercent(basemap.majorCityOpacity),
        ariaLabel: 'Cities controls',
        swatch: {
          color: basemap.majorCityColor,
          opacity: basemap.majorCityOpacity,
        },
      },
      sections: [
        {
          title: 'Text',
          fields: [
            {
              kind: 'color',
              id: 'major-city-colour',
              label: 'Colour',
              value: basemap.majorCityColor,
              onChange: (color) => setBasemapElementColor('majorCityColor', color),
            },
            {
              kind: 'slider',
              id: 'major-city-size',
              label: 'Size',
              value: basemap.majorCitySize ?? 6,
              min: 1,
              max: 18,
              step: 0.5,
              mode: 'raw',
              onChange: (size) => setBasemapNumericValue('majorCitySize', size),
            },
            {
              kind: 'slider',
              id: 'major-city-opacity',
              label: 'Opacity',
              value: basemap.majorCityOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('majorCityOpacity', opacity),
            },
          ],
        },
        {
          title: 'Border',
          fields: [
            {
              kind: 'color',
              id: 'major-city-border-colour',
              label: 'Colour',
              value: basemap.majorCityBorderColor ?? '#f8fafc',
              onChange: (color) =>
                setBasemapElementColor('majorCityBorderColor', color),
            },
            {
              kind: 'slider',
              id: 'major-city-border-width',
              label: 'Thickness',
              value: basemap.majorCityBorderWidth ?? 0.5,
              min: 0,
              max: 6,
              step: 0.5,
              mode: 'raw',
              onChange: (width) =>
                setBasemapNumericValue('majorCityBorderWidth', width),
            },
            {
              kind: 'slider',
              id: 'major-city-border-opacity',
              label: 'Opacity',
              value: basemap.majorCityBorderOpacity ?? 0.35,
              onChange: (opacity) =>
                setBasemapElementOpacity('majorCityBorderOpacity', opacity),
            },
          ],
        },
      ],
    },
    {
      id: 'sea-labels',
      label: 'Sea labels',
      visibility: {
        state: booleanToSidebarVisibilityState(basemap.showSeaLabels),
        onChange: (enabled) =>
          setBasemapLayerVisibility('showSeaLabels', enabled),
      },
      pill: {
        valueLabel: formatPercent(basemap.seaLabelOpacity),
        ariaLabel: 'Sea labels controls',
        swatch: {
          color: basemap.seaLabelColor,
          opacity: basemap.seaLabelOpacity,
        },
      },
      sections: [
        {
          title: 'Text',
          fields: [
            {
              kind: 'color',
              id: 'sea-label-colour',
              label: 'Colour',
              value: basemap.seaLabelColor,
              onChange: (color) => setBasemapElementColor('seaLabelColor', color),
            },
            {
              kind: 'slider',
              id: 'sea-label-size',
              label: 'Size',
              value: basemap.seaLabelSize ?? 7,
              min: 1,
              max: 18,
              step: 0.5,
              mode: 'raw',
              onChange: (size) => setBasemapNumericValue('seaLabelSize', size),
            },
            {
              kind: 'slider',
              id: 'sea-label-opacity',
              label: 'Opacity',
              value: basemap.seaLabelOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('seaLabelOpacity', opacity),
            },
          ],
        },
        {
          title: 'Border',
          fields: [
            {
              kind: 'color',
              id: 'sea-label-border-colour',
              label: 'Colour',
              value: basemap.seaLabelBorderColor ?? '#f8fafc',
              onChange: (color) =>
                setBasemapElementColor('seaLabelBorderColor', color),
            },
            {
              kind: 'slider',
              id: 'sea-label-border-width',
              label: 'Thickness',
              value: basemap.seaLabelBorderWidth ?? 0.5,
              min: 0,
              max: 6,
              step: 0.5,
              mode: 'raw',
              onChange: (width) =>
                setBasemapNumericValue('seaLabelBorderWidth', width),
            },
            {
              kind: 'slider',
              id: 'sea-label-border-opacity',
              label: 'Opacity',
              value: basemap.seaLabelBorderOpacity ?? 0.3,
              onChange: (opacity) =>
                setBasemapElementOpacity('seaLabelBorderOpacity', opacity),
            },
          ],
        },
      ],
    },
  ];
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function booleanToSidebarVisibilityState(
  visible: boolean,
): SidebarVisibilityState {
  return visible ? 'on' : 'off';
}
