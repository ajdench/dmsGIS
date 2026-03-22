import type { BasemapSettings } from '../../types';
import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import { resolvePillSwatchOpacity } from '../../lib/sidebar/swatchVisibility';

type LabelRowId =
  | 'country-labels'
  | 'major-cities'
  | 'region-labels'
  | 'network-labels'
  | 'facility-labels';

type BasemapLabelVisibilityKey =
  | 'showCountryLabels'
  | 'showMajorCities'
  | 'showRegionLabels'
  | 'showNetworkLabels'
  | 'showFacilityLabels';

type BasemapLabelColorKey =
  | 'countryLabelColor'
  | 'countryLabelBorderColor'
  | 'majorCityColor'
  | 'majorCityBorderColor'
  | 'regionLabelColor'
  | 'regionLabelBorderColor'
  | 'networkLabelColor'
  | 'networkLabelBorderColor'
  | 'facilityLabelColor'
  | 'facilityLabelBorderColor';

type BasemapLabelOpacityKey =
  | 'countryLabelOpacity'
  | 'countryLabelBorderOpacity'
  | 'majorCityOpacity'
  | 'majorCityBorderOpacity'
  | 'regionLabelOpacity'
  | 'regionLabelBorderOpacity'
  | 'networkLabelOpacity'
  | 'networkLabelBorderOpacity'
  | 'facilityLabelOpacity'
  | 'facilityLabelBorderOpacity';

type BasemapLabelNumericKey =
  | 'countryLabelSize'
  | 'countryLabelBorderWidth'
  | 'majorCitySize'
  | 'majorCityBorderWidth'
  | 'regionLabelSize'
  | 'regionLabelBorderWidth'
  | 'networkLabelSize'
  | 'networkLabelBorderWidth'
  | 'facilityLabelSize'
  | 'facilityLabelBorderWidth';

interface BuildLabelPanelRowsOptions {
  basemap: BasemapSettings;
  setBasemapLayerVisibility: (
    key: BasemapLabelVisibilityKey,
    visible: boolean,
  ) => void;
  setBasemapElementColor: (key: BasemapLabelColorKey, color: string) => void;
  setBasemapElementOpacity: (
    key: BasemapLabelOpacityKey,
    opacity: number,
  ) => void;
  setBasemapNumericValue: (key: BasemapLabelNumericKey, value: number) => void;
}

interface LabelRowConfig {
  id: LabelRowId;
  label: string;
  visibilityKey: BasemapLabelVisibilityKey;
  colorKey: BasemapLabelColorKey;
  borderColorKey: BasemapLabelColorKey;
  opacityKey: BasemapLabelOpacityKey;
  borderOpacityKey: BasemapLabelOpacityKey;
  sizeKey: BasemapLabelNumericKey;
  borderWidthKey: BasemapLabelNumericKey;
  colorId: string;
  sizeId: string;
  opacityId: string;
  borderColorId: string;
  borderWidthId: string;
  borderOpacityId: string;
  defaultColor: string;
  defaultOpacity: number;
  defaultSize: number;
  defaultBorderColor: string;
  defaultBorderWidth: number;
  defaultBorderOpacity: number;
}

const LABEL_ROW_CONFIGS: LabelRowConfig[] = [
  {
    id: 'country-labels',
    label: 'Countries',
    visibilityKey: 'showCountryLabels',
    colorKey: 'countryLabelColor',
    borderColorKey: 'countryLabelBorderColor',
    opacityKey: 'countryLabelOpacity',
    borderOpacityKey: 'countryLabelBorderOpacity',
    sizeKey: 'countryLabelSize',
    borderWidthKey: 'countryLabelBorderWidth',
    colorId: 'country-label-colour',
    sizeId: 'country-label-size',
    opacityId: 'country-label-opacity',
    borderColorId: 'country-label-border-colour',
    borderWidthId: 'country-label-border-width',
    borderOpacityId: 'country-label-border-opacity',
    defaultColor: '#0f172a',
    defaultOpacity: 0.4,
    defaultSize: 8,
    defaultBorderColor: '#f8fafc',
    defaultBorderWidth: 0,
    defaultBorderOpacity: 0,
  },
  {
    id: 'major-cities',
    label: 'Cities',
    visibilityKey: 'showMajorCities',
    colorKey: 'majorCityColor',
    borderColorKey: 'majorCityBorderColor',
    opacityKey: 'majorCityOpacity',
    borderOpacityKey: 'majorCityBorderOpacity',
    sizeKey: 'majorCitySize',
    borderWidthKey: 'majorCityBorderWidth',
    colorId: 'major-city-colour',
    sizeId: 'major-city-size',
    opacityId: 'major-city-opacity',
    borderColorId: 'major-city-border-colour',
    borderWidthId: 'major-city-border-width',
    borderOpacityId: 'major-city-border-opacity',
    defaultColor: '#1f2937',
    defaultOpacity: 0.65,
    defaultSize: 6,
    defaultBorderColor: '#f8fafc',
    defaultBorderWidth: 0,
    defaultBorderOpacity: 0,
  },
  {
    id: 'region-labels',
    label: 'Regions',
    visibilityKey: 'showRegionLabels',
    colorKey: 'regionLabelColor',
    borderColorKey: 'regionLabelBorderColor',
    opacityKey: 'regionLabelOpacity',
    borderOpacityKey: 'regionLabelBorderOpacity',
    sizeKey: 'regionLabelSize',
    borderWidthKey: 'regionLabelBorderWidth',
    colorId: 'region-label-colour',
    sizeId: 'region-label-size',
    opacityId: 'region-label-opacity',
    borderColorId: 'region-label-border-colour',
    borderWidthId: 'region-label-border-width',
    borderOpacityId: 'region-label-border-opacity',
    defaultColor: '#334155',
    defaultOpacity: 0.5,
    defaultSize: 7,
    defaultBorderColor: '#f8fafc',
    defaultBorderWidth: 0,
    defaultBorderOpacity: 0,
  },
  {
    id: 'network-labels',
    label: 'Networks',
    visibilityKey: 'showNetworkLabels',
    colorKey: 'networkLabelColor',
    borderColorKey: 'networkLabelBorderColor',
    opacityKey: 'networkLabelOpacity',
    borderOpacityKey: 'networkLabelBorderOpacity',
    sizeKey: 'networkLabelSize',
    borderWidthKey: 'networkLabelBorderWidth',
    colorId: 'network-label-colour',
    sizeId: 'network-label-size',
    opacityId: 'network-label-opacity',
    borderColorId: 'network-label-border-colour',
    borderWidthId: 'network-label-border-width',
    borderOpacityId: 'network-label-border-opacity',
    defaultColor: '#475569',
    defaultOpacity: 0.55,
    defaultSize: 6,
    defaultBorderColor: '#f8fafc',
    defaultBorderWidth: 0,
    defaultBorderOpacity: 0,
  },
  {
    id: 'facility-labels',
    label: 'Facilities',
    visibilityKey: 'showFacilityLabels',
    colorKey: 'facilityLabelColor',
    borderColorKey: 'facilityLabelBorderColor',
    opacityKey: 'facilityLabelOpacity',
    borderOpacityKey: 'facilityLabelBorderOpacity',
    sizeKey: 'facilityLabelSize',
    borderWidthKey: 'facilityLabelBorderWidth',
    colorId: 'facility-label-colour',
    sizeId: 'facility-label-size',
    opacityId: 'facility-label-opacity',
    borderColorId: 'facility-label-border-colour',
    borderWidthId: 'facility-label-border-width',
    borderOpacityId: 'facility-label-border-opacity',
    defaultColor: '#111827',
    defaultOpacity: 0.7,
    defaultSize: 5.5,
    defaultBorderColor: '#f8fafc',
    defaultBorderWidth: 0,
    defaultBorderOpacity: 0,
  },
];

export function buildLabelPanelRows({
  basemap,
  setBasemapLayerVisibility,
  setBasemapElementColor,
  setBasemapElementOpacity,
  setBasemapNumericValue,
}: BuildLabelPanelRowsOptions): SidebarRowDefinition<LabelRowId>[] {
  return LABEL_ROW_CONFIGS.map((config) => {
    const visible = basemap[config.visibilityKey] ?? false;
    const color = basemap[config.colorKey] ?? config.defaultColor;
    const opacity = basemap[config.opacityKey] ?? config.defaultOpacity;
    const size = basemap[config.sizeKey] ?? config.defaultSize;
    const borderColor =
      basemap[config.borderColorKey] ?? config.defaultBorderColor;
    const borderWidth =
      basemap[config.borderWidthKey] ?? config.defaultBorderWidth;
    const borderOpacity =
      basemap[config.borderOpacityKey] ?? config.defaultBorderOpacity;

    return {
      id: config.id,
      label: config.label,
      visibility: {
        state: booleanToSidebarVisibilityState(visible),
        onChange: (enabled) =>
          setBasemapLayerVisibility(config.visibilityKey, enabled),
      },
      pill: {
        valueLabel: formatPercent(opacity),
        ariaLabel: `${config.label} controls`,
        swatch: {
          color,
          opacity: resolvePillSwatchOpacity(opacity, visible),
          borderColor,
          borderOpacity,
          borderWidth,
        },
      },
      sections: [
        {
          title: 'Text',
          fields: [
            {
              kind: 'color',
              id: config.colorId,
              label: 'Colour',
              value: color,
              onChange: (nextColor) =>
                setBasemapElementColor(config.colorKey, nextColor),
            },
            {
              kind: 'slider',
              id: config.sizeId,
              label: 'Size',
              value: size,
              min: 1,
              max: 18,
              step: 0.5,
              mode: 'raw',
              onChange: (nextSize) =>
                setBasemapNumericValue(config.sizeKey, nextSize),
            },
            {
              kind: 'slider',
              id: config.opacityId,
              label: 'Opacity',
              value: opacity,
              onChange: (nextOpacity) =>
                setBasemapElementOpacity(config.opacityKey, nextOpacity),
            },
          ],
        },
        {
          title: 'Border',
          fields: [
            {
              kind: 'color',
              id: config.borderColorId,
              label: 'Colour',
              value: borderColor,
              onChange: (nextBorderColor) =>
                setBasemapElementColor(
                  config.borderColorKey,
                  nextBorderColor,
                ),
            },
            {
              kind: 'slider',
              id: config.borderWidthId,
              label: 'Thickness',
              value: borderWidth,
              min: 0,
              max: 10,
              step: 0.25,
              mode: 'raw',
              onChange: (nextBorderWidth) =>
                setBasemapNumericValue(
                  config.borderWidthKey,
                  nextBorderWidth,
                ),
            },
            {
              kind: 'slider',
              id: config.borderOpacityId,
              label: 'Opacity',
              value: borderOpacity,
              onChange: (nextBorderOpacity) =>
                setBasemapElementOpacity(
                  config.borderOpacityKey,
                  nextBorderOpacity,
                ),
            },
          ],
        },
      ],
    };
  });
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function booleanToSidebarVisibilityState(
  visible: boolean,
): SidebarVisibilityState {
  return visible ? 'on' : 'off';
}
