import type { SidebarRowDefinition } from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import type { OverlayLayerStyle } from '../../types';

interface BuildOverlayPanelRowsOptions {
  layers: OverlayLayerStyle[];
  setOverlayLayerVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerOpacity: (id: string, opacity: number) => void;
  setOverlayLayerBorderVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerBorderColor: (id: string, color: string) => void;
  setOverlayLayerBorderWidth?: (id: string, width: number) => void;
  setOverlayLayerBorderOpacity: (id: string, opacity: number) => void;
}

export function buildOverlayPanelRows({
  layers,
  setOverlayLayerVisibility,
  setOverlayLayerOpacity,
  setOverlayLayerBorderVisibility,
  setOverlayLayerBorderColor,
  setOverlayLayerBorderWidth,
  setOverlayLayerBorderOpacity,
}: BuildOverlayPanelRowsOptions): SidebarRowDefinition[] {
  return layers.map((layer) => ({
    id: layer.id,
    label: formatOverlayRowLabel(layer),
    titleClassName: getOverlayRowTitleClassName(layer),
    visibility: {
      state: getOverlayRowVisibilityState(layer.visible, layer.borderVisible),
      onChange: (checked) => {
        setOverlayLayerVisibility(layer.id, checked);
        setOverlayLayerBorderVisibility(layer.id, checked);
      },
    },
    pill: {
      valueLabel: `${Math.round(layer.opacity * 100)}%`,
      ariaLabel: `${layer.name} controls`,
      swatch: {
        color: layer.swatchColor,
        opacity: layer.visible ? layer.opacity : layer.borderVisible ? layer.borderOpacity : 0,
        borderColor: layer.borderColor,
        borderOpacity: layer.borderVisible ? layer.borderOpacity : 0,
        borderWidth: layer.borderWidth ?? 1,
      },
    },
    sections: [
      {
        title: 'Fill',
        enabledState: booleanToSidebarVisibilityState(layer.visible),
        onEnabledChange: (checked) => setOverlayLayerVisibility(layer.id, checked),
        fields: [
          {
            kind: 'color',
            id: `${layer.id}-fill-colour`,
            label: 'Colour',
            value: layer.swatchColor,
            disabled: true,
            opacityPreview: 1,
            onChange: () => {},
          },
          {
            kind: 'slider',
            id: `${layer.id}-opacity`,
            label: 'Opacity',
            value: layer.opacity,
            onChange: (value) => setOverlayLayerOpacity(layer.id, value),
          },
        ],
      },
      {
        title: 'Border',
        enabledState: booleanToSidebarVisibilityState(layer.borderVisible),
        onEnabledChange: (checked) =>
          setOverlayLayerBorderVisibility(layer.id, checked),
        fields: [
          {
            kind: 'color',
            id: `${layer.id}-border-colour`,
            label: 'Colour',
            value: layer.borderColor,
            onChange: (color) => setOverlayLayerBorderColor(layer.id, color),
          },
          {
            kind: 'slider',
            id: `${layer.id}-border-width`,
            label: 'Thickness',
            value: layer.borderWidth ?? 1,
            min: 0,
            max: 10,
            step: 0.25,
            mode: 'raw',
            onChange: (value) => setOverlayLayerBorderWidth?.(layer.id, value),
          },
          {
            kind: 'slider',
            id: `${layer.id}-border-opacity`,
            label: 'Opacity',
            value: layer.borderOpacity,
            onChange: (value) => setOverlayLayerBorderOpacity(layer.id, value),
          },
        ],
      },
    ],
  }));
}

function booleanToSidebarVisibilityState(
  visible: boolean,
): SidebarVisibilityState {
  return visible ? 'on' : 'off';
}

function getOverlayRowVisibilityState(
  visible: boolean,
  borderVisible: boolean,
): SidebarVisibilityState {
  if (visible && borderVisible) return 'on';
  if (!visible && !borderVisible) return 'off';
  return 'mixed';
}

function formatOverlayRowLabel(layer: OverlayLayerStyle): string {
  if (layer.id === 'nhsEnglandRegionsBsc') {
    return 'NHS England\nRegions';
  }

  if (layer.id === 'sjcJmcOutline') {
    return 'SJC JMC\nRegions';
  }

  if (layer.id === 'englandIcb') {
    const suffix = 'NHS England ICBs';
    if (layer.name.endsWith(suffix)) {
      const prefix = layer.name.slice(0, -suffix.length).trim();
      return prefix ? `${prefix}\n${suffix}` : suffix;
    }
  }

  return layer.name;
}

function getOverlayRowTitleClassName(layer: OverlayLayerStyle): string | undefined {
  if (layer.id === 'nhsEnglandRegionsBsc' || layer.id === 'sjcJmcOutline') {
    return 'sidebar-exact-accordion-item__title--three-line-block';
  }

  return undefined;
}
