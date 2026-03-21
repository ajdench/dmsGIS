import type {
  OverlaySectionId,
  OverlayStyleKey,
  OverlayStyleState,
} from './prototypeStyleState';
import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';

export function buildOverlayControlSections(
  sectionId: OverlaySectionId,
  style: OverlayStyleState,
  setOverlayStyle: <K extends OverlayStyleKey>(
    sectionId: OverlaySectionId,
    key: K,
    value: OverlayStyleState[K],
  ) => void,
): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Layer',
      enabled: style.layerEnabled,
      onToggle: () => setOverlayStyle(sectionId, 'layerEnabled', !style.layerEnabled),
      fields: [
        {
          kind: 'color',
          id: `${sectionId}-colour`,
          label: 'Colour',
          value: style.color,
          opacityPreview: style.opacity,
          onChange: (color) => setOverlayStyle(sectionId, 'color', color),
        },
        {
          kind: 'slider',
          id: `${sectionId}-opacity`,
          label: 'Opacity',
          value: style.opacity,
          onChange: (opacity) => setOverlayStyle(sectionId, 'opacity', opacity),
        },
      ],
    },
    {
      title: 'Border',
      enabled: style.borderEnabled,
      onToggle: () => setOverlayStyle(sectionId, 'borderEnabled', !style.borderEnabled),
      fields: [
        {
          kind: 'color',
          id: `${sectionId}-border-colour`,
          label: 'Colour',
          value: style.borderColor,
          opacityPreview: style.borderOpacity,
          onChange: (borderColor) =>
            setOverlayStyle(sectionId, 'borderColor', borderColor),
        },
        {
          kind: 'slider',
          id: `${sectionId}-border-width`,
          label: 'Thickness',
          value: style.borderWidth,
          min: 0,
          max: 10,
          step: 0.25,
          mode: 'raw',
          onChange: (borderWidth) =>
            setOverlayStyle(sectionId, 'borderWidth', borderWidth),
        },
        {
          kind: 'slider',
          id: `${sectionId}-border-opacity`,
          label: 'Opacity',
          value: style.borderOpacity,
          onChange: (borderOpacity) =>
            setOverlayStyle(sectionId, 'borderOpacity', borderOpacity),
        },
      ],
    },
  ];
}
