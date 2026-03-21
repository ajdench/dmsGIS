import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import type { BasemapSettings } from '../../types';

interface BuildBasemapPanelRowsOptions {
  basemap: BasemapSettings;
  setBasemapLayerVisibility: (
    key:
      | 'showLandFill'
      | 'showCountryBorders'
      | 'showCountryLabels'
      | 'showMajorCities'
      | 'showSeaFill'
      | 'showSeaLabels',
    visible: boolean,
  ) => void;
  setBasemapElementColor: (
    key:
      | 'landFillColor'
      | 'countryBorderColor'
      | 'countryLabelColor'
      | 'majorCityColor'
      | 'seaFillColor'
      | 'seaLabelColor',
    color: string,
  ) => void;
  setBasemapElementOpacity: (
    key:
      | 'landFillOpacity'
      | 'countryBorderOpacity'
      | 'countryLabelOpacity'
      | 'majorCityOpacity'
      | 'seaFillOpacity'
      | 'seaLabelOpacity',
    opacity: number,
  ) => void;
}

export function buildBasemapPanelRows({
  basemap,
  setBasemapLayerVisibility,
  setBasemapElementColor,
  setBasemapElementOpacity,
}: BuildBasemapPanelRowsOptions): SidebarRowDefinition<'land' | 'sea'>[] {
  return [
    {
      id: 'land',
      label: 'Land',
      visibility: {
        state: booleanToSidebarVisibilityState(basemap.showLandFill),
        onChange: (enabled) => setBasemapLayerVisibility('showLandFill', enabled),
      },
      pill: {
        valueLabel: formatPercent(basemap.landFillOpacity),
        ariaLabel: 'Land controls',
        swatch: {
          color: basemap.landFillColor,
          opacity: basemap.landFillOpacity,
        },
      },
      sections: [
        {
          title: 'Fill',
          fields: [
            {
              kind: 'toggle',
              id: 'land-fill-visible',
              label: 'Visible',
              checked: basemap.showLandFill,
              onChange: (checked) => setBasemapLayerVisibility('showLandFill', checked),
            },
            {
              kind: 'color',
              id: 'land-fill-colour',
              label: 'Colour',
              value: basemap.landFillColor,
              onChange: (color) => setBasemapElementColor('landFillColor', color),
            },
            {
              kind: 'slider',
              id: 'land-fill-opacity',
              label: 'Opacity',
              value: basemap.landFillOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('landFillOpacity', opacity),
            },
          ],
        },
        {
          title: 'Borders',
          fields: [
            {
              kind: 'toggle',
              id: 'country-borders-visible',
              label: 'Visible',
              checked: basemap.showCountryBorders,
              onChange: (checked) =>
                setBasemapLayerVisibility('showCountryBorders', checked),
            },
            {
              kind: 'color',
              id: 'country-borders-colour',
              label: 'Colour',
              value: basemap.countryBorderColor,
              onChange: (color) =>
                setBasemapElementColor('countryBorderColor', color),
            },
            {
              kind: 'slider',
              id: 'country-borders-opacity',
              label: 'Opacity',
              value: basemap.countryBorderOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('countryBorderOpacity', opacity),
            },
          ],
        },
        {
          title: 'Labels',
          fields: [
            {
              kind: 'toggle',
              id: 'country-labels-visible',
              label: 'Visible',
              checked: basemap.showCountryLabels,
              onChange: (checked) =>
                setBasemapLayerVisibility('showCountryLabels', checked),
            },
            {
              kind: 'color',
              id: 'country-labels-colour',
              label: 'Colour',
              value: basemap.countryLabelColor,
              onChange: (color) =>
                setBasemapElementColor('countryLabelColor', color),
            },
            {
              kind: 'slider',
              id: 'country-labels-opacity',
              label: 'Opacity',
              value: basemap.countryLabelOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('countryLabelOpacity', opacity),
            },
          ],
        },
        {
          title: 'Major cities',
          fields: [
            {
              kind: 'toggle',
              id: 'major-cities-visible',
              label: 'Visible',
              checked: basemap.showMajorCities,
              onChange: (checked) =>
                setBasemapLayerVisibility('showMajorCities', checked),
            },
            {
              kind: 'color',
              id: 'major-cities-colour',
              label: 'Colour',
              value: basemap.majorCityColor,
              onChange: (color) => setBasemapElementColor('majorCityColor', color),
            },
            {
              kind: 'slider',
              id: 'major-cities-opacity',
              label: 'Opacity',
              value: basemap.majorCityOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('majorCityOpacity', opacity),
            },
          ],
        },
      ],
    },
    {
      id: 'sea',
      label: 'Sea',
      visibility: {
        state: booleanToSidebarVisibilityState(basemap.showSeaFill),
        onChange: (enabled) => setBasemapLayerVisibility('showSeaFill', enabled),
      },
      pill: {
        valueLabel: formatPercent(basemap.seaFillOpacity),
        ariaLabel: 'Sea controls',
        swatch: {
          color: basemap.seaFillColor,
          opacity: basemap.seaFillOpacity,
        },
      },
      sections: [
        {
          title: 'Fill',
          fields: [
            {
              kind: 'toggle',
              id: 'sea-fill-visible',
              label: 'Visible',
              checked: basemap.showSeaFill,
              onChange: (checked) => setBasemapLayerVisibility('showSeaFill', checked),
            },
            {
              kind: 'color',
              id: 'sea-fill-colour',
              label: 'Colour',
              value: basemap.seaFillColor,
              onChange: (color) => setBasemapElementColor('seaFillColor', color),
            },
            {
              kind: 'slider',
              id: 'sea-fill-opacity',
              label: 'Opacity',
              value: basemap.seaFillOpacity,
              onChange: (opacity) => setBasemapElementOpacity('seaFillOpacity', opacity),
            },
          ],
        },
        {
          title: 'Labels',
          fields: [
            {
              kind: 'toggle',
              id: 'sea-labels-visible',
              label: 'Visible',
              checked: basemap.showSeaLabels,
              onChange: (checked) =>
                setBasemapLayerVisibility('showSeaLabels', checked),
            },
            {
              kind: 'color',
              id: 'sea-labels-colour',
              label: 'Colour',
              value: basemap.seaLabelColor,
              onChange: (color) => setBasemapElementColor('seaLabelColor', color),
            },
            {
              kind: 'slider',
              id: 'sea-labels-opacity',
              label: 'Opacity',
              value: basemap.seaLabelOpacity,
              onChange: (opacity) => setBasemapElementOpacity('seaLabelOpacity', opacity),
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
