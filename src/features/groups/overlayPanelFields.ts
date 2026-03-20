import type { SidebarControlSectionConfig } from '../../components/sidebar/SidebarControlSections';
import type { OverlayLayerStyle } from '../../types';

export interface OverlayPanelRowConfig {
  id: string;
  label: string;
  enabled: boolean;
  valueLabel: string;
  swatchColor: string;
  swatchOpacity: number;
  sections: SidebarControlSectionConfig[];
}

interface BuildOverlayPanelRowsOptions {
  layers: OverlayLayerStyle[];
  setOverlayLayerVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerOpacity: (id: string, opacity: number) => void;
  setOverlayLayerBorderVisibility: (id: string, visible: boolean) => void;
  setOverlayLayerBorderColor: (id: string, color: string) => void;
  setOverlayLayerBorderOpacity: (id: string, opacity: number) => void;
}

export function buildOverlayPanelRows({
  layers,
  setOverlayLayerVisibility,
  setOverlayLayerOpacity,
  setOverlayLayerBorderVisibility,
  setOverlayLayerBorderColor,
  setOverlayLayerBorderOpacity,
}: BuildOverlayPanelRowsOptions): OverlayPanelRowConfig[] {
  return layers.map((layer) => ({
    id: layer.id,
    label: layer.name,
    enabled: layer.visible,
    valueLabel: `${Math.round(layer.opacity * 100)}%`,
    swatchColor: layer.borderColor,
    swatchOpacity: layer.opacity,
    sections: [
      {
        title: 'Layer',
        fields: [
          {
            kind: 'toggle',
            id: `${layer.id}-visible`,
            label: 'Visible',
            checked: layer.visible,
            onChange: (checked) => setOverlayLayerVisibility(layer.id, checked),
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
        fields: [
          {
            kind: 'toggle',
            id: `${layer.id}-border-visible`,
            label: 'Visible',
            checked: layer.borderVisible,
            onChange: (checked) =>
              setOverlayLayerBorderVisibility(layer.id, checked),
          },
          {
            kind: 'color',
            id: `${layer.id}-border-colour`,
            label: 'Colour',
            value: layer.borderColor,
            onChange: (color) => setOverlayLayerBorderColor(layer.id, color),
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
