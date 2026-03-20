import type {
  LabelSectionId,
  LabelStyleKey,
  LabelStyleState,
} from './prototypeStyleState';
import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';

interface LabelSectionShape {
  id: LabelSectionId;
  colourId: string;
  opacityId: string;
}

export function buildLabelControlSections(
  section: LabelSectionShape,
  style: LabelStyleState,
  setLabelStyle: <K extends LabelStyleKey>(
    sectionId: LabelSectionId,
    key: K,
    value: LabelStyleState[K],
  ) => void,
): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Text',
      fields: [
        {
          kind: 'color',
          id: section.colourId,
          label: 'Colour',
          value: style.color,
          opacityPreview: style.opacity,
          onChange: (color) => setLabelStyle(section.id, 'color', color),
        },
        {
          kind: 'slider',
          id: `${section.id}-size`,
          label: 'Size',
          value: style.size,
          min: 1,
          max: 18,
          step: 0.5,
          mode: 'raw',
          onChange: (size) => setLabelStyle(section.id, 'size', size),
        },
        {
          kind: 'slider',
          id: section.opacityId,
          label: 'Opacity',
          value: style.opacity,
          onChange: (opacity) => setLabelStyle(section.id, 'opacity', opacity),
        },
      ],
    },
    {
      title: 'Border',
      fields: [
        {
          kind: 'color',
          id: `${section.id}-border-colour`,
          label: 'Colour',
          value: style.borderColor,
          opacityPreview: style.borderOpacity,
          onChange: (borderColor) =>
            setLabelStyle(section.id, 'borderColor', borderColor),
        },
        {
          kind: 'slider',
          id: `${section.id}-border-width`,
          label: 'Thickness',
          value: style.borderWidth,
          min: 0,
          max: 6,
          step: 0.5,
          mode: 'raw',
          onChange: (borderWidth) =>
            setLabelStyle(section.id, 'borderWidth', borderWidth),
        },
        {
          kind: 'slider',
          id: `${section.id}-border-opacity`,
          label: 'Opacity',
          value: style.borderOpacity,
          onChange: (borderOpacity) =>
            setLabelStyle(section.id, 'borderOpacity', borderOpacity),
        },
      ],
    },
  ];
}
