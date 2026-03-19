export const DEFAULT_OPEN_PANES = ['basemap', 'facilities', 'labels', 'overlays'];
export const DEFAULT_BASEMAP_SECTIONS = ['land', 'sea'];
export const DEFAULT_FACILITY_SECTIONS = ['pmc'];
export const DEFAULT_LABEL_SECTIONS = ['country-labels', 'major-cities'];
export const DEFAULT_OVERLAY_SECTIONS = ['board-boundaries'];

export const REGION_ROWS = [
  'Scotland & Northern Ireland',
  'North',
  'Wales & West Midlands',
  'East',
  'South West',
  'Central & Wessex',
  'London & South',
] as const;

export const INITIAL_PANE_ENABLED = {
  basemap: true,
  facilities: true,
  labels: true,
  overlays: true,
} satisfies Record<string, boolean>;

export const INITIAL_SECTION_ENABLED = {
  land: true,
  sea: true,
  pmc: true,
  'country-labels': false,
  'major-cities': true,
  'board-boundaries': true,
} satisfies Record<string, boolean>;

export const INITIAL_OVERLAY_ROW_ENABLED = {
  careBoards: true,
  pmcPopulated: true,
  pmcUnpopulated: false,
} satisfies Record<string, boolean>;

export const OVERLAY_ROWS = [
  {
    key: 'careBoards',
    label: 'Care board boundaries',
    value: '100%',
    swatch: '#f4b740',
  },
  {
    key: 'pmcPopulated',
    label: 'PMC populated care board boundaries',
    value: '75%',
    swatch: '#ed5151',
  },
  {
    key: 'pmcUnpopulated',
    label: 'PMC unpopulated care board boundaries',
    value: '35%',
    swatch: '#94a3b8',
  },
] as const;

export const BASEMAP_SIMPLE_SECTIONS = [
  {
    id: 'land',
    title: 'Land',
    colourId: 'land-colour',
    colourValue: '#ecf0e6',
    opacityId: 'land-opacity',
  },
  {
    id: 'sea',
    title: 'Sea',
    colourId: 'sea-colour',
    colourValue: '#d9e7f5',
    opacityId: 'sea-opacity',
  },
] as const;

export const LABEL_SIMPLE_SECTIONS = [
  {
    id: 'country-labels',
    title: 'Countries',
    colourId: 'country-label-colour',
    colourValue: '#0f172a',
    opacityId: 'country-label-opacity',
  },
  {
    id: 'major-cities',
    title: 'Cities',
    colourId: 'major-city-colour',
    colourValue: '#1f2937',
    opacityId: 'major-city-opacity',
  },
] as const;

export function buildInitialRegionEnabled() {
  return Object.fromEntries(REGION_ROWS.map((region) => [region, true])) as Record<
    string,
    boolean
  >;
}
