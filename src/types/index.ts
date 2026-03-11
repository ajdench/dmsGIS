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

export interface RegionBoundaryLayerStyle {
  id: string;
  name: string;
  path: string;
  visible: boolean;
  opacity: number;
  borderVisible: boolean;
  borderColor: string;
  borderOpacity: number;
  swatchColor: string;
}

export type ViewPresetId = 'current' | 'coa3a' | 'coa3b' | 'coa3c';

export interface Facility {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}
