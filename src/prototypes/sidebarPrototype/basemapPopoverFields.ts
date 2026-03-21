import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';
import type { SwatchStop } from './PrototypeControls';

interface BasemapControlSectionArgs {
  idPrefix: string;
  colourValue: string;
  colourOpacity: number;
  colourMix?: SwatchStop[];
  onOpacityChange: (value: number) => void;
}

export function buildBasemapControlSections({
  idPrefix,
  colourValue,
  colourOpacity,
  colourMix,
  onOpacityChange,
}: BasemapControlSectionArgs): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Layer',
      fields: [
        {
          kind: 'color',
          id: `${idPrefix}-colour`,
          label: 'Colour',
          value: colourValue,
          opacityPreview: colourOpacity,
          mixedSwatches: colourMix,
          onChange: () => {},
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
