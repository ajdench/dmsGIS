import { DEFAULT_PAR_CORRECTION_POLICY } from './config/parCorrection';
import type { PresetRegionGroup } from './config/viewPresets';
import { getScenarioPresetConfig } from './config/viewPresets';
import type { RegionStyle, RegionGroupStyleOverride, ViewPresetId } from '../types';
import type { FacilitySymbolShape } from '../types';
import { PMC_REGION_ORDER, stripScenarioRegionPrefix } from './regions/regionOrder';
import { getEffectiveGroupStyle } from '../features/groups/regionsPanelFields';
import {
  buildProportionalParCorrectionSummary,
  formatParDisplayValue,
  parseFacilityParValue,
} from './facilityPar';

interface WorkspaceBottomCardSwatch {
  color: string;
  opacity: number;
  shape: FacilitySymbolShape;
  borderColor: string;
  borderOpacity: number;
  borderWidth: number;
}

export interface WorkspaceBottomCard {
  key: string;
  title: string;
  swatch: WorkspaceBottomCardSwatch;
  actualParDisplay: string | null;
  correctionParDisplay: string | null;
  parDisplay: string | null;
  middleRow?:
    | {
        kind: 'button';
        label: string;
      }
    | {
        kind: 'royalNavyContribution';
        swatch: WorkspaceBottomCardSwatch;
        valueDisplay: string;
      };
}

export interface WorkspaceBottomCardModel {
  slots: Array<WorkspaceBottomCard | null>;
  totalCard: WorkspaceBottomCard;
}

const SLOT_COUNT = 9;
const DEVOLVED_JMC_GROUP_NAMES = [
  'JMC Scotland',
  'JMC Northern Ireland',
  'JMC Wales',
] as const;
const SCENARIO_BOTTOM_CARD_PRESETS = ['coa3a', 'coa3b', 'coa3c'] as const;
const SPECIAL_SCENARIO_REGION_NAMES = ['Overseas', 'Royal Navy'] as const;

export function buildWorkspaceBottomCardModel(params: {
  activeViewPreset: ViewPresetId;
  regions: RegionStyle[];
  regionGroupOverrides: Record<string, RegionGroupStyleOverride>;
  pmcRegionParDisplayByName: Record<string, string>;
  pmcTotalParDisplay: string;
  presetRegionParByPreset: Partial<Record<ViewPresetId, Record<string, number>>>;
  presetRoyalNavyRegionalParByPreset?: Partial<Record<ViewPresetId, Record<string, number>>>;
  showRoyalNavyRegionalization?: boolean;
}): WorkspaceBottomCardModel {
  const {
    activeViewPreset,
    regions,
    regionGroupOverrides,
    pmcRegionParDisplayByName,
    pmcTotalParDisplay,
    presetRegionParByPreset,
    presetRoyalNavyRegionalParByPreset = {},
    showRoyalNavyRegionalization = false,
  } = params;

  if (isScenarioBottomCardPreset(activeViewPreset)) {
    return buildScenarioPresetCardModel({
      presetId: activeViewPreset,
      regions,
      regionGroupOverrides,
      pmcTotalParDisplay,
      presetRegionParByName: presetRegionParByPreset[activeViewPreset] ?? {},
      royalNavyRegionalParByName:
        presetRoyalNavyRegionalParByPreset[activeViewPreset] ?? {},
      showRoyalNavyRegionalization,
    });
  }

  const regionByName = new Map(regions.map((region) => [region.name, region]));
  const royalNavyRegionalParByName =
    presetRoyalNavyRegionalParByPreset[activeViewPreset] ?? {};
  const royalNavySwatch = createPmcRegionSwatch('Royal Navy', regions);
  const overallTotalPar = parseFacilityParValue(pmcTotalParDisplay);
  const slots = PMC_REGION_ORDER.map((regionName) => {
    const region = regionByName.get(regionName);
    if (!region) {
      return null;
    }

    const baseParDisplay = pmcRegionParDisplayByName[region.name] ?? '—';
    const baseParValue = parseFacilityParValue(baseParDisplay) ?? 0;
    const royalNavyContributionValue = royalNavyRegionalParByName[region.name] ?? 0;

    const rawParValue =
      region.name === 'Royal Navy' && showRoyalNavyRegionalization
        ? null
        : showRoyalNavyRegionalization && royalNavyContributionValue > 0
          ? baseParValue + royalNavyContributionValue
          : baseParValue;

    return {
      key: region.name,
      title: getCurrentBottomCardTitle(region.name),
      swatch: {
        color: region.color,
        opacity: 1,
        shape: region.shape,
        borderColor: region.borderColor,
        borderOpacity: region.borderVisible ? region.borderOpacity : 0,
        borderWidth: region.borderVisible ? region.borderWidth : 1,
      },
      ...buildCardParDisplays(rawParValue, overallTotalPar),
      middleRow:
        region.name === 'Royal Navy'
          ? {
              kind: 'button',
              label: showRoyalNavyRegionalization ? 'Unregionalise' : 'Regionalise',
            }
          : showRoyalNavyRegionalization && royalNavyContributionValue > 0
            ? {
                kind: 'royalNavyContribution',
                swatch: royalNavySwatch,
                valueDisplay: formatParDisplayValue(royalNavyContributionValue),
              }
            : undefined,
    } satisfies WorkspaceBottomCard;
  });

  return {
    slots,
    totalCard: createTotalCard(pmcTotalParDisplay, overallTotalPar),
  };
}

function getCurrentBottomCardTitle(regionName: string): string {
  if (regionName === 'Scotland & Northern Ireland') {
    return 'Scotland & NI';
  }

  return regionName;
}

function isScenarioBottomCardPreset(
  presetId: ViewPresetId,
): presetId is (typeof SCENARIO_BOTTOM_CARD_PRESETS)[number] {
  return (
    SCENARIO_BOTTOM_CARD_PRESETS as readonly ViewPresetId[]
  ).includes(presetId);
}

function buildScenarioPresetCardModel(params: {
  presetId: 'coa3a' | 'coa3b' | 'coa3c';
  regions: RegionStyle[];
  regionGroupOverrides: Record<string, RegionGroupStyleOverride>;
  pmcTotalParDisplay: string;
  presetRegionParByName: Record<string, number>;
  royalNavyRegionalParByName: Record<string, number>;
  showRoyalNavyRegionalization: boolean;
}): WorkspaceBottomCardModel {
  const {
    presetId,
    regions,
    regionGroupOverrides,
    pmcTotalParDisplay,
    presetRegionParByName,
    royalNavyRegionalParByName,
    showRoyalNavyRegionalization,
  } = params;
  const overallTotalPar = parseFacilityParValue(pmcTotalParDisplay);
  const presetConfig = getScenarioPresetConfig(presetId);
  if (!presetConfig) {
    return {
      slots: Array.from({ length: SLOT_COUNT }, () => null),
      totalCard: createTotalCard(pmcTotalParDisplay, overallTotalPar),
    };
  }

  const slots: Array<WorkspaceBottomCard | null> = [];
  const royalNavySwatch = createPmcRegionSwatch('Royal Navy', regions);

  if (presetId === 'coa3a') {
    const devolvedCards = presetConfig.regionGroups.filter((group) =>
      DEVOLVED_JMC_GROUP_NAMES.includes(group.name as (typeof DEVOLVED_JMC_GROUP_NAMES)[number]),
    );
    const otherCards = presetConfig.regionGroups.filter(
      (group) =>
        !DEVOLVED_JMC_GROUP_NAMES.includes(group.name as (typeof DEVOLVED_JMC_GROUP_NAMES)[number]),
    );

    if (devolvedCards.length > 0) {
      const baseParValue = devolvedCards.reduce(
        (sum, group) => sum + (presetRegionParByName[group.name] ?? 0),
        0,
      );
      const royalNavyContributionValue = devolvedCards.reduce(
        (sum, group) => sum + (royalNavyRegionalParByName[group.name] ?? 0),
        0,
      );
      slots.push({
        key: 'sjc-jmc-devolved-administrations',
        title: 'Devolved Admin...',
        swatch: createScenarioGroupSwatch(
          resolveDevolvedAdministrationsColor(devolvedCards, regionGroupOverrides),
        ),
        ...buildCardParDisplays(
          baseParValue + (showRoyalNavyRegionalization ? royalNavyContributionValue : 0),
          overallTotalPar,
        ),
        middleRow:
          showRoyalNavyRegionalization && royalNavyContributionValue > 0
            ? {
                kind: 'royalNavyContribution',
                swatch: royalNavySwatch,
                valueDisplay: formatParDisplayValue(royalNavyContributionValue),
              }
            : undefined,
      });
    }

    for (const group of otherCards) {
      slots.push(
        createScenarioGroupCard(
          group,
          regionGroupOverrides,
          presetRegionParByName,
          royalNavyRegionalParByName,
          royalNavySwatch,
          showRoyalNavyRegionalization,
          overallTotalPar,
        ),
      );
    }
  } else {
    for (const group of presetConfig.regionGroups) {
      slots.push(
        createScenarioGroupCard(
          group,
          regionGroupOverrides,
          presetRegionParByName,
          royalNavyRegionalParByName,
          royalNavySwatch,
          showRoyalNavyRegionalization,
          overallTotalPar,
        ),
      );
    }
  }

  while (slots.length < SLOT_COUNT - 2) {
    slots.push(null);
  }

  for (const regionName of SPECIAL_SCENARIO_REGION_NAMES) {
    slots.push(
      createSpecialPmcRegionCard({
        regionName,
        regions,
        parValue:
          regionName === 'Royal Navy' && showRoyalNavyRegionalization
            ? null
            : (presetRegionParByName[regionName] ?? null),
        overallTotalPar,
        middleRow:
          regionName === 'Royal Navy'
            ? {
                kind: 'button',
                label: showRoyalNavyRegionalization ? 'Unregionalise' : 'Regionalise',
              }
            : undefined,
      }),
    );
  }

  return {
    slots,
    totalCard: createTotalCard(pmcTotalParDisplay, overallTotalPar),
  };
}

function resolveDevolvedAdministrationsColor(
  groups: PresetRegionGroup[],
  regionGroupOverrides: Record<string, RegionGroupStyleOverride>,
): string {
  const effectiveColors = groups.map(
    (group) =>
      getEffectiveGroupStyle(group, regionGroupOverrides).populatedFillColor ??
      group.colors.populated,
  );

  return effectiveColors[0] ?? '#4862b8';
}

function createScenarioGroupCard(
  group: PresetRegionGroup,
  regionGroupOverrides: Record<string, RegionGroupStyleOverride>,
  presetRegionParByName: Record<string, number>,
  royalNavyRegionalParByName: Record<string, number>,
  royalNavySwatch: WorkspaceBottomCardSwatch,
  showRoyalNavyRegionalization: boolean,
  overallTotalPar: number | null,
): WorkspaceBottomCard {
  const baseParValue = presetRegionParByName[group.name] ?? 0;
  const royalNavyContributionValue = royalNavyRegionalParByName[group.name] ?? 0;
  return {
    key: group.name,
    title: getScenarioBottomCardTitle(group.name),
    swatch: createScenarioGroupSwatch(
      getEffectiveGroupStyle(group, regionGroupOverrides).populatedFillColor ??
        group.colors.populated,
    ),
    ...buildCardParDisplays(
      baseParValue + (showRoyalNavyRegionalization ? royalNavyContributionValue : 0),
      overallTotalPar,
    ),
    middleRow:
      showRoyalNavyRegionalization && royalNavyContributionValue > 0
        ? {
            kind: 'royalNavyContribution',
            swatch: royalNavySwatch,
            valueDisplay: formatParDisplayValue(royalNavyContributionValue),
          }
        : undefined,
  };
}

function getScenarioBottomCardTitle(groupName: string): string {
  const stripped = stripScenarioRegionPrefix(groupName);
  if (stripped === 'Devolved Administrations') {
    return 'Devolved Admin...';
  }
  if (stripped === 'London and East') {
    return 'London\nand East';
  }
  return stripped;
}

function createScenarioGroupSwatch(color: string): WorkspaceBottomCardSwatch {
  return {
    color,
    opacity: 1,
    shape: 'circle',
    borderColor: color,
    borderOpacity: 0,
    borderWidth: 1,
  };
}

function createSpecialPmcRegionCard(params: {
  regionName: (typeof SPECIAL_SCENARIO_REGION_NAMES)[number];
  regions: RegionStyle[];
  parValue: number | null;
  overallTotalPar: number | null;
  middleRow?: WorkspaceBottomCard['middleRow'];
}): WorkspaceBottomCard {
  const { regionName, regions, parValue, overallTotalPar, middleRow } = params;

  return {
    key: regionName,
    title: regionName,
    swatch: createPmcRegionSwatch(regionName, regions),
    ...buildCardParDisplays(parValue, overallTotalPar),
    middleRow,
  };
}

function createPmcRegionSwatch(
  regionName: string,
  regions: RegionStyle[],
): WorkspaceBottomCardSwatch {
  const region = regions.find((candidate) => candidate.name === regionName);

  return {
    color: region?.color ?? '#000000',
    opacity: 1,
    shape: region?.shape ?? 'circle',
    borderColor: region?.borderColor ?? (region?.color ?? '#000000'),
    borderOpacity: region?.borderVisible ? region.borderOpacity : 0,
    borderWidth: region?.borderVisible ? region.borderWidth : 1,
  };
}

function createTotalCard(
  parDisplay: string,
  overallTotalPar: number | null,
): WorkspaceBottomCard {
  const parsedTotalPar = parseFacilityParValue(parDisplay);
  return {
    key: 'total',
    title: 'Total',
    swatch: {
      color: '#000000',
      opacity: 1,
      shape: 'circle',
      borderColor: '#000000',
      borderOpacity: 1,
      borderWidth: 1,
    },
    ...buildCardParDisplays(parsedTotalPar, overallTotalPar),
  };
}

function buildCardParDisplays(
  rawParValue: number | null,
  overallTotalPar: number | null,
): Pick<WorkspaceBottomCard, 'actualParDisplay' | 'correctionParDisplay' | 'parDisplay'> {
  const correctionSummary = buildProportionalParCorrectionSummary({
    regionPar: rawParValue,
    baseportPar: null,
    overallTotalPar,
    policy: DEFAULT_PAR_CORRECTION_POLICY,
  });
  const correctionContext = formatBottomCardCorrectionContext(
    correctionSummary.contributionPercent,
  );
  const correctionParDisplay =
    correctionSummary.correctionValue === null
      ? formatParDisplayValue(null)
      : `${formatParDisplayValue(correctionSummary.correctionValue)}${
          correctionContext ? ` ${correctionContext}` : ''
        }`;

  return {
    actualParDisplay: formatParDisplayValue(rawParValue),
    correctionParDisplay,
    parDisplay: formatParDisplayValue(correctionSummary.correctedTotal),
  };
}

function formatBottomCardCorrectionContext(percent: number | null): string | null {
  if (percent === null) {
    return null;
  }

  return `(${percent}%)`;
}
