import type {
  SidebarPopoverSectionDefinition,
  SidebarRowDefinition,
  SidebarSwatchStop,
} from '../../lib/sidebar/contracts';
import {
  collectImmediateChildVisibility,
  type SidebarVisibilityState,
} from '../../lib/sidebar/visibilityTree';
import { resolvePillSwatchOpacity } from '../../lib/sidebar/swatchVisibility';
import type {
  CombinedPracticeCatalogEntry,
  CombinedPracticeStyle,
  FacilitySymbolShape,
} from '../../types';

interface BuildCombinedPracticePanelOptions {
  combinedPractices: CombinedPracticeStyle[];
  combinedPracticeCatalog?: CombinedPracticeCatalogEntry[];
  visibleRegionNames?: ReadonlySet<string>;
  defaultCombinedPracticeStyles?: Record<string, CombinedPracticeStyle>;
  facilitySymbolShape: FacilitySymbolShape;
  setCombinedPracticeBorderVisibility: (name: string, visible: boolean) => void;
  setCombinedPracticeBorderColor: (name: string, color: string) => void;
  resetCombinedPracticeBorderColor: (name: string) => void;
  setCombinedPracticeBorderOpacity: (name: string, opacity: number) => void;
  setCombinedPracticeBorderWidth: (name: string, width: number) => void;
  setAllCombinedPracticeBorderVisibility: (visible: boolean) => void;
  setAllCombinedPracticeBorderColor: (color: string) => void;
  resetAllCombinedPracticeColorsToDefault: () => void;
  setAllCombinedPracticeBorderOpacity: (opacity: number) => void;
  setAllCombinedPracticeBorderWidth: (width: number) => void;
  resetCombinedPracticeBorderOpacity: (name: string) => void;
  resetCombinedPracticeBorderWidth: (name: string) => void;
  resetAllCombinedPracticeBorderOpacity: () => void;
  resetAllCombinedPracticeBorderWidth: () => void;
}

interface CombinedPracticePanelDefinition {
  visibilityState: SidebarVisibilityState;
  emptyMessage: string;
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

export function buildCombinedPracticePanelDefinition({
  combinedPractices,
  combinedPracticeCatalog = [],
  visibleRegionNames,
  defaultCombinedPracticeStyles = {},
  facilitySymbolShape,
  setCombinedPracticeBorderVisibility,
  setCombinedPracticeBorderColor,
  resetCombinedPracticeBorderColor,
  setCombinedPracticeBorderOpacity,
  setCombinedPracticeBorderWidth,
  setAllCombinedPracticeBorderVisibility,
  setAllCombinedPracticeBorderColor,
  resetAllCombinedPracticeColorsToDefault,
  setAllCombinedPracticeBorderOpacity,
  setAllCombinedPracticeBorderWidth,
  resetCombinedPracticeBorderOpacity,
  resetCombinedPracticeBorderWidth,
  resetAllCombinedPracticeBorderOpacity,
  resetAllCombinedPracticeBorderWidth,
}: BuildCombinedPracticePanelOptions): CombinedPracticePanelDefinition {
  const sortedPractices = combinedPractices
    .slice()
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName, undefined, {
        sensitivity: 'base',
      }),
    );
  const regionsByPracticeName = new Map(
    combinedPracticeCatalog.map((entry) => [entry.name, entry.regions]),
  );
  const visiblePractices = sortedPractices.filter((practice) => {
    const regions = regionsByPracticeName.get(practice.name);
    if (!regions || regions.length === 0 || !visibleRegionNames) {
      return true;
    }

    return regions.some((regionName) => visibleRegionNames.has(regionName));
  });
  const visibilityState = collectImmediateChildVisibility(
    sortedPractices,
    (practice) => practice.visible,
  );
  const swatchPractices =
    visiblePractices.length > 0 ? visiblePractices : sortedPractices;
  const mixedBorderColors = buildMixedSwatches(
    swatchPractices.map((practice) => ({
      color: practice.borderColor,
      opacity: practice.borderOpacity,
    })),
  );
  const defaultMixedBorderColors = buildMixedSwatches(
    swatchPractices.map((practice) => ({
      color:
        defaultCombinedPracticeStyles[practice.name]?.borderColor ??
        practice.borderColor,
      opacity: 1,
    })),
  );
  const firstPractice = swatchPractices[0];

  return {
    visibilityState,
    emptyMessage:
      sortedPractices.length === 0
        ? 'No combined practices loaded'
        : 'No combined practices visible',
    pillSummary: {
      valueLabel: formatPercent(firstPractice?.borderOpacity ?? 1),
      ariaLabel: 'Combined practice controls',
      swatch: {
        color: firstPractice?.borderColor ?? '#cbd5e1',
        opacity: resolvePillSwatchOpacity(
          firstPractice?.borderOpacity ?? 1,
          visibilityState !== 'off',
        ),
        mix: mixedBorderColors,
        shape: facilitySymbolShape,
        borderColor: firstPractice?.borderColor ?? '#cbd5e1',
        borderOpacity: firstPractice?.borderOpacity ?? 1,
        borderWidth: visibilityState === 'off' ? 0 : firstPractice?.borderWidth ?? 1,
      },
    },
    sections: [
      {
        title: 'Border',
        enabledState: visibilityState,
        onEnabledChange: setAllCombinedPracticeBorderVisibility,
        fields: [
          {
            kind: 'color',
            id: 'combined-practices-border-colour',
            label: 'Colour',
            value: firstPractice?.borderColor ?? '#cbd5e1',
            opacityPreview: firstPractice?.borderOpacity ?? 1,
            mixedSwatches: mixedBorderColors,
            onChange: setAllCombinedPracticeBorderColor,
            onCopy: resetAllCombinedPracticeColorsToDefault,
            copySwatches: defaultMixedBorderColors,
            copyLabel: 'Reset to default colours',
            copyShowIcon: true,
            copyIcon: 'reset',
          },
          {
            kind: 'slider',
            id: 'combined-practices-border-width',
            label: 'Thickness',
            value: firstPractice?.borderWidth ?? 1,
            min: 0,
            max: 4,
            step: 0.25,
            mode: 'raw',
            onChange: setAllCombinedPracticeBorderWidth,
            onReset: resetAllCombinedPracticeBorderWidth,
            resetPlacement: 'right',
            resetTone: 'neutral',
          },
          {
            kind: 'slider',
            id: 'combined-practices-border-opacity',
            label: 'Opacity',
            value: firstPractice?.borderOpacity ?? 1,
            onChange: setAllCombinedPracticeBorderOpacity,
            onReset: resetAllCombinedPracticeBorderOpacity,
            resetPlacement: 'right',
            resetTone: 'neutral',
          },
        ],
      },
    ],
    rows: visiblePractices.map((practice) => ({
      id: practice.name,
      label: practice.displayName,
      visibility: {
        state: practice.visible ? 'on' : 'off',
        onChange: (visible) =>
          setCombinedPracticeBorderVisibility(practice.name, visible),
      },
      pill: {
        valueLabel: formatPercent(practice.borderOpacity),
        ariaLabel: `${practice.displayName} controls`,
        swatch: {
          color: practice.borderColor,
          opacity: resolvePillSwatchOpacity(
            practice.borderOpacity,
            practice.visible,
          ),
          shape: facilitySymbolShape,
          borderColor: practice.borderColor,
          borderOpacity: practice.borderOpacity,
          borderWidth: practice.visible ? practice.borderWidth : 0,
        },
      },
      sections: [
        {
          title: 'Border',
          enabledState: practice.visible ? 'on' : 'off',
          onEnabledChange: (enabled) =>
            setCombinedPracticeBorderVisibility(practice.name, enabled),
          fields: [
            {
              kind: 'color',
              id: `combined-practice-${practice.name}-colour`,
              label: 'Colour',
              value: practice.borderColor,
              opacityPreview: practice.borderOpacity,
              onChange: (color) =>
                setCombinedPracticeBorderColor(practice.name, color),
              onCopy: () => resetCombinedPracticeBorderColor(practice.name),
              copySwatches: [
                {
                  color:
                    defaultCombinedPracticeStyles[practice.name]?.borderColor ??
                    practice.borderColor,
                  opacity: 1,
                },
              ],
              copyLabel: `Reset ${practice.displayName} colour`,
              copyShowIcon: true,
              copyIcon: 'reset',
            },
            {
              kind: 'slider',
              id: `combined-practice-${practice.name}-width`,
              label: 'Thickness',
              value: practice.borderWidth,
              min: 0,
              max: 4,
              step: 0.25,
              mode: 'raw',
              onChange: (width) =>
                setCombinedPracticeBorderWidth(practice.name, width),
              onReset: () => resetCombinedPracticeBorderWidth(practice.name),
              resetPlacement: 'right',
              resetTone: 'neutral',
            },
            {
              kind: 'slider',
              id: `combined-practice-${practice.name}-opacity`,
              label: 'Opacity',
              value: practice.borderOpacity,
              onChange: (opacity) =>
                setCombinedPracticeBorderOpacity(practice.name, opacity),
              onReset: () => resetCombinedPracticeBorderOpacity(practice.name),
              resetPlacement: 'right',
              resetTone: 'neutral',
            },
          ],
        },
      ],
    })),
  };
}

function buildMixedSwatches(
  swatches: Array<{ color: string; opacity: number }>,
): SidebarSwatchStop[] | undefined {
  if (swatches.length === 0) {
    return undefined;
  }

  const unique = new Map<string, SidebarSwatchStop>();
  for (const swatch of swatches) {
    const key = `${swatch.color}:${swatch.opacity}`;
    if (!unique.has(key)) {
      unique.set(key, { color: swatch.color, opacity: swatch.opacity });
    }
  }
  return [...unique.values()];
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}
