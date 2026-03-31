import type {
  SidebarPillSummary,
  SidebarPopoverSectionDefinition,
  SidebarRowDefinition,
  SidebarSwatchStop,
} from '../../lib/sidebar/contracts';
import type { SidebarVisibilityState } from '../../lib/sidebar/visibilityTree';
import type { PresetRegionGroup } from '../../lib/config/viewPresets';
import type { RegionGroupStyleOverride } from '../../types';
import {
  stripScenarioRegionPrefix,
  wrapRegionLabel,
} from '../../lib/regions/regionOrder';

/**
 * Deduplicates swatch stops and returns undefined if there is only one unique stop
 * (matching PMC panel pattern for multi-colour pill swatches).
 */
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

interface BuildRegionsPanelRowsOptions {
  groups: PresetRegionGroup[];
  overrides: Record<string, RegionGroupStyleOverride>;
  setVisible: (groupName: string, visible: boolean) => void;
  setPopulatedFillVisible: (groupName: string, visible: boolean) => void;
  setUnpopulatedFillVisible: (groupName: string, visible: boolean) => void;
  setPopulatedFillColor: (groupName: string, color: string | null) => void;
  setUnpopulatedFillColor: (groupName: string, color: string | null) => void;
  setPopulatedOpacity: (groupName: string, opacity: number) => void;
  setUnpopulatedOpacity: (groupName: string, opacity: number) => void;
  setBorderVisible: (groupName: string, visible: boolean) => void;
  setBorderColor: (groupName: string, color: string) => void;
  setBorderOpacity: (groupName: string, opacity: number) => void;
  setBorderWidth: (groupName: string, width: number) => void;
}

interface BuildRegionsGlobalPillOptions {
  groups: PresetRegionGroup[];
  overrides: Record<string, RegionGroupStyleOverride>;
  setAllPopulatedOpacity: (opacity: number) => void;
  setAllUnpopulatedOpacity: (opacity: number) => void;
  setAllBorderVisible: (visible: boolean) => void;
  setAllBorderOpacity: (opacity: number) => void;
  setAllBorderWidth: (width: number) => void;
}

/** Returns effective values for a group, applying override if present. */
export function getEffectiveGroupStyle(
  group: PresetRegionGroup,
  overrides: Record<string, RegionGroupStyleOverride>,
): RegionGroupStyleOverride {
  const override = overrides[group.name];
  return {
    visible: override?.visible ?? true,
    populatedFillVisible: override?.populatedFillVisible ?? true,
    unpopulatedFillVisible: override?.unpopulatedFillVisible ?? true,
    populatedFillColor: override?.populatedFillColor ?? null,
    unpopulatedFillColor: override?.unpopulatedFillColor ?? null,
    populatedOpacity: override?.populatedOpacity ?? group.populatedOpacity,
    unpopulatedOpacity: override?.unpopulatedOpacity ?? group.unpopulatedOpacity,
    borderVisible: override?.borderVisible ?? false,
    borderColor: override?.borderColor ?? group.borderColor,
    borderOpacity: override?.borderOpacity ?? group.borderOpacity,
    borderWidth: override?.borderWidth ?? group.borderWidth,
  };
}

/**
 * Derives the row-level visibility state from per-fill visibility flags.
 *   Both on  → 'on'
 *   Both off → 'off'
 *   Mixed    → 'mixed'
 */
function deriveRowVisibilityState(
  populatedFillVisible: boolean,
  unpopulatedFillVisible: boolean,
): SidebarVisibilityState {
  if (populatedFillVisible && unpopulatedFillVisible) return 'on';
  if (!populatedFillVisible && !unpopulatedFillVisible) return 'off';
  return 'mixed';
}

/**
 * Builds the global pill sections for the Regions section card header.
 * Broadcasts populated opacity, unpopulated opacity, and border visibility
 * to ALL groups in the current preset.
 */
export function buildRegionsGlobalPillSections(
  options: BuildRegionsGlobalPillOptions,
): SidebarPopoverSectionDefinition[] {
  const {
    groups,
    overrides,
    setAllPopulatedOpacity,
    setAllUnpopulatedOpacity,
    setAllBorderVisible,
    setAllBorderOpacity,
    setAllBorderWidth,
  } = options;

  // Compute aggregate values (average opacities/width, aggregate border state).
  const effs = groups.map((g) => getEffectiveGroupStyle(g, overrides));
  const avgPopulatedOpacity =
    effs.length > 0
      ? effs.reduce((sum, e) => sum + e.populatedOpacity, 0) / effs.length
      : 0.35;
  const avgUnpopulatedOpacity =
    effs.length > 0
      ? effs.reduce((sum, e) => sum + e.unpopulatedOpacity, 0) / effs.length
      : 0.25;
  const avgBorderWidth =
    effs.length > 0
      ? effs.reduce((sum, e) => sum + e.borderWidth, 0) / effs.length
      : 1;
  const avgBorderOpacity =
    effs.length > 0
      ? effs.reduce((sum, e) => sum + e.borderOpacity, 0) / effs.length
      : 0.35;
  const anyBorderVisible = effs.some((e) => e.borderVisible);

  return [
    {
      title: 'Fill: populated',
      fields: [
        {
          kind: 'slider',
          id: 'regions-global-populated-opacity',
          label: 'Opacity',
          value: avgPopulatedOpacity,
          step: 0.01,
          onChange: setAllPopulatedOpacity,
        },
      ],
    },
    {
      title: 'Fill: unpopulated',
      fields: [
        {
          kind: 'slider',
          id: 'regions-global-unpopulated-opacity',
          label: 'Opacity',
          value: avgUnpopulatedOpacity,
          step: 0.01,
          onChange: setAllUnpopulatedOpacity,
        },
      ],
    },
    {
      title: 'Border',
      enabledState: anyBorderVisible ? 'on' : 'off',
      onEnabledChange: setAllBorderVisible,
      fields: [
        {
          kind: 'slider',
          id: 'regions-global-border-width',
          label: 'Thickness',
          value: avgBorderWidth,
          min: 0.5,
          max: 4,
          step: 0.5,
          mode: 'raw' as const,
          onChange: setAllBorderWidth,
        },
        {
          kind: 'slider',
          id: 'regions-global-border-opacity',
          label: 'Opacity',
          value: avgBorderOpacity,
          step: 0.01,
          onChange: setAllBorderOpacity,
        },
      ],
    },
  ];
}

/**
 * Builds the global pill summary for the Regions section card header.
 * Uses a multi-colour mix swatch (one stop per group populated colour at 30% opacity),
 * matching the PMC global pill pattern.
 */
export function buildRegionsGlobalPillSummary(
  groups: PresetRegionGroup[],
  overrides: Record<string, RegionGroupStyleOverride>,
): SidebarPillSummary {
  const effs = groups.map((g) => getEffectiveGroupStyle(g, overrides));
  const avgPopulatedOpacity =
    effs.length > 0
      ? effs.reduce((sum, e) => sum + e.populatedOpacity, 0) / effs.length
      : 0.4;

  const allGroupSwatches: SidebarSwatchStop[] = groups.map((g, i) => ({
    color: effs[i].populatedFillColor ?? g.colors.populated,
    opacity: 0.30,
  }));
  const mixedColors = buildMixedSwatches(allGroupSwatches);
  const firstColor = (effs[0]?.populatedFillColor ?? groups[0]?.colors.populated) ?? '#8888a0';

  return {
    valueLabel: `${Math.round(avgPopulatedOpacity * 100)}%`,
    ariaLabel: 'Region groups global controls',
    swatch: {
      color: firstColor,
      opacity: 0.30,
      mix: mixedColors,
    },
  };
}

export function buildRegionsPanelRows({
  groups,
  overrides,
  setVisible,
  setPopulatedFillVisible,
  setUnpopulatedFillVisible,
  setPopulatedFillColor,
  setUnpopulatedFillColor,
  setPopulatedOpacity,
  setUnpopulatedOpacity,
  setBorderVisible,
  setBorderColor,
  setBorderOpacity,
  setBorderWidth,
}: BuildRegionsPanelRowsOptions): SidebarRowDefinition[] {
  return groups.map((group) => {
    const eff = getEffectiveGroupStyle(group, overrides);
    const id = group.name;

    const visibilityState = deriveRowVisibilityState(
      eff.populatedFillVisible,
      eff.unpopulatedFillVisible,
    );

    // Effective colours: override colour, or group config default.
    const populatedColor = eff.populatedFillColor ?? group.colors.populated;
    const unpopulatedColor = eff.unpopulatedFillColor ?? group.colors.unpopulated;

    // Per-row pill uses a two-stop mixed swatch: populated at 30% + unpopulated at 20%.
    // buildMixedSwatches returns undefined when both colours are identical (e.g. coa3a),
    // in which case the pill falls back to the single-colour swatch.
    const rowMix = buildMixedSwatches([
      { color: populatedColor, opacity: 0.30 },
      { color: unpopulatedColor, opacity: 0.20 },
    ]);

    return {
      id,
      label: wrapRegionLabel(stripScenarioRegionPrefix(group.name)),
      visibility: {
        state: visibilityState,
        onChange: (visible) => {
          // Row toggle: set both fill visibilities together + legacy visible flag.
          setPopulatedFillVisible(id, visible);
          setUnpopulatedFillVisible(id, visible);
          setVisible(id, visible);
        },
      },
      pill: {
        valueLabel: `${Math.round(eff.populatedOpacity * 100)}%`,
        ariaLabel: `${group.name} region controls`,
        swatch: {
          color: populatedColor,
          opacity: 0.30,
          mix: rowMix,
        },
      },
      sections: [
        {
          title: 'Fill: populated',
          enabledState: eff.populatedFillVisible ? 'on' : 'off',
          onEnabledChange: (enabled) => {
            setPopulatedFillVisible(id, enabled);
            setVisible(id, enabled || eff.unpopulatedFillVisible);
          },
          fields: [
            {
              kind: 'color',
              id: `${id}-populated-colour`,
              label: 'Colour',
              value: populatedColor,
              opacityPreview: eff.populatedOpacity,
              onChange: (color) => setPopulatedFillColor(id, color),
              onCopy: () => setPopulatedFillColor(id, null),
              copyIcon: 'reset' as const,
              copyShowIcon: true,
              copyLabel: 'Reset to default colour',
              copySwatches: [{ color: group.colors.populated, opacity: eff.populatedOpacity }],
            },
            {
              kind: 'slider',
              id: `${id}-populated-opacity`,
              label: 'Opacity',
              value: eff.populatedOpacity,
              step: 0.01,
              onChange: (value) => setPopulatedOpacity(id, value),
              onReset: () => setPopulatedOpacity(id, group.populatedOpacity),
            },
          ],
        },
        {
          title: 'Fill: unpopulated',
          enabledState: eff.unpopulatedFillVisible ? 'on' : 'off',
          onEnabledChange: (enabled) => {
            setUnpopulatedFillVisible(id, enabled);
            setVisible(id, eff.populatedFillVisible || enabled);
          },
          fields: [
            {
              kind: 'color',
              id: `${id}-unpopulated-colour`,
              label: 'Colour',
              value: unpopulatedColor,
              opacityPreview: eff.unpopulatedOpacity,
              onChange: (color) => setUnpopulatedFillColor(id, color),
              onCopy: () => setUnpopulatedFillColor(id, null),
              copyIcon: 'reset' as const,
              copyShowIcon: true,
              copyLabel: 'Reset to default colour',
              copySwatches: [{ color: group.colors.unpopulated, opacity: eff.unpopulatedOpacity }],
            },
            {
              kind: 'slider',
              id: `${id}-unpopulated-opacity`,
              label: 'Opacity',
              value: eff.unpopulatedOpacity,
              step: 0.01,
              onChange: (value) => setUnpopulatedOpacity(id, value),
              onReset: () => setUnpopulatedOpacity(id, group.unpopulatedOpacity),
            },
          ],
        },
        {
          title: 'Border',
          enabledState: eff.borderVisible ? 'on' : 'off',
          onEnabledChange: (enabled) => setBorderVisible(id, enabled),
          fields: [
            {
              kind: 'color',
              id: `${id}-border-colour`,
              label: 'Colour',
              value: eff.borderColor,
              onChange: (color) => setBorderColor(id, color),
            },
            {
              kind: 'slider',
              id: `${id}-border-width`,
              label: 'Thickness',
              value: eff.borderWidth,
              min: 0.5,
              max: 4,
              step: 0.5,
              mode: 'raw' as const,
              onChange: (value) => setBorderWidth(id, value),
              onReset: () => setBorderWidth(id, group.borderWidth),
            },
            {
              kind: 'slider',
              id: `${id}-border-opacity`,
              label: 'Opacity',
              value: eff.borderOpacity,
              step: 0.01,
              onChange: (value) => setBorderOpacity(id, value),
              onReset: () => setBorderOpacity(id, group.borderOpacity),
            },
          ],
        },
      ],
    };
  });
}
