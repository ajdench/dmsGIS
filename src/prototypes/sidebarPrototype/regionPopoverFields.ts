import type {
  RegionStyleState,
} from './prototypeStyleState';
import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';

export function buildRegionControlSections(
  label: string,
  styleState: RegionStyleState,
  onStyleChange: (nextStyle: RegionStyleState) => void,
): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Points',
      enabled: styleState.pointsEnabled,
      onToggle: () =>
        onStyleChange({
          ...styleState,
          pointsEnabled: !styleState.pointsEnabled,
        }),
      fields: [
        {
          kind: 'shape',
          label: 'Shape',
          value: styleState.shape,
          onChange: (shape) =>
            onStyleChange({
              ...styleState,
              shape,
            }),
        },
        {
          kind: 'slider',
          id: `${label}-size`,
          label: 'Size',
          value: styleState.size,
          min: 1,
          max: 12,
          step: 0.5,
          mode: 'raw',
          onChange: (size) =>
            onStyleChange({
              ...styleState,
              size,
            }),
        },
        {
          kind: 'color',
          id: `${label}-colour`,
          label: 'Colour',
          value: styleState.color,
          opacityPreview: styleState.opacity,
          onChange: (color) =>
            onStyleChange({
              ...styleState,
              color,
            }),
        },
        {
          kind: 'slider',
          id: `${label}-opacity`,
          label: 'Opacity',
          value: styleState.opacity,
          onChange: (opacity) =>
            onStyleChange({
              ...styleState,
              opacity,
            }),
        },
      ],
    },
    {
      title: 'Border',
      enabled: styleState.borderEnabled,
      onToggle: () =>
        onStyleChange({
          ...styleState,
          borderEnabled: !styleState.borderEnabled,
        }),
      fields: [
        {
          kind: 'color',
          id: `${label}-border-colour`,
          label: 'Colour',
          value: styleState.borderColor,
          opacityPreview: styleState.borderOpacity,
          onChange: (borderColor) =>
            onStyleChange({
              ...styleState,
              borderColor,
            }),
        },
        {
          kind: 'slider',
          id: `${label}-border-width`,
          label: 'Thickness',
          value: styleState.borderWidth,
          min: 0,
          max: 10,
          step: 0.25,
          mode: 'raw',
          onChange: (borderWidth) =>
            onStyleChange({
              ...styleState,
              borderWidth,
            }),
        },
        {
          kind: 'slider',
          id: `${label}-border-opacity`,
          label: 'Opacity',
          value: styleState.borderOpacity,
          onChange: (borderOpacity) =>
            onStyleChange({
              ...styleState,
              borderOpacity,
            }),
        },
      ],
    },
  ];
}
