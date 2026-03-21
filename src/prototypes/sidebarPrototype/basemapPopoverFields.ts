import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';
import type { SwatchStop } from './PrototypeControls';

interface BasemapControlSectionArgs {
  idPrefix: string;
  enabled: boolean;
  onToggle: () => void;
  colourValue: string;
  colourOpacity: number;
  colourMix?: SwatchStop[];
  onColorChange: (value: string) => void;
  onOpacityChange: (value: number) => void;
}

export function buildBasemapControlSections({
  idPrefix,
  enabled,
  onToggle,
  colourValue,
  colourOpacity,
  colourMix,
  onColorChange,
  onOpacityChange,
}: BasemapControlSectionArgs): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Layer',
      enabled,
      onToggle,
      fields: [
        {
          kind: 'color',
          id: `${idPrefix}-colour`,
          label: 'Colour',
          value: colourValue,
          opacityPreview: colourOpacity,
          mixedSwatches: colourMix,
          onChange: onColorChange,
        },
        {
          kind: 'slider',
          id: `${idPrefix}-opacity`,
          label: 'Opacity',
          value: colourOpacity,
          onChange: onOpacityChange,
        },
      ],
    },
  ];
}
