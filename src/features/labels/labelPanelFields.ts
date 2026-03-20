import type { BasemapSettings } from '../../types';
import type { SidebarControlSectionConfig } from '../../components/sidebar/SidebarControlSections';

export interface LabelPanelRowConfig {
  id: 'country-labels' | 'major-cities' | 'sea-labels';
  label: string;
  enabled: boolean;
  swatchColor: string;
  swatchOpacity: number;
  valueLabel: string;
  sections: SidebarControlSectionConfig[];
  onEnabledChange: (enabled: boolean) => void;
}

interface BuildLabelPanelRowsOptions {
  basemap: BasemapSettings;
  setBasemapLayerVisibility: (
    key: 'showCountryLabels' | 'showMajorCities' | 'showSeaLabels',
    visible: boolean,
  ) => void;
  setBasemapElementColor: (
    key: 'countryLabelColor' | 'majorCityColor' | 'seaLabelColor',
    color: string,
  ) => void;
  setBasemapElementOpacity: (
    key: 'countryLabelOpacity' | 'majorCityOpacity' | 'seaLabelOpacity',
    opacity: number,
  ) => void;
}

export function buildLabelPanelRows({
  basemap,
  setBasemapLayerVisibility,
  setBasemapElementColor,
  setBasemapElementOpacity,
}: BuildLabelPanelRowsOptions): LabelPanelRowConfig[] {
  return [
    {
      id: 'country-labels',
      label: 'Countries',
      enabled: basemap.showCountryLabels,
      swatchColor: basemap.countryLabelColor,
      swatchOpacity: basemap.countryLabelOpacity,
      valueLabel: formatPercent(basemap.countryLabelOpacity),
      onEnabledChange: (enabled) =>
        setBasemapLayerVisibility('showCountryLabels', enabled),
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
              id: 'country-label-opacity',
              label: 'Opacity',
              value: basemap.countryLabelOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('countryLabelOpacity', opacity),
            },
          ],
        },
      ],
    },
    {
      id: 'major-cities',
      label: 'Cities',
      enabled: basemap.showMajorCities,
      swatchColor: basemap.majorCityColor,
      swatchOpacity: basemap.majorCityOpacity,
      valueLabel: formatPercent(basemap.majorCityOpacity),
      onEnabledChange: (enabled) =>
        setBasemapLayerVisibility('showMajorCities', enabled),
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
              id: 'major-city-opacity',
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
      id: 'sea-labels',
      label: 'Sea labels',
      enabled: basemap.showSeaLabels,
      swatchColor: basemap.seaLabelColor,
      swatchOpacity: basemap.seaLabelOpacity,
      valueLabel: formatPercent(basemap.seaLabelOpacity),
      onEnabledChange: (enabled) =>
        setBasemapLayerVisibility('showSeaLabels', enabled),
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
              id: 'sea-label-opacity',
              label: 'Opacity',
              value: basemap.seaLabelOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('seaLabelOpacity', opacity),
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
