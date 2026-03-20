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
  showCountryLabels: boolean;
  majorCityColor: string;
  majorCityOpacity: number;
  showMajorCities: boolean;
  seaFillColor: string;
  seaFillOpacity: number;
  showSeaFill: boolean;
  seaLabelColor: string;
  seaLabelOpacity: number;
  showSeaLabels: boolean;
}

export interface RegionStyle {
  name: string;
  visible: boolean;
  color: string;
  opacity: number;
  borderVisible: boolean;
  borderColor: string;
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
