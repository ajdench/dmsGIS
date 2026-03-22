export interface LayerState {
  id: string;
  name: string;
  type: 'polygon' | 'point';
  path: string;
  visible: boolean;
  opacity: number;
}

export type BasemapProvider = 'localDetailed';
export type BasemapScale = '10m';
export type FacilitySymbolShape = 'circle' | 'square' | 'diamond' | 'triangle';

export interface BasemapSettings {
  provider: BasemapProvider;
  scale: BasemapScale;
  landFillColor: string;
  landFillOpacity: number;
  showLandFill: boolean;
  countryBorderColor: string;
  countryBorderOpacity: number;
  showCountryBorders: boolean;
  countryLabelColor: string;
  countryLabelOpacity: number;
  countryLabelSize?: number;
  countryLabelBorderColor?: string;
  countryLabelBorderWidth?: number;
  countryLabelBorderOpacity?: number;
  showCountryLabels: boolean;
  majorCityColor: string;
  majorCityOpacity: number;
  majorCitySize?: number;
  majorCityBorderColor?: string;
  majorCityBorderWidth?: number;
  majorCityBorderOpacity?: number;
  showMajorCities: boolean;
  regionLabelColor?: string;
  regionLabelOpacity?: number;
  regionLabelSize?: number;
  regionLabelBorderColor?: string;
  regionLabelBorderWidth?: number;
  regionLabelBorderOpacity?: number;
  showRegionLabels?: boolean;
  networkLabelColor?: string;
  networkLabelOpacity?: number;
  networkLabelSize?: number;
  networkLabelBorderColor?: string;
  networkLabelBorderWidth?: number;
  networkLabelBorderOpacity?: number;
  showNetworkLabels?: boolean;
  facilityLabelColor?: string;
  facilityLabelOpacity?: number;
  facilityLabelSize?: number;
  facilityLabelBorderColor?: string;
  facilityLabelBorderWidth?: number;
  facilityLabelBorderOpacity?: number;
  showFacilityLabels?: boolean;
  seaFillColor: string;
  seaFillOpacity: number;
  showSeaFill: boolean;
  seaLabelColor: string;
  seaLabelOpacity: number;
  seaLabelSize?: number;
  seaLabelBorderColor?: string;
  seaLabelBorderWidth?: number;
  seaLabelBorderOpacity?: number;
  showSeaLabels: boolean;
}

export interface RegionStyle {
  name: string;
  visible: boolean;
  color: string;
  opacity: number;
  shape: FacilitySymbolShape;
  borderVisible: boolean;
  borderColor: string;
  borderWidth: number;
  borderOpacity: number;
  symbolSize: number;
}

export interface OverlayLayerStyle {
  id: string;
  name: string;
  path: string;
  family: OverlayFamily;
  visible: boolean;
  opacity: number;
  borderVisible: boolean;
  borderColor: string;
  borderOpacity: number;
  swatchColor: string;
}

export type RegionBoundaryLayerStyle = OverlayLayerStyle;

export type ViewPresetId = 'current' | 'coa3a' | 'coa3b' | 'coa3c';
export type BoundarySystemId = 'legacyIcbHb' | 'icbHb2026';
export type ScenarioWorkspaceId =
  | Exclude<ViewPresetId, 'current'>
  | 'dphcEstimateCoaPlayground';
export type OverlayFamily =
  | 'boardBoundaries'
  | 'scenarioRegions'
  | 'nhsRegions'
  | 'customRegions';

export interface Facility {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

export interface SelectionState {
  facilityIds: string[];
  boundaryName: string | null;
  jmcName: string | null;
}
