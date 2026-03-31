import type { BoundarySystemId } from '../../types';

export type NhsEnglandRegionId =
  | 'eastOfEngland'
  | 'london'
  | 'midlands'
  | 'northEastAndYorkshire'
  | 'northWest'
  | 'southEast'
  | 'southWest';

export interface NhsEnglandRegionDefinition {
  id: NhsEnglandRegionId;
  label: string;
  shortLabel: string;
  order: number;
}

export interface NhsEnglandRegionAssignment {
  boundarySystemId: 'icbHb2026';
  boundaryCode: string;
  boundaryName: string;
  regionId: NhsEnglandRegionId;
}

export const NHS_ENGLAND_REGIONS: Record<
  NhsEnglandRegionId,
  NhsEnglandRegionDefinition
> = {
  eastOfEngland: {
    id: 'eastOfEngland',
    label: 'East of England',
    shortLabel: 'East',
    order: 1,
  },
  london: {
    id: 'london',
    label: 'London',
    shortLabel: 'London',
    order: 2,
  },
  midlands: {
    id: 'midlands',
    label: 'Midlands',
    shortLabel: 'Midlands',
    order: 3,
  },
  northEastAndYorkshire: {
    id: 'northEastAndYorkshire',
    label: 'North East and Yorkshire',
    shortLabel: 'NEY',
    order: 4,
  },
  northWest: {
    id: 'northWest',
    label: 'North West',
    shortLabel: 'North West',
    order: 5,
  },
  southEast: {
    id: 'southEast',
    label: 'South East',
    shortLabel: 'South East',
    order: 6,
  },
  southWest: {
    id: 'southWest',
    label: 'South West',
    shortLabel: 'South West',
    order: 7,
  },
};

const NHS_ENGLAND_REGION_ASSIGNMENTS_2026: NhsEnglandRegionAssignment[] = [
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000065',
    boundaryName: 'NHS Central East Integrated Care Board',
    regionId: 'eastOfEngland',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000066',
    boundaryName: 'NHS Essex Integrated Care Board',
    regionId: 'eastOfEngland',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000068',
    boundaryName: 'NHS Norfolk and Suffolk Integrated Care Board',
    regionId: 'eastOfEngland',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000029',
    boundaryName: 'NHS North East London Integrated Care Board',
    regionId: 'london',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000030',
    boundaryName: 'NHS South East London Integrated Care Board',
    regionId: 'london',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000031',
    boundaryName: 'NHS South West London Integrated Care Board',
    regionId: 'london',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000071',
    boundaryName: 'NHS West and North London Integrated Care Board',
    regionId: 'london',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000055',
    boundaryName: 'NHS Birmingham and Solihull Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000062',
    boundaryName: 'NHS Black Country Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000018',
    boundaryName: 'NHS Coventry and Warwickshire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000058',
    boundaryName: 'NHS Derby and Derbyshire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000019',
    boundaryName: 'NHS Herefordshire and Worcestershire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000015',
    boundaryName: 'NHS Leicester, Leicestershire and Rutland Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000013',
    boundaryName: 'NHS Lincolnshire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000059',
    boundaryName: 'NHS Northamptonshire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000060',
    boundaryName: 'NHS Nottingham and Nottinghamshire Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000011',
    boundaryName: 'NHS Shropshire, Telford and Wrekin Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000010',
    boundaryName: 'NHS Staffordshire and Stoke-on-Trent Integrated Care Board',
    regionId: 'midlands',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000051',
    boundaryName: 'NHS Humber and North Yorkshire Integrated Care Board',
    regionId: 'northEastAndYorkshire',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000050',
    boundaryName: 'NHS North East and North Cumbria Integrated Care Board',
    regionId: 'northEastAndYorkshire',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000061',
    boundaryName: 'NHS South Yorkshire Integrated Care Board',
    regionId: 'northEastAndYorkshire',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000054',
    boundaryName: 'NHS West Yorkshire Integrated Care Board',
    regionId: 'northEastAndYorkshire',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000008',
    boundaryName: 'NHS Cheshire and Merseyside Integrated Care Board',
    regionId: 'northWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000057',
    boundaryName: 'NHS Greater Manchester Integrated Care Board',
    regionId: 'northWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000048',
    boundaryName: 'NHS Lancashire and South Cumbria Integrated Care Board',
    regionId: 'northWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000067',
    boundaryName: 'NHS Hampshire and Isle of Wight Integrated Care Board',
    regionId: 'southEast',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000032',
    boundaryName: 'NHS Kent and Medway Integrated Care Board',
    regionId: 'southEast',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000069',
    boundaryName: 'NHS Surrey and Sussex Integrated Care Board',
    regionId: 'southEast',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000070',
    boundaryName: 'NHS Thames Valley Integrated Care Board',
    regionId: 'southEast',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000040',
    boundaryName:
      'NHS Bath and North East Somerset, Swindon and Wiltshire Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000039',
    boundaryName:
      'NHS Bristol, North Somerset and South Gloucestershire Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000036',
    boundaryName: 'NHS Cornwall and the Isles of Scilly Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000037',
    boundaryName: 'NHS Devon Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000041',
    boundaryName: 'NHS Dorset Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000043',
    boundaryName: 'NHS Gloucestershire Integrated Care Board',
    regionId: 'southWest',
  },
  {
    boundarySystemId: 'icbHb2026',
    boundaryCode: 'E54000038',
    boundaryName: 'NHS Somerset Integrated Care Board',
    regionId: 'southWest',
  },
];

const nhsEnglandRegionAssignmentByCode = new Map(
  NHS_ENGLAND_REGION_ASSIGNMENTS_2026.map((assignment) => [
    assignment.boundaryCode,
    assignment,
  ]),
);

const nhsEnglandRegionAssignmentByName = new Map(
  NHS_ENGLAND_REGION_ASSIGNMENTS_2026.map((assignment) => [
    assignment.boundaryName,
    assignment,
  ]),
);

export function getOrderedNhsEnglandRegions(): NhsEnglandRegionDefinition[] {
  return Object.values(NHS_ENGLAND_REGIONS).sort((a, b) => a.order - b.order);
}

export function getNhsEnglandRegionAssignments(
  boundarySystemId: BoundarySystemId,
): NhsEnglandRegionAssignment[] {
  return boundarySystemId === 'icbHb2026'
    ? [...NHS_ENGLAND_REGION_ASSIGNMENTS_2026]
    : [];
}

export function getNhsEnglandRegionAssignmentForBoundary(
  boundarySystemId: BoundarySystemId,
  boundaryCode: string | null | undefined,
  boundaryName?: string | null,
): NhsEnglandRegionAssignment | null {
  if (boundarySystemId !== 'icbHb2026') {
    return null;
  }

  const normalizedCode = String(boundaryCode ?? '').trim();
  if (normalizedCode) {
    return nhsEnglandRegionAssignmentByCode.get(normalizedCode) ?? null;
  }

  const normalizedName = String(boundaryName ?? '').trim();
  if (normalizedName) {
    return nhsEnglandRegionAssignmentByName.get(normalizedName) ?? null;
  }

  return null;
}

export function getNhsEnglandRegionDefinition(
  regionId: NhsEnglandRegionId,
): NhsEnglandRegionDefinition {
  return NHS_ENGLAND_REGIONS[regionId];
}
