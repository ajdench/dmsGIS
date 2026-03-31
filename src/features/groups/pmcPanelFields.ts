import type {
  SidebarPopoverSectionDefinition,
  SidebarRowDefinition,
  SidebarSwatchStop,
} from '../../lib/sidebar/contracts';
import { resolvePillSwatchOpacity } from '../../lib/sidebar/swatchVisibility';
import {
  collectImmediateChildVisibility,
  type SidebarVisibilityState,
} from '../../lib/sidebar/visibilityTree';
import {
  PMC_REGION_ORDER,
  sortItemsByPmcRegionOrder,
  wrapRegionLabel,
} from '../../lib/regions/regionOrder';
import type { FacilitySymbolShape, RegionStyle } from '../../types';

interface BuildPmcPanelRowsOptions {
  regions: RegionStyle[];
  facilitySymbolShape: FacilitySymbolShape;
  facilitySymbolSize: number;
  regionGlobalOpacity: number;
  setRegionVisibility: (name: string, visible: boolean) => void;
  setRegionColor: (name: string, color: string) => void;
  setRegionOpacity: (name: string, opacity: number) => void;
  setRegionBorderVisibility: (name: string, visible: boolean) => void;
  setRegionBorderColor: (name: string, color: string) => void;
  setRegionBorderOpacity: (name: string, opacity: number) => void;
  setRegionBorderWidth: (name: string, width: number) => void;
  setRegionShape: (name: string, shape: FacilitySymbolShape) => void;
  setRegionSymbolSize: (name: string, size: number) => void;
  setRegionGlobalOpacity: (opacity: number) => void;
  setAllRegionVisibility: (visible: boolean) => void;
  setAllRegionColor: (color: string) => void;
  resetAllRegionColorsToDefault: () => void;
  setAllRegionBorderVisibility: (visible: boolean) => void;
  setAllRegionBorderColor: (color: string) => void;
  setAllRegionBorderOpacity: (opacity: number) => void;
  setAllRegionBorderWidth: (width: number) => void;
  copyFillToBorder: () => void;
  copyRegionFillToBorder: (name: string) => void;
  setAllRegionShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolSize: (size: number) => void;
  defaultRegionColors?: Record<string, string>;
  borderSectionStateOverride?: SidebarVisibilityState;
}

interface PmcPanelDefinition {
  visibilityState: ReturnType<typeof collectImmediateChildVisibility<RegionStyle>>;
  pillSummary: {
    valueLabel: string;
    ariaLabel: string;
    swatch: {
      color: string;
      opacity: number;
      mix?: SidebarSwatchStop[];
      shape: FacilitySymbolShape;
      borderColor?: string;
      borderOpacity?: number;
      borderWidth?: number;
    };
  };
  sections: SidebarPopoverSectionDefinition[];
  rows: SidebarRowDefinition[];
}

export function buildPmcPanelDefinition({
  regions,
  facilitySymbolShape,
  facilitySymbolSize,
  regionGlobalOpacity,
  setRegionVisibility,
  setRegionColor,
  setRegionOpacity,
  setRegionBorderVisibility,
  setRegionBorderColor,
  setRegionBorderOpacity,
  setRegionBorderWidth,
  setRegionShape,
  setRegionSymbolSize,
  setRegionGlobalOpacity,
  setAllRegionVisibility,
  setAllRegionColor,
  resetAllRegionColorsToDefault,
  setAllRegionBorderVisibility,
  setAllRegionBorderColor,
  setAllRegionBorderOpacity,
  setAllRegionBorderWidth,
  copyFillToBorder,
  copyRegionFillToBorder,
  setAllRegionShape,
  setFacilitySymbolSize,
  defaultRegionColors = {},
  borderSectionStateOverride,
}: BuildPmcPanelRowsOptions): PmcPanelDefinition {
  const sortedRegions = sortRegions(regions);
  const visibilityState = collectImmediateChildVisibility(
    sortedRegions,
    (region) => region.visible,
  );
  const borderState = collectImmediateChildVisibility(
    sortedRegions,
    (region) => region.borderVisible,
  );
  const pointsSectionState =
    sortedRegions.some((region) => region.visible) ? 'on' : 'off';
  const borderSectionState =
    borderSectionStateOverride ??
    (sortedRegions.length > 0 &&
    sortedRegions.every((region) => region.borderVisible)
      ? 'on'
      : 'off');
  const mixedFacilityColors = buildMixedSwatches(
    sortedRegions.map((region) => ({
      color: region.color,
      opacity: region.opacity,
    })),
  );
  const mixedFacilityColorsForBorderCopy = buildMixedSwatches(
    sortedRegions.map((region) => ({
      color: region.color,
      opacity: 1,
    })),
  );
  const defaultMixedFacilityColors = buildMixedSwatches(
    sortedRegions.map((region) => ({
      color: defaultRegionColors[region.name] ?? region.color,
      opacity: region.opacity,
    })),
  );
  const mixedBorderColors = buildMixedSwatches(
    sortedRegions.map((region) => ({
      color: region.borderColor,
      opacity: region.borderOpacity,
    })),
  );

  return {
    visibilityState,
    pillSummary: {
      valueLabel: formatPercent(regionGlobalOpacity),
      ariaLabel: 'PMC controls',
      swatch: {
        color: sortedRegions[0]?.color ?? '#cbd5e1',
        opacity: visibilityState === 'off' ? 0 : regionGlobalOpacity,
        mix: mixedFacilityColors,
        shape: facilitySymbolShape,
        borderColor: sortedRegions[0]?.borderColor ?? '#cbd5e1',
        borderOpacity: sortedRegions[0]?.borderOpacity ?? 0,
        borderWidth: borderState === 'off' ? 0 : (sortedRegions[0]?.borderWidth ?? 1),
      },
    },
    sections: [
      {
        title: 'Points',
        enabledState: pointsSectionState,
        onEnabledChange: setAllRegionVisibility,
        fields: [
          {
            kind: 'shape',
            label: 'Shape',
            value: facilitySymbolShape,
            onChange: setAllRegionShape,
          },
          {
            kind: 'color',
            id: 'pmc-colour',
            label: 'Colour',
            value: sortedRegions[0]?.color ?? '#cbd5e1',
            opacityPreview: regionGlobalOpacity,
            mixedSwatches: mixedFacilityColors,
            onChange: setAllRegionColor,
            onCopy: resetAllRegionColorsToDefault,
            copySwatches:
              defaultMixedFacilityColors ??
              (sortedRegions[0]
                ? [
                    {
                      color:
                        defaultRegionColors[sortedRegions[0].name] ??
                        sortedRegions[0].color,
                      opacity: sortedRegions[0].opacity,
                    },
                  ]
                : undefined),
            copyLabel: 'Reset to default colours',
            copyShowIcon: true,
            copyIcon: 'reset',
          },
          {
            kind: 'slider',
            id: 'pmc-size',
            label: 'Size',
            value: facilitySymbolSize,
            min: 1,
            max: 12,
            step: 0.5,
            mode: 'raw',
            onChange: setFacilitySymbolSize,
          },
          {
            kind: 'slider',
            id: 'pmc-opacity',
            label: 'Opacity',
            value: regionGlobalOpacity,
            onChange: setRegionGlobalOpacity,
          },
        ],
      },
        {
          title: 'Border',
          enabledState: borderSectionState,
          onEnabledChange: setAllRegionBorderVisibility,
          fields: [
          {
            kind: 'color',
            id: 'pmc-border-colour',
            label: 'Colour',
            value: sortedRegions[0]?.borderColor ?? '#cbd5e1',
            opacityPreview: sortedRegions[0]?.borderOpacity ?? 0,
            mixedSwatches: mixedBorderColors,
            onChange: setAllRegionBorderColor,
            onCopy: copyFillToBorder,
            copySwatches: mixedFacilityColorsForBorderCopy,
          },
          {
            kind: 'slider',
            id: 'pmc-border-width',
            label: 'Thickness',
            value: sortedRegions[0]?.borderWidth ?? 1,
            min: 0,
            max: 10,
            step: 0.25,
            mode: 'raw',
            onChange: setAllRegionBorderWidth,
          },
          {
            kind: 'slider',
            id: 'pmc-border-opacity',
            label: 'Opacity',
            value: sortedRegions[0]?.borderOpacity ?? 0,
            onChange: setAllRegionBorderOpacity,
          },
        ],
      },
    ],
    rows: sortedRegions.map((region) => ({
      id: region.name,
          label: wrapRegionLabel(region.name),
      visibility: {
        state: region.visible ? 'on' : 'off',
        onChange: (visible) => setRegionVisibility(region.name, visible),
      },
      pill: {
        valueLabel: formatPercent(region.opacity),
        ariaLabel: `${region.name} controls`,
        swatch: {
          color: region.color,
          opacity: resolvePillSwatchOpacity(region.opacity, region.visible),
          shape: region.shape,
          borderColor: region.borderColor,
          borderOpacity: region.borderOpacity,
          borderWidth: region.borderVisible ? region.borderWidth : 0,
        },
      },
      sections: [
        {
          title: 'Points',
          enabledState: region.visible ? 'on' : 'off',
          onEnabledChange: (visible) => setRegionVisibility(region.name, visible),
          fields: [
            {
              kind: 'shape',
              label: 'Shape',
              value: region.shape,
              onChange: (shape) => setRegionShape(region.name, shape),
            },
            {
              kind: 'color',
              id: `${slugify(region.name)}-colour`,
              label: 'Colour',
              value: region.color,
              opacityPreview: region.opacity,
              onChange: (color) => setRegionColor(region.name, color),
            },
            {
              kind: 'slider',
              id: `${slugify(region.name)}-size`,
              label: 'Size',
              value: region.symbolSize,
              min: 1,
              max: 12,
              step: 0.5,
              mode: 'raw',
              onChange: (size) => setRegionSymbolSize(region.name, size),
            },
            {
              kind: 'slider',
              id: `${slugify(region.name)}-opacity`,
              label: 'Opacity',
              value: region.opacity,
              onChange: (opacity) => setRegionOpacity(region.name, opacity),
            },
          ],
        },
        {
          title: 'Border',
          enabledState: region.borderVisible ? 'on' : 'off',
          onEnabledChange: (visible) =>
            setRegionBorderVisibility(region.name, visible),
          fields: [
            {
              kind: 'color',
              id: `${slugify(region.name)}-border-colour`,
              label: 'Colour',
              value: region.borderColor,
              opacityPreview: region.borderOpacity,
              onChange: (color) => setRegionBorderColor(region.name, color),
              onCopy: () => copyRegionFillToBorder(region.name),
              copySwatches: [{ color: region.color, opacity: 1 }],
            },
            {
              kind: 'slider',
              id: `${slugify(region.name)}-border-width`,
              label: 'Thickness',
              value: region.borderWidth,
              min: 0,
              max: 10,
              step: 0.25,
              mode: 'raw',
              onChange: (width) => setRegionBorderWidth(region.name, width),
            },
            {
              kind: 'slider',
              id: `${slugify(region.name)}-border-opacity`,
              label: 'Opacity',
              value: region.borderOpacity,
              onChange: (opacity) =>
                setRegionBorderOpacity(region.name, opacity),
            },
          ],
        },
      ],
    })),
  };
}

function sortRegions(regions: RegionStyle[]): RegionStyle[] {
  return sortItemsByPmcRegionOrder(regions).filter((region) =>
    PMC_REGION_ORDER.includes(region.name as (typeof PMC_REGION_ORDER)[number]),
  );
}

function buildMixedSwatches(
  swatches: SidebarSwatchStop[],
): SidebarSwatchStop[] | undefined {
  const uniqueSwatches = swatches.filter(
    (swatch, index, allSwatches) =>
      allSwatches.findIndex(
        (candidate) =>
          candidate.color === swatch.color &&
          (candidate.opacity ?? 1) === (swatch.opacity ?? 1),
      ) === index,
  );

  return uniqueSwatches.length > 1 ? uniqueSwatches : undefined;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
