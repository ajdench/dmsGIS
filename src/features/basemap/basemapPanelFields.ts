import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import type { BasemapSettings } from '../../types';

const DEFAULT_LAND_FILL_COLOR = '#ecf0e6';
const DEFAULT_SEA_FILL_COLOR = '#d9e7f5';

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
          borderWidth: 0,
        },
      },
      sections: [
        {
          title: 'Layer',
          enabledState: booleanToSidebarVisibilityState(basemap.showLandFill),
          onEnabledChange: (checked) =>
            setBasemapLayerVisibility('showLandFill', checked),
          fields: [
            {
              kind: 'color',
              id: 'land-fill-colour',
              label: 'Colour',
              value: basemap.landFillColor,
              opacityPreview: basemap.landFillOpacity,
              onChange: (color) => setBasemapElementColor('landFillColor', color),
              onCopy: () => {
                setBasemapElementColor('landFillColor', DEFAULT_LAND_FILL_COLOR);
                setBasemapElementOpacity('landFillOpacity', 1);
              },
              copySwatches: [{ color: DEFAULT_LAND_FILL_COLOR, opacity: 1 }],
              copyLabel: 'Reset to default colour',
              copyShowIcon: true,
              copyIcon: 'reset' as const,
              copyTone: 'neutral',
            },
            {
              kind: 'slider',
              id: 'land-fill-opacity',
              label: 'Opacity',
              value: basemap.landFillOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('landFillOpacity', opacity),
              onReset: () => setBasemapElementOpacity('landFillOpacity', 1),
              resetPlacement: 'right',
              resetTone: 'neutral',
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
          borderWidth: 0,
        },
      },
      sections: [
        {
          title: 'Layer',
          enabledState: booleanToSidebarVisibilityState(basemap.showSeaFill),
          onEnabledChange: (checked) =>
            setBasemapLayerVisibility('showSeaFill', checked),
          fields: [
            {
              kind: 'color',
              id: 'sea-fill-colour',
              label: 'Colour',
              value: basemap.seaFillColor,
              opacityPreview: basemap.seaFillOpacity,
              onChange: (color) => setBasemapElementColor('seaFillColor', color),
              onCopy: () => {
                setBasemapElementColor('seaFillColor', DEFAULT_SEA_FILL_COLOR);
                setBasemapElementOpacity('seaFillOpacity', 1);
              },
              copySwatches: [{ color: DEFAULT_SEA_FILL_COLOR, opacity: 1 }],
              copyLabel: 'Reset to default colour',
              copyShowIcon: true,
              copyIcon: 'reset' as const,
              copyTone: 'neutral',
            },
            {
              kind: 'slider',
              id: 'sea-fill-opacity',
              label: 'Opacity',
              value: basemap.seaFillOpacity,
              onChange: (opacity) =>
                setBasemapElementOpacity('seaFillOpacity', opacity),
              onReset: () => setBasemapElementOpacity('seaFillOpacity', 1),
              resetPlacement: 'right',
              resetTone: 'neutral',
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
