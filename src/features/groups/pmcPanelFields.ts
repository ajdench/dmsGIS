import type {
  SidebarPopoverSectionDefinition,
  SidebarRowDefinition,
  SidebarSwatchStop,
} from '../../lib/sidebar/contracts';
import { resolvePillSwatchOpacity } from '../../lib/sidebar/swatchVisibility';
import { collectImmediateChildVisibility } from '../../lib/sidebar/visibilityTree';
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
  setAllRegionBorderVisibility: (visible: boolean) => void;
  setAllRegionBorderColor: (color: string) => void;
  setAllRegionBorderOpacity: (opacity: number) => void;
  setAllRegionBorderWidth: (width: number) => void;
  copyFillToBorder: () => void;
  copyRegionFillToBorder: (name: string) => void;
  setAllRegionShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolShape: (shape: FacilitySymbolShape) => void;
  setFacilitySymbolSize: (size: number) => void;
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

const REGION_ORDER = [
  'Scotland & Northern Ireland',
  'North',
  'Wales & West Midlands',
  'East',
  'South West',
  'Central & Wessex',
  'London & South',
  'Overseas',
] as const;

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
  setAllRegionBorderVisibility,
  setAllRegionBorderColor,
  setAllRegionBorderOpacity,
  setAllRegionBorderWidth,
  copyFillToBorder,
  copyRegionFillToBorder,
  setAllRegionShape,
  setFacilitySymbolShape,
  setFacilitySymbolSize,
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
  const mixedFacilityColors = buildMixedSwatches(
    sortedRegions.map((region) => ({
      color: region.color,
      opacity: region.opacity,
    })),
  );
  const mixedBorderColors = buildMixedSwatches(
    sortedRegions
      .filter((region) => region.borderVisible)
      .map((region) => ({
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
        enabledState: visibilityState,
        onEnabledChange: setAllRegionVisibility,
        fields: [
          {
            kind: 'shape',
            label: 'Shape',
            value: facilitySymbolShape,
            onChange: setAllRegionShape,
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
            kind: 'color',
            id: 'pmc-colour',
            label: 'Colour',
            value: sortedRegions[0]?.color ?? '#cbd5e1',
            opacityPreview: regionGlobalOpacity,
            mixedSwatches: mixedFacilityColors,
            onChange: setAllRegionColor,
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
          enabledState: borderState,
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
            copySwatches: mixedFacilityColors,
          },
          {
            kind: 'slider',
            id: 'pmc-border-opacity',
            label: 'Opacity',
            value: sortedRegions[0]?.borderOpacity ?? 0,
            onChange: setAllRegionBorderOpacity,
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
        ],
      },
    ],
    rows: sortedRegions.map((region) => ({
      id: region.name,
          label: region.name,
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
              copySwatches: [{ color: region.color, opacity: region.opacity }],
            },
            {
              kind: 'slider',
              id: `${slugify(region.name)}-border-opacity`,
              label: 'Opacity',
              value: region.borderOpacity,
              onChange: (opacity) =>
                setRegionBorderOpacity(region.name, opacity),
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
          ],
        },
      ],
    })),
  };
}

function sortRegions(regions: RegionStyle[]): RegionStyle[] {
  return [...regions].sort((left, right) => {
    const leftIndex = REGION_ORDER.indexOf(left.name as (typeof REGION_ORDER)[number]);
    const rightIndex = REGION_ORDER.indexOf(
      right.name as (typeof REGION_ORDER)[number],
    );

    return leftIndex - rightIndex;
  }).filter((region) =>
    REGION_ORDER.includes(region.name as (typeof REGION_ORDER)[number]),
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
