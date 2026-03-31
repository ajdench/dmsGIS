import type { SwatchStop } from './PrototypeControls';
import type {
  RegionStyleKey,
  RegionStyleState,
} from './prototypeStyleState';
import type { PrototypeControlSectionConfig } from './popoverFieldRenderer';

interface FacilityControlSectionArgs {
  facilityPointsEnabled: RegionStyleState['pointsEnabled'];
  facilityBorderEnabled: RegionStyleState['borderEnabled'];
  facilityShape: RegionStyleState['shape'];
  facilitySymbolSize: RegionStyleState['size'];
  facilityColor: RegionStyleState['color'];
  facilityOpacity: RegionStyleState['opacity'];
  mixedFacilityColors?: SwatchStop[];
  facilityBorderColor: RegionStyleState['borderColor'];
  facilityBorderWidth: RegionStyleState['borderWidth'];
  facilityBorderOpacity: RegionStyleState['borderOpacity'];
  mixedFacilityBorderColors?: SwatchStop[];
  setFacilityStyle: <K extends RegionStyleKey>(
    key: K,
    value: RegionStyleState[K],
  ) => void;
}

export function buildFacilityControlSections(
  args: FacilityControlSectionArgs,
): PrototypeControlSectionConfig[] {
  return [
    {
      title: 'Points',
      enabled: args.facilityPointsEnabled,
      onToggle: () =>
        args.setFacilityStyle('pointsEnabled', !args.facilityPointsEnabled),
      fields: [
        {
          kind: 'shape',
          label: 'Shape',
          value: args.facilityShape,
          onChange: (shape) => args.setFacilityStyle('shape', shape),
        },
        {
          kind: 'slider',
          id: 'pmc-size',
          label: 'Size',
          value: args.facilitySymbolSize,
          min: 1,
          max: 12,
          step: 0.5,
          mode: 'raw',
          onChange: (size) => args.setFacilityStyle('size', size),
        },
        {
          kind: 'color',
          id: 'pmc-colour',
          label: 'Colour',
          value: args.facilityColor,
          opacityPreview: args.facilityOpacity,
          mixedSwatches: args.mixedFacilityColors,
          onChange: (color) => args.setFacilityStyle('color', color),
        },
        {
          kind: 'slider',
          id: 'pmc-opacity',
          label: 'Opacity',
          value: args.facilityOpacity,
          onChange: (opacity) => args.setFacilityStyle('opacity', opacity),
        },
      ],
    },
    {
      title: 'Border',
      enabled: args.facilityBorderEnabled,
      onToggle: () =>
        args.setFacilityStyle('borderEnabled', !args.facilityBorderEnabled),
      fields: [
        {
          kind: 'color',
          id: 'pmc-border-colour',
          label: 'Colour',
          value: args.facilityBorderColor,
          opacityPreview: args.facilityBorderOpacity,
          mixedSwatches: args.mixedFacilityBorderColors,
          onChange: (borderColor) => args.setFacilityStyle('borderColor', borderColor),
        },
        {
          kind: 'slider',
          id: 'pmc-border-width',
          label: 'Line thickness',
          value: args.facilityBorderWidth,
          min: 0,
          max: 10,
          step: 0.25,
          mode: 'raw',
          onChange: (borderWidth) => args.setFacilityStyle('borderWidth', borderWidth),
        },
        {
          kind: 'slider',
          id: 'pmc-border-opacity',
          label: 'Border opacity',
          value: args.facilityBorderOpacity,
          onChange: (borderOpacity) =>
            args.setFacilityStyle('borderOpacity', borderOpacity),
        },
      ],
    },
  ];
}
